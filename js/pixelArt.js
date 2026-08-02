// Tiny "pixel grid" sprite renderer. A sprite is just an array of equal
// length strings; each character maps to a PALETTE color, '.' is
// transparent. This gives genuine chunky retro-sprite look with zero
// external image assets, and caches each rendered frame to an offscreen
// canvas so we're not doing thousands of fillRects every animation frame.

import { PALETTE, PIXEL_SCALE } from './constants.js';

const cache = new Map();

function cacheKey(grid, scale, flip) {
  return grid.join('\n') + '|' + scale + '|' + flip;
}

function maxCols(grid) {
  let max = 0;
  for (const row of grid) max = Math.max(max, row.length);
  return max;
}

function renderToOffscreen(grid, scale, flip) {
  const rows = grid.length;
  const cols = maxCols(grid); // rows may be ragged; never clip the widest one
  const canvas = document.createElement('canvas');
  canvas.width = cols * scale;
  canvas.height = rows * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  for (let row = 0; row < rows; row++) {
    const line = grid[row];
    for (let col = 0; col < cols; col++) {
      const ch = line[col];
      if (ch === '.' || ch === undefined) continue;
      const color = PALETTE[ch];
      if (!color) continue;
      const drawCol = flip ? cols - 1 - col : col;
      ctx.fillStyle = color;
      ctx.fillRect(drawCol * scale, row * scale, scale, scale);
    }
  }
  return canvas;
}

/** Returns (and caches) an offscreen canvas for the given pixel grid. */
export function getSpriteCanvas(grid, scale = PIXEL_SCALE, flip = false) {
  const key = cacheKey(grid, scale, flip);
  let canvas = cache.get(key);
  if (!canvas) {
    canvas = renderToOffscreen(grid, scale, flip);
    cache.set(key, canvas);
  }
  return canvas;
}

/** Draws a pixel-grid sprite centered horizontally on (x, y-anchored at bottom). */
export function drawSprite(ctx, grid, x, y, { scale = PIXEL_SCALE, flip = false, alpha = 1 } = {}) {
  const canvas = getSpriteCanvas(grid, scale, flip);
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha;
  ctx.drawImage(canvas, Math.round(x), Math.round(y));
  ctx.globalAlpha = prevAlpha;
}

export function spriteSize(grid, scale = PIXEL_SCALE) {
  return { width: maxCols(grid) * scale, height: grid.length * scale };
}
