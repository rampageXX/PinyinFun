#!/usr/bin/env python3
"""
tools/verify_stories.py — is the 故事 ladder actually a ladder?

Difficulty is easy to assert and hard to feel. This measures it instead, per
story, and fails if the sequence steps backwards by more than a hair:

  lines / characters      how much there is to get through
  distinct 汉字            how much of it is new to look at
  readable %              the honest one — what share of the syllables are
                          built only from letters she has met by the lesson
                          the story unlocks after

`readable` is the number that says "can she actually read this yet". A story
that drops sharply below the one before it is out of order, however simple it
looks to an adult.

    python tools/verify_stories.py
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CJK = re.compile(r"[一-鿿]")

# How far readable% may fall from one story to the next before it counts as a
# step backwards. Some slack: vocabulary is not perfectly monotonic.
TOLERANCE = 12.0

TONES = {
    "ā": "a", "á": "a", "ǎ": "a", "à": "a",
    "ō": "o", "ó": "o", "ǒ": "o", "ò": "o",
    "ē": "e", "é": "e", "ě": "e", "è": "e",
    "ī": "i", "í": "i", "ǐ": "i", "ì": "i",
    "ū": "u", "ú": "u", "ǔ": "u", "ù": "u",
    "ǖ": "ü", "ǘ": "ü", "ǚ": "ü", "ǜ": "ü",
}


def toneless(syl):
    return "".join(TONES.get(ch, ch) for ch in syl)


def read(rel):
    return (ROOT / "data" / rel).read_text(encoding="utf-8")


def readable_bases(order):
    """Syllables spellable from letters taught up to and including `order`."""
    bases = set()
    for base, lesson in re.findall(r"base:'([^']+)', lesson:'lesson-(\d+)'", read("syllables.js")):
        if int(lesson) <= order:
            bases.add(base)
    # 整体认读 and bare 韵母 are whole syllables in their own right.
    for text, lesson in re.findall(r"text:'([^']+)'[^}]*?lesson:'lesson-(\d+)'",
                                   read("sounds.js"), re.S):
        if int(lesson) <= order:
            bases.add(text)
    return bases


def main():
    src = read("stories.js")
    blocks = re.findall(
        r"id: '(story-[^']+)', order: (\d+), tier: (\d+), "
        r"unlockAfter: (?:'lesson-(\d+)'|null)"
        r"(.*?)(?=\n  \{|\n\];)", src, re.S)
    if not blocks:
        print("no stories parsed", file=sys.stderr)
        return 1

    rows, problems = [], []
    for sid, order, tier, unlock, body in blocks:
        # A free story has no unlock lesson; measure it at 课1, which is where
        # she actually meets it.
        order, unlock = int(order), int(unlock or 1)
        # only what is inside `lines: [...]` — the title has the same shape
        block = re.search(r"lines: \[(.*?)\],", body, re.S)
        lines = re.findall(r"\{ hanzi: '([^']+)', pinyin: '([^']*)', audio:",
                           block.group(1) if block else "")
        chars = "".join("".join(CJK.findall(h)) for h, _ in lines)
        syls = [s for _, p in lines for s in p.split() if s]
        known = readable_bases(unlock)
        ok = sum(1 for s in syls if toneless(s) in known)
        rows.append({
            "id": sid, "order": order, "tier": int(tier), "unlock": unlock,
            "lines": len(lines), "chars": len(chars), "distinct": len(set(chars)),
            "per_line": round(len(chars) / max(1, len(lines)), 1),
            "readable": round(100.0 * ok / max(1, len(syls)), 1),
        })

    rows.sort(key=lambda r: r["order"])

    print(f"{'story':<18}{'课':>4}{'lines':>7}{'chars':>7}{'新字':>6}{'/line':>7}{'readable':>10}")
    for r in rows:
        print(f"{r['id']:<18}{r['unlock']:>4}{r['lines']:>7}{r['chars']:>7}"
              f"{r['distinct']:>6}{r['per_line']:>7}{r['readable']:>9}%")

    for a, b in zip(rows, rows[1:]):
        if b["unlock"] < a["unlock"]:
            problems.append(f"{b['id']} unlocks at 课{b['unlock']}, before {a['id']} at 课{a['unlock']}")
        if b["readable"] < a["readable"] - TOLERANCE:
            problems.append(
                f"{b['id']} is {a['readable'] - b['readable']:.1f} points less readable "
                f"than {a['id']} — the ladder steps backwards")

    if problems:
        print(f"\n{len(problems)} PROBLEM(S):", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    print("\nthe ladder holds")
    return 0


if __name__ == "__main__":
    sys.exit(main())
