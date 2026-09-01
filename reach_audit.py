"""Which mill platforms can the duck actually stand on -- and get to?

Builds a platform graph per level and walks it from the spawn. Anything it
cannot reach is either decoration or a bug; in the mill (stages 31-40) every
platform is meant to be functional, so anything stranded there is a bug.

Edges model the real jump budget from player.js:
  - up:   rise <= 79px apex, horizontal gap <= 115.6px
  - pad:  a bounce flower under the target lifts you 112px instead
  - down: any drop, with drift allowance
  - lift: a vertical cart bridges the heights it travels through
"""
from __future__ import annotations

import sys
from collections import deque

from check_levels import (
    LEVELS_JS, parse_levels, GROUND_Y, HAY_W, LILY_W, MAX_JUMP_X, MAX_JUMP_H,
)

PAD_JUMP_H = 112.0
CART_W = 60
# A landing window is "tight" relative to the TARGET's width -- a 42px lily
# pad can never offer a 60px window, and demanding one would drown the real
# findings in noise. Small targets must still offer most of their surface;
# big targets must offer a genuinely forgiving approach.
def tight_limit(target_width):
    return min(40.0, target_width * 0.55)
DRIFT = 150.0  # how far you can drift sideways while falling


# How thick each surface is, for head-bonk tests. A ledge is a solid slab
# with a real underside: the game let a duck jump 22px under a catwalk
# while this audit happily reported the floor above as "reachable".
THICKNESS = {"ground": 40, "ledge": 18, "hay": 15, "lily": 10, "vcart": 20, "hcart": 20}


def platforms(lv):
    """Every standable surface as (label, left, right, top)."""
    out = []
    for gx, gw, *_ in lv["ground"]:
        out.append((f"ground[{gx},{gw}]", gx, gx + gw, GROUND_Y))
    for lx, lw, ly, *_ in lv["ledges"]:
        out.append((f"ledge[{lx},{lw},{ly}]", lx, lx + lw, ly))
    for hx, hy in lv["hay"]:
        out.append((f"hay[{hx},{hy}]", hx, hx + HAY_W, hy))
    # Lily pads are solid tops -- they are how you cross every pond.
    for cx, cy in lv["lilies"]:
        out.append((f"lily[{cx},{cy}]", cx - LILY_W / 2, cx + LILY_W / 2, cy))
    for row in lv.get("carts", []):
        x, y, rng = row[0], row[1], row[2]
        axis = row[3] if len(row) > 3 else "h"
        if axis == "v":
            # A lift is standable across its whole travel.
            out.append((f"vcart[{x},{y}]", x, x + CART_W, y - rng, y + rng))
        else:
            out.append((f"hcart[{x},{y}]", x - rng, x + rng + CART_W, y))
    return [(p if len(p) == 5 else (*p, p[3])) for p in out]


def gap(a, b):
    """Horizontal gap between two spans; 0 if they overlap."""
    if a[2] >= b[1] and b[2] >= a[1]:
        return 0.0
    return b[1] - a[2] if b[1] > a[2] else a[1] - b[2]


# Real physics, straight from constants.js / player.js.
GRAVITY = 0.55
JUMP_V = -9.6
PAD_V = -11.4
MAX_FALL = 11.0
RUN_SPEED = 3.4
PLAYER_W = 26
PLAYER_H = 30


def ceilings(plats, a, b):
    """Solid slabs that could stop a jump from a to b with a head-bonk."""
    out = []
    for p in plats:
        if p is a or p is b:
            continue
        kind = p[0].split("[")[0]
        thick = THICKNESS.get(kind, 18)
        out.append((p[1], p[2], p[3], p[3] + thick))
    return out


def arc_lands(start_x, start_top, vy0, vx, target, obstacles=()):
    """Simulate one jump; True if it lands on target's top surface.

    Integration order matches player.js exactly (gravity, then position).
    A landing needs the feet to cross the target's top while the body
    overlaps it horizontally -- and to have been ABOVE that top on the
    previous frame, so clipping up through a platform is not a landing.
    """
    _, tleft, tright, ttop, _tlow = target
    x = start_x
    feet = start_top
    vy = vy0
    for _ in range(220):
        prev_feet = feet
        vy = min(vy + GRAVITY, MAX_FALL)
        feet += vy
        x += vx
        left, right = x, x + PLAYER_W
        # Head-bonk: rising into the underside of a slab stops the climb.
        if vy < 0:
            head = feet - PLAYER_H
            for oleft, oright, otop, obottom in obstacles:
                # Needs real overlap -- clipping 2px of a slab's corner is
                # not what stops a duck in game.
                if min(right, oright) - max(left, oleft) > 8 and otop < head < obottom:
                    return False
        overlap = right > tleft and left < tright
        if overlap and prev_feet <= ttop <= feet and vy > 0:
            return True
        if feet > ttop + 400:  # fell well past it
            return False
    return False


def jump_window(a, b, pad_launch=False, obstacles=()):
    """Widest contiguous run of takeoff positions (px) that lands on B at
    full run speed. This is the number that matters to a human: a jump
    with a 4px window is not a route, it is a lottery."""
    _, aleft, aright, atop, _alow = a
    vy0 = PAD_V if pad_launch else JUMP_V
    # Test BOTH run directions. Picking one from the platforms' relative
    # positions is wrong whenever the target sits inside the launch
    # platform's span -- it reported a 0px window for bales that are a
    # plain hop, and Clyde had to shuffle geometry around the false alarm.
    best = 0
    for toward in (1, -1):
        run = 0
        x = aleft - PLAYER_W
        while x <= aright + 2:
            if arc_lands(x, atop, vy0, RUN_SPEED * toward, b, obstacles):
                run += 2
                best = max(best, run)
            else:
                run = 0
            x += 2
    return best


def can_jump(a, b, pad_launch=False, obstacles=()):
    """Sweep takeoff positions and speeds along A looking for one arc that
    lands on B. Costlier than comparing two numbers, and correct, which
    the two-number version was not: a jump cannot be at apex height and
    maximum distance at the same moment."""
    _, aleft, aright, atop, _alow = a
    vy0 = PAD_V if pad_launch else JUMP_V
    # Takeoff spots: sample across A, densely near its edges.
    spots = set()
    span = max(1.0, aright - aleft)
    steps = min(60, max(6, int(span // 8)))
    for i in range(steps + 1):
        spots.add(aleft + span * i / steps - PLAYER_W / 2)
    for vx in (RUN_SPEED, RUN_SPEED * 0.6, RUN_SPEED * 0.25, 0.0,
               -RUN_SPEED * 0.25, -RUN_SPEED * 0.6, -RUN_SPEED):
        for sx in spots:
            if arc_lands(sx, atop, vy0, vx, b, obstacles):
                return True
    return False


def pad_near(lv, span_left, span_right):
    for bx, _by in lv.get("bounces", []):
        if span_left - MAX_JUMP_X <= bx <= span_right + MAX_JUMP_X:
            return True
    return False


def reachable(lv):
    plats = platforms(lv)
    spawn_x = lv["spawn"][0] if lv["spawn"] else 40
    spawn_y = lv["spawn"][1] if lv["spawn"] else GROUND_Y - 30
    # Start from the platform the spawn stands on (nearest top below feet).
    start = None
    best = 1e9
    for i, p in enumerate(plats):
        top_hi = p[3]
        if p[1] - 40 <= spawn_x <= p[2] + 40:
            d = abs((spawn_y + 30) - top_hi)
            if d < best:
                best, start = d, i
    if start is None:
        return plats, set(), "no platform under spawn", {}

    seen = {start}
    windows = {start: 999}  # best landing window into each platform
    queue = deque([start])
    while queue:
        i = queue.popleft()
        a = plats[i]
        a_top = a[4]  # lowest standable height of a lift; equals top for statics
        for j, b in enumerate(plats):
            if j in seen:
                continue
            dx = gap(a, b)
            if dx > DRIFT:
                continue  # nothing reaches that far, don't simulate it
            # A lift boarded at its low end carries you to its high end.
            lift_ok = b[3] != b[4] and dx <= MAX_JUMP_X and b[4] >= a_top - MAX_JUMP_H
            pad = pad_near(lv, a[1], a[2])
            obs = ceilings(plats, a, b)
            if lift_ok or can_jump(a, b, obstacles=obs) \
                    or (pad and can_jump(a, b, pad_launch=True, obstacles=obs)):
                win = 999 if lift_ok else max(
                    jump_window(a, b, obstacles=obs),
                    jump_window(a, b, pad_launch=True, obstacles=obs) if pad else 0,
                )
                windows[j] = max(windows.get(j, 0), win)
                seen.add(j)
                queue.append(j)
    return plats, seen, None, windows


# The Captain's rule, encoded: a level has ONE way through, and the goal is
# never something you can hop up to from the floor below it. Reachability
# alone is the wrong invariant -- chasing it is exactly how Hopper House got
# a staircase 300px from spawn that skipped 4,300px of level.
SHORTCUT_MIN_DIST = 900.0  # a climb nearer the goal than this is a bypass


def goal_entries(lv, plats, seen, goal_idx):
    """Every platform BELOW the goal's platform that can jump onto it.

    The intended design is exactly one such platform, far away -- the lift
    at the far end of the level. Two of them, or one close to the goal, is
    an alternate route.
    """
    g = plats[goal_idx]
    out = []
    for i, p in enumerate(plats):
        if i == goal_idx or p[3] <= g[3]:
            continue  # not below it
        if not can_jump(p, g, obstacles=ceilings(plats, p, g)):
            continue
        gx = lv["goal"][0] if lv["goal"] else g[1]
        dist = 0.0 if p[1] <= gx <= p[2] else min(abs(p[1] - gx), abs(p[2] - gx))
        out.append((p[0], dist, i in seen))
    return out


def goal_reachable(lv, plats, seen):
    """The goal flag must stand on a platform the duck can actually get to.
    check_levels only proves the goal SITS on something -- which a stranded
    upper floor also satisfies."""
    if not lv["goal"]:
        return True, "default goal"
    gx, gy = lv["goal"]
    best, dist = None, 1e9
    for i, p in enumerate(plats):
        if p[1] - 40 <= gx <= p[2] + 40:
            d = abs((gy + 90) - p[3])  # flag is 90 tall, standing on its top
            if d < dist:
                dist, best = d, i
    if best is None:
        return False, f"goal {gx},{gy} has no platform under it"
    if best not in seen:
        return False, f"goal {gx},{gy} stands on {plats[best][0]}, which is unreachable"
    return True, best


def main():
    text = LEVELS_JS.read_text(encoding="utf-8")
    levels = parse_levels(text)
    only_mill = "--all" not in sys.argv
    problems = 0
    for i, lv in enumerate(levels):
        if only_mill and not lv.get("mill"):
            continue
        plats, seen, err, windows = reachable(lv)
        stranded = [p for k, p in enumerate(plats) if k not in seen]
        tight = [(p, windows.get(k, 0)) for k, p in enumerate(plats)
                 if k in seen and windows.get(k, 999) < tight_limit(p[2] - p[1])]
        goal_ok, goal_info = goal_reachable(lv, plats, seen)
        goal_msg = None if goal_ok else goal_info
        shortcuts = []
        if goal_ok and isinstance(goal_info, int):
            for label, dist, live in goal_entries(lv, plats, seen, goal_info):
                if live and dist < SHORTCUT_MIN_DIST:
                    shortcuts.append((label, dist))
        bad = bool(stranded or tight or err or not goal_ok or shortcuts)
        print(f"{'BAD' if bad else 'OK '} {i + 1:>3} {lv['name']:<16} "
              f"width={lv['width']:<5} platforms={len(plats):<3} "
              f"stranded={len(stranded)} tight={len(tight)}")
        if err:
            print(f"      !! {err}")
        if not goal_ok:
            print(f"      GOAL:     {goal_msg}")
            problems += 1
        for label, dist in shortcuts:
            print(f"      SHORTCUT: {label} is {dist:.0f}px from the goal and can "
                  f"jump straight onto its floor (want >= {SHORTCUT_MIN_DIST:.0f})")
            problems += 1
        for p in stranded:
            print(f"      STRANDED: {p[0]} top={p[3]}")
        for p, w in tight:
            print(f"      TIGHT:    {p[0]} top={p[3]} best landing window {w}px")
        problems += len(stranded) + len(tight) + (1 if err else 0)
    print(f"\n{'CLEAN' if not problems else str(problems) + ' PROBLEM(S)'}")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
