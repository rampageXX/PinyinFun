# 拼音岛 (Pinyin Island) — a pinyin app for a 7-year-old

## Context

You want to teach your 7-year-old 汉语拼音 step by step, following the sequence the
2024 人教版 (统编版) 一年级上册语文 textbook actually uses, rather than an ad-hoc order.
You already have **Bonjourly** (`C:\Users\yuyin\OneDrive\Python\Bonjourly`) — a working,
no-build-step vanilla JS learning app with lessons, spaced repetition, daily sessions,
streaks, minigames and a rewards map. Rather than start from scratch, we clone its
proven infrastructure into a new app at `C:\Users\yuyin\OneDrive\Python\Pinyin` and
swap French vocabulary for the pinyin curriculum.

The outcome: a browser app your child opens on an iPad, does a 5-minute mission each
day, works through 14 lessons in textbook order, and collects stickers on a 拼音王国 map.

### Research: what the textbook actually does

The 2024 秋 statutory edition splits pinyin across **three units, 14 lessons**:

| 单元 | 课 | 内容 | New rules introduced |
|---|---|---|---|
| 二 | 1 | a o e | 四声 (ā á ǎ à), 四线三格 |
| 二 | 2 | i u ü | i 标调去点, ü 两点 |
| 二 | 3 | b p m f | **两拼音节** (b-ā→bā) |
| 二 | 4 | d t n l | n/l 与 ü |
| 三 | 5 | g k h | **三拼音节** (g-u-ā→guā) |
| 三 | 6 | j q x | **j q x 见 ü 去两点** |
| 三 | 7 | z c s | 整体认读 zi ci si |
| 三 | 8 | zh ch sh r | 平翘舌对比; 整体认读 zhi chi shi ri |
| 三 | 9 | y w | 整体认读 yi wu yu; y+ü→yu |
| 四 | 10 | ai ei ui | **标调规则** 有a不放过 / i u 并列标在后 |
| 四 | 11 | ao ou iu | iu 标在 u |
| 四 | 12 | ie üe er | 整体认读 ye yue; er 不与声母相拼 |
| 四 | 13 | an en in un ün | 前鼻韵母; 整体认读 yuan yin yun |
| 四 | 14 | ang eng ing ong | 后鼻韵母; 整体认读 ying |

Totals to cover: **23 声母, 24 韵母, 16 整体认读音节**.
Each textbook lesson follows the same shape: 看图认读字母 → 记字形(顺口溜) → 拼读音节 → 词语 → 儿歌.
The app mirrors that shape as four stages per lesson.

### Decisions already made

- **Audio**: pre-generated MP3s from a one-time Python script (accurate; works offline).
- **Players**: solo child + a parent dashboard. No JSONBin, no network, no accounts.
- **UI text**: Chinese with pinyin ruby above every character; every label speaks on tap.
- **Scope**: all 14 lessons.
- **Minigames**: 听音选一选, 拼一拼, 声调小火车, 火眼金睛 (all four).
- **Session**: daily 5-minute mission + freely browsable lessons.
- **Rewards**: 拼音王国 map (14 islands) + 40-slot sticker album.
- **Handwriting**: out of scope.

---

## Architecture

Same shape as Bonjourly: vanilla HTML/CSS/JS, no npm, no build, screens as hidden divs
toggled by `showScreen()`, all state in `localStorage`. Opens straight from `index.html`
(file://) or deploys to GitHub Pages unchanged.

```
C:\Users\yuyin\OneDrive\Python\Pinyin\
  index.html            # all screens as sections; script tags in dependency order
  styles.css            # island design system (see Visual direction)
  app.js                # screen rendering + navigation (mirrors Bonjourly app.js)
  CLAUDE.md             # project guide, written last
  data/
    sounds.js           # 63 atomic sounds: 23 声母 + 24 韵母 + 16 整体认读音节
    syllables.js        # curriculum syllables with per-tone 汉字 + audio paths
    stickers.js         # 40 sticker definitions
    lessons/
      _registry.js      # registerLesson(), getLessonById(), getSoundById(), state
      _template.js      # authoring template
      lesson01.js … lesson14.js
  games/
    listenPick.js       # 听音选一选
    blendBuilder.js     # 拼一拼  ← the important one
    toneTrain.js        # 声调小火车
    sharpEyes.js        # 火眼金睛
    dailyMission.js     # orchestrates a 10-question session
  lib/
    storage.js          # localStorage wrapper, namespace 'pinyin_'
    audio.js            # MP3 playback + 拼读 sequences + TTS fallback
    ruby.js             # renders 汉字 with pinyin ruby, speaks on tap
    strength.js         # spaced repetition per sound/syllable id
    selection.js        # deterministic daily item picker
    scoring.js          # points + speed + streak bonus
    streaks.js          # daily streak with freeze
    progress.js         # lesson mastery + unlock
    stickers.js         # award logic
  audio/
    sheng/ yun/ zheng/ syl/ word/ chant/    # generated MP3s
    overrides/                              # hand-recorded replacements (optional)
  tools/
    gen_audio.py        # one-time audio generation
    verify_data.py      # data integrity checks
  tests/
    test_app.py         # Playwright smoke test (modelled on Bonjourly/test_app.py)
```

### What is copied from Bonjourly vs. written new

**Copy nearly verbatim** (rename namespace, keep logic):
- `lib/storage.js` → change `NS` to `'pinyin_'`
- `lib/wordStrength.js` → `lib/strength.js` (identical algorithm: +15 / −20 / −5 daily decay,
  labels 强/学习中/模糊/忘了)
- `lib/scoring.js` → identical (100 base, ≤50 speed bonus, +25 every 3rd in a row)
- `lib/streaks.js` → drop the JSONBin sync, keep increment + monthly freeze
- `lib/dailySelection.js` → `lib/selection.js`; keep `seededRng`, `weightedSample`,
  `seededSample`, `shuffle10` verbatim; adapt `pickTodaysLessonWords` to
  `pickTodaysItems` (60% current lesson, 40% weakness-weighted review)
- `lib/lessonProgress.js` → `lib/progress.js`; same mastery test, applied to sound ids
- `data/lessons/_registry.js` → same `registerLesson()` / global-array pattern
- `games/listenAndPick.js` → `games/listenPick.js` (structure kept, options become
  pinyin/letters/pictures instead of English glosses)
- `games/dailyDuel.js` → `games/dailyMission.js` (same schedule/advance/progress loop,
  new game types, single-player)
- `app.js` screen machinery: `showScreen`, `navTo`, `setActiveNav`, `showToast`,
  `getTodayString`, `toDateString`, `svgEl`, week-grid rendering, journey-map SVG
  rendering (`renderJourney` → `renderMap`)

**Written new**:
- `lib/audio.js` — Bonjourly's is Web-Speech-only and won't survive here
- `lib/ruby.js`, `lib/stickers.js`
- `games/blendBuilder.js`, `games/toneTrain.js`, `games/sharpEyes.js`
- all `data/` content, `tools/`, `styles.css`

**Dropped**: `lib/jsonbin.js`, `config.js`, `data/avatarItems.js`, the avatar screen,
`games/typeTranslation.js` + `lib/levenshtein.js` (no typing for a 7-year-old — everything
is tap and drag), `games/grammarDrill.js`.

---

## Data model

### `data/sounds.js` — the unit of spaced repetition

```js
const SOUNDS = [
  { id:'sh-b',  type:'shengmu', text:'b',  audio:'audio/sheng/b.mp3',
    hanzi:'玻', pic:'📻', mnemonic:'右下半圆 b b b',
    confusable:['sh-d','sh-p'], lesson:'lesson-03' },

  { id:'yu-a',  type:'yunmu', sub:'dan',  text:'a', audio:'audio/yun/a.mp3',
    hanzi:'啊', pic:'👧', mnemonic:'张大嘴巴 a a a', lesson:'lesson-01' },

  { id:'zt-zhi', type:'zhengti', text:'zhi', audio:'audio/zheng/zhi.mp3',
    note:'整体认读，不能拼读', lesson:'lesson-08' },
];
```
63 entries. `confusable` drives 火眼金睛 distractors and Listen & Pick distractors —
so wrong answers are the ones the child actually confuses (b/d, p/q, z/zh, n/l, ei/ie,
ui/iu, an/ang, en/eng, in/ing), not random letters.

### `data/syllables.js` — 拼读 material

```js
{ id:'sy-ba', shengmu:'b', jiemu:null, yunmu:'a', base:'ba', lesson:'lesson-03',
  tones:[
    { tone:1, pinyin:'bā', hanzi:'八', word:'八',   pic:'8️⃣', audio:'audio/syl/ba1.mp3' },
    { tone:2, pinyin:'bá', hanzi:'拔', word:'拔河', pic:'🪢', audio:'audio/syl/ba2.mp3' },
    { tone:3, pinyin:'bǎ', hanzi:'把', word:'一把伞', pic:'☂️', audio:'audio/syl/ba3.mp3' },
    { tone:4, pinyin:'bà', hanzi:'爸', word:'爸爸', pic:'👨',  audio:'audio/syl/ba4.mp3' },
  ] }
```
Only tones that are real Mandarin syllables get an entry — the textbook drills real
syllables only. `jiemu` (介母 i/u/ü) non-null marks a 三拼音节, which `blendBuilder`
renders as three slots instead of two.

### `data/lessons/lessonNN.js`

```js
registerLesson({
  id:'lesson-03', order:3, unit:2, island:'🏝',
  title:  { zh:'b p m f', sub:'四个声母朋友' },
  intro:  '认识 b p m f，学会把声母和韵母拼在一起。',
  sounds:    ['sh-b','sh-p','sh-m','sh-f'],
  syllables: ['sy-ba','sy-bo','sy-bi','sy-bu','sy-pa','sy-po', /*…*/],
  words:     [ {pinyin:'bà ba', hanzi:'爸爸', pic:'👨', audio:'audio/word/爸爸.mp3'}, /*…*/ ],
  rule:   { id:'rule-liangpin', title:'两拼音节',
            text:'前音轻短后音重，两音相连猛一碰',
            demo:{ shengmu:'b', yunmu:'ā', result:'bā' } },      // or null
  chant:  { title:'《爸爸妈妈》',
            lines:[ {pinyin:'bà ba mā ma', hanzi:'爸爸妈妈'}, /*…*/ ],
            audio:'audio/chant/lesson03.mp3' },
  sticker:'st-03',
  mastery:{ threshold:0.8, minAttempts:2 },
});
```

---

## Audio pipeline

The one part with real risk, so it gets a QA loop built in.

**`tools/gen_audio.py`** — run once. Requires `pip install edge-tts pypinyin`
(Python 3.14.2 is already installed; neither package is yet).

1. Build a **pinyin → 汉字 reverse index**: iterate CJK U+4E00–U+9FFF, use `pypinyin`
   to get each character's toned reading, keep the most common character per reading
   (ranked against a bundled frequency list). This auto-supplies a speakable 汉字 for
   every syllable+tone in the curriculum.
2. Emit `tools/audio_manifest.json`: `{ "audio/syl/ba1.mp3": "八", ... }`, built from
   `data/sounds.js`, `data/syllables.js` and the lesson `words`/`chant` fields.
3. For bare 声母/韵母 use the standard **呼读音** characters (isolated letters have no
   character, so a fixed table is required):
   `b玻 p坡 m摸 f佛 d得 t特 n讷 l勒 g哥 k科 h喝 j基 q欺 x希 zh知 ch蚩 sh诗 r日 z资 c雌 s思 y衣 w乌`
   `a啊 o喔 e鹅 i衣 u乌 ü迂 ai哀 ei诶 ui威 ao熬 ou欧 iu优 ie耶 üe约 er儿 an安 en恩 in因 un温 ün晕 ang昂 eng鞥 ong轰*`
4. Synthesize each with `edge-tts`, voice `zh-CN-XiaoxiaoNeural`, rate `-10%`.
5. Write files; skip any that already exist so reruns are cheap.

**Known weak spots**: `eng` (鞥 is a rare character) and `ong` (no standalone syllable
exists — marked `*`). These will be checked first in QA and, if wrong, replaced by a
recording you make yourself.

**Audio QA screen** — `#audio-check-screen`, reachable from the parent view: a list of
every generated file with a ▶ button and a ✓/✗ toggle. Anything marked ✗ is listed for
re-recording; `lib/audio.js` checks `audio/overrides/<same-path>` first, so dropping a
hand-recorded MP3 there silently replaces the generated one with no code change.

**`lib/audio.js`** API:
```js
playAudio(src, onEnd)                 // override-aware, preloaded, cancels previous
playSequence([a, b, c], onEnd)        // 拼读: "b" … "ā" … "bā" with gaps
speakFallback(text)                   // zh-CN speechSynthesis, only if MP3 is missing
preloadLesson(lessonId)               // warm the cache when a lesson opens
```
iOS requires audio to be unlocked by a user gesture — the 开始 button on the start screen
plays a silent buffer once to unlock playback for the session.

---

## Screens

| id | 名字 | contents |
|---|---|---|
| `#start-screen` | 你好 | name input, big 开始 button (also unlocks iOS audio) |
| `#home-screen` | 首页 | 今天的任务 card w/ progress, 🔥连续 N 天, ⭐ points, 我的课程 card, 本周 7-day grid |
| `#map-screen` | 拼音王国 | SVG island path, 14 stops: ✓ done / ◉ current / 🔒 locked; tap → lesson |
| `#lesson-screen` | 课程 | four stages: ① 认一认 (sound cards) ② 拼一拼 ③ 练一练 ④ 儿歌 — each a ring showing completion; the 规则 card appears here when the lesson has one |
| `#game-screen` | — | host for whichever minigame is running; progress bar + live score |
| `#result-screen` | 太棒了 | score, correct count, stickers earned (animated), 再来一次 / 回家 |
| `#sticker-screen` | 贴纸册 | 40-slot album grid, locked slots greyed; tap a sticker to hear its sound |
| `#parent-screen` | 家长 | per-sound strength heatmap, minutes/day, lesson mastery %, link to audio QA, reset |

Bottom nav: 🏠 首页 · 🗺 王国 · 📖 贴纸册 · 👨‍👩‍👧 家长.
Every nav label and card title uses `ruby.js`, so it renders as pinyin-over-characters
and speaks when tapped.

---

## Minigames

All four keep Bonjourly's contract: `initX(item, onComplete)` where `onComplete`
receives `{ correct: bool, timeMs: number }`, rendering into `#game-area`.

**`blendBuilder.js` — 拼一拼** (highest pedagogical value)
Two modes, chosen by the mission schedule:
- *build*: 声母 card and 韵母 card shown; drag them into slots. On snap, `playSequence`
  says `b … ā … bā`, the merged card flips to the syllable with its tone colour, and the
  example 汉字 + picture fades in.
- *listen-and-build*: hear `guā`, pick the right 声母, 介母 and 韵母 from three rows.
Three-slot layout when `syllable.jiemu` is set. Pointer events (works for mouse and touch);
wrong pairs bounce back with a soft buzz.

**`listenPick.js` — 听音选一选**
Port of Bonjourly's `listenAndPick.js`. Prompt = 🔊; options = 4 large letter/syllable
cards. Distractors come from `confusable` first, then same-type sounds.

**`toneTrain.js` — 声调小火车**
Plays a syllable; four train cars show ā / á / ǎ / à with the tone contour drawn above
and the tone colour applied. Also a reverse mode: show `mā`, play three candidates, pick
the matching one.

**`sharpEyes.js` — 火眼金睛**
15-second timed grid of confusable letters; tap every instance of the target. Scores on
hits minus false taps. Pulled from the lesson's `confusable` sets.

**`dailyMission.js`**
Mirrors `dailyDuel.js`: a fixed 10-slot schedule seeded by today's date so a mid-session
reload resumes the same set. Default schedule —
`2× blendBuilder (2 slots each) · 3× listenPick · 2× toneTrain · 1× sharpEyes (2 slots)`.
Lessons 1–2 have no syllables yet, so those slots fall back to listenPick + toneTrain;
`buildSchedule()` degrades gracefully when a pool is empty.

---

## Visual direction

Bonjourly is a French café (cream/navy/gold, Playfair serif). This app needs its own
identity — a sunny island, made for small fingers:

- Palette: sky `#4AA8E8`, sand `#FFF3DC`, sunshine `#FFC94A`, coral `#FF7A6B`,
  leaf `#4CC97A`, ink `#234057`.
- **Tone colours used consistently everywhere** (a real learning aid, not decoration):
  1声 `#E8524A` · 2声 `#F0A02E` · 3声 `#3FA85C` · 4声 `#3F7FD1` · 轻声 grey.
- Chunky rounded cards, ≥64px touch targets, thick 3px borders, big drop shadows.
- Letters set in a rounded sans (system stack: `"HYQiHei", "PingFang SC", "Segoe UI Rounded", sans-serif`)
  at very large sizes; ruby pinyin at ~45% of the character size.
- Motion: card flip on match, pop on correct, gentle shake on wrong, sticker "peel and
  stick" animation on award, island stamp when a lesson completes.
- Sound effects: short correct/wrong/unlock chimes generated alongside the speech audio.

At implementation time, load the `frontend-design` skill before writing `styles.css`.

---

## Build order

Each step ends in something runnable — open `index.html` and check it.

1. **Skeleton** — `index.html` with all 8 screen sections, `styles.css` design system,
   `lib/storage.js`, `lib/ruby.js`, `app.js` navigation. Screens switch, ruby renders.
2. **Sound inventory** — `data/sounds.js`, all 63 entries with mnemonics and confusables.
3. **Audio** — `tools/gen_audio.py` + manifest + generate; `lib/audio.js`;
   `#audio-check-screen`. **Listen to the letters before continuing** — everything
   downstream depends on this being right.
4. **Lessons 1–4** — `_registry.js`, `_template.js`, `lesson01–04.js`, `data/syllables.js`
   for those lessons; `#lesson-screen` renders stage ① 认一认.
5. **listenPick + toneTrain** — first two playable games, driven from a lesson.
6. **blendBuilder** — including 三拼音节 layout (needed from lesson 5 onward).
7. **sharpEyes**.
8. **Progression** — `lib/strength.js`, `lib/progress.js`, lesson stages ②③④, mastery
   and unlock.
9. **Daily mission** — `lib/selection.js`, `lib/scoring.js`, `lib/streaks.js`,
   `games/dailyMission.js`, `#home-screen` and `#result-screen` wired up.
10. **拼音王国 map** — `#map-screen`, adapting Bonjourly's `renderJourney` SVG code.
11. **Sticker album** — `data/stickers.js`, `lib/stickers.js`, `#sticker-screen`,
    award animation on the result screen.
12. **Lessons 5–14** — bulk content authoring against the template; regenerate audio.
13. **Parent dashboard** — `#parent-screen`.
14. **Polish** — animations, sound effects, `CLAUDE.md`, optional GitHub Pages deploy.

---

## Verification

**Data integrity — `tools/verify_data.py`** (run after every content change):
- every `audio:` path referenced in `data/` exists on disk (or in `audio/overrides/`)
- every sound/syllable id referenced by a lesson exists; no duplicate ids
- all 23 声母 and 24 韵母 appear across the 14 lessons exactly once as `sounds`
- all 16 整体认读音节 present, each assigned to the textbook's lesson
- every syllable's `shengmu`/`yunmu` decompose to real sound ids
- lesson `order` values are 1–14 with no gaps

**Audio QA** — open `#audio-check-screen`, play all 63 letter sounds plus a sample of
syllables, mark failures. Confirm `eng` and `ong` specifically. Re-record any ✗ into
`audio/overrides/` and re-check.

**Functional — `tests/test_app.py`** (Playwright, modelled on `Bonjourly/test_app.py`):
- start screen → enter name → home screen renders
- 今天的任务 runs to completion; result screen shows a score and 10/10 progress
- `localStorage.pinyin_strengths` gains entries after a session
- completing lesson 1's stages unlocks lesson 2 on the map
- a sticker appears in the album after the first mastery

**With the child (the real test)**: open on the iPad, do lesson 1 (a o e) together.
Watch for: can they hear the tone difference in 声调小火车? do they understand what
拼一拼 is asking without being told? are the touch targets big enough? Adjust before
authoring lessons 5–14 — content is the expensive part, so validate the mechanics first.
