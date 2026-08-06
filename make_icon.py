"""One-off build tool: bakes the duck-scooter badge into a multi-size .ico
for the desktop shortcut, plus a PNG preview. Not part of the game runtime --
run again any time icon_art.py's sprite/palette changes. See icon_art.py for
the actual drawing code (shared with generate_pwa_icons.py).
"""
from icon_art import draw_badge

canvas = draw_badge(256)
canvas.save('assets_icon_preview.png')
canvas.save('duck_icon.ico', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print('wrote duck_icon.ico and assets_icon_preview.png')
