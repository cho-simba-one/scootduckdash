"""Prove every pond crossing is jumpable.

Jump budget (same gravity-then-position order as player.js at dt=1):
  34 airborne frames, 115.6px of run-up distance, 79.0px of height.
Lily pads are 42px wide; keep edge-to-edge gaps under 92px so a real
player (not a frame-perfect hold-right) can still clear them.
Horizontal carts count as a ride: you must be able to hop ON at the
cart's start and hop OFF at its end.
"""
from __future__ import annotations

import ast
import re
from pathlib import Path

ROOT = Path(__file__).parent
LEVELS_JS = ROOT / "js" / "levels.js"

LILY_W = 42
HAY_W = 30
CART_W = 60
SAFE_EDGE = 92
MAX_JUMP_X = 115.6
MAX_JUMP_H = 79.0
GROUND_Y = 230
PLAYER_H = 30


def _js_array(blob: str, key: str):
    token = f"{key}:"
    i = blob.find(token)
    if i < 0:
        return None
    i = blob.find("[", i)
    depth = 0
    for j in range(i, len(blob)):
        if blob[j] == "[":
            depth += 1
        elif blob[j] == "]":
            depth -= 1
            if depth == 0:
                raw = blob[i : j + 1]
                return ast.literal_eval(raw)
    raise ValueError(f"unclosed array for {key}")


def parse_levels(text: str) -> list[dict]:
    text = re.sub(r"^\s*//.*$", "", text, flags=re.M)
    start = text.find("export const LEVELS = [")
    body = text[start:]
    levels = []
    for m in re.finditer(r"name:\s*'([^']+)'", body):
        chunk_start = m.start()
        nxt = body.find("name:", chunk_start + 5)
        chunk = body[chunk_start : nxt if nxt > 0 else None]
        width = re.search(r"width:\s*(\d+)", chunk)
        levels.append({
            "name": m.group(1),
            "width": int(width.group(1)) if width else 0,
            "ground": _js_array(chunk, "ground") or [],
            "hay": _js_array(chunk, "hay") or [],
            "ponds": _js_array(chunk, "ponds") or [],
            "lilies": _js_array(chunk, "lilies") or [],
            "carts": _js_array(chunk, "carts") or [],
            "pickups": _js_array(chunk, "pickups") or [],
        })
    return levels


def lily_edges(cx):
    return cx - LILY_W / 2, cx + LILY_W / 2


def check_level(lv: dict) -> list[str]:
    fails = []
    name = lv["name"]

    if lv["ground"][0][0] > 40:
        fails.append(f"{name}: spawn x=40 is not on the first ground strip")
    last_g = lv["ground"][-1]
    goal_x = lv["width"] - 120
    if not (last_g[0] <= goal_x <= last_g[0] + last_g[1]):
        fails.append(f"{name}: goal at {goal_x} is not on the last ground strip")

    for pond in lv["ponds"]:
        pads = sorted(cx for cx, _y in lv["lilies"] if pond[0] < cx < pond[1])
        for cx, nx in zip(pads, pads[1:]):
            gap = (nx - LILY_W / 2) - (cx + LILY_W / 2)
            if gap > SAFE_EDGE and not cart_covers(lv["carts"], cx + LILY_W / 2, nx - LILY_W / 2):
                fails.append(
                    f"{name}: lily {cx}->{nx} in pond {pond[0]}-{pond[1]} "
                    f"edge gap {gap:.0f}px > {SAFE_EDGE} and no cart"
                )

    for pond in lv["ponds"]:
        a, b = pond
        fails.extend(check_pond(name, a, b, lv))

    for x, y, kind in lv["pickups"]:
        if kind != "heart":
            continue
        # Vertical-lift hearts sit at y=36; keep them off nearby hay jump range.
        if y <= 40:
            for hx, hy in lv["hay"]:
                dx = abs((hx + HAY_W / 2) - x)
                rise = hy - y
                if dx < MAX_JUMP_X and rise <= MAX_JUMP_H:
                    fails.append(
                        f"{name}: heart at {x},{y} is jumpable from hay {hx},{hy} "
                        f"(dx={dx:.0f} rise={rise:.0f}) -- lift skip"
                    )

    for hx, hy in lv["hay"]:
        if GROUND_Y - hy > MAX_JUMP_H + 1:
            # Must be reachable from another hay, not only from the floor.
            if not any(
                other is not (hx, hy)
                and abs((other[0] + HAY_W / 2) - (hx + HAY_W / 2)) < MAX_JUMP_X
                and 0 <= other[1] - hy <= MAX_JUMP_H
                for other in lv["hay"]
            ):
                # First hay on a strip can still be 79px off the ground.
                if GROUND_Y - hy > MAX_JUMP_H:
                    fails.append(
                        f"{name}: hay at {hx},{hy} is {GROUND_Y - hy}px above ground "
                        f"(max jump height {MAX_JUMP_H})"
                    )
    return fails


def cart_covers(carts, left, right):
    for x, y, rng, axis in carts:
        if axis != "h":
            continue
        cover_l, cover_r = x, x + rng + CART_W
        if cover_l <= left + SAFE_EDGE and cover_r >= right - SAFE_EDGE:
            return True
    return False


def check_pond(name, a, b, lv) -> list[str]:
    fails = []
    pads = sorted((cx, cy) for cx, cy in lv["lilies"] if a < cx < b)
    hcarts = [
        (x, y, rng) for x, y, rng, axis in lv["carts"] if axis == "h" and a < x < b
    ]
    if not pads and not hcarts:
        fails.append(f"{name}: pond {a}-{b} has no lilies and no carts")
        return fails

    # Path: ground -> first pad/cart, then along pads, using carts to
    # bridge any oversize pad gap, then last pad/cart -> far ground.
    points = []
    if pads:
        first_l, _ = lily_edges(pads[0][0])
        if first_l - a > SAFE_EDGE and not cart_covers(lv["carts"], a, first_l):
            fails.append(
                f"{name}: pond {a}-{b} entry gap {first_l - a:.0f}px (need lily or cart)"
            )
        last_r = lily_edges(pads[-1][0])[1]
        if b - last_r > SAFE_EDGE and not cart_covers(lv["carts"], last_r, b):
            fails.append(
                f"{name}: pond {a}-{b} exit gap {b - last_r:.0f}px (need lily or cart)"
            )
    for x, y, rng in hcarts:
        on_gap_ok = any(lily_edges(cx)[1] + SAFE_EDGE >= x for cx, _cy in pads) or x - a <= SAFE_EDGE
        off_right = x + rng + CART_W
        off_gap_ok = any(lily_edges(cx)[0] - SAFE_EDGE <= off_right for cx, _cy in pads) or b - off_right <= SAFE_EDGE
        if not on_gap_ok:
            fails.append(f"{name}: cannot hop ON cart at {x} in pond {a}-{b}")
        if not off_gap_ok:
            fails.append(f"{name}: cannot hop OFF cart ending {off_right} in pond {a}-{b}")
    return fails


def main():
    levels = parse_levels(LEVELS_JS.read_text(encoding="utf-8"))
    if len(levels) < 5:
        raise SystemExit(f"expected at least 5 levels, parsed {len(levels)}")
    fails = []
    for lv in levels:
        fails.extend(check_level(lv))
        print(f"  {lv['name']}: width={lv['width']} ponds={len(lv['ponds'])} "
              f"lilies={len(lv['lilies'])} carts={len(lv['carts'])}")
    if fails:
        print("FAIL")
        for f in fails:
            print(" -", f)
        raise SystemExit(1)
    print(f"OK {len(levels)} levels, all pond crossings inside the jump budget")


if __name__ == "__main__":
    main()
