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
MUSIC_JS = ROOT / "js" / "musicData.js"

LILY_W = 42
HAY_W = 30
CART_W = 60
TAXI_W = 70
SAFE_EDGE = 92
WHIP_SAFE = 120
MAX_JUMP_X = 115.6
MAX_JUMP_H = 79.0
GROUND_Y = 230
PLAYER_H = 30
PLAYER_W = 26


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
        world = re.search(r"world:\s*'([^']+)'", chunk)
        spawn = _js_array(chunk, "spawn")
        goal = _js_array(chunk, "goal")
        mill = (world.group(1) if world else "") == "mill"
        levels.append({
            "name": m.group(1),
            "width": int(width.group(1)) if width else 0,
            "ground": _js_array(chunk, "ground") or [],
            "ledges": _js_array(chunk, "ledges") or [],
            "hay": _js_array(chunk, "hay") or [],
            "ponds": _js_array(chunk, "ponds") or [],
            "lilies": _js_array(chunk, "lilies") or [],
            "carts": _js_array(chunk, "carts") or [],
            "taxis": _js_array(chunk, "taxis") or [],
            "pickups": _js_array(chunk, "pickups") or [],
            "saves": _js_array(chunk, "saves") or [],
            "spawn": spawn,
            "goal": goal,
            "mill": mill,
            "whip": bool(re.search(r"whip:\s*true", chunk)) or mill,
        })
    return levels


def lily_edges(cx):
    return cx - LILY_W / 2, cx + LILY_W / 2


def edge_limit(lv):
    return WHIP_SAFE if lv.get("whip") else SAFE_EDGE


def on_ground(x, lv):
    for gx, gw, *_rest in lv["ground"]:
        if gx <= x <= gx + gw:
            return True
    return False


def on_ledge(x, top_y, lv, box_height=90):
    for row in lv["ledges"]:
        lx, lw, ly, *_rest = row
        if lx <= x <= lx + lw and abs(top_y - (ly - box_height)) < 8:
            return True
    return False


def on_hay_bale(x, top_y, lv):
    for hx, hy in lv["hay"]:
        if hx <= x <= hx + HAY_W and abs(top_y - (hy - PLAYER_H)) < 8:
            return True
    return False


def save_supported(x, top_y, lv):
    """A save's [x, y] is the top-left of the player box (width 26) that
    gets planted there on respawn -- mirrors how spawn/goal are checked,
    but also accepts hay bales since mill saves often perch on one."""
    right = x + PLAYER_W
    if on_ground(x, lv) and on_ground(right, lv) and abs(top_y - (GROUND_Y - PLAYER_H)) < 8:
        return True
    if on_ledge(x, top_y, lv, PLAYER_H) and on_ledge(right, top_y, lv, PLAYER_H):
        return True
    if on_hay_bale(x, top_y, lv) and on_hay_bale(right, top_y, lv):
        return True
    return False


def check_level(lv: dict) -> list[str]:
    fails = []
    name = lv["name"]

    spawn_x = lv["spawn"][0] if lv["spawn"] else 40
    if not on_ground(spawn_x, lv):
        fails.append(f"{name}: spawn x={spawn_x} is not on a ground strip")
    if lv["goal"]:
        gx, gy = lv["goal"]
        if not on_ground(gx, lv) and not on_ledge(gx, gy, lv):
            fails.append(f"{name}: goal at {gx},{gy} is not on ground or a ledge")
    else:
        last_g = lv["ground"][-1]
        goal_x = lv["width"] - 120
        if not (last_g[0] <= goal_x <= last_g[0] + last_g[1]):
            fails.append(f"{name}: goal at {goal_x} is not on the last ground strip")

    for sx, sy in lv["saves"]:
        if not save_supported(sx, sy, lv):
            fails.append(
                f"{name}: save at {sx},{sy} is not supported by a ground strip, "
                f"ledge, or hay bale -- player would spawn floating"
            )

    for pond in lv["ponds"]:
        pads = sorted(cx for cx, _y in lv["lilies"] if pond[0] < cx < pond[1])
        for cx, nx in zip(pads, pads[1:]):
            gap = (nx - LILY_W / 2) - (cx + LILY_W / 2)
            if gap > edge_limit(lv) and not cart_covers(rides_h(lv), cx + LILY_W / 2, nx - LILY_W / 2):
                fails.append(
                    f"{name}: lily {cx}->{nx} in pond {pond[0]}-{pond[1]} "
                    f"edge gap {gap:.0f}px > {edge_limit(lv)} and no cart"
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


def rides_h(lv):
    out = []
    for x, y, rng, axis in lv["carts"]:
        if axis == "h":
            out.append((x, y, rng, CART_W))
    for x, y, rng in lv.get("taxis") or []:
        out.append((x, y, rng, TAXI_W))
    return out


def cart_covers(rides, left, right):
    for x, _y, rng, width in rides:
        cover_l, cover_r = x, x + rng + width
        if cover_l <= left + SAFE_EDGE and cover_r >= right - SAFE_EDGE:
            return True
    return False


def check_pond(name, a, b, lv) -> list[str]:
    fails = []
    pads = sorted((cx, cy) for cx, cy in lv["lilies"] if a < cx < b)
    hcarts = [
        (x, y, rng, w) for x, y, rng, w in rides_h(lv) if a < x < b
    ]
    if not pads and not hcarts:
        fails.append(f"{name}: pond {a}-{b} has no lilies and no carts")
        return fails

    # Path: ground -> first pad/cart, then along pads, using carts to
    # bridge any oversize pad gap, then last pad/cart -> far ground.
    if pads:
        first_l, _ = lily_edges(pads[0][0])
        if first_l - a > edge_limit(lv) and not cart_covers(rides_h(lv), a, first_l):
            fails.append(
                f"{name}: pond {a}-{b} entry gap {first_l - a:.0f}px (need lily or cart)"
            )
        last_r = lily_edges(pads[-1][0])[1]
        if b - last_r > edge_limit(lv) and not cart_covers(rides_h(lv), last_r, b):
            fails.append(
                f"{name}: pond {a}-{b} exit gap {b - last_r:.0f}px (need lily or cart)"
            )
    for x, y, rng, width in hcarts:
        on_gap_ok = any(lily_edges(cx)[1] + edge_limit(lv) >= x for cx, _cy in pads) or x - a <= edge_limit(lv)
        off_right = x + rng + width
        off_gap_ok = any(lily_edges(cx)[0] - edge_limit(lv) <= off_right for cx, _cy in pads) or b - off_right <= edge_limit(lv)
        if not on_gap_ok:
            fails.append(f"{name}: cannot hop ON cart at {x} in pond {a}-{b}")
        if not off_gap_ok:
            fails.append(f"{name}: cannot hop OFF cart ending {off_right} in pond {a}-{b}")
    return fails


def parse_track_count(text: str) -> int:
    """Count entries in `export const TRACKS = [ ... ];` in musicData.js."""
    marker = "export const TRACKS = ["
    start = text.find(marker)
    if start < 0:
        raise SystemExit("could not find 'export const TRACKS = [' in musicData.js")
    i = start + len(marker) - 1  # index of the opening '['
    depth = 0
    for j in range(i, len(text)):
        if text[j] == "[":
            depth += 1
        elif text[j] == "]":
            depth -= 1
            if depth == 0:
                raw = text[i + 1 : j]
                break
    else:
        raise SystemExit("unclosed TRACKS array in musicData.js")
    return len([t for t in raw.split(",") if t.strip()])


def main():
    levels = parse_levels(LEVELS_JS.read_text(encoding="utf-8"))
    if len(levels) < 40:
        raise SystemExit(f"expected at least 40 levels, parsed {len(levels)}")
    fails = []

    track_count = parse_track_count(MUSIC_JS.read_text(encoding="utf-8"))
    if track_count != len(levels):
        fails.append(
            f"musicData.js TRACKS has {track_count} entries but levels.js has "
            f"{len(levels)} levels -- add or remove a track so they match"
        )

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
