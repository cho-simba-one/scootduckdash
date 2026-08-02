// The one demo level: a farmyard stretch with a pond gap you have to
// hop across on lily pads (each guarded by a frog), a couple of hay-bale
// jump platforms, and a goal flag at the far end.

import { GAME_HEIGHT, GROUND_Y, LEVEL_WIDTH } from './constants.js';
import { Frog } from './enemy.js';
import { spriteSize } from './pixelArt.js';
import { HAY_BALE, LILYPAD } from './sprites.js';

const hayBaleSize = spriteSize(HAY_BALE);
const lilyPadSize = spriteSize(LILYPAD);

function groundStrip(x, width, y = GROUND_Y) {
  return { x, y, width, height: GAME_HEIGHT - y };
}

function hayPlatform(x, y) {
  return { x, y, width: hayBaleSize.width, height: hayBaleSize.height };
}

function lilyPlatform(centerX, topY) {
  // Solid collider is thin -- just the very top surface of the pad,
  // matching how it's drawn (a squat lily-pad shape).
  return { x: centerX - lilyPadSize.width / 2, y: topY, width: lilyPadSize.width, height: 10 };
}

export function createLevel() {
  const solids = [];
  const lilyPads = []; // pure visual, rendered separately from their collider
  const frogs = [];

  // --- Section 1: intro meadow, gentle jump practice -----------------------
  solids.push(groundStrip(0, 720));
  solids.push(hayPlatform(300, 175));
  solids.push(hayPlatform(500, 150));
  frogs.push(new Frog(520, 150)); // easy stomp target sitting on the hay bale

  // --- Section 2: pond gap -- hop the lily pads, frogs guard each one ------
  const pondStartX = 720;
  const pondEndX = 1120;
  const padXs = [770, 890, 1010];
  const padYs = [200, 180, 200];
  padXs.forEach((px, i) => {
    const pad = lilyPlatform(px, padYs[i]);
    solids.push(pad);
    lilyPads.push({ x: px - lilyPadSize.width / 2, y: padYs[i] });
    frogs.push(new Frog(px, padYs[i]));
  });

  // --- Section 3: resume solid ground, a taller platform challenge ---------
  solids.push(groundStrip(pondEndX, 900));
  solids.push(hayPlatform(1300, 165));
  solids.push(hayPlatform(1480, 130));
  solids.push(hayPlatform(1660, 165));
  frogs.push(new Frog(1480, 130));

  // --- Section 4: second, slightly wider pond gap for a bit more spice -----
  const pond2StartX = 2020;
  const pond2EndX = 2380;
  const pad2Xs = [2070, 2190, 2320];
  const pad2Ys = [205, 185, 205];
  pad2Xs.forEach((px, i) => {
    const pad = lilyPlatform(px, pad2Ys[i]);
    solids.push(pad);
    lilyPads.push({ x: px - lilyPadSize.width / 2, y: pad2Ys[i] });
    frogs.push(new Frog(px, pad2Ys[i]));
  });

  // --- Section 5: home stretch to the goal flag ----------------------------
  solids.push(groundStrip(pond2EndX, LEVEL_WIDTH - pond2EndX));
  solids.push(hayPlatform(2600, 160));
  solids.push(hayPlatform(2800, 160));
  frogs.push(new Frog(2800, 160));

  const goal = { x: LEVEL_WIDTH - 120, y: GROUND_Y - 90, width: 16, height: 90 };

  // Respawn points used if the duck plummets into a pond -- always the
  // most recent solid ground the player had already reached.
  const checkpoints = [40, pondEndX + 20, pond2EndX + 20];

  // --- Background decor (purely cosmetic, rendered with parallax) ---------
  const clouds = [
    { x: 120, y: 30 }, { x: 520, y: 55 }, { x: 950, y: 25 }, { x: 1400, y: 45 },
    { x: 1900, y: 30 }, { x: 2300, y: 55 }, { x: 2750, y: 30 }, { x: 3200, y: 45 },
  ];
  const buildings = [
    { type: 'farmhouse', x: 180, y: GROUND_Y - 105 },
    { type: 'barn', x: 560, y: GROUND_Y - 95 },
    { type: 'barn', x: 2550, y: GROUND_Y - 95 },
  ];
  const animals = [
    { type: 'dog', x: 420, y: GROUND_Y - 22, seed: 0 },
    { type: 'goose', x: 900, y: GROUND_Y - 18, seed: 1 },
    { type: 'goose', x: 1500, y: GROUND_Y - 18, seed: 2 },
    { type: 'dog', x: 2400, y: GROUND_Y - 22, seed: 3 },
    { type: 'goose', x: 2900, y: GROUND_Y - 18, seed: 4 },
  ];
  const ponds = [
    { x: pondStartX, width: pondEndX - pondStartX },
    { x: pond2StartX, width: pond2EndX - pond2StartX },
  ];

  return { solids, lilyPads, frogs, goal, clouds, buildings, animals, ponds, checkpoints };
}
