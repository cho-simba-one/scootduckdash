// CONTROLS overlay: a retro SNES-style pad diagram plus keyboard and touch
// mappings. Pure rendering -- game.js owns the toggle state (title button,
// the C key, or a gamepad's SELECT button).

import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { touchMode, isFullscreen, fullscreenSupported } from './settings.js';

export const CONTROLS_BUTTON = { x: GAME_WIDTH / 2 - 70, y: 232, width: 140, height: 20 };

// Tappable setting rows inside the overlay. game.js maps a hit to the
// matching action; the labels are drawn from live settings state.
const ROWS = {
  fullscreen: { x: 60, y: 198, width: 170, height: 22 },
  touch: { x: 250, y: 198, width: 170, height: 22 },
};

/** Which setting row (if any) is under the pointer: 'fullscreen'|'touch'|null. */
export function rowAt(mx, my) {
  for (const [name, r] of Object.entries(ROWS)) {
    if (mx >= r.x && mx <= r.x + r.width && my >= r.y && my <= r.y + r.height) return name;
  }
  return null;
}

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

export function render(ctx, paused = false) {
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23f';
  ctx.font = "14px 'Press Start 2P', monospace";
  ctx.fillText(paused ? 'PAUSED' : 'CONTROLS', GAME_WIDTH / 2, 28);

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
  ctx.fillText('B JUMP - TAP AGAIN IN AIR = TAIL WHIP x3', GAME_WIDTH / 2, 166);
  ctx.fillStyle = '#8ecae6';
  ctx.fillText('A DUCK   Y/X SHOOT   START GO   SELECT MENU', GAME_WIDTH / 2, 177);
  ctx.fillText('KEYS: ARROWS MOVE  UP UP = WHIP  SPACE SHOOT', GAME_WIDTH / 2, 188);

  // --- Tappable settings ----------------------------------------------
  settingRow(ctx, ROWS.fullscreen, 'FULLSCREEN', fullscreenSupported()
    ? (isFullscreen() ? 'ON' : 'OFF')
    : 'N/A', 'F');
  settingRow(ctx, ROWS.touch, 'TOUCH PADS', touchMode().toUpperCase(), 'T');

  ctx.textAlign = 'center';
  ctx.fillStyle = '#9aa0a8';
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.fillText('TOUCH PADS: AUTO SHOWS THEM ON TOUCHSCREENS ONLY', GAME_WIDTH / 2, 234);
  ctx.fillText('START OR SELECT ON A PAD  -  SNES LAYOUT SHOWN', GAME_WIDTH / 2, 246);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText('TAP ELSEWHERE, C, OR SELECT TO CLOSE', GAME_WIDTH / 2, 258);
  ctx.textAlign = 'left';
}

/** One tappable "LABEL  [VALUE]  key" row. */
function settingRow(ctx, r, label, value, key) {
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(r.x, r.y, r.width, r.height);
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x, r.y, r.width, r.height);

  ctx.textAlign = 'left';
  ctx.font = "7px 'Press Start 2P', monospace";
  ctx.fillStyle = '#cdeeff';
  ctx.fillText(label, r.x + 6, r.y + 14);
  ctx.textAlign = 'right';
  ctx.fillStyle = value === 'OFF' || value === 'N/A' ? '#9aa0a8' : '#ffd23f';
  ctx.fillText(value, r.x + r.width - 16, r.y + 14);
  ctx.fillStyle = '#63b56b';
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.fillText(key, r.x + r.width - 4, r.y + 14);
  ctx.textAlign = 'left';
}
