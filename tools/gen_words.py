#!/usr/bin/env python3
"""
tools/gen_words.py — writes data/words.js, the 词语 book.

Fourteen themes, one opening per lesson cleared, from the words a 7-year-old
already owns outwards. Each word carries up to two examples, because a character
on its own is a shape: 手 becomes learnable as 洗手 and 小手.

Pinyin is derived with pypinyin rather than typed, with an overrides table for
the syllables that are genuinely neutral in speech and that pypinyin marks
anyway — 耳朵 ěr duo, not ěr duǒ. Same approach as the 词语 in the lessons.

    pip install pypinyin
    python tools/gen_words.py

Re-run it after changing the tables below, then gen_audio.py and gen_sw.py.
"""

import io
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "words.js"

# Genuinely neutral second syllables. pypinyin marks them; speech does not.
NEUTRAL = {
    "耳朵": "ěr duo", "头发": "tóu fa", "石头": "shí tou", "木头": "mù tou",
    "眼睛": "yǎn jing", "鼻子": "bí zi", "虫子": "chóng zi", "兔子": "tù zi",
    "桌子": "zhuō zi", "椅子": "yǐ zi", "本子": "běn zi", "月亮": "yuè liang",
    "星星": "xīng xing", "风筝": "fēng zheng",
    "爸爸": "bà ba", "妈妈": "mā ma", "哥哥": "gē ge", "姐姐": "jiě jie",
    "弟弟": "dì di", "妹妹": "mèi mei", "奶奶": "nǎi nai",
}

# (theme id, 中文 name, the lesson that opens it, emoji, words)
# a word is (字, emoji, [(example, emoji or "")])
THEMES = [
 ("basic", "基础", 1, "🌱", [
   ("人", "🧍", [("大人", "👨"), ("家人", "👪")]),
   ("大", "🐘", [("大山", "⛰️"), ("大树", "🌳")]),
   ("小", "🐣", [("小手", "✋"), ("小鸟", "🐦")]),
   ("上", "⬆️", [("上山", "⛰️"), ("早上", "🌅")]),
   ("下", "⬇️", [("下雨", "☔"), ("下山", "⛰️")]),
   ("中", "🎯", [("中国", "🇨🇳"), ("中午", "🕛")]),
   ("我", "🙋", [("我们", "👥"), ("我家", "🏠")]),
   ("你", "👉", [("你好", "👋"), ("你们", "👥")]),
   ("好", "👍", [("你好", "👋"), ("好人", "😊")]),
   ("不", "🚫", [("不好", "😕"), ("不多", "🤏")]),
 ]),
 ("number", "数字", 2, "🔢", [
   ("一", "1️⃣", [("一天", "📅"), ("一年", "🗓️")]),
   ("二", "2️⃣", [("二月", "📅"), ("十二", "🕛")]),
   ("三", "3️⃣", [("三月", "📅"), ("三个", "🍎")]),
   ("四", "4️⃣", [("四月", "📅"), ("十四", "🔢")]),
   ("五", "5️⃣", [("五月", "📅"), ("五个", "🖐️")]),
   ("六", "6️⃣", [("六月", "📅"), ("十六", "🔢")]),
   ("七", "7️⃣", [("七月", "📅"), ("七天", "📆")]),
   ("八", "8️⃣", [("八月", "📅"), ("八个", "🔢")]),
   ("九", "9️⃣", [("九月", "📅"), ("九个", "🔢")]),
   ("十", "🔟", [("十月", "📅"), ("十个", "🔢")]),
 ]),
 ("body", "身体", 3, "🖐️", [
   ("口", "👄", [("大口", "😮"), ("口水", "💧")]),
   ("手", "✋", [("洗手", "🧼"), ("小手", "🤏")]),
   ("足", "🦶", [("足球", "⚽"), ("手足", "🤝")]),
   ("脸", "😊", [("洗脸", "🧼"), ("小脸", "👶")]),
   ("耳", "👂", [("耳朵", "👂"), ("木耳", "🍄")]),
   ("头", "🧑", [("头发", "💇"), ("石头", "🪨")]),
   ("心", "❤️", [("小心", "⚠️"), ("开心", "😄")]),
   ("牙", "🦷", [("刷牙", "🪥"), ("大牙", "🦷")]),
   ("眼", "👀", [("眼睛", "👀"), ("眼泪", "😢")]),
   ("鼻", "👃", [("鼻子", "👃"), ("鼻音", "🎵")]),
 ]),
 ("food", "食物", 4, "🍚", [
   ("米", "🌾", [("大米", "🍚"), ("米饭", "🍚")]),
   ("饭", "🍚", [("米饭", "🍚"), ("吃饭", "🍽️")]),
   ("果", "🍎", [("水果", "🍉"), ("苹果", "🍏")]),
   ("菜", "🥬", [("白菜", "🥬"), ("青菜", "🥗")]),
   ("肉", "🍖", [("牛肉", "🥩"), ("鱼肉", "🐟")]),
   ("蛋", "🥚", [("鸡蛋", "🥚"), ("蛋糕", "🍰")]),
   ("面", "🍜", [("面包", "🍞"), ("面条", "🍜")]),
   ("奶", "🥛", [("牛奶", "🥛"), ("奶奶", "👵")]),
   ("茶", "🍵", [("喝茶", "🍵"), ("茶水", "🫖")]),
   ("糖", "🍬", [("白糖", "🥄"), ("糖果", "🍬")]),
 ]),
 ("family", "家人", 5, "👪", [
   ("爸", "👨", [("爸爸", "👨"), ("爸妈", "👫")]),
   ("妈", "👩", [("妈妈", "👩"), ("爸妈", "👫")]),
   ("哥", "👦", [("哥哥", "👦"), ("大哥", "🧑")]),
   ("姐", "👧", [("姐姐", "👧"), ("大姐", "👩")]),
   ("弟", "🧒", [("弟弟", "🧒"), ("小弟", "👶")]),
   ("妹", "👧", [("妹妹", "👧"), ("小妹", "👶")]),
   ("家", "🏠", [("我家", "🏠"), ("家人", "👪")]),
   ("门", "🚪", [("大门", "🚪"), ("门口", "🚪")]),
 ]),
 ("animal", "动物", 6, "🐾", [
   ("马", "🐴", [("小马", "🐴"), ("木马", "🎠")]),
   ("牛", "🐮", [("牛奶", "🥛"), ("小牛", "🐄")]),
   ("羊", "🐑", [("小羊", "🐑"), ("山羊", "🐐")]),
   ("鸟", "🐦", [("小鸟", "🐦"), ("飞鸟", "🕊️")]),
   ("鱼", "🐟", [("小鱼", "🐟"), ("金鱼", "🐠")]),
   ("虫", "🐛", [("虫子", "🐛"), ("小虫", "🐜")]),
   ("猫", "🐱", [("小猫", "🐱"), ("花猫", "🐈")]),
   ("狗", "🐕", [("小狗", "🐕"), ("大狗", "🐕‍🦺")]),
   ("兔", "🐰", [("兔子", "🐰"), ("小兔", "🐇")]),
   ("鸡", "🐔", [("小鸡", "🐣"), ("公鸡", "🐓")]),
 ]),
 ("nature", "自然", 7, "🌳", [
   ("日", "☀️", [("日出", "🌅"), ("生日", "🎂")]),
   ("月", "🌙", [("月亮", "🌕"), ("月光", "🌝")]),
   ("火", "🔥", [("火车", "🚂"), ("大火", "🔥")]),
   ("水", "💧", [("喝水", "🥤"), ("水果", "🍉")]),
   ("土", "🟫", [("土地", "🌍"), ("泥土", "🪱")]),
   ("木", "🪵", [("木头", "🪵"), ("树木", "🌲")]),
   ("山", "⛰️", [("大山", "🏔️"), ("上山", "🥾")]),
   ("石", "🪨", [("石头", "🪨"), ("石山", "🏔️")]),
   ("田", "🌾", [("田地", "🌾"), ("水田", "🌾")]),
   ("天", "☁️", [("今天", "📅"), ("天上", "☁️")]),
 ]),
 ("colour", "颜色", 8, "🎨", [
   ("红", "🔴", [("红色", "🔴"), ("红花", "🌺")]),
   ("黄", "🟡", [("黄色", "🟡"), ("黄牛", "🐂")]),
   ("蓝", "🔵", [("蓝色", "🔵"), ("蓝天", "🌤️")]),
   ("绿", "🟢", [("绿色", "🟢"), ("绿叶", "🍃")]),
   ("白", "⚪", [("白色", "⚪"), ("白云", "☁️")]),
   ("黑", "⚫", [("黑色", "⚫"), ("黑夜", "🌃")]),
 ]),
 ("where", "方位", 9, "🧭", [
   ("前", "⬅️", [("前面", "👉"), ("门前", "🚪")]),
   ("后", "➡️", [("后面", "👈"), ("以后", "⏭️")]),
   ("左", "👈", [("左手", "🤚"), ("左边", "⬅️")]),
   ("右", "👉", [("右手", "✋"), ("右边", "➡️")]),
   ("里", "📥", [("里面", "📦"), ("家里", "🏠")]),
   ("外", "📤", [("外面", "🌳"), ("外公", "👴")]),
   ("远", "🔭", [("远方", "🏞️"), ("很远", "🛣️")]),
   ("近", "🔍", [("很近", "📏"), ("走近", "🚶")]),
 ]),
 ("home", "家里", 10, "🛋️", [
   ("窗", "🪟", [("窗口", "🪟"), ("车窗", "🚗")]),
   ("床", "🛏️", [("起床", "⏰"), ("小床", "🛏️")]),
   ("桌", "🪑", [("桌子", "🪑"), ("书桌", "📚")]),
   ("椅", "🪑", [("椅子", "🪑"), ("木椅", "🪵")]),
   ("书", "📖", [("看书", "📖"), ("书包", "🎒")]),
   ("笔", "✏️", [("铅笔", "✏️"), ("毛笔", "🖌️")]),
   ("纸", "📄", [("白纸", "📄"), ("报纸", "📰")]),
   ("灯", "💡", [("台灯", "💡"), ("红灯", "🚦")]),
   ("伞", "☂️", [("雨伞", "☂️"), ("打伞", "🌂")]),
   ("刀", "🔪", [("小刀", "🔪"), ("刀口", "🔪")]),
 ]),
 ("action", "动作", 11, "🏃", [
   ("走", "🚶", [("走路", "🛣️"), ("走开", "👋")]),
   ("跑", "🏃", [("跑步", "🏃"), ("快跑", "💨")]),
   ("看", "👀", [("看书", "📖"), ("看见", "👁️")]),
   ("听", "👂", [("听话", "👂"), ("好听", "🎵")]),
   ("说", "💬", [("说话", "💬"), ("听说", "👂")]),
   ("读", "📖", [("读书", "📚"), ("读音", "🔊")]),
   ("写", "✍️", [("写字", "✍️"), ("写下", "📝")]),
   ("吃", "🍽️", [("吃饭", "🍚"), ("好吃", "😋")]),
   ("喝", "🥤", [("喝水", "💧"), ("喝茶", "🍵")]),
   ("玩", "🧸", [("玩具", "🧸"), ("好玩", "😄")]),
 ]),
 ("weather", "天气", 12, "🌤️", [
   ("云", "☁️", [("白云", "☁️"), ("云朵", "☁️")]),
   ("风", "🌬️", [("大风", "💨"), ("风筝", "🪁")]),
   ("雨", "☔", [("下雨", "🌧️"), ("雨水", "💧")]),
   ("雪", "❄️", [("下雪", "🌨️"), ("雪花", "❄️")]),
   ("电", "⚡", [("电话", "📞"), ("电灯", "💡")]),
   ("冰", "🧊", [("冰水", "🥤"), ("冰山", "🏔️")]),
   ("星", "⭐", [("星星", "✨"), ("火星", "🪐")]),
   ("光", "💡", [("月光", "🌝"), ("阳光", "🌞")]),
 ]),
 ("time", "时间", 13, "⏰", [
   ("年", "🗓️", [("今年", "📅"), ("新年", "🎊")]),
   ("早", "🌅", [("早上", "🌅"), ("早安", "😊")]),
   ("午", "🕛", [("中午", "🕛"), ("下午", "🕒")]),
   ("晚", "🌃", [("晚上", "🌃"), ("晚安", "😴")]),
   ("今", "📆", [("今天", "📅"), ("今年", "🗓️")]),
   ("明", "🔆", [("明天", "📅"), ("明白", "💡")]),
   ("春", "🌸", [("春天", "🌸"), ("春风", "🍃")]),
   ("夏", "🌞", [("夏天", "🌞"), ("夏日", "🏖️")]),
   ("秋", "🍂", [("秋天", "🍂"), ("秋风", "🍁")]),
   ("冬", "⛄", [("冬天", "⛄"), ("冬日", "🌨️")]),
 ]),
 ("school", "学校", 14, "🏫", [
   ("学", "📚", [("学习", "📖"), ("上学", "🎒")]),
   ("校", "🏫", [("学校", "🏫"), ("校门", "🚪")]),
   ("老", "👴", [("老师", "👩‍🏫"), ("老人", "🧓")]),
   ("师", "👩‍🏫", [("老师", "👩‍🏫"), ("师生", "👫")]),
   ("同", "👥", [("同学", "👫"), ("相同", "🟰")]),
   ("友", "👫", [("朋友", "👭"), ("友好", "🤝")]),
   ("本", "📓", [("课本", "📓"), ("本子", "📔")]),
   ("课", "📚", [("上课", "🔔"), ("课本", "📓")]),
   ("字", "✍️", [("写字", "✍️"), ("汉字", "🀄")]),
 ]),
]


def reading(text):
    if text in NEUTRAL:
        return NEUTRAL[text]
    from pypinyin import pinyin, Style
    return " ".join(p[0] for p in pinyin(text, style=Style.TONE))


def safe(text):
    """Audio path for a word. Same convention the lesson 词语 already use."""
    return "audio/word/" + text + ".mp3"


def main():
    try:
        import pypinyin  # noqa: F401
    except ImportError:
        print("pypinyin is not installed.  Run:  pip install pypinyin", file=sys.stderr)
        return 1

    lines = ["""/*
 * data/words.js — GENERATED by tools/gen_words.py. Do not hand-edit.
 *
 * 词语: fourteen themes, one opening each time a lesson is cleared, running
 * from the words she already owns out to the ones school will give her.
 *
 * Every word carries up to two examples, because a character on its own is a
 * shape — 手 becomes learnable as 洗手 and 小手. Examples render through
 * lib/ruby.js, so the pinyin sits above the characters, and each one speaks.
 *
 * A theme is not gated on being able to *read* its words: 人 and 大 are learned
 * as shapes long before their spelling matters, and gating on pinyin would put
 * 数字 behind 课13 for 三 and 四.
 */

const WORD_THEMES = ["""]

    n_words = n_ex = 0
    for tid, name, lesson, emoji, words in THEMES:
        lines.append("  {")
        lines.append(f"    id: 'wt-{tid}', name: '{name}', pic: '{emoji}',")
        lines.append(f"    unlockAfter: 'lesson-{lesson:02d}',")
        lines.append("    words: [")
        for word, pic, examples in words:
            n_words += 1
            ex = []
            for text, epic in examples:
                n_ex += 1
                ex.append("{{ hanzi: '{0}', pinyin: '{1}', pic: '{2}', audio: '{3}' }}".format(
                    text, reading(text), epic, safe(text)))
            lines.append(
                "      {{ id: 'w-{0}', word: '{1}', pinyin: '{2}', pic: '{3}', audio: '{4}',".format(
                    tid + "-" + word, word, reading(word), pic, safe(word)))
            lines.append("        examples: [" + ", ".join(ex) + "] },")
        lines.append("    ],")
        lines.append("  },")

    lines += ["];", "",
              "const WORDS = [];",
              "WORD_THEMES.forEach(function (t) {",
              "  t.words.forEach(function (w) { WORDS.push(w); });",
              "});",
              "",
              "const WORDS_BY_ID = {};",
              "WORDS.forEach(function (w) { WORDS_BY_ID[w.id] = w; });",
              "",
              "function getWord(id) { return WORDS_BY_ID[id]; }",
              "function getWordTheme(id) {",
              "  return WORD_THEMES.filter(function (t) { return t.id === id; })[0];",
              "}",
              ""]

    OUT.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print(f"wrote {OUT.relative_to(ROOT)}")
    print(f"  {len(THEMES)} themes, {n_words} words, {n_ex} examples")
    distinct = {t for _, _, _, _, ws in THEMES for w, _, exs in ws for t, _ in exs}
    print(f"  {len(distinct)} distinct example phrases to synthesise")
    return 0


if __name__ == "__main__":
    sys.exit(main())
