// Tunable game constants. Keep every "magic number" here so balance
// tweaks never require hunting through gameplay code.

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

export const PIXEL_SCALE = 3; // how big each "pixel grid" cell renders as, in game units

export const GRAVITY = 0.55;
export const MAX_FALL_SPEED = 11;

export const PLAYER_MOVE_ACCEL = 0.6;
export const PLAYER_FRICTION = 0.45;
export const PLAYER_MAX_SPEED = 3.4;
export const PLAYER_DUCK_MAX_SPEED = 1.2;
export const PLAYER_JUMP_VELOCITY = -9.6;
export const PLAYER_STOMP_BOUNCE = -6.5;
export const PLAYER_PAD_BOUNCE = -11.4; // flower pads -- enough extra height to reach secret eggs

export const PLAYER_WIDTH = 26;
export const PLAYER_HEIGHT = 30;
export const PLAYER_DUCK_HEIGHT = 20;

export const PLAYER_MAX_HEARTS = 3;
export const PLAYER_INVINCIBLE_MS = 1400;

export const PROJECTILE_SPEED = 6.5;
export const PROJECTILE_COOLDOWN_MS = 260;
export const PROJECTILE_LIFETIME_MS = 1800;

export const FROG_HOP_INTERVAL_MS = [1600, 2800]; // randomized min/max
export const FROG_HOP_VELOCITY = -6.2;
export const FROG_TONGUE_RANGE = 70;
export const FROG_TONGUE_DURATION_MS = 500;
export const FROG_TONGUE_COOLDOWN_MS = [2200, 4000];

// Level widths now live per-level in levels.js -- they differ, and a shared
// constant would scroll past the end of short levels and stop short on long ones.
export const GROUND_Y = GAME_HEIGHT - 40;

export const GOOSE_PATROL_SPEED = 1.15;
export const CART_SPEED = 1.5; // radians/sec through the eased travel cycle

export const KEY_LEFT = ['ArrowLeft'];
export const KEY_RIGHT = ['ArrowRight'];
export const KEY_UP = ['ArrowUp'];
export const KEY_DOWN = ['ArrowDown'];
export const KEY_SHOOT = ['Space'];

// Retro-ish shared palette. Sprites reference these keys instead of raw
// hex so re-theming later is a one-line change.
export const PALETTE = {
  '.': null, // transparent
  k: '#1a1a1a', // outline black
  y: '#ffd23f', // duck yellow
  Y: '#ffe873', // duck yellow highlight
  o: '#ff8c1a', // bill / feet orange
  w: '#ffffff', // white (eyes, belly)
  r: '#e63946', // red (hat/propeller/accents)
  b: '#3a86ff', // blue (hat)
  g: '#2a9d3f', // scooter deck green
  s: '#8d99ae', // scooter steel grey
  G: '#4caf50', // frog green
  F: '#357a38', // frog dark green
  p: '#ffb6c1', // tongue pink
  R: '#b5482f', // barn red
  X: '#7a2e1c', // barn dark red trim
  c: '#f4e9d8', // farmhouse cream wall
  e: '#8a8f98', // roof grey
  h: '#e0b23a', // hay gold
  H: '#b3841f', // hay gold shadow
  n: '#8a5a3a', // dog fur brown
  N: '#5e3c22', // dog fur dark
  l: '#3fae4a', // grass green (light)
  m: '#2c7a34', // grass dark green
  t: '#7a5230', // dirt ground
  a: '#5ab6e8', // pond water
  A: '#3f8fc9', // pond water shadow
  P: '#e89ab0', // pig pink
  B: '#f5d142', // bee gold
  C: '#2b2b33', // crow black
  u: '#7b5ea7'  // dusk purple
};

// NOTE: every palette key MUST be exactly one character -- sprite grids
// below are read one character per cell.

