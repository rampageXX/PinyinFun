/*
 * data/stories.js — 故事, the reading section.
 *
 * Tier 1 is 古诗: five Tang poems, twenty characters each, the ones every
 * Chinese child learns first. They are here rather than in the lessons because
 * reading is a different act from drilling — she follows the ruby and listens,
 * she is not being tested.
 *
 * Every source is ancient and long out of copyright. Difficulty is graded and
 * checked by tools/verify_stories.py rather than left to judgement, and each
 * poem unlocks a couple of lessons after the last, so one arrives as a reward
 * rather than five at once.
 *
 * Lines carry punctuation in `hanzi`; lib/ruby.js passes non-汉字 through
 * without consuming a syllable, so 「鹅，鹅，鹅，」 pairs with 「é é é」.
 */

const STORIES = [
  {
    id: 'story-yonge', order: 1, tier: 1, unlockAfter: null,
    title: { hanzi: '咏鹅', pinyin: 'yǒng é', audio: 'audio/story/yonge-title.mp3' },
    source: '骆宾王 · 唐',
    art: 'art/yonge.svg',
    lines: [
      { hanzi: '鹅，鹅，鹅，', pinyin: 'é é é', audio: 'audio/story/yonge-1.mp3' },
      { hanzi: '曲项向天歌。', pinyin: 'qū xiàng xiàng tiān gē', audio: 'audio/story/yonge-2.mp3' },
      { hanzi: '白毛浮绿水，', pinyin: 'bái máo fú lǜ shuǐ', audio: 'audio/story/yonge-3.mp3' },
      { hanzi: '红掌拨清波。', pinyin: 'hóng zhǎng bō qīng bō', audio: 'audio/story/yonge-4.mp3' },
    ],
    words: [
      { hanzi: '鹅', pinyin: 'é', pic: '🦢', audio: 'audio/word/鹅.mp3' },
      { hanzi: '水', pinyin: 'shuǐ', pic: '💧', audio: 'audio/word/水.mp3' },
      { hanzi: '红色', pinyin: 'hóng sè', pic: '🔴', audio: 'audio/word/红色.mp3' },
      { hanzi: '歌', pinyin: 'gē', pic: '🎵', audio: 'audio/word/歌.mp3' },
    ],
  },
  {
    id: 'story-minnong', order: 2, tier: 1, unlockAfter: 'lesson-04',
    title: { hanzi: '悯农', pinyin: 'mǐn nóng', audio: 'audio/story/minnong-title.mp3' },
    source: '李绅 · 唐',
    art: 'art/minnong.svg',
    lines: [
      { hanzi: '锄禾日当午，', pinyin: 'chú hé rì dāng wǔ', audio: 'audio/story/minnong-1.mp3' },
      { hanzi: '汗滴禾下土。', pinyin: 'hàn dī hé xià tǔ', audio: 'audio/story/minnong-2.mp3' },
      { hanzi: '谁知盘中餐，', pinyin: 'shéi zhī pán zhōng cān', audio: 'audio/story/minnong-3.mp3' },
      { hanzi: '粒粒皆辛苦。', pinyin: 'lì lì jiē xīn kǔ', audio: 'audio/story/minnong-4.mp3' },
    ],
    words: [
      { hanzi: '米饭', pinyin: 'mǐ fàn', pic: '🍚', audio: 'audio/word/米饭.mp3' },
      { hanzi: '土地', pinyin: 'tǔ dì', pic: '🌍', audio: 'audio/word/土地.mp3' },
      { hanzi: '太阳', pinyin: 'tài yáng', pic: '☀️', audio: 'audio/word/太阳.mp3' },
      { hanzi: '辛苦', pinyin: 'xīn kǔ', pic: '😓', audio: 'audio/word/辛苦.mp3' },
    ],
  },
  {
    id: 'story-chunxiao', order: 3, tier: 1, unlockAfter: 'lesson-06',
    title: { hanzi: '春晓', pinyin: 'chūn xiǎo', audio: 'audio/story/chunxiao-title.mp3' },
    source: '孟浩然 · 唐',
    art: 'art/chunxiao.svg',
    lines: [
      { hanzi: '春眠不觉晓，', pinyin: 'chūn mián bù jué xiǎo', audio: 'audio/story/chunxiao-1.mp3' },
      { hanzi: '处处闻啼鸟。', pinyin: 'chù chù wén tí niǎo', audio: 'audio/story/chunxiao-2.mp3' },
      { hanzi: '夜来风雨声，', pinyin: 'yè lái fēng yǔ shēng', audio: 'audio/story/chunxiao-3.mp3' },
      { hanzi: '花落知多少。', pinyin: 'huā luò zhī duō shǎo', audio: 'audio/story/chunxiao-4.mp3' },
    ],
    words: [
      { hanzi: '春天', pinyin: 'chūn tiān', pic: '🌸', audio: 'audio/word/春天.mp3' },
      { hanzi: '鸟', pinyin: 'niǎo', pic: '🐦', audio: 'audio/word/鸟.mp3' },
      { hanzi: '风', pinyin: 'fēng', pic: '🌬️', audio: 'audio/word/风.mp3' },
      { hanzi: '雨', pinyin: 'yǔ', pic: '☔', audio: 'audio/word/雨.mp3' },
    ],
  },
  {
    id: 'story-hua', order: 4, tier: 1, unlockAfter: 'lesson-08',
    title: { hanzi: '画', pinyin: 'huà', audio: 'audio/story/hua-title.mp3' },
    source: '王维 · 唐',
    art: 'art/hua.svg',
    lines: [
      { hanzi: '远看山有色，', pinyin: 'yuǎn kàn shān yǒu sè', audio: 'audio/story/hua-1.mp3' },
      { hanzi: '近听水无声。', pinyin: 'jìn tīng shuǐ wú shēng', audio: 'audio/story/hua-2.mp3' },
      { hanzi: '春去花还在，', pinyin: 'chūn qù huā hái zài', audio: 'audio/story/hua-3.mp3' },
      { hanzi: '人来鸟不惊。', pinyin: 'rén lái niǎo bù jīng', audio: 'audio/story/hua-4.mp3' },
    ],
    words: [
      { hanzi: '山', pinyin: 'shān', pic: '⛰️', audio: 'audio/word/山.mp3' },
      { hanzi: '水', pinyin: 'shuǐ', pic: '💧', audio: 'audio/word/水.mp3' },
      { hanzi: '花', pinyin: 'huā', pic: '🌸', audio: 'audio/word/花.mp3' },
      { hanzi: '鸟', pinyin: 'niǎo', pic: '🐦', audio: 'audio/word/鸟.mp3' },
    ],
  },
  {
    id: 'story-jingyesi', order: 5, tier: 1, unlockAfter: 'lesson-10',
    title: { hanzi: '静夜思', pinyin: 'jìng yè sī', audio: 'audio/story/jingyesi-title.mp3' },
    source: '李白 · 唐',
    art: 'art/jingyesi.svg',
    lines: [
      { hanzi: '床前明月光，', pinyin: 'chuáng qián míng yuè guāng', audio: 'audio/story/jingyesi-1.mp3' },
      { hanzi: '疑是地上霜。', pinyin: 'yí shì dì shàng shuāng', audio: 'audio/story/jingyesi-2.mp3' },
      { hanzi: '举头望明月，', pinyin: 'jǔ tóu wàng míng yuè', audio: 'audio/story/jingyesi-3.mp3' },
      { hanzi: '低头思故乡。', pinyin: 'dī tóu sī gù xiāng', audio: 'audio/story/jingyesi-4.mp3' },
    ],
    words: [
      { hanzi: '月亮', pinyin: 'yuè liang', pic: '🌙', audio: 'audio/word/月亮.mp3' },
      { hanzi: '头', pinyin: 'tóu', pic: '👤', audio: 'audio/word/头.mp3' },
      { hanzi: '光', pinyin: 'guāng', pic: '💡', audio: 'audio/word/光.mp3' },
      { hanzi: '家', pinyin: 'jiā', pic: '🏠', audio: 'audio/word/家.mp3' },
    ],
  },
];

const STORIES_BY_ID = {};
STORIES.forEach(function (s) { STORIES_BY_ID[s.id] = s; });

function getStory(id) { return STORIES_BY_ID[id]; }
