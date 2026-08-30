// All the non-interactive rendering: sky, sun, parallax scenery layers,
// pond water, ground/platform tiles, lily pads, and the goal flag.
// Kept separate from level.js (which just owns layout/collision data) so
// each file has one job.

import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from './constants.js';
import { THEMES } from './levels.js';
import { drawSprite, getSpriteCanvas, spriteSize } from './pixelArt.js';
import { CLOUD, FARMHOUSE, BARN, DOG, GOOSE, HAY_BALE, LILYPAD, GROUND_TILE } from './sprites.js';

const groundTileSize = spriteSize(GROUND_TILE);

function parallaxX(worldX, camera, factor) {
  return worldX - camera.x * factor;
}

/** Sky, sun/moon and (at night) stars, tinted by the level's theme. */
export function renderSky(ctx, theme = THEMES.day) {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, theme.skyTop);
  gradient.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (theme.stars) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 40; i++) {
      // Hashed scatter -- two plain linear sequences (i*97, i*53) produce a
      // visibly regular diagonal lattice rather than stars. Deterministic
      // either way, so the sky never flickers between frames.
      const h = Math.sin(i * 12.9898) * 43758.5453;
      const h2 = Math.sin(i * 78.233) * 12345.6789;
      const x = Math.floor(Math.abs(h % 1) * GAME_WIDTH);
      const y = Math.floor(Math.abs(h2 % 1) * 130);
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // Sun/moon in the corner -- doesn't scroll at all (infinitely far away).
  ctx.fillStyle = theme.sun;
  ctx.beginPath();
  ctx.arc(GAME_WIDTH - 55, 45, 22, 0, Math.PI * 2);
  ctx.fill();
}

export function renderBackground(ctx, camera, level, nowMs) {
  // Clouds -- furthest layer, slowest parallax.
  for (const cloud of level.clouds) {
    drawSprite(ctx, CLOUD, parallaxX(cloud.x, camera, 0.2), cloud.y, { scale: 3 });
  }

  // Farmhouse / barn silhouettes.
  for (const b of level.buildings) {
    const sprite = b.type === 'farmhouse' ? FARMHOUSE : BARN;
    drawSprite(ctx, sprite, parallaxX(b.x, camera, 0.5), b.y, { scale: 2 });
  }

  // Background dogs & geese -- gentle idle bob so they feel alive.
  for (const a of level.animals) {
    const bob = Math.sin(nowMs / 400 + a.seed * 10) * 2;
    const sprite = a.type === 'dog' ? DOG : GOOSE;
    drawSprite(ctx, sprite, parallaxX(a.x, camera, 0.75), a.y + bob, { scale: 2.5 });
  }

  // Pond water -- sits flush with the ground gaps, same parallax as terrain.
  const [waterTop, waterBottom] = level.theme.water;
  for (const pond of level.ponds) {
    const screenX = parallaxX(pond.x, camera, 1);
    if (screenX + pond.width < 0 || screenX > GAME_WIDTH) continue;
    const grad = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
    grad.addColorStop(0, waterTop);
    grad.addColorStop(1, waterBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(screenX, GROUND_Y, pond.width, GAME_HEIGHT - GROUND_Y);
    // A couple of animated ripple lines for a touch of life.
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const rippleY = GROUND_Y + 14 + i * 12 + Math.sin(nowMs / 500 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(screenX + 6, rippleY);
      ctx.lineTo(screenX + pond.width - 6, rippleY);
      ctx.stroke();
    }
  }
}

export function renderTerrain(ctx, camera, level) {
  for (const solid of level.solids) {
    // Carts render themselves (they move); skip them here so the generic
    // "thin solid = lily pad" rule below doesn't draw a pad under one.
    if (solid.isCart) continue;

    const screenX = solid.x - camera.x;
    if (screenX + solid.width < 0 || screenX > GAME_WIDTH) continue;

    // Lily pads and hay bales are drawn as themselves; wide ground strips
    // get tiled with the grass/dirt tile texture.
    if (solid.height <= 12) {
      drawSprite(ctx, LILYPAD, screenX - (spriteSize(LILYPAD).width - solid.width) / 2, solid.y, { scale: 3 });
      continue;
    }
    if (solid.width <= 40) {
      drawSprite(ctx, HAY_BALE, screenX, solid.y, { scale: 3 });
      continue;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(screenX, solid.y, solid.width, solid.height);
    ctx.clip();
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(screenX, solid.y, solid.width, solid.height);
    const tileCanvas = getSpriteCanvas(GROUND_TILE, 3, false);
    for (let tx = 0; tx < solid.width + groundTileSize.width; tx += groundTileSize.width) {
      ctx.drawImage(tileCanvas, screenX + tx, solid.y);
    }
    ctx.restore();
  }
}

/** Whole-scene colour wash for sunset/night. Drawn after the world, before
 * the HUD, so gameplay elements pick up the mood without the UI going dim. */
export function renderThemeOverlay(ctx, theme) {
  if (!theme.overlay) return;
  ctx.fillStyle = theme.overlay;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

export function renderGoal(ctx, camera, level) {
  const g = level.goal;
  const screenX = g.x - camera.x;
  if (screenX < -40 || screenX > GAME_WIDTH + 40) return;
  ctx.fillStyle = '#8a8f98';
  ctx.fillRect(screenX, g.y, 6, g.height);
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(screenX + 6, g.y);
  ctx.lineTo(screenX + 34, g.y + 10);
  ctx.lineTo(screenX + 6, g.y + 20);
  ctx.closePath();
  ctx.fill();
}
