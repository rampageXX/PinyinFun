#!/usr/bin/env python3
"""
tools/gen_syllables.py — build data/syllables.js from the curriculum.

Hand-authoring hundreds of syllables, each needing a real 汉字 a child would
recognise, is tedious and error-prone. Instead we derive them: combine the
声母 and 韵母 each lesson has introduced, keep only the combinations that are
real Mandarin syllables, and attach a common character for every tone that
actually exists.

Two shapes are generated:
  两拼音节  声母 + 韵母              bā   mī   hǎo
  三拼音节  声母 + 介母 + 韵母        guā  jiā  xuǎn
The 介母 (i u ü) is what makes a syllable 三拼, and blendBuilder renders
those with three slots instead of two.

Orthography is handled properly, because the spelling rules ARE the lesson:
  j q x + ü  ->  ju qu xu      (见 ü 去两点 — lesson 6)
  n l   + ü  ->  nü lü         (两点保留)
  tone marks follow 有a不放过，没a找o e，i u 并列标在后

Usage
    pip install pypinyin
    python tools/gen_syllables.py            # writes data/syllables.js
    python tools/gen_syllables.py --stats    # summary only, writes nothing

Then regenerate audio:  python tools/gen_audio.py
"""

import argparse
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "syllables.js"

# ─────────────────────────────────────────────────────────────────────
# Curriculum — mirrors data/sounds.js. See CLAUDE.md for the lesson table.
# ─────────────────────────────────────────────────────────────────────

LESSON_SHENGMU = {
    3: ["b", "p", "m", "f"],
    4: ["d", "t", "n", "l"],
    5: ["g", "k", "h"],
    6: ["j", "q", "x"],
    7: ["z", "c", "s"],
    8: ["zh", "ch", "sh", "r"],
}
# y and w are spelling devices rather than blendable initials — the syllables
# they head are 整体认读音节 and live in data/sounds.js.

LESSON_YUNMU = {
    1: ["a", "o", "e"],
    2: ["i", "u", "ü"],
    10: ["ai", "ei", "ui"],
    11: ["ao", "ou", "iu"],
    12: ["ie", "üe", "er"],
    13: ["an", "en", "in", "un", "ün"],
    14: ["ang", "eng", "ing", "ong"],
}

# 三拼音节 is introduced with g k h in lesson 5. A 介母 may only precede the
# simple finals — ui/iu/in/un/ün etc. already contain a medial themselves.
MEDIALS = ["i", "u", "ü"]
MEDIAL_FINALS = ["a", "o", "e", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ong"]

# 韵母 that are already complete syllables with nothing in front of them.
# This is what makes 声调小火车 possible in 课1 — the lesson whose entire rule
# is 四声, but which has no 声母 yet and so had no syllable to drill.
#
# i/u/ü are deliberately absent: standing alone they are written yi/wu/yu,
# which are 整体认读音节 and not taught until 课9. er is here because it never
# takes an initial at all, so without this it could never be tone-drilled.
STANDALONE_YUNMU = ["a", "o", "e", "er"]

SHENGMU_LESSON = {s: n for n, xs in LESSON_SHENGMU.items() for s in xs}
YUNMU_LESSON = {y: n for n, xs in LESSON_YUNMU.items() for y in xs}


def lesson_of(*parts):
    """A syllable belongs to the lesson of its last-introduced part."""
    n = 0
    for p in parts:
        if p in SHENGMU_LESSON:
            n = max(n, SHENGMU_LESSON[p])
        if p in YUNMU_LESSON:
            n = max(n, YUNMU_LESSON[p])
    # A 三拼音节 cannot be shown before 三拼 itself is taught (lesson 5).
    return n


# Two tiers of characters, both consulted in order.
#
# TIER1 — concrete, picturable, the kind of character a first-grade textbook
# actually uses as an example: 八 for bā, 妈 for mā. Always preferred.
#
# TIER2 — general high-frequency characters. Consulted only when TIER1 has
# nothing for a reading, so a perfectly ordinary syllable like `pò` is not
# dropped just because it has no concrete noun. Abstract but familiar beats
# absent.
#
# A syllable with no character in either tier is dropped rather than taught
# with something obscure.

TIER1 = (
    "一二三四五六七八九十百千万大小多少上下左右前后里外中"
    "人口手足目耳头发脸眼鼻嘴牙舌心肝肺胃背腰腿脚指甲"
    "日月火水土木金山石田禾竹米雨雪云风星光电冰霜露雾虹雷"
    "爸妈哥姐弟妹爷奶家门窗床桌椅书笔纸包伞灯钟表刀勺碗盘杯瓶"
    "学校老师同友班课本字词句音声色味歌舞画棋球"
    "天地海河湖江溪泉波浪沙滩岛峰谷洞泥块路桥街村城国旗"
    "花草树叶果瓜豆菜肉蛋饭面茶奶糖盐油米粥汤饼糕"
    "鱼鸟马牛羊猫狗虫兔鸡鸭鹅猪象狮虎熊猴蛇龟蜂蝶蚁蛙鼠鹿龙凤"
    "红黄蓝绿白黑灰紫粉青长短高矮胖瘦快慢冷热新旧远近深浅"
    "春夏秋冬早晚昼夜今明昨年月周日时分秒"
    "衣裤鞋帽袜裙衫车船飞机火箭轮胎帆桨"
    "吃喝走跑跳游坐站睡醒穿脱洗刷玩找拿给送买卖唱读写数算"
    "拍打推拉抱扛提举挂放摆收扫擦晾折剪贴串挖种浇摘捡"
    "甜苦酸辣咸香臭圆方尖平直弯软硬干湿亮暗宽窄厚薄轻重"
    "东南西北公主王子牙角尾巴翅膀羽毛壳巢窝"
    "农稻麦谷园林场群舍圈棚庄"
)

TIER2 = (
    "的了是不在有个好来去出进开关看听说话我你他她它们和跟还也就都很太最真"
    "对错非没到从向往被把让叫做当成为想知会能要爱欢喜怒哀乐笑哭闹静动"
    "这那哪什么怎样为何谁几种样式点些面部分半全每各另别其此"
    "生死老病医药痛累饿渴困忙闲乐苦难易新奇怪美丑善恶"
    "工作事业务活干活儿事情理由因果法子办事用处"
    "国民族家庭亲戚邻居客人主客男女老少年轻"
    "文化教育科技艺术体育运动比赛输赢胜负强弱"
    "问答题解答案对话交流表达意思想法办法方法"
    "破坡波泼婆坡末墨莫默磨魔摸摩谋某母木目慕暮"
    "怕爬帕拍排牌派盘判胖抛跑炮泡陪配喷盆朋碰批皮"
    "拖托脱驼陀套讨桃逃套特疼腾梯提题体替天田甜填条跳"
    "锅果过郭裹刮挂怪拐官管观关光广逛规鬼贵滚棍锅"
    "扩阔宽款狂矿框葵愧困扩客刻课肯坑空孔控口哭苦裤快"
    "华划化怀坏欢环换黄谎回会婚活火或货获祸"
    "假价架尖间简件建江讲交角脚接街结姐借今近京经"
    "抢桥巧切亲轻清情请穷球区取全权劝却确群裙"
    "写鞋血心新星行形性修需许选学雪寻训"
    "杂灾在咱早造则怎增窄站张长招找照者这真争睁正"
    "擦才采彩菜参餐残藏草层查察差产常场唱超朝车"
    "撒赛三散扫色森沙山伤商上少社身深声省剩"
    "扎摘窄债展占战掌招找爪照罩折这真镇争睁只纸指志治"
    "喳查茶差插叉拆柴产铲昌常场厂唱抄超朝潮吵炒车扯彻沉陈"
    "沙纱傻筛晒山删闪扇善伤商赏上梢烧勺少舌设射伸身深神审"
    "染让绕惹热人认任扔仍日容肉如入软锐若弱"
)

COMMON_RANK = {ch: i for i, ch in enumerate(TIER1)}
TIER2_RANK = {ch: i for i, ch in enumerate(TIER2) if ch not in COMMON_RANK}

# Where frequency ranking picks a technically-common but pedagogically-poor
# character, name the right one explicitly. Keyed by (written form, tone).
OVERRIDES = {
    ("ba", 1): "八", ("ba", 2): "拔", ("ba", 3): "把", ("ba", 4): "爸",
    ("ma", 2): "麻", ("ma", 4): "骂", ("ma", 1): "妈", ("ma", 3): "马",
    ("mi", 3): "米", ("mu", 4): "木", ("bo", 1): "波", ("po", 1): "坡",
    ("fu", 4): "父", ("da", 4): "大", ("di", 4): "弟", ("tu", 4): "兔",
    ("li", 4): "力", ("ge", 1): "哥", ("gu", 3): "鼓", ("he", 2): "禾",
    ("hu", 2): "湖", ("ji", 1): "鸡", ("qi", 2): "旗", ("xi", 3): "洗",
    ("zi", 4): "字", ("ci", 2): "词", ("si", 1): "思", ("zhi", 3): "纸",
    ("chi", 1): "吃", ("shi", 2): "十", ("ri", 4): "日", ("er", 3): "耳",
    ("hua", 1): "花", ("gua", 1): "瓜", ("jia", 1): "家", ("xia", 4): "下",
    ("shui", 3): "水", ("hao", 3): "好", ("mao", 1): "猫", ("niao", 3): "鸟",
    ("shu", 1): "书", ("men", 2): "门", ("shan", 1): "山", ("tian", 1): "天",
    ("guo", 2): "国", ("duo", 1): "多", ("zhong", 1): "中", ("hong", 2): "红",
}

FILE_SAFE = {"ü": "v"}
TONE_VOWELS = {
    "a": "āáǎà", "o": "ōóǒò", "e": "ēéěè",
    "i": "īíǐì", "u": "ūúǔù", "ü": "ǖǘǚǜ",
}


def safe(text):
    """Filesystem-safe name: ü is not portable in a path."""
    return text.replace("ü", "v")


def written_form(shengmu, medial, yunmu):
    """Apply the spelling rules to get what actually appears on the page."""
    rime = (medial or "") + yunmu
    if shengmu in ("j", "q", "x"):
        rime = rime.replace("ü", "u")          # 见 ü 去两点
    return shengmu + rime


def add_tone(base, tone):
    """有a不放过，没a找o e，i u 并列标在后."""
    if tone == 0:
        return base
    for v in ("a", "o", "e"):
        if v in base:
            i = base.index(v)
            return base[:i] + TONE_VOWELS[v][tone - 1] + base[i + 1:]
    for i in range(len(base) - 1, -1, -1):     # last of i / u / ü
        if base[i] in TONE_VOWELS:
            return base[:i] + TONE_VOWELS[base[i]][tone - 1] + base[i + 1:]
    return base


def build_index():
    """reading-with-tone-number (pypinyin TONE3 spelling) -> best character.

    Only characters we vouch for are indexed at all, so a syllable can never
    be illustrated by something a child would never see. TIER1 wins outright;
    TIER2 fills in readings TIER1 has no concrete word for.
    """
    from pypinyin import pinyin, Style

    buckets = defaultdict(list)
    for ch in set(COMMON_RANK) | set(TIER2_RANK):
        try:
            reading = pinyin(ch, style=Style.TONE3, errors="ignore")
        except Exception:
            continue
        if not reading or not reading[0]:
            continue
        raw = reading[0][0]
        if not raw or not raw[-1].isdigit():
            continue
        buckets[raw].append(ch)

    def rank(ch):
        if ch in COMMON_RANK:
            return (0, COMMON_RANK[ch])
        return (1, TIER2_RANK.get(ch, 10_000))

    best = {}
    for reading, chars in buckets.items():
        best[reading] = min(chars, key=rank)
    return best


def lookup_key(written, tone):
    """pypinyin TONE3 writes ü as v (nv3 for 女); j/q/x forms already use u."""
    return safe(written) + str(tone)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stats", action="store_true")
    args = ap.parse_args()

    try:
        best = build_index()
    except ImportError:
        print("pypinyin is not installed.  Run:  pip install pypinyin", file=sys.stderr)
        return 1

    all_shengmu = list(SHENGMU_LESSON)
    all_yunmu = [y for y in YUNMU_LESSON if y != "er"]   # er never takes an initial

    combos = []
    for ym in STANDALONE_YUNMU:
        combos.append(("", None, ym))       # a whole syllable on its own
    for sm in all_shengmu:
        for ym in all_yunmu:
            combos.append((sm, None, ym))
        for med in MEDIALS:
            for ym in MEDIAL_FINALS:
                combos.append((sm, med, ym))

    records = []
    seen = set()
    for sm, med, ym in combos:
        written = written_form(sm, med, ym)
        if written in seen:
            continue

        tones = []
        for tone in (1, 2, 3, 4):
            hanzi = OVERRIDES.get((written, tone)) or best.get(lookup_key(written, tone))
            if not hanzi:
                continue
            tones.append({
                "tone": tone,
                "pinyin": add_tone(written, tone),
                "hanzi": hanzi,
                "audio": f"audio/syl/{safe(written)}{tone}.mp3",
            })
        if not tones:
            continue                            # not a real syllable, or all readings rare

        seen.add(written)
        order = lesson_of(sm, ym)
        if med:
            order = max(order, 5)               # 三拼音节 starts at lesson 5
        records.append({
            "id": "sy-" + safe(written),
            "shengmu": sm,
            "jiemu": med,
            "yunmu": ym,
            "base": written,
            "lesson": f"lesson-{order:02d}",
            "tones": tones,
        })

    records.sort(key=lambda r: (r["lesson"], r["id"]))

    by_lesson = defaultdict(int)
    for r in records:
        by_lesson[r["lesson"]] += 1
    total_tones = sum(len(r["tones"]) for r in records)
    sanpin = sum(1 for r in records if r["jiemu"])
    print(f"{len(records)} syllables ({sanpin} 三拼), {total_tones} toned readings")
    for k in sorted(by_lesson):
        print(f"  {k}: {by_lesson[k]}")

    if args.stats:
        return 0

    lines = [
        "/*",
        " * data/syllables.js — GENERATED by tools/gen_syllables.py. Do not hand-edit;",
        " * change the curriculum tables or the OVERRIDES map in that script instead.",
        " *",
        " * Each entry is a real Mandarin syllable built from parts the child has already",
        " * met, with one common 汉字 per tone that actually exists. `jiemu` non-null marks",
        " * a 三拼音节, which blendBuilder renders with three slots instead of two.",
        " * `lesson` is the lesson of its last-introduced part, so a syllable never appears",
        " * before both halves of it have been taught.",
        " */",
        "",
        "const SYLLABLES = [",
    ]
    for r in records:
        tones = ", ".join(
            "{{tone:{tone}, pinyin:'{pinyin}', hanzi:'{hanzi}', audio:'{audio}'}}".format(**t)
            for t in r["tones"]
        )
        jiemu = f"'{r['jiemu']}'" if r["jiemu"] else "null"
        shengmu = f"'{r['shengmu']}'" if r["shengmu"] else "null"
        lines.append(
            f"  {{ id:'{r['id']}', shengmu:{shengmu}, jiemu:{jiemu}, "
            f"yunmu:'{r['yunmu']}', base:'{r['base']}', lesson:'{r['lesson']}',\n"
            f"    tones:[{tones}] }},"
        )
    lines += [
        "];",
        "",
        "const SYLLABLES_BY_ID = {};",
        "SYLLABLES.forEach(function (s) { SYLLABLES_BY_ID[s.id] = s; });",
        "",
        "function getSyllable(id) { return SYLLABLES_BY_ID[id]; }",
        "",
        "/* Syllables a child may legitimately be shown at a given lesson. */",
        "function syllablesUpToLesson(order) {",
        "  return SYLLABLES.filter(function (s) {",
        "    return parseInt(s.lesson.slice(-2), 10) <= order;",
        "  });",
        "}",
        "",
        "function syllablesForLesson(lessonId) {",
        "  return SYLLABLES.filter(function (s) { return s.lesson === lessonId; });",
        "}",
        "",
        "/* A random tone of a syllable, for drills that need one reading. */",
        "function pickTone(syllable, rng) {",
        "  var r = rng ? rng() : Math.random();",
        "  return syllable.tones[Math.floor(r * syllable.tones.length)];",
        "}",
        "",
    ]

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
