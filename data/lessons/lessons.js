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
  introVoice: { say: '第一课。三个韵母，四个声调。张大嘴巴 啊，公鸡打鸣 喔，白鹅唱歌 鹅。',
    audio: 'audio/intro/lesson-01.mp3' },
  sounds: ['yu-a', 'yu-o', 'yu-e'],
  rule: {
    id: 'rule-tones', title: '四声',
    text: '一声平，二声扬，三声拐弯，四声降。',
    audio: 'audio/rule/lesson-01.mp3',
    tones: ['ā', 'á', 'ǎ', 'à'],
    toneDemo: {
      items: [
        { tone: 1, pinyin: 'bā', hanzi: '八', pic: '8️⃣', audio: 'audio/syl/ba1.mp3' },
        { tone: 2, pinyin: 'bá', hanzi: '拔', pic: '🪢', audio: 'audio/syl/ba2.mp3' },
        { tone: 3, pinyin: 'bǎ', hanzi: '把', pic: '✋', audio: 'audio/syl/ba3.mp3' },
        { tone: 4, pinyin: 'bà', hanzi: '爸', pic: '👨', audio: 'audio/syl/ba4.mp3' },
      ],
    },
  },
  words: [
    { hanzi: '鹅', pinyin: 'é', pic: '🦢', audio: 'audio/word/鹅.mp3' },
    { hanzi: '阿姨', pinyin: 'ā yí', pic: '👩', audio: 'audio/word/阿姨.mp3' },
    { hanzi: '大象', pinyin: 'dà xiàng', pic: '🐘', audio: 'audio/word/大象.mp3' },
    { hanzi: '婆婆', pinyin: 'pó po', pic: '👵', audio: 'audio/word/婆婆.mp3' },
    { hanzi: '我', pinyin: 'wǒ', pic: '🙋', audio: 'audio/word/我.mp3' },
    { hanzi: '哥哥', pinyin: 'gē ge', pic: '👦', audio: 'audio/word/哥哥.mp3' },
  ],
  chant: {
    title: '《张大嘴巴》',
    lines: [
      { hanzi: '张大嘴巴', pinyin: 'zhāng dà zuǐ ba', audio: 'audio/chant/l01-1.mp3' },
      { hanzi: '啊啊啊', say: '啊，啊，啊', pinyin: 'a a a', audio: 'audio/chant/l01-2.mp3' },
      { hanzi: '公鸡打鸣', pinyin: 'gōng jī dǎ míng', audio: 'audio/chant/l01-3.mp3' },
      { hanzi: '喔喔喔', say: '喔，喔，喔', pinyin: 'o o o', audio: 'audio/chant/l01-4.mp3' },
      { hanzi: '白鹅唱歌', pinyin: 'bái é chàng gē', audio: 'audio/chant/l01-5.mp3' },
      { hanzi: '鹅鹅鹅', say: '鹅，鹅，鹅', pinyin: 'e e e', audio: 'audio/chant/l01-6.mp3' },
    ],
  },
  sticker: 'st-01',
});

registerLesson({
  id: 'lesson-02', order: 2, unit: 2, island: '🐚',
  title: 'i u ü', subtitle: '还有三个单韵母',
  intro: '六个单韵母到齐了。注意 i 戴帽子的时候要把点去掉：ī。',
  introVoice: { say: '六个单韵母到齐了。注意 衣 戴帽子的时候要把点去掉。',
    audio: 'audio/intro/lesson-02.mp3' },
  sounds: ['yu-i', 'yu-u', 'yu-v'],
  rule: {
    id: 'rule-i-dot', title: 'i 标调去点',
    text: 'i 戴上帽子，就要把头上的点摘下来：i → ī í ǐ ì。',
    say: '小 衣 戴上帽子，就要把头上的点摘下来。',
    audio: 'audio/rule/lesson-02.mp3',
    tones: ['ī', 'í', 'ǐ', 'ì'],
    toneDemo: {
      items: [
        { tone: 1, pinyin: 'bā', hanzi: '八', pic: '8️⃣', audio: 'audio/syl/ba1.mp3' },
        { tone: 2, pinyin: 'bá', hanzi: '拔', pic: '🪢', audio: 'audio/syl/ba2.mp3' },
        { tone: 3, pinyin: 'bǎ', hanzi: '把', pic: '✋', audio: 'audio/syl/ba3.mp3' },
        { tone: 4, pinyin: 'bà', hanzi: '爸', pic: '👨', audio: 'audio/syl/ba4.mp3' },
      ],
    },
  },
  words: [
    { hanzi: '衣服', pinyin: 'yī fu', pic: '👕', audio: 'audio/word/衣服.mp3' },
    { hanzi: '乌鸦', pinyin: 'wū yā', pic: '🐦', audio: 'audio/word/乌鸦.mp3' },
    { hanzi: '鱼', pinyin: 'yú', pic: '🐟', audio: 'audio/word/鱼.mp3' },
    { hanzi: '一', pinyin: 'yī', pic: '1️⃣', audio: 'audio/word/一.mp3' },
    { hanzi: '椅子', pinyin: 'yǐ zi', pic: '🪑', audio: 'audio/word/椅子.mp3' },
    { hanzi: '五', pinyin: 'wǔ', pic: '5️⃣', audio: 'audio/word/五.mp3' },
    { hanzi: '雨', pinyin: 'yǔ', pic: '☔', audio: 'audio/word/雨.mp3' },
    { hanzi: '绿色', pinyin: 'lǜ sè', pic: '🟢', audio: 'audio/word/绿色.mp3' },
  ],
  chant: {
    title: '《小鱼吐泡》',
    lines: [
      { hanzi: '牙齿对齐', pinyin: 'yá chǐ duì qí', audio: 'audio/chant/l02-1.mp3' },
      { hanzi: '衣衣衣', say: '衣，衣，衣', pinyin: 'i i i', audio: 'audio/chant/l02-2.mp3' },
      { hanzi: '嘴巴突出', pinyin: 'zuǐ ba tū chū', audio: 'audio/chant/l02-3.mp3' },
      { hanzi: '乌乌乌', say: '乌，乌，乌', pinyin: 'u u u', audio: 'audio/chant/l02-4.mp3' },
      { hanzi: '小鱼吐泡', pinyin: 'xiǎo yú tǔ pào', audio: 'audio/chant/l02-5.mp3' },
      { hanzi: '迂迂迂', say: '迂，迂，迂', pinyin: 'ü ü ü', audio: 'audio/chant/l02-6.mp3' },
    ],
  },
  sticker: 'st-02',
});

registerLesson({
  id: 'lesson-03', order: 3, unit: 2, island: '🌴',
  title: 'b p m f', subtitle: '第一批声母',
  intro: '声母来了。声母不能单独念，要和韵母拼在一起：b 和 ā 一碰，就是 bā。',
  introVoice: { say: '声母来了。声母不能单独念，要和韵母拼在一起：玻 和 啊 一碰，就是 八。',
    audio: 'audio/intro/lesson-03.mp3' },
  sounds: ['sh-b', 'sh-p', 'sh-m', 'sh-f'],
  rule: {
    id: 'rule-liangpin', title: '两拼音节',
    text: '前音轻短后音重，两音相连猛一碰。',
    audio: 'audio/rule/lesson-03.mp3',
    demo: { parts: ['b', 'ā'], result: 'bā', hanzi: '八' },
  },
  words: [
    { hanzi: '爸爸', pinyin: 'bà ba', pic: '👨', audio: 'audio/word/爸爸.mp3' },
    { hanzi: '妈妈', pinyin: 'mā ma', pic: '👩', audio: 'audio/word/妈妈.mp3' },
    { hanzi: '布', pinyin: 'bù', pic: '🧵', audio: 'audio/word/布.mp3' },
    { hanzi: '笔', pinyin: 'bǐ', pic: '✏️', audio: 'audio/word/笔.mp3' },
    { hanzi: '苹果', pinyin: 'píng guǒ', pic: '🍎', audio: 'audio/word/苹果.mp3' },
    { hanzi: '皮球', pinyin: 'pí qiú', pic: '⚽', audio: 'audio/word/皮球.mp3' },
    { hanzi: '猫', pinyin: 'māo', pic: '🐱', audio: 'audio/word/猫.mp3' },
    { hanzi: '马', pinyin: 'mǎ', pic: '🐴', audio: 'audio/word/马.mp3' },
    { hanzi: '飞机', pinyin: 'fēi jī', pic: '✈️', audio: 'audio/word/飞机.mp3' },
    { hanzi: '风', pinyin: 'fēng', pic: '🌬️', audio: 'audio/word/风.mp3' },
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
  introVoice: { say: '讷 和 勒 遇到 迂 的时候，两点要留着：女、绿。',
    audio: 'audio/intro/lesson-04.mp3' },
  sounds: ['sh-d', 'sh-t', 'sh-n', 'sh-l'],
  rule: {
    id: 'rule-nl-v', title: 'n l 与 ü',
    text: 'n 和 l 很客气，小 ü 的帽子不用摘：nü lü。',
    say: '讷 和 勒 很客气，小 迂 的帽子不用摘：女，绿。',
    audio: 'audio/rule/lesson-04.mp3',
    demo: { parts: ['l', 'ǜ'], result: 'lǜ', hanzi: '绿' },
  },
  words: [
    { hanzi: '大米', pinyin: 'dà mǐ', pic: '🍚', audio: 'audio/word/大米.mp3' },
    { hanzi: '土地', pinyin: 'tǔ dì', pic: '🌍', audio: 'audio/word/土地.mp3' },
    { hanzi: '女', pinyin: 'nǚ', pic: '👧', audio: 'audio/word/女.mp3' },
    { hanzi: '弟弟', pinyin: 'dì di', pic: '👦', audio: 'audio/word/弟弟.mp3' },
    { hanzi: '灯', pinyin: 'dēng', pic: '💡', audio: 'audio/word/灯.mp3' },
    { hanzi: '兔子', pinyin: 'tù zi', pic: '🐰', audio: 'audio/word/兔子.mp3' },
    { hanzi: '太阳', pinyin: 'tài yáng', pic: '☀️', audio: 'audio/word/太阳.mp3' },
    { hanzi: '牛', pinyin: 'niú', pic: '🐮', audio: 'audio/word/牛.mp3' },
    { hanzi: '鸟', pinyin: 'niǎo', pic: '🐦', audio: 'audio/word/鸟.mp3' },
    { hanzi: '老虎', pinyin: 'lǎo hǔ', pic: '🐯', audio: 'audio/word/老虎.mp3' },
    { hanzi: '梨', pinyin: 'lí', pic: '🍐', audio: 'audio/word/梨.mp3' },
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
  introVoice: { say: '有的音节有三个部分：哥，乌，啊。中间的 乌 叫介母。',
    audio: 'audio/intro/lesson-05.mp3' },
  sounds: ['sh-g', 'sh-k', 'sh-h'],
  rule: {
    id: 'rule-sanpin', title: '三拼音节',
    text: '声轻介快韵母响，三音连读很顺当。',
    audio: 'audio/rule/lesson-05.mp3',
    demo: { parts: ['g', 'u', 'ā'], result: 'guā', hanzi: '瓜' },
  },
  words: [
    { hanzi: '哥哥', pinyin: 'gē ge', pic: '👦', audio: 'audio/word/哥哥.mp3' },
    { hanzi: '喝水', pinyin: 'hē shuǐ', pic: '💧', audio: 'audio/word/喝水.mp3' },
    { hanzi: '西瓜', pinyin: 'xī guā', pic: '🍉', audio: 'audio/word/西瓜.mp3' },
    { hanzi: '狗', pinyin: 'gǒu', pic: '🐕', audio: 'audio/word/狗.mp3' },
    { hanzi: '鸽子', pinyin: 'gē zi', pic: '🕊️', audio: 'audio/word/鸽子.mp3' },
    { hanzi: '口', pinyin: 'kǒu', pic: '👄', audio: 'audio/word/口.mp3' },
    { hanzi: '裤子', pinyin: 'kù zi', pic: '👖', audio: 'audio/word/裤子.mp3' },
    { hanzi: '猴子', pinyin: 'hóu zi', pic: '🐵', audio: 'audio/word/猴子.mp3' },
    { hanzi: '黑色', pinyin: 'hēi sè', pic: '⬛', audio: 'audio/word/黑色.mp3' },
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
  introVoice: { say: '这一课最重要的规则：基、欺、希 和小 迂 在一起，迂 上的两点要去掉。',
    audio: 'audio/intro/lesson-06.mp3' },
  sounds: ['sh-j', 'sh-q', 'sh-x'],
  rule: {
    id: 'rule-jqx-v', title: 'j q x 见 ü 去两点',
    text: '小 ü 有礼貌，见了 j q x，摘下帽子敬个礼：jü → ju。',
    say: '小 迂 有礼貌，见了 基、欺、希，摘下帽子敬个礼：居。',
    audio: 'audio/rule/lesson-06.mp3',
    demo: { parts: ['j', 'ü'], result: 'jú', hanzi: '橘', note: '写作 ju，读作 jü' },
  },
  words: [
    { hanzi: '公鸡', pinyin: 'gōng jī', pic: '🐓', audio: 'audio/word/公鸡.mp3' },
    { hanzi: '气球', pinyin: 'qì qiú', pic: '🎈', audio: 'audio/word/气球.mp3' },
    { hanzi: '洗衣', pinyin: 'xǐ yī', pic: '🧺', audio: 'audio/word/洗衣.mp3' },
    { hanzi: '家', pinyin: 'jiā', pic: '🏠', audio: 'audio/word/家.mp3' },
    { hanzi: '脚', pinyin: 'jiǎo', pic: '🦶', audio: 'audio/word/脚.mp3' },
    { hanzi: '七', pinyin: 'qī', pic: '7️⃣', audio: 'audio/word/七.mp3' },
    { hanzi: '汽车', pinyin: 'qì chē', pic: '🚗', audio: 'audio/word/汽车.mp3' },
    { hanzi: '雪', pinyin: 'xuě', pic: '❄️', audio: 'audio/word/雪.mp3' },
    { hanzi: '星星', pinyin: 'xīng xing', pic: '⭐', audio: 'audio/word/星星.mp3' },
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
  introVoice: { say: '舌尖平平地抵住牙齿，这叫平舌音。资、雌、思 是整体认读音节，不用拼，直接读。',
    audio: 'audio/intro/lesson-07.mp3' },
  sounds: ['sh-z', 'sh-c', 'sh-s', 'zt-zi', 'zt-ci', 'zt-si'],
  rule: {
    id: 'rule-zhengti', title: '整体认读音节',
    text: '整体认读音节不能拼读，看见了就直接读出来。',
    audio: 'audio/rule/lesson-07.mp3',
    demo: { parts: ['zi'], result: 'zì', hanzi: '字' },
  },
  words: [
    { hanzi: '写字', pinyin: 'xiě zì', pic: '✍️', audio: 'audio/word/写字.mp3' },
    { hanzi: '词语', pinyin: 'cí yǔ', pic: '📖', audio: 'audio/word/词语.mp3' },
    { hanzi: '丝瓜', pinyin: 'sī guā', pic: '🥒', audio: 'audio/word/丝瓜.mp3' },
    { hanzi: '走', pinyin: 'zǒu', pic: '🚶', audio: 'audio/word/走.mp3' },
    { hanzi: '紫色', pinyin: 'zǐ sè', pic: '🟣', audio: 'audio/word/紫色.mp3' },
    { hanzi: '草', pinyin: 'cǎo', pic: '🌿', audio: 'audio/word/草.mp3' },
    { hanzi: '彩虹', pinyin: 'cǎi hóng', pic: '🌈', audio: 'audio/word/彩虹.mp3' },
    { hanzi: '四', pinyin: 'sì', pic: '4️⃣', audio: 'audio/word/四.mp3' },
    { hanzi: '伞', pinyin: 'sǎn', pic: '☂️', audio: 'audio/word/伞.mp3' },
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
  introVoice: { say: '舌尖翘起来碰上颚，这叫翘舌音。和上一课的 资、雌、思 比一比，别念混了。',
    audio: 'audio/intro/lesson-08.mp3' },
  sounds: ['sh-zh', 'sh-ch', 'sh-sh', 'sh-r', 'zt-zhi', 'zt-chi', 'zt-shi', 'zt-ri'],
  rule: {
    id: 'rule-pingqiao', title: '平舌音和翘舌音',
    text: 'z c s 舌头平，zh ch sh r 舌头翘。念一念：zi—zhi，ci—chi，si—shi。',
    say: '资、雌、思，舌头平。知、蚩、诗、日，舌头翘。念一念：资，知。雌，蚩。思，诗。',
    audio: 'audio/rule/lesson-08.mp3',
    demo: { parts: ['zh', 'ǐ'], result: 'zhǐ', hanzi: '纸' },
  },
  words: [
    { hanzi: '吃饭', pinyin: 'chī fàn', pic: '🍚', audio: 'audio/word/吃饭.mp3' },
    { hanzi: '狮子', pinyin: 'shī zi', pic: '🦁', audio: 'audio/word/狮子.mp3' },
    { hanzi: '日出', pinyin: 'rì chū', pic: '🌅', audio: 'audio/word/日出.mp3' },
    { hanzi: '猪', pinyin: 'zhū', pic: '🐷', audio: 'audio/word/猪.mp3' },
    { hanzi: '纸', pinyin: 'zhǐ', pic: '📄', audio: 'audio/word/纸.mp3' },
    { hanzi: '中国', pinyin: 'zhōng guó', pic: '🇨🇳', audio: 'audio/word/中国.mp3' },
    { hanzi: '虫子', pinyin: 'chóng zi', pic: '🐛', audio: 'audio/word/虫子.mp3' },
    { hanzi: '船', pinyin: 'chuán', pic: '⛵', audio: 'audio/word/船.mp3' },
    { hanzi: '手', pinyin: 'shǒu', pic: '✋', audio: 'audio/word/手.mp3' },
    { hanzi: '山', pinyin: 'shān', pic: '⛰️', audio: 'audio/word/山.mp3' },
    { hanzi: '肉', pinyin: 'ròu', pic: '🍖', audio: 'audio/word/肉.mp3' },
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
  introVoice: { say: '衣 和 乌 帮韵母站在最前面。衣 遇到 迂，迂 也要脱帽。',
    audio: 'audio/intro/lesson-09.mp3' },
  sounds: ['sh-y', 'sh-w', 'zt-yi', 'zt-wu', 'zt-yu'],
  rule: {
    id: 'rule-y-v', title: 'y 见 ü 也去两点',
    text: 'y 和小 ü 在一起，两点同样要摘掉：yü → yu，读作 yü。',
    say: '衣 和小 迂 在一起，两点同样要摘掉，读作 迂。',
    audio: 'audio/rule/lesson-09.mp3',
    demo: { parts: ['y', 'ü'], result: 'yú', hanzi: '鱼' },
  },
  words: [
    { hanzi: '衣服', pinyin: 'yī fu', pic: '👕', audio: 'audio/word/衣服.mp3' },
    { hanzi: '乌鸦', pinyin: 'wū yā', pic: '🐦', audio: 'audio/word/乌鸦.mp3' },
    { hanzi: '小鱼', pinyin: 'xiǎo yú', pic: '🐟', audio: 'audio/word/小鱼.mp3' },
    { hanzi: '鸭子', pinyin: 'yā zi', pic: '🦆', audio: 'audio/word/鸭子.mp3' },
    { hanzi: '眼睛', pinyin: 'yǎn jing', pic: '👀', audio: 'audio/word/眼睛.mp3' },
    { hanzi: '娃娃', pinyin: 'wá wa', pic: '🧸', audio: 'audio/word/娃娃.mp3' },
    { hanzi: '袜子', pinyin: 'wà zi', pic: '🧦', audio: 'audio/word/袜子.mp3' },
    { hanzi: '碗', pinyin: 'wǎn', pic: '🥣', audio: 'audio/word/碗.mp3' },
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
  introVoice: { say: '两个韵母手拉手，就是复韵母。这一课还要学会声调标在哪儿。',
    audio: 'audio/intro/lesson-10.mp3' },
  sounds: ['yu-ai', 'yu-ei', 'yu-ui'],
  rule: {
    id: 'rule-biaodiao', title: '标调规则',
    text: '有 a 不放过，没 a 找 o e，i u 并列标在后。',
    say: '有 啊 不放过，没 啊 找 喔、鹅，衣 乌 并列标在后。',
    audio: 'audio/rule/lesson-10.mp3',
    demo: { parts: ['b', 'āi'], result: 'bái', hanzi: '白' },
  },
  words: [
    { hanzi: '白菜', pinyin: 'bái cài', pic: '🥬', audio: 'audio/word/白菜.mp3' },
    { hanzi: '妹妹', pinyin: 'mèi mei', pic: '👧', audio: 'audio/word/妹妹.mp3' },
    { hanzi: '围巾', pinyin: 'wéi jīn', pic: '🧣', audio: 'audio/word/围巾.mp3' },
    { hanzi: '爱心', pinyin: 'ài xīn', pic: '❤️', audio: 'audio/word/爱心.mp3' },
    { hanzi: '海', pinyin: 'hǎi', pic: '🌊', audio: 'audio/word/海.mp3' },
    { hanzi: '杯子', pinyin: 'bēi zi', pic: '🥤', audio: 'audio/word/杯子.mp3' },
    { hanzi: '水', pinyin: 'shuǐ', pic: '💧', audio: 'audio/word/水.mp3' },
    { hanzi: '腿', pinyin: 'tuǐ', pic: '🦵', audio: 'audio/word/腿.mp3' },
    { hanzi: '嘴', pinyin: 'zuǐ', pic: '👄', audio: 'audio/word/嘴.mp3' },
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
  introVoice: { say: '优 的声调标在 乌 上面。别标错地方。',
    audio: 'audio/intro/lesson-11.mp3' },
  sounds: ['yu-ao', 'yu-ou', 'yu-iu'],
  rule: {
    id: 'rule-iu', title: 'iu 标在 u',
    text: 'i u 并列标在后 —— iu 的帽子戴在 u 头上：liù。',
    say: '衣 乌 并列标在后。优 的帽子戴在 乌 头上：六。',
    audio: 'audio/rule/lesson-11.mp3',
    demo: { parts: ['l', 'iù'], result: 'liù', hanzi: '六' },
  },
  words: [
    { hanzi: '棉袄', pinyin: 'mián ǎo', pic: '🧥', audio: 'audio/word/棉袄.mp3' },
    { hanzi: '莲藕', pinyin: 'lián ǒu', pic: '🥬', audio: 'audio/word/莲藕.mp3' },
    { hanzi: '游泳', pinyin: 'yóu yǒng', pic: '🏊', audio: 'audio/word/游泳.mp3' },
    { hanzi: '帽子', pinyin: 'mào zi', pic: '🎩', audio: 'audio/word/帽子.mp3' },
    { hanzi: '桃子', pinyin: 'táo zi', pic: '🍑', audio: 'audio/word/桃子.mp3' },
    { hanzi: '豆子', pinyin: 'dòu zi', pic: '🫘', audio: 'audio/word/豆子.mp3' },
    { hanzi: '六', pinyin: 'liù', pic: '6️⃣', audio: 'audio/word/六.mp3' },
    { hanzi: '牛奶', pinyin: 'niú nǎi', pic: '🥛', audio: 'audio/word/牛奶.mp3' },
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
  introVoice: { say: '儿 很特别，它不和任何声母相拼，总是自己单独用。',
    audio: 'audio/intro/lesson-12.mp3' },
  sounds: ['yu-ie', 'yu-ve', 'yu-er', 'zt-ye', 'zt-yue'],
  rule: {
    id: 'rule-er', title: 'er 不与声母相拼',
    text: 'er 是个独行侠，从来不和声母做朋友，永远自己站着：ér、ěr、èr。',
    say: '儿 是个独行侠，从来不和声母做朋友，永远自己站着：儿、耳、二。',
    audio: 'audio/rule/lesson-12.mp3',
    demo: { parts: ['er'], result: 'ěr', hanzi: '耳' },
  },
  words: [
    { hanzi: '树叶', pinyin: 'shù yè', pic: '🍃', audio: 'audio/word/树叶.mp3' },
    { hanzi: '月亮', pinyin: 'yuè liang', pic: '🌙', audio: 'audio/word/月亮.mp3' },
    { hanzi: '耳朵', pinyin: 'ěr duo', pic: '👂', audio: 'audio/word/耳朵.mp3' },
    { hanzi: '谢谢', pinyin: 'xiè xie', pic: '🙏', audio: 'audio/word/谢谢.mp3' },
    { hanzi: '姐姐', pinyin: 'jiě jie', pic: '👧', audio: 'audio/word/姐姐.mp3' },
    { hanzi: '雪花', pinyin: 'xuě huā', pic: '❄️', audio: 'audio/word/雪花.mp3' },
    { hanzi: '学校', pinyin: 'xué xiào', pic: '🏫', audio: 'audio/word/学校.mp3' },
    { hanzi: '二', pinyin: 'èr', pic: '2️⃣', audio: 'audio/word/二.mp3' },
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
  introVoice: { say: '前鼻韵母的尾巴是 讷，舌尖要抵住上牙床。',
    audio: 'audio/intro/lesson-13.mp3' },
  sounds: ['yu-an', 'yu-en', 'yu-in', 'yu-un', 'yu-vn', 'zt-yuan', 'zt-yin', 'zt-yun'],
  rule: {
    id: 'rule-qianbi', title: '前鼻韵母',
    text: '前鼻韵母 n 收尾，舌尖顶住上牙床：an en in un ün。',
    say: '前鼻韵母 讷 收尾，舌尖顶住上牙床：安、恩、因、温、晕。',
    audio: 'audio/rule/lesson-13.mp3',
    demo: { parts: ['t', 'iān'], result: 'tiān', hanzi: '天' },
  },
  words: [
    { hanzi: '天安门', pinyin: 'tiān ān mén', pic: '🏛️', audio: 'audio/word/天安门.mp3' },
    { hanzi: '白云', pinyin: 'bái yún', pic: '☁️', audio: 'audio/word/白云.mp3' },
    { hanzi: '树林', pinyin: 'shù lín', pic: '🌳', audio: 'audio/word/树林.mp3' },
    { hanzi: '三', pinyin: 'sān', pic: '3️⃣', audio: 'audio/word/三.mp3' },
    { hanzi: '蓝色', pinyin: 'lán sè', pic: '🔵', audio: 'audio/word/蓝色.mp3' },
    { hanzi: '门', pinyin: 'mén', pic: '🚪', audio: 'audio/word/门.mp3' },
    { hanzi: '心', pinyin: 'xīn', pic: '❤️', audio: 'audio/word/心.mp3' },
    { hanzi: '金鱼', pinyin: 'jīn yú', pic: '🐠', audio: 'audio/word/金鱼.mp3' },
    { hanzi: '春天', pinyin: 'chūn tiān', pic: '🌸', audio: 'audio/word/春天.mp3' },
    { hanzi: '裙子', pinyin: 'qún zi', pic: '👗', audio: 'audio/word/裙子.mp3' },
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
  introVoice: { say: '最后一课。后鼻韵母的尾巴是后鼻音，舌根要抬起来。学完这一课，拼音就全学会了。',
    audio: 'audio/intro/lesson-14.mp3' },
  sounds: ['yu-ang', 'yu-eng', 'yu-ing', 'yu-ong', 'zt-ying'],
  rule: {
    id: 'rule-houbi', title: '后鼻韵母',
    text: '后鼻韵母 ng 收尾，舌根抬起来：ang eng ing ong。和前鼻音比一比：an—ang。',
    say: '后鼻韵母收尾时舌根抬起来：昂、鞥、英、轰。和前鼻音比一比：安，昂。',
    audio: 'audio/rule/lesson-14.mp3',
    demo: { parts: ['y', 'áng'], result: 'yáng', hanzi: '羊' },
  },
  words: [
    { hanzi: '山羊', pinyin: 'shān yáng', pic: '🐑', audio: 'audio/word/山羊.mp3' },
    { hanzi: '台灯', pinyin: 'tái dēng', pic: '💡', audio: 'audio/word/台灯.mp3' },
    { hanzi: '老鹰', pinyin: 'lǎo yīng', pic: '🦅', audio: 'audio/word/老鹰.mp3' },
    { hanzi: '大钟', pinyin: 'dà zhōng', pic: '🔔', audio: 'audio/word/大钟.mp3' },
    { hanzi: '糖', pinyin: 'táng', pic: '🍬', audio: 'audio/word/糖.mp3' },
    { hanzi: '风筝', pinyin: 'fēng zheng', pic: '🪁', audio: 'audio/word/风筝.mp3' },
    { hanzi: '星光', pinyin: 'xīng guāng', pic: '🌟', audio: 'audio/word/星光.mp3' },
    { hanzi: '龙', pinyin: 'lóng', pic: '🐉', audio: 'audio/word/龙.mp3' },
    { hanzi: '红色', pinyin: 'hóng sè', pic: '🔴', audio: 'audio/word/红色.mp3' },
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
