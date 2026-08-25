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

Early. What exists so far:

- [x] `data/sounds.js` — all 63 sounds, validated (23 声母 + 24 韵母 + 16 整体认读音节)
- [x] `tools/gen_audio.py` — audio generation pipeline (not yet run)
- [x] `docs/PLAN.md` — the full approved design
- [ ] everything else — see Build Order

## Tech Stack

- Vanilla HTML5 + CSS3 + JavaScript (ES6). **No npm, no framework, no build step.**
- All state in `localStorage`, namespace `pinyin_`. No backend, no network, no accounts.
- Audio: pre-generated MP3s in `audio/`, played by `lib/audio.js`.
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
data/
  sounds.js         # ✅ 63 sounds — the unit of spaced repetition
  syllables.js      # curriculum syllables, per-tone 汉字 + audio
  stickers.js       # 40 sticker definitions
  lessons/
    _registry.js    # registerLesson(), getLessonById(), lesson state
    _template.js    # authoring template
    lesson01..14.js
games/
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
  gen_audio.py      # ✅ one-time audio generation
  verify_data.py    # data integrity checks
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
- **Mastery**: ≥90% of a lesson's sounds attempted ≥2 times AND ≥80% at strength ≥80
  → lesson mastered, next lesson unlocks, sticker awarded.

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

`lib/audio.js` API: `playAudio(src, onEnd)`, `playSequence([a,b,c], onEnd)` for
拼读 (`b … ā … bā`), `preloadLesson(id)`, `speakFallback(text)`.
iOS blocks audio until a user gesture — the 开始 button plays a silent buffer once
to unlock playback for the session.

## UI Conventions

- **Every Chinese label carries pinyin ruby above it** via `lib/ruby.js`, and speaks
  when tapped. The interface itself is reading practice.
- **Tone colours are used consistently everywhere** — they are a learning aid, not
  decoration: 1声 `#E8524A`, 2声 `#F0A02E`, 3声 `#3FA85C`, 4声 `#3F7FD1`, 轻声 grey.
- Palette: sky `#4AA8E8`, sand `#FFF3DC`, sunshine `#FFC94A`, coral `#FF7A6B`,
  leaf `#4CC97A`, ink `#234057`.
- Touch targets ≥64px. Chunky rounded cards, thick borders. Built for small fingers.
- No typing anywhere. Tap and drag only.

## Build Order

Each step must end in something you can open and check.

1. Skeleton — `index.html`, `styles.css`, `lib/storage.js`, `lib/ruby.js`, `app.js` nav
2. ✅ `data/sounds.js`
3. Audio — run `tools/gen_audio.py`, write `lib/audio.js`, add the 音频检查 screen.
   **Listen before continuing; everything downstream depends on this.**
4. Lessons 1–4 + `data/syllables.js` + lesson screen stage ①
5. `listenPick.js` + `toneTrain.js`
6. `blendBuilder.js` (needs the 三拼音节 layout from lesson 5 on)
7. `sharpEyes.js`
8. Progression — `strength.js`, `progress.js`, lesson stages ②③④, mastery/unlock
9. Daily mission — `selection.js`, `scoring.js`, `streaks.js`, `dailyMission.js`, home + result
10. 拼音王国 map screen
11. Sticker album
12. Lessons 5–14, regenerate audio
13. Parent dashboard
14. Polish, sound effects, deploy

## Verification

```bash
node -e "eval(require('fs').readFileSync('data/sounds.js','utf8')+';global.S=SOUNDS');console.log(S.length)"
python tools/verify_data.py      # once written
python -m pytest tests/          # Playwright smoke test, once written
```

`verify_data.py` must check: every `audio:` path exists on disk or in `overrides/`;
every id referenced by a lesson exists; no duplicate ids; all 23 声母 / 24 韵母 /
16 整体认读音节 assigned to exactly one lesson each; lesson `order` 1–14 with no gaps.

**The real test is the child.** Validate the mechanics on lessons 1–4 with her before
authoring lessons 5–14 — content is the expensive part.
