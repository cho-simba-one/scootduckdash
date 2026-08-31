// CONTROLS overlay: a retro SNES-style pad diagram plus keyboard and touch
// mappings. Pure rendering -- game.js owns the toggle state (title button,
// the C key, or a gamepad's SELECT button).

import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

export const CONTROLS_BUTTON = { x: GAME_WIDTH / 2 - 70, y: 232, width: 140, height: 20 };

export function isInsideControlsButton(mx, my) {
  const b = CONTROLS_BUTTON;
  return mx >= b.x && mx <= b.x + b.width && my >= b.y && my <= b.y + b.height;
}

/** Small button drawn on the title screen under START. */
export function renderButton(ctx, hover) {
  const b = CONTROLS_BUTTON;
  ctx.fillStyle = hover ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.22)';
  ctx.fillRect(b.x, b.y, b.width, b.height);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x, b.y, b.width, b.height);
  ctx.fillStyle = '#1a1a1a';
  ctx.font = "8px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.fillText('CONTROLS', GAME_WIDTH / 2, b.y + 14);
  ctx.textAlign = 'left';
}

function pill(ctx, x, y, w, h, label) {
  ctx.fillStyle = '#23232b';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#cdeeff';
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h + 9);
  ctx.textAlign = 'left';
}

function faceButton(ctx, cx, cy, color, letter) {
  ctx.fillStyle = '#23232b';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.font = "8px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.fillText(letter, cx, cy + 4);
  ctx.textAlign = 'left';
}

export function render(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23f';
  ctx.font = "14px 'Press Start 2P', monospace";
  ctx.fillText('CONTROLS', GAME_WIDTH / 2, 28);

  // --- Pad body -------------------------------------------------------
  const padX = 90;
  const padY = 48;
  const padW = 300;
  const padH = 104;
  ctx.fillStyle = '#3b3b45';
  ctx.fillRect(padX, padY, padW, padH);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 3;
  ctx.strokeRect(padX, padY, padW, padH);

  // D-pad (left side).
  const dx = padX + 62;
  const dy = padY + 52;
  ctx.fillStyle = '#23232b';
  ctx.fillRect(dx - 27, dy - 9, 54, 18);
  ctx.fillRect(dx - 9, dy - 27, 18, 54);
  ctx.fillStyle = '#cdeeff';
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.fillText('MOVE', dx, dy + 40);

  // START / SELECT pills (center).
  pill(ctx, padX + 118, padY + 62, 30, 9, 'SELECT');
  pill(ctx, padX + 156, padY + 62, 30, 9, 'START');

  // Face buttons, SNES layout: X top, A right, B bottom, Y left.
  const fx = padX + 240;
  const fy = padY + 52;
  faceButton(ctx, fx, fy - 24, '#5a8fd6', 'X');
  faceButton(ctx, fx + 24, fy, '#e05a5a', 'A');
  faceButton(ctx, fx, fy + 24, '#f2c14e', 'B');
  faceButton(ctx, fx - 24, fy, '#63b56b', 'Y');

  // --- Mapping text ---------------------------------------------------
  ctx.font = "8px 'Press Start 2P', monospace";
  ctx.fillStyle = '#ffffff';
  ctx.fillText('B JUMP   A DUCK + TAIL WHIP   Y/X SHOOT', GAME_WIDTH / 2, 178);
  ctx.fillText('START GO   SELECT THIS SCREEN', GAME_WIDTH / 2, 194);
  ctx.fillStyle = '#8ecae6';
  ctx.fillText('KEYS: ARROWS MOVE+JUMP+DUCK  SPACE SHOOT', GAME_WIDTH / 2, 216);
  ctx.fillText('M MUTE   C THIS SCREEN', GAME_WIDTH / 2, 230);
  ctx.fillStyle = '#9aa0a8';
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.fillText('PHONE: TOUCH PADS APPEAR IN PLAY  -  SNES LAYOUT SHOWN', GAME_WIDTH / 2, 246);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText('TAP, C, OR SELECT TO CLOSE', GAME_WIDTH / 2, 260);
  ctx.textAlign = 'left';
}
