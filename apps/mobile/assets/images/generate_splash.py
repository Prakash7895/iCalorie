#!/usr/bin/env python3
"""Generate iCalorie splash icon — solid accent bg + centered nutrition-outline SVG."""

import os, io
from PIL import Image

ASSETS_DIR = os.path.dirname(os.path.abspath(__file__))
SIZE = 1024
ACCENT = "#00B894"  # COLORS.accent

# Icon size in SVG units is 60; scale that to canvas proportionally.
# SVG viewBox is 512×512, so 60/512 ≈ 11.7% of canvas.
ICON_SIZE = SIZE  # fill the full 1024×1024 canvas

# Read SVG and configure it for rendering
svg_path = os.path.join(ASSETS_DIR, "nutrition-outline.svg")
with open(svg_path) as f:
    svg = f.read()

# Set explicit dimensions + white stroke/fill
svg = svg.replace('class="ionicon"', f'width="{ICON_SIZE}" height="{ICON_SIZE}"')
svg = svg.replace("currentColor", "#FFFFFF")  # outline stroke → white
# Ensure the two filled sub-paths (eyes + leaf) also render white
svg = svg.replace('<path d="M323', '<path fill="#FFFFFF" d="M323')
svg = svg.replace("<ellipse", '<ellipse fill="#FFFFFF"')

import cairosvg

png_bytes = cairosvg.svg2png(
    bytestring=svg.encode(), output_width=ICON_SIZE, output_height=ICON_SIZE
)
icon = Image.open(io.BytesIO(png_bytes)).convert("RGBA")

# Create solid accent background
r, g, b = int(ACCENT[1:3], 16), int(ACCENT[3:5], 16), int(ACCENT[5:7], 16)
img = Image.new("RGBA", (SIZE, SIZE), (r, g, b, 255))

# Paste icon dead-center
ix = (SIZE - ICON_SIZE) // 2
iy = (SIZE - ICON_SIZE) // 2
img.paste(icon, (ix, iy), icon)

# Save
out_png = os.path.join(ASSETS_DIR, "splash-icon.png")
out_jpg = os.path.join(ASSETS_DIR, "splash-icon.jpg")
img.convert("RGB").save(out_png, "PNG")
img.convert("RGB").save(out_jpg, "JPEG", quality=96)
print(f"✅  Saved: {out_png}")
print(f"✅  Saved: {out_jpg}")
