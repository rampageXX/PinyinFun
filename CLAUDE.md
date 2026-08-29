# CLAUDE.md — 拼音岛 (PinyinFun)

Guidance for Claude Code when working in this repository.

## Project Overview

**拼音岛** is a browser app that teaches 汉语拼音 to a 7-year-old, following the
lesson sequence of the **2024 秋 人教版 (统编版) 一年级上册语文** textbook. Single
player (the child) plus a parent dashboard. Runs on an iPad in the browser —
no App Store, no install, no build step.

It is a content-swapped sibling of **Bonjourly** (`../Bonjourly`), an existing
French-learning app. Bonjourly's infrastructure — spaced repetition, lesson
registry, daily session orchestration, scoring, streaks, journey map — is the
proven base being reused here. **When implementing anything listed under
"Ported from Bonjourly" below, read the original file first and keep its logic.**

Full design: `docs/PLAN.md`.

## Status

Playable end to end. All 14 lessons, all four minigames, the daily mission,
the map, the sticker album and the parent dashboard are built and tested.

- [x] `data/sounds.js` — 63 sounds (23 声母 + 24 韵母 + 16 整体认读音节)
- [x] `data/syllables.js` — 279 syllables, 54 三拼, generated
- [x] `audio/` — 646 MP3s
- [x] `data/lessons/lessons.js` — all 14 lessons
- [x] four minigames + `dailyMission.js`
- [x] progression, streaks, scoring, stickers, map, parent dashboard
- [x] `tools/verify_data.py`, `tests/test_app.py` — 10 tests, all passing

Not done: the 音频检查 pass with a human ear (see Audio), and using it with
the child. Lessons 1–2 have no 声母, so 拼一拼 cannot run there — that is
correct, not a gap. 声调小火车 does run in 课1 now, on the bare 韵母 `e`
(é 鹅 / è 饿) — see 单韵母 as whole syllables below.

## Tech Stack

- Vanilla HTML5 + CSS3 + JavaScript (ES6). **No npm, no framework, no build step.**
- All state in `localStorage`, namespace `pinyin_`. No backend, no network, no accounts.
- Audio: pre-generated MP3s in `audio/`, played by `lib/audio.js`.
- Offline: `sw.js` precaches the whole app (673 files, 5 MB) so it runs with no
  network at all. Generated — see Offline below.
- Screens are `<section class="screen">` elements toggled with a `.hidden` class,
  exactly like Bonjourly. No router.
- Data files are plain JS that assign to globals or call `registerLesson()`, loaded
  by `<script>` tags in `index.html` in dependency order.

Edit files and open `index.html`. That is the whole dev loop.

## The Curriculum (source of truth for content)

14 pinyin lessons across three units in the 2024 statutory edition:

| 单元 | 课 | 内容 | Rule introduced |
|---|---|---|---|
| 二 | 1 | a o e | 四声 ā á ǎ à |
| 二 | 2 | i u ü | i 标调去点；ü 两点 |
| 二 | 3 | b p m f | **两拼音节** b-ā→bā |
| 二 | 4 | d t n l | n l 与 ü |
| 三 | 5 | g k h | **三拼音节** g-u-ā→guā |
| 三 | 6 | j q x | **j q x 见 ü 去两点** |
| 三 | 7 | z c s | 整体认读 zi ci si |
| 三 | 8 | zh ch sh r | 平翘舌；整体认读 zhi chi shi ri |
| 三 | 9 | y w | 整体认读 yi wu yu；y+ü→yu |
| 四 | 10 | ai ei ui | **标调规则** 有a不放过，没a找o e，i u 并列标在后 |
| 四 | 11 | ao ou iu | iu 标在 u |
| 四 | 12 | ie üe er | 整体认读 ye yue；er 不与声母相拼 |
| 四 | 13 | an en in un ün | 前鼻韵母；整体认读 yuan yin yun |
| 四 | 14 | ang eng ing ong | 后鼻韵母；整体认读 ying |

Each textbook lesson runs 看图认读字母 → 记字形(顺口溜) → 拼读音节 → 词语 → 儿歌.
The app mirrors this as four lesson stages: ① 认一认 ② 拼一拼 ③ 练一练 ④ 儿歌.

**Do not reorder lessons or introduce a sound before its lesson.** The whole point
of the app is that it tracks what the child is being taught at school that week.

## Architecture

```
index.html          # every screen as a hidden section; script tags in dependency order
styles.css          # island design system
app.js              # screen rendering + navigation
manifest.json       # PWA metadata — installs to the iPad home screen
sw.js               # GENERATED offline cache (tools/gen_sw.py)
data/
  sounds.js         # ✅ 63 sounds — the unit of spaced repetition
  syllables.js      # curriculum syllables, per-tone 汉字 + audio
  stickers.js       # 40 sticker definitions
  stories.js        # 故事 — five Tang poems, graded and unlocked by lesson
  lessons/
    _registry.js    # registerLesson(), getLessonById(), lesson state
    lessons.js      # all 14 lessons — thin, they reference sounds by id
art/                # drawn story scenes, flat SVG in the island palette
games/
  _ui.js            # shared game chrome: header, speaker, feedback timing
  listenPick.js     # 听音选一选
  blendBuilder.js   # 拼一拼 — drag 声母+韵母, the core skill
  toneTrain.js      # 声调小火车
  sharpEyes.js      # 火眼金睛 — b/d/p/q discrimination
  dailyMission.js   # 10-question session orchestrator
lib/
  storage.js audio.js ruby.js strength.js
  selection.js scoring.js streaks.js progress.js stickers.js
audio/
  sheng/ yun/ zheng/ syl/ word/ chant/ sfx/
  overrides/        # hand-recorded MP3s that win over generated ones
tools/
  gen_audio.py      # audio generation
  gen_syllables.py  # generates data/syllables.js from the curriculum
  verify_data.py    # data integrity checks
  verify_stories.py # the 故事 difficulty ladder, measured not asserted
  gen_sw.py         # regenerates sw.js — run after gen_audio.py
tests/test_app.py   # Playwright smoke test
```

### Ported from Bonjourly — read the original before rewriting

| This repo | Bonjourly original | Change |
|---|---|---|
| `lib/storage.js` | `lib/storage.js` | `NS = 'pinyin_'` |
| `lib/strength.js` | `lib/wordStrength.js` | same algorithm, ids are sound ids |
| `lib/scoring.js` | `lib/scoring.js` | unchanged |
| `lib/streaks.js` | `lib/streaks.js` | drop JSONBin sync |
| `lib/selection.js` | `lib/dailySelection.js` | keep `seededRng`/`weightedSample`/`seededSample`/`shuffle10` verbatim |
| `lib/progress.js` | `lib/lessonProgress.js` | same mastery test over sound ids |
| `data/lessons/_registry.js` | same file | same `registerLesson()` pattern |
| `games/listenPick.js` | `games/listenAndPick.js` | options are letters/syllables, not English |
| `games/dailyMission.js` | `games/dailyDuel.js` | single player, new game types |
| `app.js` navigation | `app.js` | `showScreen`, `navTo`, `showToast`, `getTodayString`, `svgEl`, week grid, `renderJourney`→`renderMap` |

**Deliberately dropped**: `lib/jsonbin.js`, `config.js`, avatar system,
`typeTranslation.js` + `levenshtein.js` (no typing — a 7-year-old taps and drags),
`grammarDrill.js`.

## Key Algorithms (inherited, keep the constants)

- **Sound strength**: correct `+15`, wrong `−20`, daily decay `−5` (`−10` for 3 days
  after a broken streak), clamped 0–100. Labels: 强 80+, 学习中 40–79, 模糊 10–39, 忘了 <10.
- **Scoring**: 100 base + up to 50 speed bonus (full within 12s) + 25 every 3rd correct in a row.
- **Daily selection**: seeded by the date string so a reload mid-session resumes the
  same 10 items. 60% current lesson, 40% weakness-weighted review of earlier lessons.
- **Progression**: it works like a game — a mission at ≥`CLEAR_RATIO` (9/10)
  *and* every letter the lesson teaches asked at least once *clears* it, awards
  its sticker and opens the next lesson immediately. No calendar anywhere.
  From 课3 on, six of the ten slots go to blending and tone drills, so lessons
  teaching more than four letters (课7 8 9 12 13 14) take two sittings — the
  result screen names the letters still waiting.
- **Coverage ordering**: `pickTodaysItems` puts never-asked letters at the
  front. This is load-bearing, not a nicety: the draw is seeded by date, so
  without it a second sitting on the same day repeats the identical letters and
  a big lesson can never be cleared at all.
- Replaying a cleared lesson is always allowed and never moves her backwards.
- **The map bar** is average sound *strength* (50 start, +15 / −20, −5 a day,
  never-asked counts 0) — a knowledge meter, not the mission score. One perfect
  session caps around 80%.

## Audio

The one genuinely risky part. Browser zh-CN voices read `"b"` as the English letter
"bee", so nothing is synthesised at runtime — every sound is a static MP3 generated
from a **Chinese character that produces it** (the 呼读音: b→玻, a→啊, z→资).

```bash
pip install edge-tts pypinyin
python tools/gen_audio.py            # generates everything missing, skips existing
python tools/gen_audio.py --manifest # inspect what it would say, generate nothing
```

**Two sounds cannot be synthesised reliably and are flagged `needsRecording` in
`data/sounds.js`:**
- `eng` — maps to 鞥, a rare character the voice may mispronounce
- `ong` — has *no* standalone syllable in Mandarin, so no character exists at all

Listen to those two first. Record replacements yourself into
`audio/overrides/audio/yun/eng.mp3` and `.../ong.mp3`; `lib/audio.js` checks
`overrides/` before the generated file, so no code change is needed.

### 单韵母 as whole syllables

课1's whole rule is 四声, but every syllable used to need a 声母, so the lesson
that teaches tones had nothing for 声调小火车 to drill. `STANDALONE_YUNMU` in
`gen_syllables.py` fixes that: a 韵母 that is already a complete syllable gets
its own entry with `shengmu:null`. Today that is `e` (课1) and `er` (课12 — it
never takes an initial, so it was otherwise undrillable).

`a` and `o` are **not** there, and cannot be. Audio is synthesised from a 汉字
that produces the reading, and ǎ/á/ō/ó have no character in common use — 啊 is
read as one tone whatever mark you write. Giving 课1 a full four-tone drill on
`a` needs hand-recorded clips in `audio/overrides/audio/syl/a1.mp3` … `a4.mp3`;
drop them in and add `a` to `STANDALONE_YUNMU` with matching `OVERRIDES`.

A 声母-less syllable must never reach 拼一拼 — there is nothing to blend.
`buildSchedule()` filters them into `blendPool` separately for that reason.

`lib/audio.js` API: `playAudio(src, onEnd)`, `playSequence([a,b,c], onEnd)` for
拼读 (`b … ā … bā`), `preloadLesson(id)`, `speakFallback(text)`.
iOS blocks audio until a user gesture — the 开始 button plays a silent buffer once
to unlock playback for the session.

## 故事

A reading section, separate from the lessons because reading is a different act
from drilling — she follows the ruby and listens, she is not being tested. Five
Tang poems, every source ancient and out of copyright, the retellings written
for this app.

A story unlocks when the lesson in `unlockAfter` is cleared, so it arrives as a
reward for finishing a lesson. Order is **measured, not asserted**:

```bash
python tools/verify_stories.py
```

It reports, per story, what share of the syllables are built only from letters
she has met by that lesson — the honest answer to "can she read this yet" — and
fails if the sequence steps backwards. That check is why 静夜思 is last despite
being the most famous: `chuáng shuāng guāng` all need 课14's ang/uang, making it
the hardest to decode, and putting it early broke the ladder by 19 points.

Reading material may use letters ahead of the lesson — 课1's 儿歌 already does.
The "never before its lesson" rule governs **game distractors**, not text she
reads with pinyin above it.

Pictures are flat SVG in `art/`, drawn rather than photographed: a few kilobytes
each, no licence to track, and they look like the rest of the app. Photographs
would be none of those things.

## Offline

The app never calls a network by itself — no backend, no accounts, no CDN, no
fonts to fetch. The only reason it would need internet is that GitHub Pages has
to hand over the files, so `sw.js` caches them on the device instead. After one
online visit it runs on a plane, indefinitely.

```bash
python tools/gen_sw.py    # after gen_audio.py, or any change to the shell
```

`VERSION` in `sw.js` is a content hash of every cached file, so a redeploy drops
the old cache rather than leaving a child with a half-updated app.
`verify_data.py` fails if `sw.js` is stale — otherwise the app looks fine on a
laptop and silently serves yesterday's audio on the iPad.

The shell must cache or install fails; audio is best-effort, because one
unreachable MP3 should not cost the whole offline app. Registration is skipped
on `file://`, where service workers do not exist and opening `index.html`
directly is still the dev loop.

## 四声 must be hearable

A rule showing tone marks carries a `toneDemo`: four cards pairing each mark
with a real word in that tone, tappable, plus a button that plays all four in a
row. Comparison is the whole point — a single tone in isolation says nothing.

The example is **八 拔 把 爸**, not the letter itself. `ǎ` and `á` have no
character in common use, so a bare vowel in four tones cannot be synthesised at
all — the same wall that keeps 课1's tone drill down to `e`. One syllable across
four tones is how tones are taught anyway, and 爸 is a word she already owns.

`verify_data.py` fails a rule that prints tone marks with no `toneDemo`, or
whose examples are out of tone order.

## Nothing on a lesson screen is silent

She cannot read. Every block of text on a lesson screen has a 🔊 and reads on
tap — the intro, the 顺口溜 on each card, the 口诀, the 儿歌 lines, the words.
`verify_data.py` fails a lesson whose intro or rule has no audio.

Each speaking control is at least 64px tall. This is not cosmetic: the 顺口溜
sits inside the sound card, which is itself a button, so a near-miss plays the
bare letter instead of the chant — it looks like the app ignoring her.

The aria-labels are deliberately distinct — 读一读介绍 / 读一读规则 / 读一读 —
because three controls whose labels all began 读一读 could not be told apart. The 口诀 is the one thing on a lesson screen
a child cannot decode for herself — 「前音轻短后音重，两音相连猛一碰。」 is
written for a reader, and she is not one yet.

Eleven of the fourteen print letters, and a zh-CN voice says a bare `a` as the
English letter name. Those carry a `say` in 呼读音 characters, the same escape
hatch the 儿歌 lines use — the page shows 「有 a 不放过」, the voice hears
「有 啊 不放过」. `verify_data.py` fails a rule with no audio, or one that prints
letters without a `say`.

The 顺口溜 is voiced differently, because 「右下半圆 b b b」 ends in the letter
itself. Only the phrase is synthesised; the letters are then played from their
own recording, so the sequence is `mnemonic/sh-b.mp3` followed by `sheng/b.mp3`
three times. The synthesiser never sees a letter, which is the whole rule of
this app's audio. Three phrases contain letters mid-sentence — 课8's
「z 加 h，翘起舌头」 — and their `say` carries 呼读音: 「资 加 喝，翘起舌头」.

Tapping the card still plays the bare letter; the 顺口溜 stops propagation so
the two do not fire together and cut each other off.

Both `gen_audio.py` and `verify_data.py` walk nested objects to find these: a
rule holds a `demo: {...}` and a sound holds a `mnemonicVoice: {...}`, and
matching only innermost braces skipped the records that contain them.

## UI Conventions

- **Every Chinese label carries pinyin ruby above it** via `lib/ruby.js`, and speaks
  when tapped. The interface itself is reading practice.
- **Tone colours are used consistently everywhere** — they are a learning aid, not
  decoration: 1声 `#E8524A`, 2声 `#F0A02E`, 3声 `#3FA85C`, 4声 `#3F7FD1`, 轻声 grey.
- Palette: sky `#4AA8E8`, sand `#FFF3DC`, sunshine `#FFC94A`, coral `#FF7A6B`,
  leaf `#4CC97A`, ink `#234057`.
- Touch targets ≥64px. Chunky rounded cards, thick borders. Built for small fingers.
- No typing anywhere. Tap and drag only.

## Rules that must not be broken

These are the invariants a change can quietly violate, and `tests/test_app.py`
guards each one:

1. **Never show a letter before its lesson.** Distractors come from
   `availableSounds(order)`; a `confusable` pointing at a later lesson is
   dropped, not leaked. Offering ü in lesson 1 asks the child to rule out
   something she has never seen.
2. **Tone marks follow 标调规则.** `writeTone()` implements 有a不放过，没a找o e，
   i u 并列标在后. A mis-placed mark teaches the error.
3. **Pinyin is lowercase.** No `text-transform: uppercase` anywhere near it.
4. **Latin letters need a single-storey `a` and `g`** — see `--font-pinyin`.
5. **A syllable never precedes either of its parts** (`gen_syllables.py`
   assigns each to the lesson of its last-introduced part).
6. **A lesson opens only once the one before it is cleared.**
   `isLessonUnlocked()` reads `clearedOn[prev]`, so the map can never show an
   island whose letters she has not reached yet. Clearing is the only key.
7. **Audio never outlives the question that started it.** Elements are cached
   one per file, so a listener left behind on a shared clip resurfaces in a
   later lesson — 课3's bā blend shares `audio/yun/a.mp3` with 课1's a, which
   once made tapping a in 课1 play bā. Every play detaches its own listeners
   when superseded, and carries a `generation` so a stale callback cannot
   restart a sequence from a lesson she has left.

## What is left

- The 音频检查 pass by ear, especially `eng` and `ong`
- 课1's tone drill covers only `e`. `a` and `o` need hand-recorded tone clips
  before they can join it — see 单韵母 as whole syllables under Audio.
- Trying it with the child, and tuning from what actually confuses her
- Optional: GitHub Pages deploy (`.nojekyll`-ready; the service worker means
  it only needs the network for the very first visit)

## Verification

```bash
node -e "eval(require('fs').readFileSync('data/sounds.js','utf8')+';global.S=SOUNDS');console.log(S.length)"
python tools/verify_data.py      # data + offline cache integrity
python -m pytest tests/          # Playwright smoke test, 11 tests
```

`verify_data.py` must check: every `audio:` path exists on disk or in `overrides/`;
every id referenced by a lesson exists; no duplicate ids; all 23 声母 / 24 韵母 /
16 整体认读音节 assigned to exactly one lesson each; lesson `order` 1–14 with no gaps.

**The real test is the child.** Validate the mechanics on lessons 1–4 with her before
authoring lessons 5–14 — content is the expensive part.
