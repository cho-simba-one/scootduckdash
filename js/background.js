// All the non-interactive rendering: sky, sun, parallax scenery layers,
// pond water, ground/platform tiles, lily pads, and the goal flag.
// Kept separate from level.js (which just owns layout/collision data) so
// each file has one job.

import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from './constants.js';
import { drawSprite, getSpriteCanvas, spriteSize } from './pixelArt.js';
import { CLOUD, FARMHOUSE, BARN, DOG, GOOSE, HAY_BALE, LILYPAD, GROUND_TILE } from './sprites.js';

const groundTileSize = spriteSize(GROUND_TILE);

function parallaxX(worldX, camera, factor) {
  return worldX - camera.x * factor;
}

export function renderSky(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, '#7ec8f2');
  gradient.addColorStop(1, '#cdeeff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Simple sun in the corner -- doesn't scroll at all (infinitely far away).
  ctx.fillStyle = '#fff4cc';
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
  for (const pond of level.ponds) {
    const screenX = parallaxX(pond.x, camera, 1);
    if (screenX + pond.width < 0 || screenX > GAME_WIDTH) continue;
    const grad = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#5ab6e8');
    grad.addColorStop(1, '#3f8fc9');
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
