#!/usr/bin/env python3
"""
tools/gen_audio.py — one-time audio generation for 拼音岛.

The app plays static MP3s rather than calling a TTS engine at runtime, because
browser zh-CN voices read isolated Latin letters as English ("b" -> "bee").
Every sound therefore gets a Chinese character that produces it, and Edge's
neural voices synthesise that character.

Usage
    pip install edge-tts pypinyin
    python tools/gen_audio.py                # generate everything missing
    python tools/gen_audio.py --only sheng   # just one folder
    python tools/gen_audio.py --force        # re-synthesise even if present
    python tools/gen_audio.py --manifest     # write the manifest, synthesise nothing

Output lands in audio/{sheng,yun,zheng,syl,word}/ and is committed to the repo.
Existing files are skipped, so reruns after adding a lesson are cheap.

Known limits, handled explicitly rather than silently:
  * A bare 声母 has no character of its own. We use the traditional 呼读音
    (b -> 玻, z -> 资). That is what teachers and textbook audio say too.
  * `eng` maps to the rare character 鞥 and `ong` has NO standalone syllable in
    Mandarin at all. Both are flagged needsRecording in data/sounds.js. Check
    them first in the in-app 音频检查 screen and, if wrong, record two short
    clips yourself into audio/overrides/audio/yun/eng.mp3 and .../ong.mp3.
    lib/audio.js prefers an override whenever one exists.
"""

import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"
MANIFEST = ROOT / "tools" / "audio_manifest.json"

VOICE = "zh-CN-XiaoxiaoNeural"   # clear female newsreader voice
RATE = "-10%"                    # slightly slow, for a 7-year-old
CONCURRENCY = 6


# ─────────────────────────────────────────────────────────────────────
# 呼读音 tables — the only way to voice a bare letter.
# Keep these in sync with the `hanzi` field in data/sounds.js; that file is
# the source of truth and this table is the fallback when parsing fails.
# ─────────────────────────────────────────────────────────────────────

SHENGMU_HANZI = {
    "b": "玻", "p": "坡", "m": "摸", "f": "佛",
    "d": "得", "t": "特", "n": "讷", "l": "勒",
    "g": "哥", "k": "科", "h": "喝",
    "j": "基", "q": "欺", "x": "希",
    "zh": "知", "ch": "蚩", "sh": "诗", "r": "日",
    "z": "资", "c": "雌", "s": "思",
    "y": "衣", "w": "乌",
}

YUNMU_HANZI = {
    "a": "啊", "o": "喔", "e": "鹅", "i": "衣", "u": "乌", "ü": "迂",
    "ai": "哀", "ei": "诶", "ui": "威", "ao": "熬", "ou": "欧", "iu": "优",
    "ie": "耶", "üe": "约", "er": "儿",
    "an": "安", "en": "恩", "in": "因", "un": "温", "ün": "晕",
    "ang": "昂", "eng": "鞥", "ing": "英", "ong": "轰",
}

# Filename-safe spelling: ü cannot appear in a path on every filesystem.
FILE_SAFE = {"ü": "v", "üe": "ve", "ün": "vn"}


def safe_name(text: str) -> str:
    return FILE_SAFE.get(text, text.replace("ü", "v"))


# ─────────────────────────────────────────────────────────────────────
# Reading data/sounds.js and data/syllables.js from Python.
# They are JS files, not JSON, so we pull out the fields we need with
# regexes rather than adding a JS runtime dependency. The fields are
# written in a fixed `key:'value'` style, which keeps this reliable.
# ─────────────────────────────────────────────────────────────────────

def parse_js_objects(path: Path):
    """Yield dicts of the simple string fields of each `{...}` record."""
    if not path.exists():
        return []
    src = path.read_text(encoding="utf-8")
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)     # strip block comments
    src = re.sub(r"//[^\n]*", "", src)                   # strip line comments
    records = []
    # Innermost-first, then peel that layer off and go again. A lesson's rule
    # holds a nested `demo: {...}`, so matching only innermost braces missed
    # the rule itself — and with it every 口诀 recording.
    work = src
    for _ in range(6):
        blocks = re.findall(r"\{[^{}]*\}", work)
        if not blocks:
            break
        for block in blocks:
            rec = dict(re.findall(r"(\w+)\s*:\s*'([^']*)'", block))
            flags = dict(re.findall(r"(\w+)\s*:\s*(true|false)", block))
            rec.update({k: v == "true" for k, v in flags.items()})
            nums = dict(re.findall(r"(\w+)\s*:\s*(\d+)", block))
            rec.update({k: int(v) for k, v in nums.items()})
            if rec:
                records.append(rec)
        work = re.sub(r"\{[^{}]*\}", "", work)
    return records


def build_manifest() -> dict:
    """Map every output MP3 path -> the Chinese text to speak."""
    manifest = {}

    sounds = parse_js_objects(ROOT / "data" / "sounds.js")
    for s in sounds:
        audio = s.get("audio")
        hanzi = s.get("hanzi")
        if not audio or not hanzi:
            continue
        manifest[audio] = hanzi

    # Fill anything sounds.js has not defined yet from the fallback tables,
    # so the audio set is complete even before every lesson is authored.
    for letter, hanzi in SHENGMU_HANZI.items():
        manifest.setdefault(f"audio/sheng/{safe_name(letter)}.mp3", hanzi)
    for letter, hanzi in YUNMU_HANZI.items():
        manifest.setdefault(f"audio/yun/{safe_name(letter)}.mp3", hanzi)

    # Syllables: every tone that is a real Mandarin syllable, plus the
    # example words and chants declared by the lessons.
    for syl in parse_js_objects(ROOT / "data" / "syllables.js"):
        audio, hanzi = syl.get("audio"), syl.get("hanzi")
        if audio and hanzi:
            manifest[audio] = hanzi

    lessons_dir = ROOT / "data" / "lessons"
    if lessons_dir.exists():
        for lesson_file in sorted(lessons_dir.glob("lesson*.js")):
            for rec in parse_js_objects(lesson_file):
                audio = rec.get("audio")
                # `say` wins over `hanzi` when the two differ: a 儿歌 line like
                # 鹅鹅鹅 is three separate beats the child repeats after the
                # teacher, but written solid the voice reads it as one long
                # "ééé". The page still shows 鹅鹅鹅; only the voice hears
                # 鹅，鹅，鹅. Real reduplicated words (爸爸, 妈妈) have no `say`
                # and stay a single word, which is correct for them.
                # `text` picks up the 口诀 on each lesson's rule card. Those
                # are printed with real letters — 「有 a 不放过」 — and a zh-CN
                # voice reads a bare "a" as the English letter, so the rules
                # that contain letters carry a `say` in 呼读音 characters.
                text = (rec.get("say") or rec.get("hanzi")
                        or rec.get("word") or rec.get("text"))
                if audio and text:
                    manifest[audio] = text

    # 顺口溜: the phrase half only. The letters that follow it are played from
    # their own recordings at runtime, so the synthesiser never sees a letter.
    for rec in parse_js_objects(ROOT / "data" / "sounds.js"):
        audio, text = rec.get("audio"), rec.get("say")
        if audio and text and "/mnemonic/" in audio:
            manifest[audio] = text

    # 故事: poem lines, their titles, and the 生词 under each.
    stories = ROOT / "data" / "stories.js"
    if stories.exists():
        for rec in parse_js_objects(stories):
            audio = rec.get("audio")
            text = rec.get("say") or rec.get("hanzi") or rec.get("word")
            if audio and text:
                manifest[audio] = text

    return manifest


# ─────────────────────────────────────────────────────────────────────
# Synthesis
# ─────────────────────────────────────────────────────────────────────

async def synth_one(sem, communicate_cls, rel_path: str, text: str, force: bool):
    out = ROOT / rel_path
    if out.exists() and not force:
        return "skip", rel_path
    out.parent.mkdir(parents=True, exist_ok=True)
    async with sem:
        try:
            await communicate_cls(text, VOICE, rate=RATE).save(str(out))
        except Exception as exc:                       # network / voice errors
            return f"FAIL {exc}", rel_path
    if not out.exists() or out.stat().st_size < 500:   # empty MP3 = failure
        return "FAIL empty output", rel_path
    return "ok", rel_path


async def synth_all(manifest: dict, force: bool):
    from edge_tts import Communicate

    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = [synth_one(sem, Communicate, p, t, force) for p, t in sorted(manifest.items())]
    done = ok = skipped = failed = 0
    failures = []
    for coro in asyncio.as_completed(tasks):
        status, path = await coro
        done += 1
        if status == "ok":
            ok += 1
        elif status == "skip":
            skipped += 1
        else:
            failed += 1
            failures.append((path, status))
        if done % 25 == 0 or done == len(tasks):
            print(f"  {done}/{len(tasks)}  new={ok} skipped={skipped} failed={failed}", flush=True)
    return ok, skipped, failures


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="restrict to one audio subfolder, e.g. sheng")
    ap.add_argument("--force", action="store_true", help="re-synthesise existing files")
    ap.add_argument("--manifest", action="store_true", help="write manifest only")
    args = ap.parse_args()

    manifest = build_manifest()
    if args.only:
        prefix = f"audio/{args.only}/"
        manifest = {k: v for k, v in manifest.items() if k.startswith(prefix)}

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    print(f"manifest: {len(manifest)} entries -> {MANIFEST.relative_to(ROOT)}")

    if args.manifest:
        return 0
    if not manifest:
        print("nothing to generate")
        return 0

    try:
        import edge_tts  # noqa: F401
    except ImportError:
        print("edge-tts is not installed.  Run:  pip install edge-tts pypinyin", file=sys.stderr)
        return 1

    print(f"synthesising with {VOICE} at rate {RATE} ...")
    ok, skipped, failures = asyncio.run(synth_all(manifest, args.force))
    print(f"\ndone: {ok} generated, {skipped} already present, {len(failures)} failed")
    for path, why in failures:
        print(f"  FAILED  {path}: {why}", file=sys.stderr)

    print(
        "\nNext: open the app, go to 家长 → 音频检查, and listen to every letter.\n"
        "Check `eng` and `ong` first — they are the two the synthesiser cannot\n"
        "be trusted on. Record replacements into audio/overrides/<same path>."
    )
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
