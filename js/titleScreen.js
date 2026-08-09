// Title screen: farm backdrop, bobbing hero duck, and a mouse-clickable
// START button. No keyboard needed here -- purely mouse-driven per spec.

import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { renderSky } from './background.js';
import { LEVEL_COUNT } from './level.js';
import { drawSprite } from './pixelArt.js';
import { DUCK_IDLE, CLOUD, FARMHOUSE, BARN } from './sprites.js';

export const START_BUTTON = { x: GAME_WIDTH / 2 - 70, y: 185, width: 140, height: 40 };

let hovering = false;

export function setHover(mx, my) {
  hovering = isInsideButton(mx, my);
  return hovering;
}

export function isInsideButton(mx, my) {
  const b = START_BUTTON;
  return mx >= b.x && mx <= b.x + b.width && my >= b.y && my <= b.y + b.height;
}

function fitFontSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px 'Press Start 2P', monospace`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `${size}px 'Press Start 2P', monospace`;
  }
  return size;
}

export function render(ctx, nowMs) {
  renderSky(ctx);
  drawSprite(ctx, CLOUD, 60 - (nowMs / 60) % 600, 30, { scale: 3 });
  drawSprite(ctx, CLOUD, 340 - (nowMs / 90) % 600, 55, { scale: 3 });
  drawSprite(ctx, FARMHOUSE, 40, GAME_HEIGHT - 155, { scale: 2 });
  drawSprite(ctx, BARN, GAME_WIDTH - 220, GAME_HEIGHT - 145, { scale: 2 });

  ctx.fillStyle = '#3fae4a';
  ctx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);

  // Bobbing hero duck, front and center.
  const bob = Math.sin(nowMs / 300) * 6;
  drawSprite(ctx, DUCK_IDLE, GAME_WIDTH / 2 - 30, GAME_HEIGHT - 100 + bob, { scale: 3 });

  // Title text with a chunky drop-shadow for that retro-cartridge look.
  // Auto-shrinks to fit so a slow web-font load (falls back to monospace,
  // which measures differently) can never clip it off-canvas.
  ctx.textAlign = 'center';
  const title = 'DUCK SCOOTER DASH';
  const titleSize = fitFontSize(ctx, title, GAME_WIDTH - 24, 30);
  ctx.font = `${titleSize}px 'Press Start 2P', monospace`;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText(title, GAME_WIDTH / 2 + 3, 73);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(title, GAME_WIDTH / 2, 70);

  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText(`${LEVEL_COUNT} Levels`, GAME_WIDTH / 2, 100);

  // START button.
  const b = START_BUTTON;
  ctx.fillStyle = hovering ? '#ffe873' : '#ffd23f';
  ctx.fillRect(b.x, b.y, b.width, b.height);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x, b.y, b.width, b.height);
  ctx.fillStyle = '#1a1a1a';
  ctx.font = "16px 'Press Start 2P', monospace";
  ctx.fillText('START', GAME_WIDTH / 2, b.y + 26);

  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillStyle = '#2a2a2a';
  ctx.fillText('Arrows to move / jump / duck  -  Space to shoot  -  M mutes', GAME_WIDTH / 2, GAME_HEIGHT - 14);
  ctx.textAlign = 'left';
}
