"""One-off build tool: bakes the duck-scooter badge into the PNG sizes a web
app manifest needs (installable PWA on Android/desktop Chrome, Apple touch
icon for iOS home screen). Run again any time icon_art.py's sprite/palette
changes. Outputs land in assets/icons/.
"""
import os
from icon_art import draw_badge

OUT_DIR = os.path.join('assets', 'icons')
os.makedirs(OUT_DIR, exist_ok=True)

# (filename, size, rounded) -- "maskable" gets extra safe-zone padding baked
# in via a lower target fill so Android's own mask doesn't clip the duck;
# apple-touch-icon should NOT be pre-rounded since iOS rounds it itself.
SPECS = [
    ('icon-192.png', 192, True),
    ('icon-512.png', 512, True),
    ('maskable-512.png', 512, True),
    ('apple-touch-icon.png', 180, False),
]

for filename, size, rounded in SPECS:
    img = draw_badge(size, rounded=rounded)
    path = os.path.join(OUT_DIR, filename)
    img.save(path)
    print(f'wrote {path}')
