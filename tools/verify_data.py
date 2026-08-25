#!/usr/bin/env python3
"""
tools/verify_data.py — integrity checks for the content.

The app has no build step and no type checker, so a typo in a lesson file
would surface as a silent blank card in front of a 7-year-old. Run this after
touching anything under data/.

    python tools/verify_data.py

Checks
  * the 63 sounds are complete: 23 声母, 24 韵母, 16 整体认读音节
  * no duplicate ids anywhere
  * every confusable / lesson / sticker reference resolves
  * each sound belongs to exactly one lesson, and the lesson agrees
  * lesson orders are 1..14 with no gaps
  * every audio path referenced by the data exists on disk, or has an
    override, or is one of the two sounds we know need recording
  * every ruby pairing has as many pinyin syllables as it has 汉字
  * syllables decompose into sounds that exist and are taught no later
"""

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

CJK = re.compile(r"[㐀-鿿]")

EXPECTED = {"shengmu": 23, "yunmu": 24, "zhengti": 16}
EXPECTED_SUB = {"dan": 6, "fu": 9, "qian": 5, "hou": 4}

problems = []
notes = []


def fail(msg):
    problems.append(msg)


def read(path):
    return (DATA / path).read_text(encoding="utf-8")


def records(src):
    """Every innermost {...} literal, as a dict of its simple fields."""
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    src = re.sub(r"//[^\n]*", "", src)
    out = []
    for block in re.findall(r"\{[^{}]*\}", src):
        rec = dict(re.findall(r"(\w+)\s*:\s*'([^']*)'", block))
        rec.update({k: v == "true" for k, v in re.findall(r"(\w+)\s*:\s*(true|false)", block)})
        rec.update({k: int(v) for k, v in re.findall(r"(\w+)\s*:\s*(\d+)", block)})
        if rec:
            out.append(rec)
    return out


# ── sounds ───────────────────────────────────────────────────────────

sounds_src = read("sounds.js")
sounds = [r for r in records(sounds_src) if r.get("id", "").split("-")[0] in ("sh", "yu", "zt")]
by_id = {s["id"]: s for s in sounds}

if len(sounds) != 63:
    fail(f"expected 63 sounds, found {len(sounds)}")

types = Counter(s.get("type") for s in sounds)
for t, n in EXPECTED.items():
    if types.get(t) != n:
        fail(f"expected {n} {t}, found {types.get(t, 0)}")

subs = Counter(s.get("sub") for s in sounds if s.get("type") == "yunmu")
for sub, n in EXPECTED_SUB.items():
    if subs.get(sub) != n:
        fail(f"expected {n} 韵母/{sub}, found {subs.get(sub, 0)}")

dupes = [i for i, n in Counter(s["id"] for s in sounds).items() if n > 1]
if dupes:
    fail(f"duplicate sound ids: {dupes}")

for s in sounds:
    for c in re.findall(r"'([^']+)'", s.get("confusable", "")) or []:
        if c not in by_id:
            fail(f"{s['id']} confusable -> unknown id {c}")

# confusable is an array literal, so pull it out of the raw source instead
for block in re.findall(r"\{[^{}]*\}", sounds_src):
    m = re.search(r"id:'([^']+)'", block)
    c = re.search(r"confusable:\[([^\]]*)\]", block)
    if m and c:
        for ref in re.findall(r"'([^']+)'", c.group(1)):
            if ref not in by_id:
                fail(f"{m.group(1)} confusable -> unknown id {ref}")

# ── lessons ──────────────────────────────────────────────────────────

lessons_src = read("lessons/lessons.js")
lesson_blocks = re.split(r"registerLesson\(", lessons_src)[1:]

lessons = []
for block in lesson_blocks:
    lid = re.search(r"id: ?'([^']+)'", block)
    order = re.search(r"order: ?(\d+)", block)
    snd = re.search(r"sounds: ?\[([^\]]*)\]", block)
    sticker = re.search(r"sticker: ?'([^']+)'", block)
    lessons.append({
        "id": lid.group(1) if lid else "?",
        "order": int(order.group(1)) if order else 0,
        "sounds": re.findall(r"'([^']+)'", snd.group(1)) if snd else [],
        "sticker": sticker.group(1) if sticker else None,
        "raw": block,
    })

if len(lessons) != 14:
    fail(f"expected 14 lessons, found {len(lessons)}")

orders = sorted(l["order"] for l in lessons)
if orders != list(range(1, 15)):
    fail(f"lesson orders are not 1..14: {orders}")

lesson_ids = {l["id"] for l in lessons}
claimed = defaultdict(list)
for l in lessons:
    for sid in l["sounds"]:
        if sid not in by_id:
            fail(f"{l['id']} references unknown sound {sid}")
        claimed[sid].append(l["id"])

for sid, owners in claimed.items():
    if len(owners) > 1:
        fail(f"sound {sid} claimed by several lessons: {owners}")
    elif by_id[sid].get("lesson") != owners[0]:
        fail(f"sound {sid} says lesson={by_id[sid].get('lesson')} but {owners[0]} claims it")

unclaimed = [s["id"] for s in sounds if s["id"] not in claimed]
if unclaimed:
    fail(f"sounds in no lesson: {unclaimed}")

# ── ruby pairings ────────────────────────────────────────────────────

pairs = re.findall(r"hanzi: ?'([^']+)', pinyin: ?'([^']*)'", lessons_src)
for hanzi, pinyin in pairs:
    n_cjk = len(CJK.findall(hanzi))
    n_syl = len([p for p in pinyin.split() if p])
    if n_cjk != n_syl:
        fail(f"ruby mismatch: '{hanzi}' has {n_cjk} 汉字 but {n_syl} syllables ('{pinyin}')")

# ── stickers ─────────────────────────────────────────────────────────

stickers = [r for r in records(read("stickers.js")) if r.get("id", "").startswith("st-")]
if len(stickers) != 40:
    fail(f"expected 40 stickers, found {len(stickers)}")

sticker_ids = {s["id"] for s in stickers}
for l in lessons:
    if l["sticker"] and l["sticker"] not in sticker_ids:
        fail(f"{l['id']} references unknown sticker {l['sticker']}")
for s in stickers:
    if s.get("kind") == "lesson" and s.get("lesson") not in lesson_ids:
        fail(f"sticker {s['id']} references unknown lesson {s.get('lesson')}")

# ── syllables ────────────────────────────────────────────────────────

syl_src = read("syllables.js")
syl_entries = re.findall(
    r"id:'([^']+)', shengmu:'([^']+)', jiemu:(null|'[^']*'), yunmu:'([^']+)', "
    r"base:'([^']+)', lesson:'([^']+)'", syl_src)

if not syl_entries:
    fail("no syllables parsed — has tools/gen_syllables.py been run?")

sound_text_lesson = {}
for s in sounds:
    sound_text_lesson.setdefault(s.get("text"), int(s["lesson"][-2:]))

for sid, sm, jm, ym, base, lesson in syl_entries:
    order = int(lesson[-2:])
    for part, name in ((sm, "声母"), (ym, "韵母")):
        if part not in sound_text_lesson:
            fail(f"syllable {sid}: {name} '{part}' is not a known sound")
        elif sound_text_lesson[part] > order:
            fail(f"syllable {sid} is in {lesson} but its {name} '{part}' "
                 f"is not taught until lesson {sound_text_lesson[part]:02d}")

# ── audio ────────────────────────────────────────────────────────────

audio_refs = set()
for src in (sounds_src, lessons_src, syl_src):
    audio_refs.update(re.findall(r"audio:'(audio/[^']+)'", src))
    audio_refs.update(re.findall(r"audio: ?'(audio/[^']+)'", src))

needs_recording = {s["audio"] for s in sounds if s.get("needsRecording")}
missing = []
for ref in sorted(audio_refs):
    if (ROOT / ref).exists() or (ROOT / "audio" / "overrides" / ref).exists():
        continue
    missing.append(ref)

if missing:
    fail(f"{len(missing)} audio files referenced but not on disk, "
         f"e.g. {missing[:5]}  — run: python tools/gen_audio.py")

for ref in sorted(needs_recording):
    if not (ROOT / "audio" / "overrides" / ref).exists():
        notes.append(f"{ref} is synthesised from a character that may be wrong — "
                     f"check it in 家长 → 音频检查 and record audio/overrides/{ref} if needed")

# ── report ───────────────────────────────────────────────────────────

print(f"sounds      {len(sounds)}   声母 {types.get('shengmu', 0)} · "
      f"韵母 {types.get('yunmu', 0)} · 整体认读 {types.get('zhengti', 0)}")
print(f"lessons     {len(lessons)}")
print(f"syllables   {len(syl_entries)}")
print(f"stickers    {len(stickers)}")
print(f"audio refs  {len(audio_refs)}")
print(f"ruby pairs  {len(pairs)}")

for n in notes:
    print(f"\nNOTE  {n}")

if problems:
    print(f"\n{len(problems)} PROBLEM(S):", file=sys.stderr)
    for p in problems:
        print(f"  - {p}", file=sys.stderr)
    sys.exit(1)

print("\nall checks passed")
