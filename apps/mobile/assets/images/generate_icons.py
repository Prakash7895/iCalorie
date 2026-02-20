#!/usr/bin/env python3
"""Generate all iCalorie app icons from nutrition-outline.svg."""

import os, io
import cairosvg
from PIL import Image, ImageDraw

ASSETS = os.path.dirname(os.path.abspath(__file__))
SVG = os.path.join(ASSETS, "nutrition-outline.svg")

ACCENT = (0, 184, 148)  # #00B894
WHITE = (255, 255, 255, 255)
BLACK = (0, 0, 0, 255)


def read_svg():
    with open(SVG) as f:
        return f.read()


def render_svg(
    size: int, stroke: str = "#FFFFFF", fill: str = "#FFFFFF"
) -> Image.Image:
    """Render nutrition-outline.svg at `size`×`size`, returning RGBA image."""
    svg = read_svg()
    svg = svg.replace('class="ionicon"', f'width="{size}" height="{size}"')
    svg = svg.replace("currentColor", stroke)
    svg = svg.replace('<path d="M323', f'<path fill="{fill}" d="M323')
    svg = svg.replace("<ellipse", f'<ellipse fill="{fill}"')
    png = cairosvg.svg2png(
        bytestring=svg.encode(), output_width=size, output_height=size
    )
    return Image.open(io.BytesIO(png)).convert("RGBA")


def solid_bg(size: int, color: tuple) -> Image.Image:
    return Image.new("RGBA", (size, size), (*color, 255))


def paste_center(base: Image.Image, icon: Image.Image) -> Image.Image:
    bw, bh = base.size
    iw, ih = icon.size
    base.paste(icon, ((bw - iw) // 2, (bh - ih) // 2), icon)
    return base


# ── 1. icon.png  (iOS / main, 1024×1024) ─────────────────────────────────────
print("Generating icon.png …")
SIZE = 1024
base = solid_bg(SIZE, ACCENT)
icon = render_svg(SIZE)  # fill full canvas
paste_center(base, icon)
base.convert("RGB").save(os.path.join(ASSETS, "icon.png"), "PNG")
print("  ✅  icon.png")

# ── 2. android-icon-foreground.png  (1024×1024, icon in safe zone, transparent bg)
# Android adaptive icon safe zone = 66/108 of total size ≈ 61%
print("Generating android-icon-foreground.png …")
ASIZE = 1024
safe = int(ASIZE * 0.61)  # ~624 px — icon within safe zone
fg = Image.new("RGBA", (ASIZE, ASIZE), (0, 0, 0, 0))  # transparent bg
icon_fg = render_svg(safe)
paste_center(fg, icon_fg)
fg.save(os.path.join(ASSETS, "android-icon-foreground.png"), "PNG")
print("  ✅  android-icon-foreground.png")

# ── 3. android-icon-background.png  (1024×1024, solid accent) ───────────────
print("Generating android-icon-background.png …")
bg = solid_bg(ASIZE, ACCENT)
bg.convert("RGB").save(os.path.join(ASSETS, "android-icon-background.png"), "PNG")
print("  ✅  android-icon-background.png")

# ── 4. android-icon-monochrome.png  (1024×1024, white icon on black) ─────────
print("Generating android-icon-monochrome.png …")
mono = solid_bg(ASIZE, (0, 0, 0))
icon_mono = render_svg(safe)  # same safe-zone size
paste_center(mono, icon_mono)
mono.convert("RGB").save(os.path.join(ASSETS, "android-icon-monochrome.png"), "PNG")
print("  ✅  android-icon-monochrome.png")

# ── 5. favicon.png  (48×48) ──────────────────────────────────────────────────
print("Generating favicon.png …")
FAV = 48
fav = solid_bg(FAV, ACCENT)
ico = render_svg(FAV)
paste_center(fav, ico)
fav.convert("RGB").save(os.path.join(ASSETS, "favicon.png"), "PNG")
print("  ✅  favicon.png")

print("\n🎉  All icons generated!")
