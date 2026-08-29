# 拼音岛 · content expansion — 词语 and 故事

A plan for two additions: many more example words per lesson, and a 故事 section
of classic Chinese stories that grows with her.

Written against the app as it stands at `717f33b`. Companion to `PLAN.md`, which
covers the original build.

---

## Where the app is today

| | now | after this plan |
|---|---|---|
| example words | 42 total (2–4 per lesson) | ~130 (8–10 per lesson) |
| reading material | 39 儿歌 lines | + ~180 story lines across 15 stories |
| pictures | emoji only, no image files at all | emoji + one drawn scene per story |
| payload | 6.2 MB (5.9 MB audio) | ~8.5 MB |
| screens | 9 | 11 (`#story-list-screen`, `#story-screen`) |

Two facts from the existing code drive the design below.

**Reading material is already ahead of the letters.** 课1's 儿歌 line is
`zhāng dà zuǐ ba` — zh belongs to 课8, d to 课4, z to 课7, b to 课3. That is
deliberate and matches the textbook: she listens, repeats, and follows the ruby.
The "never show a letter before its lesson" invariant is enforced on **game
distractors** (`availableSounds` / `pickDistractors`), not on things she reads.
Stories can therefore use full pinyin from the start.

**Ruby pairing is checked.** `verify_data.py` asserts every 汉字/pinyin pair has
as many syllables as characters. Story lines must satisfy it, so lines are
authored short and punctuation kept outside the pairing.

---

## Part A — more example words

### What changes

Each lesson goes from 3 words to 8–10, chosen so the lesson's own letters appear
in the **initial position** wherever possible — 课3 (b p m f) gets 爸爸 妈妈 白菜
面包 佛手, not words where b merely appears somewhere.

Each word keeps today's shape and needs nothing new in the data model:

```js
{ hanzi: '面包', pinyin: 'miàn bāo', pic: '🍞', audio: 'audio/word/面包.mp3' }
```

### Selection rules

1. **Initial-position first.** The letter being taught starts the word.
2. **Concrete and picturable.** If there is no honest emoji for it, it does not
   go in — a word she cannot picture is a word she cannot hold.
3. **Inside a 7-year-old's spoken vocabulary.** She should recognise the *word*
   and be learning only its spelling.
4. **One tone-contrast pair per lesson** where the letters allow it (妈 / 马,
   包 / 抱) — tones are the thing she will get wrong longest.

### Where they appear

The 词语 stage of `#lesson-screen` already renders the list; it just gets longer,
so it becomes a scrollable grid of tappable cards. No new screen.

Two follow-ons worth considering, deliberately **not** in this plan's first cut:

- a 看图选词 minigame driven by the enlarged word bank
- word strength tracked alongside sound strength (`lib/strength.js` is id-based
  and would take it unchanged)

### Cost

~90 new MP3s from `gen_audio.py`, ≈ 630 KB. No code changes beyond the data.

---

## Part B — 故事

### Shape

A fifth nav item, 📖 故事, opening a list of stories as cards. Each story is one
screen: a drawn scene, then the text line by line with pinyin ruby above the
characters. Tapping a line plays it; a ▶ 全部 button reads the whole story with
the lines highlighting as they play.

Every story ends with a 生词 strip — 4–6 words from the story with picture and
sound, feeding the same word bank as Part A.

### Progression

Three tiers, unlocked by lessons cleared, so a story never arrives before she can
read most of it.

**Tier 1 · 古诗和童谣** — unlocks after 课6. 4–8 lines, heavy repetition, every
line 3–5 characters.

| | story | source | why |
|---|---|---|---|
| 1 | 咏鹅 | 骆宾王 · 唐 | opens `鹅，鹅，鹅` — the exact line she already sings in 课1 |
| 2 | 静夜思 | 李白 · 唐 | the poem every Chinese child learns first |
| 3 | 春晓 | 孟浩然 · 唐 | 20 characters, strong rhyme |
| 4 | 画 | 王维 · 唐 | riddle structure, delights this age |
| 5 | 悯农 | 李绅 · 唐 | concrete, and a moral she will meet at school |

**Tier 2 · 小故事** — unlocks after 课10. 8–12 lines, one event, clear cause and
effect.

| | story | source |
|---|---|---|
| 6 | 乌鸦喝水 | 伊索寓言 |
| 7 | 龟兔赛跑 | 伊索寓言 |
| 8 | 守株待兔 | 韩非子 |
| 9 | 拔苗助长 | 孟子 |
| 10 | 狐假虎威 | 战国策 |

**Tier 3 · 成语故事** — unlocks after 课14, when all 63 sounds are known. 12–20
lines, a real narrative arc.

| | story | source |
|---|---|---|
| 11 | 司马光砸缸 | 宋史 |
| 12 | 曹冲称象 | 三国志 |
| 13 | 孔融让梨 | 后汉书 |
| 14 | 亡羊补牢 | 战国策 |
| 15 | 井底之蛙 | 庄子 |

Every source is ancient and long out of copyright. The retellings are written
fresh in simple modern Chinese for this app, not copied from a published edition
— which is what keeps the repo publishable.

### Graded, and checked

Difficulty is not left to judgement. `tools/verify_stories.py` computes per story
and asserts the sequence never goes backwards by more than one step:

- line count and characters per line
- distinct 汉字 count
- **% of syllables already met** by the unlock lesson — tier 1 should sit above
  85%, tier 3 may drop to 60%

The last number is the honest measure of "can she read this yet", and it is worth
printing per story so the ordering can be tuned from data rather than instinct.

### Data model

New `data/stories.js`, loaded like the other data files:

```js
const STORIES = [
  {
    id: 'story-yonge', order: 1, tier: 1, unlockAfter: 'lesson-06',
    title: { hanzi: '咏鹅', pinyin: 'yǒng é' },
    source: '骆宾王 · 唐',
    art: 'art/yonge.svg',
    lines: [
      { hanzi: '鹅鹅鹅', say: '鹅，鹅，鹅', pinyin: 'é é é',
        audio: 'audio/story/yonge-1.mp3' },
      { hanzi: '曲项向天歌', pinyin: 'qū xiàng xiàng tiān gē',
        audio: 'audio/story/yonge-2.mp3' },
    ],
    words: [
      { hanzi: '鹅', pinyin: 'é', pic: '🦢', audio: 'audio/word/鹅.mp3' },
    ],
  },
];
```

`say` is the field added for the 儿歌 fix and it is needed again here — repeated
characters must be spoken as separate beats, and `verify_data.py` already fails a
line that omits it.

### New code

| file | purpose |
|---|---|
| `data/stories.js` | the 15 stories |
| `lib/stories.js` | unlock state, "read" marks, next-story pick |
| `app.js` | `renderStoryList()`, `renderStory()`, line playback + highlight |
| `index.html` | two screens, fifth nav button |
| `tools/verify_stories.py` | the difficulty ladder check |

Reuses `ruby.js` for the text and `audio.js` for playback unchanged — including
the generation guard, so leaving a story mid-narration cannot leak a line into
the next screen.

### Rewards

Reading a story marks it read and awards a sticker. The album has 40 slots and 14
are spoken for by lessons, so there is room. This also gives the 贴纸册 something
to do after 课14, which is currently where the app runs out.

---

## Pictures — the part that needs a decision

You asked for pictures from the internet. I want to be straight about why I have
not planned for that, and what I would do instead.

**Three problems with pulling images from the web.**

1. **Copyright.** Almost every image on the internet is someone's. This repo is
   public under your name — bundling images I cannot licence is a real problem,
   not a theoretical one.
2. **Offline.** `sw.js` precaches every file so the app works with no network. An
   image referenced by URL is a blank box on a plane. They must be files in the
   repo, and photos are heavy: 15 story illustrations at 150 KB each nearly
   doubles the app.
3. **Coherence.** The whole app is emoji on flat sand-and-sea cards. Photographs
   dropped into that will look borrowed, because they will be.

**What I recommend instead**

- **Words: keep emoji.** Zero bytes, sharp at any size, already the design
  language, and the selection rule above ("no honest emoji, no word") turns the
  constraint into a filter that improves the word list.
- **Stories: one authored SVG scene each.** Flat shapes in the existing palette —
  a white goose on green water for 咏鹅, a crow and a jar for 乌鸦喝水. Roughly
  3–8 KB each, ~75 KB for all 15, theme-aware, and unmistakably part of this app.

**If you want real artwork**, the clean route is public-domain sources rather than
a general web search — Wikimedia Commons has out-of-copyright Chinese painting,
and 连环画 from the 1950s–60s is the classic look for exactly these stories. That
needs your go-ahead on two things: roughly +2–4 MB of payload, and a per-image
licence check I would list for you to approve rather than decide silently.

---

## Size budget

| | added |
|---|---|
| ~90 word MP3s | 0.6 MB |
| ~180 story line MP3s | 1.5 MB |
| 15 story titles | 0.1 MB |
| 15 SVG scenes | 0.08 MB |
| **total** | **≈ 2.3 MB → app ~8.5 MB** |

Still comfortable for a precached PWA. With photographs instead of SVG it lands
nearer 12 MB, which is where a first load over a phone connection starts to be
noticeable.

---

## Verification

Extending what already exists rather than inventing a second system:

- `verify_data.py` — story audio present on disk; ruby pairs balanced; repeated
  characters carry `say`; `unlockAfter` names a real lesson; no duplicate ids
- `tools/verify_stories.py` — the difficulty ladder, printed per story
- `tests/test_app.py` — a story locked before its lesson is cleared and readable
  after; tapping a line plays that line's audio; leaving mid-narration silences
  it; the word grid renders every word with picture and audio

`gen_sw.py` must run after any audio or art is added — `verify_data.py` already
fails a stale `sw.js`, so this is caught rather than remembered.

---

## Build order

Each step ends somewhere runnable.

1. **Word list** — author 8–10 per lesson, `gen_audio.py`, verify. No code.
2. **Lesson screen** — scrollable word grid.
3. **Story plumbing** — `data/stories.js` with 咏鹅 only, both screens, nav
   button, `lib/stories.js`, playback and highlight. One story proves the shape.
4. **Tier 1** — remaining four poems, `verify_stories.py`, the ladder tuned.
5. **Art** — 15 SVG scenes.
6. **Tiers 2 and 3** — the ten stories, generated in bulk against the template.
7. **Rewards** — story stickers, unlock toasts.
8. **Polish** — tests, `CLAUDE.md`, regenerate `sw.js`, deploy.

Steps 1–2 are worth shipping on their own: they need no new screens and give her
more of what already works.

---

## Open decisions

1. **Pictures** — emoji + authored SVG (recommended), or public-domain artwork
   with the size and licensing that implies?
2. **How many stories** — 15 as listed, or start with tier 1's five and see
   whether she reads them?
3. **Nav** — a fifth 故事 button, or reach stories from the map so the bar stays
   at four?
4. **Story audio** — one clip per line (tappable, better for learning, ~180
   files), or one per story (simpler, less useful)? Assumed per line above.
