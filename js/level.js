// Turns declarative level DATA (levels.js) into runtime collision/entity
// objects. This builder is the only place that knows how a level is
// assembled, so adding a level never means touching code -- just data.

import { GAME_HEIGHT, GROUND_Y } from './constants.js';
import { LEVELS, LEVEL_COUNT } from './levels.js';
import { Frog } from './enemy.js';
import { Goose, Cart } from './hazards.js';
import { Pickup } from './pickups.js';
import { spriteSize } from './pixelArt.js';
import { HAY_BALE, LILYPAD } from './sprites.js';

const hayBaleSize = spriteSize(HAY_BALE);
const lilyPadSize = spriteSize(LILYPAD);

export { LEVEL_COUNT };

function groundStrip(x, width, y = GROUND_Y) {
  return { x, y, width, height: GAME_HEIGHT - y };
}

function hayPlatform(x, y) {
  return { x, y, width: hayBaleSize.width, height: hayBaleSize.height };
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
  const pickups = (data.pickups ?? []).map(([x, y, kind]) => new Pickup(x, y, kind));

  for (const [x, width] of data.ground) solids.push(groundStrip(x, width));
  for (const [x, y] of data.hay) solids.push(hayPlatform(x, y));

  for (const [centerX, topY] of data.lilies) {
    solids.push(lilyPlatform(centerX, topY));
    lilyPads.push({ x: centerX - lilyPadSize.width / 2, y: topY });
  }

  for (const [centerX, topY] of data.frogs) frogs.push(new Frog(centerX, topY));
  for (const [x, y, patrol] of data.geese) geese.push(new Goose(x, y, patrol));

  for (const [x, y, range, axis] of data.carts) {
    const cart = new Cart(x, y, range, axis);
    carts.push(cart);
    // The cart's solid is mutated in place each frame, so pushing it once
    // here is enough -- collision code stays blissfully unaware it moves.
    solids.push(cart.solid);
  }

  const ponds = data.ponds.map(([x, endX]) => ({ x, width: endX - x }));

  // Respawn on the safe ground just past each pond you've already cleared.
  const checkpoints = [40, ...data.ponds.map(([, endX]) => endX + 20)];

  const buildings = data.buildings.map(([type, x]) => ({
    type,
    x,
    y: GROUND_Y - (type === 'farmhouse' ? 105 : 95),
  }));

  const animals = data.animals.map(([type, x], i) => ({
    type,
    x,
    y: GROUND_Y - (type === 'dog' ? 22 : 18),
    seed: i,
  }));

  const goal = { x: data.width - 120, y: GROUND_Y - 90, width: 16, height: 90 };

  return {
    index,
    name: data.name,
    subtitle: data.subtitle,
    theme: data.theme,
    width: data.width,
    solids, lilyPads, frogs, geese, carts, pickups, ponds, checkpoints,
    buildings, animals, goal,
    clouds: scatterClouds(data.width),
  };
}
