# Boss Plan — Captain's Amendment to the 100-Level Plan

The contractor's plan (`build_level_plan.py` / the PDF) says decade-enders are
"gauntlets, not bosses." **The Captain overrode that**: four true boss fights,
at the end of decades 4, 6, 7 and 9. This file is the settled record so the
decision doesn't read as unexplained drift later. The PDF now contradicts this
and needs regenerating whenever someone next touches the deck.

Stage 100 keeps the contractor's ending (the Scoot Cup rematch gauntlet, no
HP bar) — the bosses live at 40/60/70/90, not 100.

## The roster

| Level | World | Boss | Screen title | Status |
|---|---|---|---|---|
| 40 | The Mill | The Work Boss | THE FOREMAN — Nobody Clocks Out Early | **SHIPPED** (`js/boss.js`, `type: 'work'`) |
| 60 | Carnival | Mrs. Scooter Duck | MRS. SCOOTER DUCK — Ring Toss for Two | Planned |
| 70 | Alpine Town | Baby Scooter Duck | BABY SCOOTER DUCK — Not Done Being Upset | Planned |
| 90 | The Manor | Giant Scooter Duck | GIANT SCOOTER DUCK — His Own Worst Rival | Planned |

Full intro/victory copy for all four: `boss_fights_copy.md` (house voice,
two-line rule). Notes from that brief worth keeping:

- Mrs. Scooter Duck builds on the carnival's existing prize-duck lore; Baby
  builds on the alpine cowbell theft. Foreman and Giant are new lore.
- Baby Scooter Duck cannot be hurt (she's a baby) — the fight must resolve
  gently: outlast the tantrum, not stomp it. This will need a boss that wins
  by survival/timer rather than HP. Fine — HP already hides behind `stomp()`.
- Giant Scooter Duck is mirror-Scoot: "the man's biggest enemy is himself"
  (Captain's brief, verbatim). Mechanically: he copies your moves half a beat
  late. The Manor needs a three-storey mirror set piece.

## Engineering rules (from the Vitruvius review, settled)

- A boss satisfies the existing foe contract (`getHitbox` / `update` /
  `render` / `stomp` / `killByProjectile`) so `hitFoe` needs zero changes.
  HP and the mercy window live inside the boss.
- Boss hazards are boss-owned, exposed via `getHazardBoxes()` — never pushed
  into the player's projectile list.
- Declared in level data as a named object: `boss: { type, x, floorY, minX,
  maxX, hp }`. Registry in `boss.js` (`BOSS_TYPES`); adding a boss = one
  class + one map entry, zero builder edits.
- The goal gates on `boss.defeated`. No new game state.
- **Do not extract a Boss base class yet.** Extract shared framework when
  boss #2 exists and the shared parts are visible, not before (YAGNI).
- Bosses are placed IN the decade-final level, never inserted as extra
  levels — inserting shifts every TRACKS index and corrupts stored egg
  progress (both are keyed by level index).

## Before authoring decades 5-10 (order matters, also from the review)

1. Build the `createLevel(i)` → JSON snapshot harness (stub localStorage +
   Math.random), capture baseline hashes.
2. Split `levels.js` by world into `js/levels/` behind a re-export shim;
   prove identical hashes. (`check_appshell.py` is already recursive.)
3. Update `check_levels.py` to glob the split files.
4. Only then author Tide Caves (41-50). Each new mechanic lands with its
   validator check, or the green light means less every decade.
5. Collapse game.js's 18 copy-pasted entity loops (preserve exact render
   order — it's the z-order; stomp ratios are NOT uniform: Frog 0.6,
   Goose/Traffic 0.7, hitFoe 0.65 — carry them, don't unify).
