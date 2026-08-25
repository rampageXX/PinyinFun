/*
 * data/stickers.js — 贴纸册, 40 slots.
 *
 * Collecting is the strongest motivator at this age, and a sticker book is
 * the physical thing a Chinese first-grader already knows. Every sticker is
 * earned by doing the work, never bought or given for showing up.
 *
 * Four kinds, all evaluated by lib/stickers.js:
 *   lesson   finishing one of the 14 lessons
 *   streak   coming back N days in a row
 *   points   accumulating points
 *   sounds   getting N of the 63 sounds to 会了
 */

const STICKERS = [
  /* ── One per lesson, echoing that lesson's 儿歌 ─────────────────── */
  { id: 'st-01', kind: 'lesson', lesson: 'lesson-01', emoji: '🦢', name: '白鹅', pinyin: 'bái é' },
  { id: 'st-02', kind: 'lesson', lesson: 'lesson-02', emoji: '🐟', name: '小鱼', pinyin: 'xiǎo yú' },
  { id: 'st-03', kind: 'lesson', lesson: 'lesson-03', emoji: '👨', name: '爸爸', pinyin: 'bà ba' },
  { id: 'st-04', kind: 'lesson', lesson: 'lesson-04', emoji: '🍚', name: '大米', pinyin: 'dà mǐ' },
  { id: 'st-05', kind: 'lesson', lesson: 'lesson-05', emoji: '🍉', name: '西瓜', pinyin: 'xī guā' },
  { id: 'st-06', kind: 'lesson', lesson: 'lesson-06', emoji: '🎈', name: '气球', pinyin: 'qì qiú' },
  { id: 'st-07', kind: 'lesson', lesson: 'lesson-07', emoji: '✍️', name: '写字', pinyin: 'xiě zì' },
  { id: 'st-08', kind: 'lesson', lesson: 'lesson-08', emoji: '🦁', name: '狮子', pinyin: 'shī zi' },
  { id: 'st-09', kind: 'lesson', lesson: 'lesson-09', emoji: '🐦', name: '乌鸦', pinyin: 'wū yā' },
  { id: 'st-10', kind: 'lesson', lesson: 'lesson-10', emoji: '🧣', name: '围巾', pinyin: 'wéi jīn' },
  { id: 'st-11', kind: 'lesson', lesson: 'lesson-11', emoji: '🏊', name: '游泳', pinyin: 'yóu yǒng' },
  { id: 'st-12', kind: 'lesson', lesson: 'lesson-12', emoji: '🌙', name: '月亮', pinyin: 'yuè liang' },
  { id: 'st-13', kind: 'lesson', lesson: 'lesson-13', emoji: '☁️', name: '白云', pinyin: 'bái yún' },
  { id: 'st-14', kind: 'lesson', lesson: 'lesson-14', emoji: '🦅', name: '老鹰', pinyin: 'lǎo yīng' },

  /* ── Coming back ───────────────────────────────────────────────── */
  { id: 'st-s03',  kind: 'streak', n: 3,   emoji: '🌱', name: '小苗',   pinyin: 'xiǎo miáo' },
  { id: 'st-s05',  kind: 'streak', n: 5,   emoji: '🌿', name: '嫩叶',   pinyin: 'nèn yè' },
  { id: 'st-s07',  kind: 'streak', n: 7,   emoji: '🌳', name: '大树',   pinyin: 'dà shù' },
  { id: 'st-s14',  kind: 'streak', n: 14,  emoji: '🌸', name: '开花',   pinyin: 'kāi huā' },
  { id: 'st-s21',  kind: 'streak', n: 21,  emoji: '🍎', name: '结果',   pinyin: 'jiē guǒ' },
  { id: 'st-s30',  kind: 'streak', n: 30,  emoji: '🏆', name: '奖杯',   pinyin: 'jiǎng bēi' },
  { id: 'st-s50',  kind: 'streak', n: 50,  emoji: '🌈', name: '彩虹',   pinyin: 'cǎi hóng' },
  { id: 'st-s100', kind: 'streak', n: 100, emoji: '👑', name: '皇冠',   pinyin: 'huáng guān' },

  /* ── Points ────────────────────────────────────────────────────── */
  { id: 'st-p1', kind: 'points', n: 500,   emoji: '🐞', name: '瓢虫', pinyin: 'piáo chóng' },
  { id: 'st-p2', kind: 'points', n: 1500,  emoji: '🐝', name: '蜜蜂', pinyin: 'mì fēng' },
  { id: 'st-p3', kind: 'points', n: 3000,  emoji: '🦋', name: '蝴蝶', pinyin: 'hú dié' },
  { id: 'st-p4', kind: 'points', n: 6000,  emoji: '🐢', name: '乌龟', pinyin: 'wū guī' },
  { id: 'st-p5', kind: 'points', n: 10000, emoji: '🐬', name: '海豚', pinyin: 'hǎi tún' },
  { id: 'st-p6', kind: 'points', n: 16000, emoji: '🦜', name: '鹦鹉', pinyin: 'yīng wǔ' },
  { id: 'st-p7', kind: 'points', n: 25000, emoji: '🦌', name: '小鹿', pinyin: 'xiǎo lù' },
  { id: 'st-p8', kind: 'points', n: 40000, emoji: '🐘', name: '大象', pinyin: 'dà xiàng' },

  /* ── Sounds at 会了 ────────────────────────────────────────────── */
  { id: 'st-m06', kind: 'sounds', n: 6,  emoji: '⭐', name: '一颗星',   pinyin: 'yī kē xīng' },
  { id: 'st-m12', kind: 'sounds', n: 12, emoji: '🌟', name: '两颗星',   pinyin: 'liǎng kē xīng' },
  { id: 'st-m20', kind: 'sounds', n: 20, emoji: '✨', name: '满天星',   pinyin: 'mǎn tiān xīng' },
  { id: 'st-m29', kind: 'sounds', n: 29, emoji: '🌜', name: '月牙',     pinyin: 'yuè yá' },
  { id: 'st-m36', kind: 'sounds', n: 36, emoji: '🌕', name: '满月',     pinyin: 'mǎn yuè' },
  { id: 'st-m44', kind: 'sounds', n: 44, emoji: '🌞', name: '太阳',     pinyin: 'tài yáng' },
  { id: 'st-m52', kind: 'sounds', n: 52, emoji: '🚀', name: '火箭',     pinyin: 'huǒ jiàn' },
  { id: 'st-m58', kind: 'sounds', n: 58, emoji: '🪐', name: '星球',     pinyin: 'xīng qiú' },
  { id: 'st-m63', kind: 'sounds', n: 63, emoji: '🐉', name: '中国龙',   pinyin: 'zhōng guó lóng' },
  { id: 'st-all', kind: 'lessonsAll', n: 14, emoji: '🎓', name: '毕业', pinyin: 'bì yè' },
];

const STICKERS_BY_ID = {};
STICKERS.forEach(function (s) { STICKERS_BY_ID[s.id] = s; });

function getSticker(id) { return STICKERS_BY_ID[id]; }
