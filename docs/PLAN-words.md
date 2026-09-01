# 拼音岛 · 词语 — a word book that grows with her

A 词语 tab that opens one theme at a time as she clears lessons, starting from
the most concrete words a 7-year-old already owns and widening from there. Every
word carries examples, and every example carries pinyin above the characters.

Written against `69bda39`. Companion to `PLAN.md` and `PLAN-content.md`.

---

## The situation now

| | |
|---|---|
| distinct 汉字 anywhere in the app | **599** |
| …shown as blend / tone examples | 507 |
| …in 词语, with a picture | 154 |
| characters the app **tracks or teaches** | **0** |

She already meets five hundred characters, and they are decently chosen — 273 of
the 507 blend examples sit on the repo's own TIER1 list (concrete, first-grade),
228 more are general high-frequency, only six outside both. Exposure is not the
problem. **Nothing remembers any of it**: 八 appears once as the example for `bā`
and may never be deliberately seen again.

Two other facts shape the design.

**`lib/strength.js` is id-agnostic.** It keys on any string — sound ids today,
syllable ids since 课1's tone drill. Words need no new algorithm, only ids.

**The app has nothing after 课14.** `checkProgress` returns `null` for the next
lesson, so `currentLessonId` sticks at 14 and the mission becomes permanent
review. A word book that is still opening up at 课14 is the answer to "what now".

---

## How many

Running-text coverage is brutally front-loaded — roughly:

| characters | ≈ coverage of ordinary text |
|---|---|
| 100 | 40% |
| 300 | 60% |
| 500 | 75% |
| 1000 | 90% |

The first 300 do most of the work the first 1000 do. 一年级上册's 识字表 is about
300 recognised characters, which is the number to aim at eventually — but not
the number to build first.

**Build 14 themes × ~10 words = ~134 to start.** One theme per lesson. Then
widen each theme to ~20 for ~280 once she has taken to it. The themes are the
structure; the depth inside them is a dial.

Of the 134 below, **126 are already on TIER1** and **32 already have a
recording** — so this is largely assembling what the repo has, not inventing.

### Sourcing — the honest bit

This list is assembled from TIER1 plus frequency and theme sense. It is a good
list. It is **not** her textbook's 识字表, and I will not label it as one: the
whole value of this app is that it matches her class, and a plausible-looking
substitute is worse than an obvious gap. If you can photograph those pages the
set becomes hers. `data/words.js` is generated, so re-cutting it later is a
regeneration, not a rewrite.

---

## The ladder

One theme unlocks per lesson cleared, in this order. Concrete and already-spoken
first; abstract and school-ish last.

| 课 | theme | words |
|---|---|---|
| 1 | 基础 | 人 大 小 上 下 中 我 你 好 不 |
| 2 | 数字 | 一 二 三 四 五 六 七 八 九 十 |
| 3 | 身体 | 口 手 足 目 耳 头 心 牙 眼 鼻 |
| 4 | 食物 | 米 饭 果 菜 肉 蛋 面 奶 茶 糖 |
| 5 | 家人 | 爸 妈 哥 姐 弟 妹 家 门 |
| 6 | 动物 | 马 牛 羊 鸟 鱼 虫 猫 狗 兔 鸡 |
| 7 | 自然 | 日 月 火 水 土 木 山 石 田 天 |
| 8 | 颜色 | 红 黄 蓝 绿 白 黑 |
| 9 | 方位 | 前 后 左 右 里 外 远 近 |
| 10 | 家里 | 窗 床 桌 椅 书 笔 纸 灯 伞 刀 |
| 11 | 动作 | 走 跑 看 听 说 读 写 吃 喝 玩 |
| 12 | 天气 | 云 风 雨 雪 电 冰 星 光 |
| 13 | 时间 | 年 早 午 晚 今 明 春 夏 秋 冬 |
| 14 | 学校 | 学 校 老 师 同 友 本 课 字 |

Numbers come second rather than first because 人 大 小 上 下 are the words she
will meet in the 儿歌 and 故事 she is already reading, and a first theme should
feel like recognition rather than instruction.

---

## What a word looks like

The point of the tab is the examples. A character alone is a shape; 手 becomes
learnable when she sees 洗手 and 小手 and hears them.

```js
{
  id: 'w-shou', theme: 'body', word: '手', pinyin: 'shǒu', pic: '✋',
  audio: 'audio/word/手.mp3',
  examples: [
    { hanzi: '洗手', pinyin: 'xǐ shǒu', pic: '🧼', audio: 'audio/word/洗手.mp3' },
    { hanzi: '小手', pinyin: 'xiǎo shǒu', audio: 'audio/word/小手.mp3' },
  ],
}
```

Up to two examples per word, each rendered through `lib/ruby.js` so the pinyin
sits above the characters, each tappable. `verify_data.py` already checks every
ruby pairing has as many syllables as it has 汉字, so the examples are covered by
a check that exists.

---

## Screens

**词语 tab → theme list.** The 故事 list pattern, which already works: one card
per theme, locked ones greyed with 学完第 N 课就能看. Each unlocked card shows
its own progress — **认识 7 / 10**.

**Theme → word grid.** The 词语 chips from the lesson screen, reused. Emoji,
character, pinyin.

**Word → detail.** The character large with pinyin above it, its picture, a 🔊,
then the examples each with ruby and their own 🔊. This is the screen the whole
feature exists for.

Nav goes from five buttons to six. At 768px that is 128px each and fine; if it
ever needs to work on a phone, 词语 folds into 贴纸册 as a second tab instead.

---

## Unlocking

`clearedOn[lesson-NN]` already exists and is what 故事 uses. A theme opens when
its lesson is cleared — no new state, no second progression, and it means the
word book keeps opening up for the whole run of the app rather than arriving all
at once.

Words are **not** gated on being able to read their pinyin. 人 and 大 are learned
as shapes long before their spelling matters, and gating on pinyin would put
数字 behind 课13 for 三 and 四. The pinyin is there to be leaned on, not earned.

---

## Practice — deliberately phase 2

The tab alone is a book, not a teacher. Once it is real and she is using it, two
mission games follow, both mirroring things that already work:

- **看字选音** — the character, three pinyin options. Sibling of 我会读.
- **听音选字** — hear it, pick the character. Sibling of 听音选一选.

**Where the slots come from matters**, and the lesson is fresh: 我会读 was first
given two slots taken from 听音选一选, and three tests failed because listenPick
and sharpEyes are the only slots that ask about a *letter*, and clearing a lesson
requires every letter to have been asked. Word slots must not come out of that
budget either.

| | while pinyin lessons remain | after 课14 |
|---|---|---|
| letter slots | 5 | 2 |
| syllable slots | 5 | 3 |
| word slots | 0–1 | 5 |

Before 课14 the mission barely changes. After it, the centre of gravity moves to
词语 and the app has somewhere to go.

---

## Cost

| | |
|---|---|
| 134 word recordings | 32 exist, ~102 new |
| ~268 example recordings | all new |
| new audio | **≈ 2.6 MB** |
| payload | 7.9 MB → **≈ 10.5 MB** |

Still a comfortable precache, but it is the point where a first load over a
phone connection is noticeable. Worth knowing before rather than after.

---

## Verification

Extending what exists:

- `verify_data.py` — every word and example has audio on disk; ruby pairings
  balanced (already checked); pinyin matches the character's default pypinyin
  reading — the check that caught 把; no duplicate ids; every example actually
  contains its own word
- `tools/verify_words.py` — themes are contiguous, each maps to a real lesson,
  no word appears in two themes, and the useful one: **how many of each theme's
  words already appear in the 词语 and 故事 she has seen**, so a theme is never
  entirely cold
- `tests/test_app.py` — a theme is locked before its lesson is cleared and open
  after; the word detail renders examples with ruby; tapping an example plays
  that example; nothing on the screen is silent

---

## Build order

1. **`tools/gen_words.py` + `data/words.js`** — the 14 themes, pinyin derived
   with pypinyin and an overrides table for neutral tones, as `gen_words` did.
2. **Audio** — `gen_audio.py` already synthesises from a 汉字; it needs only to
   scan the new file.
3. **词语 tab** — theme list and word grid. Locked states from day one, so the
   growth is visible immediately.
4. **Word detail with examples** — the screen that matters.
5. **`verify_words.py`**, tests, `gen_sw.py`, docs.
6. *(later)* 看字选音 and 听音选字, and the post-课14 mission shift.

Steps 1–4 are shippable on their own and are the thing you asked for.

---

## Open questions

1. **Depth now or later** — ~10 words per theme (134 total) to start, or go
   straight to ~20 (~280)? I would start at 10: it is half the audio and tells
   you whether she opens the tab at all.
2. **The list** — assemble from TIER1 as above, or wait for the 识字表?
3. **Six nav buttons, or fold 词语 into 贴纸册?**
4. **Should a theme's words also appear in her daily mission before 课14?** The
   table above says at most one; zero is also defensible and keeps the five
   minutes purely about pinyin.
