# 拼音岛 · PinyinFun

A browser app that teaches 汉语拼音 to a 7-year-old, following the lesson order of
the **2024 秋 人教版（统编版）一年级上册语文** textbook.

Single player plus a parent dashboard. No install, no accounts, no backend —
open `index.html` on an iPad and go.

## Status

Work in progress. Built so far:

- `data/sounds.js` — the complete sound inventory, 63 items, validated
  (23 声母 + 24 韵母 + 16 整体认读音节)
- `audio/` — 63 generated MP3s, one per sound
- `tools/gen_audio.py` — the audio pipeline
- `docs/PLAN.md` — the full approved design
- `CLAUDE.md` — architecture, conventions, build order

Not built yet: `index.html`, `styles.css`, `app.js`, the four minigames,
lesson data, progression, map, stickers. See **Build Order** in `CLAUDE.md`.

## Curriculum

| 单元 | 课 | 内容 |
|---|---|---|
| 二 | 1–4 | a o e · i u ü · b p m f · d t n l |
| 三 | 5–9 | g k h · j q x · z c s · zh ch sh r · y w |
| 四 | 10–14 | ai ei ui · ao ou iu · ie üe er · an en in un ün · ang eng ing ong |

## Regenerating audio

Browser zh-CN voices read `"b"` as the English letter "bee", so nothing is
synthesised at runtime. Every sound is a static MP3 generated from a Chinese
character that produces it — the 呼读音 (b→玻, a→啊, z→资).

```bash
pip install edge-tts pypinyin
python tools/gen_audio.py             # skips files that already exist
python tools/gen_audio.py --manifest  # show what it would say, generate nothing
```

**Two sounds need checking by ear**: `eng` (maps to the rare character 鞥) and
`ong` (no standalone syllable exists in Mandarin, so no character does either).
Both are flagged `needsRecording` in `data/sounds.js`. If they sound wrong, record
replacements into `audio/overrides/audio/yun/eng.mp3` and `.../ong.mp3` — the
player prefers an override whenever one exists.

## Development

No build step. Edit files, open `index.html`.

```bash
# sanity-check the sound data
node -e "eval(require('fs').readFileSync('data/sounds.js','utf8')+';global.S=SOUNDS');console.log(S.length)"
```
