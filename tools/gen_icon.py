#!/usr/bin/env python3
"""
tools/gen_icon.py — the home-screen icon.

The child will launch this from the iPad home screen ("add to home screen"),
so it needs a real icon rather than a screenshot of whatever was on screen.

The icon is the app's signature: a letter standing on the 四线三格 stave, in
the same paper/rule/ink colours as the interface. `a` is the first letter of
the first lesson.

    python tools/gen_icon.py        # writes icon-180.png and icon-512.png
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent

PAPER = (255, 252, 244)
STAVE = (242, 162, 140)
STAVE_SOFT = (250, 217, 206)
INK = (43, 43, 51)
SEA = (19, 145, 174)

# Fonts with a single-storey 'a', in the order we prefer them. A double-storey
# 'a' is not the letterform the child is learning.
FONT_CANDIDATES = [
    "C:/Windows/Fonts/GOTHIC.TTF",      # Century Gothic
    "C:/Windows/Fonts/Candara.ttf",
    "/System/Library/Fonts/Supplemental/Futura.ttc",
    "C:/Windows/Fonts/trebuc.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
]


def load_font(size):
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def draw_icon(size):
    img = Image.new("RGB", (size, size), PAPER)
    d = ImageDraw.Draw(img)

    # Rounded teal border, so the icon reads as an app rather than a photo.
    pad = size // 22
    d.rounded_rectangle([pad, pad, size - pad, size - pad],
                        radius=size // 5, outline=SEA, width=max(2, size // 40))

    # The stave: four rules, the middle two solid, spanning the icon.
    top = size * 0.30
    bottom = size * 0.74
    gap = (bottom - top) / 3
    w = max(2, size // 60)
    x0, x1 = size * 0.20, size * 0.80
    for i in range(4):
        y = top + gap * i
        colour = STAVE if i in (1, 2) else STAVE_SOFT
        d.line([x0, y, x1, y], fill=colour, width=w)

    # 'a' sitting in the middle space, baseline on the third rule.
    letter = "a"
    font = load_font(int(gap * 2.0))
    box = d.textbbox((0, 0), letter, font=font)
    lw, lh = box[2] - box[0], box[3] - box[1]
    d.text((size / 2 - lw / 2 - box[0], top + gap * 2 - lh - box[1]),
           letter, font=font, fill=INK)

    return img


def main():
    try:
        for size, name in ((180, "icon-180.png"), (512, "icon-512.png")):
            draw_icon(size).save(ROOT / name)
            print(f"wrote {name}")
    except Exception as exc:
        print(f"icon generation failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
