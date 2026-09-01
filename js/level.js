// Turns declarative level DATA (levels.js) into runtime collision/entity
// objects. This builder is the only place that knows how a level is
// assembled, so adding a level never means touching code -- just data.

import { GAME_HEIGHT, GROUND_Y, PLAYER_HEIGHT } from './constants.js';
import { LEVELS, LEVEL_COUNT, STAGE_NAMES, STAGE_LABELS } from './levels.js';
import { Frog } from './enemy.js';
import { Goose, Cart } from './hazards.js';
import { Pickup } from './pickups.js';
import { Pig, Bee, Mole, Crow, BouncePad } from './critters.js';
import { Rat, Pigeon, Taxi, Hydrant, Geyser, Cat, Drone, Dumpster, Crane, Traffic } from './city.js';
import { Snake, Scorpion, Goat, Hawk } from './travel.js';
import { createBoss } from './boss.js';
import { hasEgg } from './secrets.js';
import { spriteSize } from './pixelArt.js';
import { HAY_BALE, LILYPAD } from './sprites.js';

const hayBaleSize = spriteSize(HAY_BALE);
const lilyPadSize = spriteSize(LILYPAD);

export { LEVEL_COUNT, STAGE_NAMES, STAGE_LABELS };

function groundStrip(x, width, y = GROUND_Y) {
  return { x, y, width, height: GAME_HEIGHT - y };
}

function hayPlatform(x, y) {
  return { x, y, width: hayBaleSize.width, height: hayBaleSize.height };
}

function ledgeStrip(x, width, y, belt) {
  const strip = { x, y, width, height: 18, isLedge: true };
  if (belt) strip.belt = belt;
  return strip;
}

function lilyPlatform(centerX, topY) {
  // Collider is deliberately thin -- just the visible top surface of the pad.
  return { x: centerX - lilyPadSize.width / 2, y: topY, width: lilyPadSize.width, height: 10 };
}

/** Cloud positions, spread evenly so wide levels don't run out of sky. */
function scatterClouds(width) {
  const clouds = [];
  for (let x = 120; x < width; x += 420) {
    clouds.push({ x, y: 25 + ((x / 420) % 3) * 15 });
  }
  return clouds;
}

/**
 * Build one level by index. Returns everything the game loop needs, plus
 * metadata (name/theme) for the HUD and background tinting.
 */
export function createLevel(index = 0) {
  const data = LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];

  const solids = [];
  const lilyPads = [];
  const frogs = [];
  const geese = [];
  const carts = [];
  // Optional in the data: levels without bonuses simply omit the key rather
  // than carrying an empty array around.
  const pickups = (data.pickups ?? [])
    .filter(([x, y, kind]) => kind !== 'egg' || !hasEgg(index))
    .map(([x, y, kind]) => new Pickup(x, y, kind));

  for (const row of (data.ground ?? [])) {
    const [x, width, belt] = row;
    const strip = groundStrip(x, width);
    if (belt) strip.belt = belt;
    solids.push(strip);
  }
  for (const row of (data.ledges ?? [])) {
    const [x, width, y, belt] = row;
    solids.push(ledgeStrip(x, width, y, belt));
  }
  for (const [x, y] of (data.hay ?? [])) solids.push(hayPlatform(x, y));

  for (const [centerX, topY] of (data.lilies ?? [])) {
    solids.push(lilyPlatform(centerX, topY));
    lilyPads.push({ x: centerX - lilyPadSize.width / 2, y: topY });
  }

  for (const [centerX, topY] of (data.frogs ?? [])) frogs.push(new Frog(centerX, topY));
  for (const [x, y, patrol] of (data.geese ?? [])) geese.push(new Goose(x, y, patrol));

  for (const [x, y, range, axis] of (data.carts ?? [])) {
    const cart = new Cart(x, y, range, axis, data.world || 'farm');
    carts.push(cart);
    // The cart's solid is mutated in place each frame, so pushing it once
    // here is enough -- collision code stays blissfully unaware it moves.
    solids.push(cart.solid);
  }

  // Low rails: standing hits them, ducking slips under. Height 10 so
  // renderTerrain does not mistake them for lily pads (those are also
  // short) -- tagged isBeam and drawn separately.
  const beams = [];
  for (const [x, width] of (data.beams ?? [])) {
    const beam = { x, y: GROUND_Y - 30, width, height: 10, isBeam: true };
    beams.push(beam);
    solids.push(beam);
  }

  const pigs = (data.pigs ?? []).map((row) => new Pig(row[0], row[1]));
  const bees = (data.bees ?? []).map(([x, y, patrol]) => new Bee(x, y, patrol));
  const moles = (data.moles ?? []).map(([x]) => new Mole(x));
  const crows = (data.crows ?? []).map(([x, y, span]) => new Crow(x, y, span));
  const bounces = (data.bounces ?? []).map(([x, y]) => new BouncePad(x, y, data.world || 'farm'));
  const rats = (data.rats ?? []).map((row) => new Rat(row[0], row[1]));
  const pigeons = (data.pigeons ?? []).map(([x, y, span]) => new Pigeon(x, y, span));
  const taxis = (data.taxis ?? []).map(([x, y, range]) => new Taxi(x, y, range));
  for (const taxi of taxis) solids.push(taxi.solid);
  const hydrants = (data.hydrants ?? []).map(([x, dir]) => new Hydrant(x, dir ?? 1));
  const geysers = (data.geysers ?? []).map(([x]) => new Geyser(x));
  const cats = (data.cats ?? []).map(([x]) => new Cat(x));
  const drones = (data.drones ?? []).map(([x, y, span]) => new Drone(x, y, span));
  const dumpsters = (data.dumpsters ?? []).map(([x]) => new Dumpster(x));
  const cranes = (data.cranes ?? []).map(([x, y, range]) => new Crane(x, y, range));
  for (const crane of cranes) solids.push(crane.solid);
  const traffic = (data.traffic ?? []).map(([x, width]) => new Traffic(x, width));
  const snakes = (data.snakes ?? []).map(([x]) => new Snake(x));
  const scorpions = (data.scorpions ?? []).map(([x]) => new Scorpion(x));
  const goats = (data.goats ?? []).map(([x]) => new Goat(x));
  const hawks = (data.hawks ?? []).map(([x, y, span]) => new Hawk(x, y, span));

  // At most one boss per level; a named-object spec because boss tuning is
  // heterogeneous (positional tuples are for forty identical rats).
  const boss = data.boss ? createBoss(data.boss) : null;

  const ponds = (data.ponds ?? []).map(([x, endX]) => ({ x, width: endX - x }));

  const spawn = data.spawn
    ? { x: data.spawn[0], y: data.spawn[1] }
    : { x: 40, y: GROUND_Y - PLAYER_HEIGHT };

  // Respawn on the safe ground just past each pond you've already cleared.
  // Mill stages list [x, y] saves along the route (including reverse wings).
  const saves = (data.saves ?? []).map(([x, y]) => ({ x, y }));
  const checkpoints = saves.length
    ? saves.map((s) => s.x)
    : [spawn.x, ...ponds.map((p) => p.x + p.width + 20)];

  const buildings = (data.buildings ?? []).map(([type, x]) => ({
    type,
    x,
    y: GROUND_Y - (type === 'farmhouse' ? 105 : 95),
  }));

  const animals = (data.animals ?? []).map(([type, x], i) => ({
    type,
    x,
    y: GROUND_Y - (type === 'dog' ? 22 : 18),
    seed: i,
  }));

  const goal = {
    x: data.goal ? data.goal[0] : data.width - 120,
    y: data.goal ? data.goal[1] : GROUND_Y - 90,
    width: 16,
    height: 90,
  };

  const tops = solids.map((s) => s.y);
  const camMinY = data.world === 'mill'
    ? Math.min(0, Math.min(goal.y, ...tops) - 160)
    : 0;

  return {
    index,
    name: data.name,
    label: STAGE_LABELS[index] ?? data.name, // "33 Hopper House"
    subtitle: data.subtitle,
    skill: data.skill || '',
    story: data.story || '',
    theme: data.theme,
    world: data.world || 'farm',
    landmark: data.landmark || '',
    cityGate: !!data.cityGate,
    travelGate: !!data.travelGate,
    millGate: !!data.millGate,
    allowWhip: !!(data.world && data.world !== 'farm' && data.world !== 'city'),
    width: data.width,
    wind: data.wind || 0,
    spawn, saves, camMinY,
    solids, lilyPads, frogs, geese, carts, pickups, ponds, checkpoints,
    pigs, bees, moles, crows, bounces, beams,
    rats, pigeons, taxis, hydrants, geysers,
    cats, drones, dumpsters, cranes, traffic,
    snakes, scorpions, goats, hawks, boss,
    buildings, animals, goal,
    clouds: scatterClouds(data.width),
  };
}
