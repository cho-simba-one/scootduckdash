"""Shared icon-art renderer: draws the duck-on-scooter badge (farmyard sky +
grass backdrop, rounded-square, duck sprite centered) at any size. Used by
make_icon.py (desktop .ico) and generate_pwa_icons.py (web app manifest
PNGs) so the artwork only lives in one place -- keep it in sync by hand with
js/sprites.js DUCK_IDLE / js/constants.js PALETTE if those ever change.
"""
from PIL import Image, ImageDraw

PALETTE = {
    '.': None,
    'k': '#1a1a1a',
    'y': '#ffd23f',
    'Y': '#ffe873',
    'o': '#ff8c1a',
    'w': '#ffffff',
    'r': '#e63946',
    'b': '#3a86ff',
    's': '#8d99ae',
}

DUCK_IDLE = [
    '....rrrr............',
    '.....rkkr...........',
    '....bbbbbb...........',
    '...bkkkkkkb..........',
    '...yYYYYYYy..........',
    '...yYkYYYYy.o..kkkkk.',
    '...yYYYYYYyooo.yss...',
    '..yyyyyyyyyoo...ys...',
    '.yyyyyyyyyyyy...s....',
    '.yYYYYYYYYYYy...s....',
    '.yyoyyyyyyoyy...s....',
    '..oo....oo......s....',
    '..kk....kk......s....',
    '.ssssssssssssssssss..',
    '.s................s..',
    '..k..............k..',
    '..k..............k..',
]


def draw_badge(size, rounded=True):
    """Render the duck-scooter app badge at `size` x `size` pixels.

    Set rounded=False for platforms (like Android adaptive/maskable icons or
    Apple touch icons) that apply their own corner-rounding -- a
    pre-rounded PNG looks bad double-clipped or with mismatched radii.
    """
    pixel = max(1, size // 26)  # source-pixel size scales with output size
    grid_w = max(len(row) for row in DUCK_IDLE) * pixel
    grid_h = len(DUCK_IDLE) * pixel

    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))

    badge = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge)
    sky_top = (135, 206, 250)
    sky_bottom = (200, 233, 255)
    for y in range(size):
        t = y / size
        col = tuple(int(sky_top[i] + (sky_bottom[i] - sky_top[i]) * t) for i in range(3))
        bd.line([(0, y), (size, y)], fill=col + (255,))
    grass_h = int(size * 0.28)
    bd.rectangle([0, size - grass_h, size, size], fill=(76, 175, 80, 255))
    bd.rectangle([0, size - grass_h, size, size - grass_h + max(1, size // 42)], fill=(63, 174, 74, 255))

    if rounded:
        mask = Image.new('L', (size, size), 0)
        md = ImageDraw.Draw(mask)
        radius = int(size * 0.164)
        md.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
        canvas.paste(badge, (0, 0), mask)
    else:
        canvas.paste(badge, (0, 0))

    sprite = Image.new('RGBA', (grid_w, grid_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sprite)
    for ry, row in enumerate(DUCK_IDLE):
        for rx, ch in enumerate(row):
            hexcol = PALETTE.get(ch)
            if not hexcol:
                continue
            x0, y0 = rx * pixel, ry * pixel
            sd.rectangle([x0, y0, x0 + pixel - 1, y0 + pixel - 1], fill=hexcol)

    target_w = size * 0.72
    target_h = size * 0.62
    scale = min(target_w / grid_w, target_h / grid_h)
    sprite = sprite.resize((max(1, int(grid_w * scale)), max(1, int(grid_h * scale))), Image.NEAREST)
    sx = (size - sprite.width) // 2
    grass_line = size - grass_h
    sy = grass_line - sprite.height + int(size * 0.04)
    canvas.alpha_composite(sprite, (sx, sy))

    return canvas
