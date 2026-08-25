/*
 * data/lessons/lessons.js — the 14 pinyin lessons of 2024 人教版一年级上册.
 *
 * A lesson is deliberately thin. It names which sounds it introduces and
 * carries the editorial content (the rule, the words, the chant); the sounds
 * themselves live in data/sounds.js and the syllables are derived in
 * data/syllables.js, which assigns each one to the lesson that completes it.
 * Nothing is duplicated, so nothing can drift.
 *
 * Fields
 *   rule   the spelling or blending rule this lesson introduces, or null.
 *          These are the load-bearing moments of the curriculum — 两拼,
 *          三拼, 见 ü 去两点, 标调规则 — and each gets its own card.
 *   words  词语 the textbook uses as examples. hanzi + audio are picked up
 *          by tools/gen_audio.py.
 *   chant  儿歌, one audio file per line so it can be played line by line
 *          and repeated after.
 *
 * DO NOT reorder. The whole point is that the app tracks the textbook.
 */

/* ══ 第二单元 ═══════════════════════════════════════════════════════ */

registerLesson({
  id: 'lesson-01', order: 1, unit: 2, island: '🏖',
  title: 'a o e', subtitle: '三个单韵母',
  intro: '第一课。三个韵母，四个声调。张大嘴巴 a，公鸡打鸣 o，白鹅唱歌 e。',
  sounds: ['yu-a', 'yu-o', 'yu-e'],
  rule: {
    id: 'rule-tones', title: '四声',
    text: '一声平，二声扬，三声拐弯，四声降。',
    tones: ['ā', 'á', 'ǎ', 'à'],
  },
  words: [
    { hanzi: '鹅', pinyin: 'é', pic: '🦢', audio: 'audio/word/鹅.mp3' },
    { hanzi: '阿姨', pinyin: 'ā yí', pic: '👩', audio: 'audio/word/阿姨.mp3' },
  ],
  chant: {
    title: '《张大嘴巴》',
    lines: [
      { hanzi: '张大嘴巴', pinyin: 'zhāng dà zuǐ ba', audio: 'audio/chant/l01-1.mp3' },
      { hanzi: '啊啊啊', pinyin: 'a a a', audio: 'audio/chant/l01-2.mp3' },
      { hanzi: '公鸡打鸣', pinyin: 'gōng jī dǎ míng', audio: 'audio/chant/l01-3.mp3' },
      { hanzi: '喔喔喔', pinyin: 'o o o', audio: 'audio/chant/l01-4.mp3' },
      { hanzi: '白鹅唱歌', pinyin: 'bái é chàng gē', audio: 'audio/chant/l01-5.mp3' },
      { hanzi: '鹅鹅鹅', pinyin: 'e e e', audio: 'audio/chant/l01-6.mp3' },
    ],
  },
  sticker: 'st-01',
});

registerLesson({
  id: 'lesson-02', order: 2, unit: 2, island: '🐚',
  title: 'i u ü', subtitle: '还有三个单韵母',
  intro: '六个单韵母到齐了。注意 i 戴帽子的时候要把点去掉：ī。',
  sounds: ['yu-i', 'yu-u', 'yu-v'],
  rule: {
    id: 'rule-i-dot', title: 'i 标调去点',
    text: 'i 戴上帽子，就要把头上的点摘下来：i → ī í ǐ ì。',
    tones: ['ī', 'í', 'ǐ', 'ì'],
  },
  words: [
    { hanzi: '衣服', pinyin: 'yī fu', pic: '👕', audio: 'audio/word/衣服.mp3' },
    { hanzi: '乌鸦', pinyin: 'wū yā', pic: '🐦', audio: 'audio/word/乌鸦.mp3' },
    { hanzi: '鱼', pinyin: 'yú', pic: '🐟', audio: 'audio/word/鱼.mp3' },
  ],
  chant: {
    title: '《小鱼吐泡》',
    lines: [
      { hanzi: '牙齿对齐', pinyin: 'yá chǐ duì qí', audio: 'audio/chant/l02-1.mp3' },
      { hanzi: '衣衣衣', pinyin: 'i i i', audio: 'audio/chant/l02-2.mp3' },
      { hanzi: '嘴巴突出', pinyin: 'zuǐ ba tū chū', audio: 'audio/chant/l02-3.mp3' },
      { hanzi: '乌乌乌', pinyin: 'u u u', audio: 'audio/chant/l02-4.mp3' },
      { hanzi: '小鱼吐泡', pinyin: 'xiǎo yú tǔ pào', audio: 'audio/chant/l02-5.mp3' },
      { hanzi: '迂迂迂', pinyin: 'ü ü ü', audio: 'audio/chant/l02-6.mp3' },
    ],
  },
  sticker: 'st-02',
});

registerLesson({
  id: 'lesson-03', order: 3, unit: 2, island: '🌴',
  title: 'b p m f', subtitle: '第一批声母',
  intro: '声母来了。声母不能单独念，要和韵母拼在一起：b 和 ā 一碰，就是 bā。',
  sounds: ['sh-b', 'sh-p', 'sh-m', 'sh-f'],
  rule: {
    id: 'rule-liangpin', title: '两拼音节',
    text: '前音轻短后音重，两音相连猛一碰。',
    demo: { parts: ['b', 'ā'], result: 'bā', hanzi: '八' },
  },
  words: [
    { hanzi: '爸爸', pinyin: 'bà ba', pic: '👨', audio: 'audio/word/爸爸.mp3' },
    { hanzi: '妈妈', pinyin: 'mā ma', pic: '👩', audio: 'audio/word/妈妈.mp3' },
    { hanzi: '布', pinyin: 'bù', pic: '🧵', audio: 'audio/word/布.mp3' },
  ],
  chant: {
    title: '《我的家》',
    lines: [
      { hanzi: '爸爸妈妈', pinyin: 'bà ba mā ma', audio: 'audio/chant/l03-1.mp3' },
      { hanzi: '我们的家', pinyin: 'wǒ men de jiā', audio: 'audio/chant/l03-2.mp3' },
    ],
  },
  sticker: 'st-03',
});

registerLesson({
  id: 'lesson-04', order: 4, unit: 2, island: '⛵',
  title: 'd t n l', subtitle: '再来四个声母',
  intro: 'n 和 l 遇到 ü 的时候，两点要留着：nü、lü。',
  sounds: ['sh-d', 'sh-t', 'sh-n', 'sh-l'],
  rule: {
    id: 'rule-nl-v', title: 'n l 与 ü',
    text: 'n 和 l 很客气，小 ü 的帽子不用摘：nü lü。',
    demo: { parts: ['l', 'ǜ'], result: 'lǜ', hanzi: '绿' },
  },
  words: [
    { hanzi: '大米', pinyin: 'dà mǐ', pic: '🍚', audio: 'audio/word/大米.mp3' },
    { hanzi: '土地', pinyin: 'tǔ dì', pic: '🌍', audio: 'audio/word/土地.mp3' },
    { hanzi: '女', pinyin: 'nǚ', pic: '👧', audio: 'audio/word/女.mp3' },
  ],
  chant: {
    title: '《大米土地》',
    lines: [
      { hanzi: '一粒大米', pinyin: 'yí lì dà mǐ', audio: 'audio/chant/l04-1.mp3' },
      { hanzi: '一片土地', pinyin: 'yí piàn tǔ dì', audio: 'audio/chant/l04-2.mp3' },
    ],
  },
  sticker: 'st-04',
});

/* ══ 第三单元 ═══════════════════════════════════════════════════════ */

registerLesson({
  id: 'lesson-05', order: 5, unit: 3, island: '🏝',
  title: 'g k h', subtitle: '三拼音节来了',
  intro: '有的音节有三个部分：g—u—ā，中间的 u 叫介母。',
  sounds: ['sh-g', 'sh-k', 'sh-h'],
  rule: {
    id: 'rule-sanpin', title: '三拼音节',
    text: '声轻介快韵母响，三音连读很顺当。',
    demo: { parts: ['g', 'u', 'ā'], result: 'guā', hanzi: '瓜' },
  },
  words: [
    { hanzi: '哥哥', pinyin: 'gē ge', pic: '👦', audio: 'audio/word/哥哥.mp3' },
    { hanzi: '喝水', pinyin: 'hē shuǐ', pic: '💧', audio: 'audio/word/喝水.mp3' },
    { hanzi: '西瓜', pinyin: 'xī guā', pic: '🍉', audio: 'audio/word/西瓜.mp3' },
  ],
  chant: {
    title: '《画画》',
    lines: [
      { hanzi: '哥哥画画', pinyin: 'gē ge huà huà', audio: 'audio/chant/l05-1.mp3' },
      { hanzi: '画个西瓜', pinyin: 'huà ge xī guā', audio: 'audio/chant/l05-2.mp3' },
    ],
  },
  sticker: 'st-05',
});

registerLesson({
  id: 'lesson-06', order: 6, unit: 3, island: '🌊',
  title: 'j q x', subtitle: '小 ü 要脱帽',
  intro: '这一课最重要的规则：j q x 和小 ü 在一起，ü 上的两点要去掉。',
  sounds: ['sh-j', 'sh-q', 'sh-x'],
  rule: {
    id: 'rule-jqx-v', title: 'j q x 见 ü 去两点',
    text: '小 ü 有礼貌，见了 j q x，摘下帽子敬个礼：jü → ju。',
    demo: { parts: ['j', 'ü'], result: 'jú', hanzi: '橘', note: '写作 ju，读作 jü' },
  },
  words: [
    { hanzi: '公鸡', pinyin: 'gōng jī', pic: '🐓', audio: 'audio/word/公鸡.mp3' },
    { hanzi: '气球', pinyin: 'qì qiú', pic: '🎈', audio: 'audio/word/气球.mp3' },
    { hanzi: '洗衣', pinyin: 'xǐ yī', pic: '🧺', audio: 'audio/word/洗衣.mp3' },
  ],
  chant: {
    title: '《小 ü 脱帽》',
    lines: [
      { hanzi: '小ü有礼貌', pinyin: 'xiǎo yǒu lǐ mào', audio: 'audio/chant/l06-1.mp3' },
      { hanzi: '见了j q x', pinyin: 'jiàn le', audio: 'audio/chant/l06-2.mp3' },
      { hanzi: '摘下帽子', pinyin: 'zhāi xià mào zi', audio: 'audio/chant/l06-3.mp3' },
      { hanzi: '敬个礼', pinyin: 'jìng ge lǐ', audio: 'audio/chant/l06-4.mp3' },
    ],
  },
  sticker: 'st-06',
});

registerLesson({
  id: 'lesson-07', order: 7, unit: 3, island: '🐠',
  title: 'z c s', subtitle: '平舌音',
  intro: '舌尖平平地抵住牙齿，这叫平舌音。zi ci si 是整体认读音节，不用拼，直接读。',
  sounds: ['sh-z', 'sh-c', 'sh-s', 'zt-zi', 'zt-ci', 'zt-si'],
  rule: {
    id: 'rule-zhengti', title: '整体认读音节',
    text: '整体认读音节不能拼读，看见了就直接读出来。',
    demo: { parts: ['zi'], result: 'zì', hanzi: '字' },
  },
  words: [
    { hanzi: '写字', pinyin: 'xiě zì', pic: '✍️', audio: 'audio/word/写字.mp3' },
    { hanzi: '词语', pinyin: 'cí yǔ', pic: '📖', audio: 'audio/word/词语.mp3' },
    { hanzi: '丝瓜', pinyin: 'sī guā', pic: '🥒', audio: 'audio/word/丝瓜.mp3' },
  ],
  chant: {
    title: '《写字》',
    lines: [
      { hanzi: '坐坐好', pinyin: 'zuò zuò hǎo', audio: 'audio/chant/l07-1.mp3' },
      { hanzi: '写好字', pinyin: 'xiě hǎo zì', audio: 'audio/chant/l07-2.mp3' },
    ],
  },
  sticker: 'st-07',
});

registerLesson({
  id: 'lesson-08', order: 8, unit: 3, island: '🦀',
  title: 'zh ch sh r', subtitle: '翘舌音',
  intro: '舌尖翘起来碰上颚，这叫翘舌音。和上一课的 z c s 比一比，别念混了。',
  sounds: ['sh-zh', 'sh-ch', 'sh-sh', 'sh-r', 'zt-zhi', 'zt-chi', 'zt-shi', 'zt-ri'],
  rule: {
    id: 'rule-pingqiao', title: '平舌音和翘舌音',
    text: 'z c s 舌头平，zh ch sh r 舌头翘。念一念：zi—zhi，ci—chi，si—shi。',
    demo: { parts: ['zh', 'ǐ'], result: 'zhǐ', hanzi: '纸' },
  },
  words: [
    { hanzi: '吃饭', pinyin: 'chī fàn', pic: '🍚', audio: 'audio/word/吃饭.mp3' },
    { hanzi: '狮子', pinyin: 'shī zi', pic: '🦁', audio: 'audio/word/狮子.mp3' },
    { hanzi: '日出', pinyin: 'rì chū', pic: '🌅', audio: 'audio/word/日出.mp3' },
  ],
  chant: {
    title: '《舌头操》',
    lines: [
      { hanzi: '平舌翘舌', pinyin: 'píng shé qiào shé', audio: 'audio/chant/l08-1.mp3' },
      { hanzi: '念清楚', pinyin: 'niàn qīng chu', audio: 'audio/chant/l08-2.mp3' },
    ],
  },
  sticker: 'st-08',
});

registerLesson({
  id: 'lesson-09', order: 9, unit: 3, island: '🐙',
  title: 'y w', subtitle: '两个好帮手',
  intro: 'y 和 w 帮韵母站在最前面。y 遇到 ü，ü 也要脱帽：yu。',
  sounds: ['sh-y', 'sh-w', 'zt-yi', 'zt-wu', 'zt-yu'],
  rule: {
    id: 'rule-y-v', title: 'y 见 ü 也去两点',
    text: 'y 和小 ü 在一起，两点同样要摘掉：yü → yu，读作 yü。',
    demo: { parts: ['y', 'ü'], result: 'yú', hanzi: '鱼' },
  },
  words: [
    { hanzi: '衣服', pinyin: 'yī fu', pic: '👕', audio: 'audio/word/衣服.mp3' },
    { hanzi: '乌鸦', pinyin: 'wū yā', pic: '🐦', audio: 'audio/word/乌鸦.mp3' },
    { hanzi: '小鱼', pinyin: 'xiǎo yú', pic: '🐟', audio: 'audio/word/小鱼.mp3' },
  ],
  chant: {
    title: '《小鱼游》',
    lines: [
      { hanzi: '小鱼小鱼', pinyin: 'xiǎo yú xiǎo yú', audio: 'audio/chant/l09-1.mp3' },
      { hanzi: '水里游', pinyin: 'shuǐ lǐ yóu', audio: 'audio/chant/l09-2.mp3' },
    ],
  },
  sticker: 'st-09',
});

/* ══ 第四单元 ═══════════════════════════════════════════════════════ */

registerLesson({
  id: 'lesson-10', order: 10, unit: 4, island: '🌋',
  title: 'ai ei ui', subtitle: '复韵母',
  intro: '两个韵母手拉手，就是复韵母。这一课还要学会声调标在哪儿。',
  sounds: ['yu-ai', 'yu-ei', 'yu-ui'],
  rule: {
    id: 'rule-biaodiao', title: '标调规则',
    text: '有 a 不放过，没 a 找 o e，i u 并列标在后。',
    demo: { parts: ['b', 'āi'], result: 'bái', hanzi: '白' },
  },
  words: [
    { hanzi: '白菜', pinyin: 'bái cài', pic: '🥬', audio: 'audio/word/白菜.mp3' },
    { hanzi: '妹妹', pinyin: 'mèi mei', pic: '👧', audio: 'audio/word/妹妹.mp3' },
    { hanzi: '围巾', pinyin: 'wéi jīn', pic: '🧣', audio: 'audio/word/围巾.mp3' },
  ],
  chant: {
    title: '《标调歌》',
    lines: [
      { hanzi: '有a不放过', pinyin: 'yǒu bú fàng guò', audio: 'audio/chant/l10-1.mp3' },
      { hanzi: '没a找o e', pinyin: 'méi zhǎo', audio: 'audio/chant/l10-2.mp3' },
      { hanzi: 'i u并列标在后', pinyin: 'bìng liè biāo zài hòu', audio: 'audio/chant/l10-3.mp3' },
    ],
  },
  sticker: 'st-10',
});

registerLesson({
  id: 'lesson-11', order: 11, unit: 4, island: '🏄',
  title: 'ao ou iu', subtitle: '还是复韵母',
  intro: 'iu 的声调标在 u 上面：iū iú iǔ iù。别标错地方。',
  sounds: ['yu-ao', 'yu-ou', 'yu-iu'],
  rule: {
    id: 'rule-iu', title: 'iu 标在 u',
    text: 'i u 并列标在后 —— iu 的帽子戴在 u 头上：liù。',
    demo: { parts: ['l', 'iù'], result: 'liù', hanzi: '六' },
  },
  words: [
    { hanzi: '棉袄', pinyin: 'mián ǎo', pic: '🧥', audio: 'audio/word/棉袄.mp3' },
    { hanzi: '莲藕', pinyin: 'lián ǒu', pic: '🥬', audio: 'audio/word/莲藕.mp3' },
    { hanzi: '游泳', pinyin: 'yóu yǒng', pic: '🏊', audio: 'audio/word/游泳.mp3' },
  ],
  chant: {
    title: '《小猫钓鱼》',
    lines: [
      { hanzi: '小猫钓鱼', pinyin: 'xiǎo māo diào yú', audio: 'audio/chant/l11-1.mp3' },
      { hanzi: '一条一条', pinyin: 'yì tiáo yì tiáo', audio: 'audio/chant/l11-2.mp3' },
    ],
  },
  sticker: 'st-11',
});

registerLesson({
  id: 'lesson-12', order: 12, unit: 4, island: '🌺',
  title: 'ie üe er', subtitle: '还有一个特别的 er',
  intro: 'er 很特别，它不和任何声母相拼，总是自己单独用。',
  sounds: ['yu-ie', 'yu-ve', 'yu-er', 'zt-ye', 'zt-yue'],
  rule: {
    id: 'rule-er', title: 'er 不与声母相拼',
    text: 'er 是个独行侠，从来不和声母做朋友，永远自己站着：ér、ěr、èr。',
    demo: { parts: ['er'], result: 'ěr', hanzi: '耳' },
  },
  words: [
    { hanzi: '树叶', pinyin: 'shù yè', pic: '🍃', audio: 'audio/word/树叶.mp3' },
    { hanzi: '月亮', pinyin: 'yuè liang', pic: '🌙', audio: 'audio/word/月亮.mp3' },
    { hanzi: '耳朵', pinyin: 'ěr duo', pic: '👂', audio: 'audio/word/耳朵.mp3' },
  ],
  chant: {
    title: '《月亮》',
    lines: [
      { hanzi: '月亮弯弯', pinyin: 'yuè liang wān wān', audio: 'audio/chant/l12-1.mp3' },
      { hanzi: '像小船', pinyin: 'xiàng xiǎo chuán', audio: 'audio/chant/l12-2.mp3' },
    ],
  },
  sticker: 'st-12',
});

registerLesson({
  id: 'lesson-13', order: 13, unit: 4, island: '🐢',
  title: 'an en in un ün', subtitle: '前鼻韵母',
  intro: '前鼻韵母的尾巴是 n，舌尖要抵住上牙床。',
  sounds: ['yu-an', 'yu-en', 'yu-in', 'yu-un', 'yu-vn', 'zt-yuan', 'zt-yin', 'zt-yun'],
  rule: {
    id: 'rule-qianbi', title: '前鼻韵母',
    text: '前鼻韵母 n 收尾，舌尖顶住上牙床：an en in un ün。',
    demo: { parts: ['t', 'iān'], result: 'tiān', hanzi: '天' },
  },
  words: [
    { hanzi: '天安门', pinyin: 'tiān ān mén', pic: '🏛️', audio: 'audio/word/天安门.mp3' },
    { hanzi: '白云', pinyin: 'bái yún', pic: '☁️', audio: 'audio/word/白云.mp3' },
    { hanzi: '树林', pinyin: 'shù lín', pic: '🌳', audio: 'audio/word/树林.mp3' },
  ],
  chant: {
    title: '《白云》',
    lines: [
      { hanzi: '蓝天白云', pinyin: 'lán tiān bái yún', audio: 'audio/chant/l13-1.mp3' },
      { hanzi: '飘啊飘', pinyin: 'piāo a piāo', audio: 'audio/chant/l13-2.mp3' },
    ],
  },
  sticker: 'st-13',
});

registerLesson({
  id: 'lesson-14', order: 14, unit: 4, island: '🏔',
  title: 'ang eng ing ong', subtitle: '后鼻韵母',
  intro: '最后一课。后鼻韵母的尾巴是 ng，舌根要抬起来。学完这一课，拼音就全学会了。',
  sounds: ['yu-ang', 'yu-eng', 'yu-ing', 'yu-ong', 'zt-ying'],
  rule: {
    id: 'rule-houbi', title: '后鼻韵母',
    text: '后鼻韵母 ng 收尾，舌根抬起来：ang eng ing ong。和前鼻音比一比：an—ang。',
    demo: { parts: ['y', 'áng'], result: 'yáng', hanzi: '羊' },
  },
  words: [
    { hanzi: '山羊', pinyin: 'shān yáng', pic: '🐑', audio: 'audio/word/山羊.mp3' },
    { hanzi: '台灯', pinyin: 'tái dēng', pic: '💡', audio: 'audio/word/台灯.mp3' },
    { hanzi: '老鹰', pinyin: 'lǎo yīng', pic: '🦅', audio: 'audio/word/老鹰.mp3' },
    { hanzi: '大钟', pinyin: 'dà zhōng', pic: '🔔', audio: 'audio/word/大钟.mp3' },
  ],
  chant: {
    title: '《毕业歌》',
    lines: [
      { hanzi: '拼音学完了', pinyin: 'pīn yīn xué wán le', audio: 'audio/chant/l14-1.mp3' },
      { hanzi: '什么都会读', pinyin: 'shén me dōu huì dú', audio: 'audio/chant/l14-2.mp3' },
    ],
  },
  sticker: 'st-14',
});
