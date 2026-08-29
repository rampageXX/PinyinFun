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
    # Innermost-first, then peel that layer away and go again. A sound record
    # holds a nested mnemonicVoice:{...}, so matching only innermost braces
    # would skip every sound and leave this checking nothing.
    work = src
    for _ in range(6):
        blocks = re.findall(r"\{[^{}]*\}", work)
        if not blocks:
            break
        for block in blocks:
            rec = dict(re.findall(r"(\w+)\s*:\s*'([^']*)'", block))
            rec.update({k: v == "true" for k, v in re.findall(r"(\w+)\s*:\s*(true|false)", block)})
            rec.update({k: int(v) for k, v in re.findall(r"(\w+)\s*:\s*(\d+)", block)})
            if rec:
                out.append(rec)
        work = re.sub(r"\{[^{}]*\}", "", work)
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
stories_src = read("stories.js")
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

pairs = re.findall(r"hanzi: ?'([^']+)', pinyin: ?'([^']*)'",
                   lessons_src + stories_src)
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
    r"id:'([^']+)', shengmu:(null|'[^']*'), jiemu:(null|'[^']*'), yunmu:'([^']+)', "
    r"base:'([^']+)', lesson:'([^']+)'", syl_src)

if not syl_entries:
    fail("no syllables parsed — has tools/gen_syllables.py been run?")

sound_text_lesson = {}
for s in sounds:
    sound_text_lesson.setdefault(s.get("text"), int(s["lesson"][-2:]))

for sid, sm, jm, ym, base, lesson in syl_entries:
    order = int(lesson[-2:])
    # A bare 韵母 (课1's e, 课12's er) is a whole syllable with no 声母 at all.
    parts = [(ym, "韵母")] if sm == "null" else [(sm.strip("'"), "声母"), (ym, "韵母")]
    for part, name in parts:
        if part not in sound_text_lesson:
            fail(f"syllable {sid}: {name} '{part}' is not a known sound")
        elif sound_text_lesson[part] > order:
            fail(f"syllable {sid} is in {lesson} but its {name} '{part}' "
                 f"is not taught until lesson {sound_text_lesson[part]:02d}")

# ── audio ────────────────────────────────────────────────────────────

audio_refs = set()
for src in (sounds_src, lessons_src, syl_src, stories_src):
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

# ── 顺口溜 ────────────────────────────────────────────────
#
# A 顺口溜 printed without a voice is decoration. Each one needs a recording of
# its phrase half; the letters after it are played from their own MP3s at run
# time, so the phrase must not contain letters either.

for m in re.finditer(r"id:'([^']+)',[^{]*?mnemonic:'([^']*)'"
                     r"(?:\s*,?\s*mnemonicVoice:\{ say:'([^']*)', audio:'([^']*)' \})?",
                     sounds_src, re.S):
    sid, mnem, say, mp3 = m.group(1), m.group(2), m.group(3), m.group(4)
    if not mp3:
        fail(f"{sid} has a 顺口溜 「{mnem}」 with no mnemonicVoice — it cannot be read aloud")
        continue
    if re.search(r"(?<![一-鿿])[a-zü]", say or ""):
        fail(f"{sid} mnemonicVoice says '{say}', which still contains letters — "
             f"the voice would read them as English letter names")

# ── 口诀 ─# ── 口诀 ────────────────────────────────────────────────────
#
# The 口诀 on each rule card is the one thing a child cannot decode for
# herself: it is written for a reader. It has to be sayable, and where it
# prints letters it needs a `say` in 呼读音 characters, because a zh-CN voice
# reads a bare "a" as the English letter name.

for body in re.findall(r"rule: \{(.*?)\n  \},", lessons_src, re.S):
    m_t = re.search(r"text: '([^']*)'", body)
    m_i = re.search(r"id: '([^']*)'", body)
    if not m_t:
        continue
    rid = m_i.group(1) if m_i else "?"
    if "audio:" not in body:
        fail(f"rule {rid} has no audio — the child cannot read it")
    letters = re.findall(r"(?<![一-鿿])[a-zü]+", m_t.group(1))
    if letters and "say:" not in body:
        fail(f"rule {rid} prints letters {letters[:4]} but has no `say` — "
             f"the voice would read them as English letter names")

# ── 故事 ─# ── 故事 ─────────────────────────────────────────────────────────────

story_ids = re.findall(r"id: '(story-[^']+)'", stories_src)
if len(story_ids) != len(set(story_ids)):
    fail(f"duplicate story ids: {story_ids}")

lesson_ids = {l["id"] for l in lessons}
for sid, unlock in re.findall(r"id: '(story-[^']+)', order: \d+, tier: \d+, "
                              r"unlockAfter: '([^']+)'", stories_src):
    if unlock not in lesson_ids:
        fail(f"{sid} unlocks after unknown lesson {unlock}")

story_orders = sorted(int(o) for o in re.findall(r"order: (\d+), tier:", stories_src))
if story_orders != list(range(1, len(story_orders) + 1)):
    fail(f"story order values are not 1..{len(story_orders)}: {story_orders}")

for art in re.findall(r"art: '([^']+)'", stories_src):
    if not (ROOT / art).exists():
        fail(f"story art missing on disk: {art}")

# ── 儿歌 repeats ─────────────────────────────────────────────────────
#
# A chant line like 鹅鹅鹅 is three separate beats the child echoes back, but
# written solid the voice reads it as one long "ééé". Such a line needs a `say`
# that spaces the characters out. Real reduplicated words (爸爸) must NOT have
# one — they are a single word and should sound like it.

lessons_src_all = read("lessons/lessons.js")
for body in re.findall(r"\{([^{}]*audio: 'audio/chant/[^']+'[^{}]*)\}", lessons_src_all):
    m_h = re.search(r"hanzi: '([^']+)'", body)
    m_a = re.search(r"audio: '([^']+)'", body)
    if not m_h or not m_a:
        continue
    hanzi = m_h.group(1)
    if len(hanzi) >= 2 and len(set(hanzi)) == 1 and "say:" not in body:
        fail(f"{m_a.group(1)} says '{hanzi}' — a repeated 韵母 beat needs a `say` "
             f"like '{'，'.join(hanzi)}', or the voice runs it into one sound")

# ── service worker ───────────────────────────────────────────────────
#
# The offline cache is a generated list of files. If gen_audio.py adds an MP3
# and nobody re-runs gen_sw.py, the app still works online and silently serves
# a stale cache on the iPad — the worst kind of bug to find on a plane.

sw_files = 0
sw_path = ROOT / "sw.js"
if not sw_path.exists():
    fail("sw.js is missing — run: python tools/gen_sw.py")
else:
    sys.path.insert(0, str(ROOT / "tools"))
    import gen_sw

    sw_src = sw_path.read_text(encoding="utf-8")
    tracked = gen_sw.collect(gen_sw.SHELL_GLOBS) + gen_sw.collect(gen_sw.AUDIO_GLOBS)
    sw_files = len(tracked)

    m = re.search(r"const VERSION = '([0-9a-f]+)'", sw_src)
    if not m:
        fail("sw.js has no VERSION — regenerate it with tools/gen_sw.py")
    elif m.group(1) != gen_sw.version_of(tracked):
        fail("sw.js is stale (VERSION does not match the files on disk) — "
             "run: python tools/gen_sw.py")

    uncached = [f for f in tracked if f"'{f}'" not in sw_src]
    if uncached:
        fail(f"{len(uncached)} files are not in the offline cache, "
             f"e.g. {uncached[:5]} — run: python tools/gen_sw.py")

# ── report ───────────────────────────────────────────────────────────

print(f"sounds      {len(sounds)}   声母 {types.get('shengmu', 0)} · "
      f"韵母 {types.get('yunmu', 0)} · 整体认读 {types.get('zhengti', 0)}")
print(f"lessons     {len(lessons)}")
print(f"syllables   {len(syl_entries)}")
print(f"stickers    {len(stickers)}")
print(f"audio refs  {len(audio_refs)}")
print(f"ruby pairs  {len(pairs)}")
print(f"stories     {len(story_ids)}")
print(f"offline     {sw_files} files precached by sw.js")

for n in notes:
    print(f"\nNOTE  {n}")

if problems:
    print(f"\n{len(problems)} PROBLEM(S):", file=sys.stderr)
    for p in problems:
        print(f"  - {p}", file=sys.stderr)
    sys.exit(1)

print("\nall checks passed")
