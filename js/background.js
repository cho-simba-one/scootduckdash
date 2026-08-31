// All the non-interactive rendering: sky, sun, parallax scenery layers,
// pond water, ground/platform tiles, lily pads, and the goal flag.
// Kept separate from level.js (which just owns layout/collision data) so
// each file has one job.

import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from './constants.js';
import { THEMES } from './levels.js';
import { drawSprite, getSpriteCanvas, spriteSize } from './pixelArt.js';
import { CLOUD, FARMHOUSE, BARN, DOG, GOOSE, HAY_BALE, LILYPAD, GROUND_TILE, CRATE } from './sprites.js';

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
  if (level.world === 'city') {
    renderCitySkyline(ctx, camera, level, nowMs);
  } else {
    for (const cloud of level.clouds) {
      drawSprite(ctx, CLOUD, parallaxX(cloud.x, camera, 0.2), cloud.y, { scale: 3 });
    }
    for (const b of level.buildings) {
      const sprite = b.type === 'farmhouse' ? FARMHOUSE : BARN;
      drawSprite(ctx, sprite, parallaxX(b.x, camera, 0.5), b.y, { scale: 2 });
    }
    for (const a of level.animals) {
      const bob = Math.sin(nowMs / 400 + a.seed * 10) * 2;
      const sprite = a.type === 'dog' ? DOG : GOOSE;
      drawSprite(ctx, sprite, parallaxX(a.x, camera, 0.75), a.y + bob, { scale: 2.5 });
    }
  }

  const [waterTop, waterBottom] = level.theme.water;
  for (const pond of level.ponds) {
    const screenX = parallaxX(pond.x, camera, 1);
    if (screenX + pond.width < 0 || screenX > GAME_WIDTH) continue;
    const grad = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
    grad.addColorStop(0, waterTop);
    grad.addColorStop(1, waterBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(screenX, GROUND_Y, pond.width, GAME_HEIGHT - GROUND_Y);
    if (level.world === 'city') {
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(screenX, GROUND_Y, 6, GAME_HEIGHT - GROUND_Y);
      ctx.fillRect(screenX + pond.width - 6, GROUND_Y, 6, GAME_HEIGHT - GROUND_Y);
      ctx.fillStyle = '#1a1a1a';
      for (let stripe = 10; stripe < pond.width - 10; stripe += 18) {
        ctx.fillRect(screenX + stripe, GROUND_Y + 4, 10, 8);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(screenX + stripe + 10, GROUND_Y + 4, 8, 8);
        ctx.fillStyle = '#1a1a1a';
      }
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      const steam = (nowMs / 350 + pond.x) % 36;
      ctx.fillRect(screenX + pond.width * 0.28, GROUND_Y - steam * 0.45, 7, steam * 0.45);
      ctx.fillRect(screenX + pond.width * 0.62, GROUND_Y - steam * 0.3, 5, steam * 0.3);
    } else {
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
}

function hash01(n) {
  const h = Math.sin(n * 12.9898) * 43758.5453;
  return Math.abs(h % 1);
}

/** Far skyline, mid towers, elevated rail, storefronts, traffic, weather. */
function renderCitySkyline(ctx, camera, level, nowMs) {
  const width = level.width;
  const theme = level.theme;
  const neon = theme === THEMES.cityNeon;
  const rain = theme === THEMES.cityRain;
  const night = !!theme.stars;
  const winOn = neon ? '#ff79c6' : rain ? '#c5d4e8' : night ? '#ffe08a' : '#fff4c2';
  const winOff = neon ? '#3a1450' : '#1a1a22';
  const farFill = neon ? '#1a0820' : rain ? '#2a3340' : '#141820';
  const farAlt = neon ? '#2a1038' : rain ? '#323c48' : '#1b2230';
  const midFill = neon ? '#3a1450' : rain ? '#3a4450' : '#2a3144';
  const midAlt = neon ? '#4a2068' : rain ? '#444e5a' : '#323a52';

  // Far haze blocks + rooftop tanks / antennas.
  for (let i = 0; i < width / 68 + 2; i++) {
    const h = 48 + hash01(i + 3) * 110;
    const x = parallaxX(i * 68, camera, 0.1);
    if (x + 70 < 0 || x > GAME_WIDTH) continue;
    ctx.fillStyle = i % 3 === 0 ? farFill : farAlt;
    ctx.fillRect(x, GROUND_Y - 8 - h, 60, h);
    if (hash01(i + 1) > 0.55) {
      ctx.fillStyle = '#3a3a44';
      ctx.fillRect(x + 18, GROUND_Y - 18 - h, 16, 10);
    }
    if (hash01(i + 2) > 0.4) {
      ctx.fillStyle = '#4a4a52';
      ctx.fillRect(x + 28, GROUND_Y - 8 - h - 16, 2, 16);
      const blink = Math.floor(nowMs / 420 + i) % 2 === 0;
      ctx.fillStyle = blink ? '#e63946' : '#4a1010';
      ctx.fillRect(x + 27, GROUND_Y - 8 - h - 20, 4, 4);
    }
  }

  // Mid towers with windows, fire escapes, AC boxes.
  for (let i = 0; i < width / 88 + 2; i++) {
    const h = 78 + hash01(i + 9) * 118;
    const bw = 46 + (i % 3) * 12;
    const x = parallaxX(i * 88, camera, 0.3);
    if (x + bw < 0 || x > GAME_WIDTH) continue;
    const top = GROUND_Y - 10 - h;
    ctx.fillStyle = hash01(i) > 0.5 ? midFill : midAlt;
    ctx.fillRect(x, top, bw, h);
    for (let wy = top + 6; wy < GROUND_Y - 22; wy += 8) {
      for (let wx = x + 4; wx < x + bw - 4; wx += 8) {
        const on = ((Math.floor(nowMs / 360) + Math.floor(wx) + Math.floor(wy / 2)) % 7) !== 0;
        ctx.fillStyle = on ? winOn : winOff;
        ctx.fillRect(wx, wy, 4, 5);
      }
    }
    if (i % 2 === 0) {
      ctx.strokeStyle = 'rgba(180,180,190,0.45)';
      ctx.lineWidth = 1;
      for (let fy = top + 20; fy < GROUND_Y - 28; fy += 16) {
        ctx.strokeRect(x + bw - 1, fy, 8, 12);
      }
    }
    if (hash01(i + 4) > 0.6) {
      ctx.fillStyle = '#6c757d';
      ctx.fillRect(x + 6, top + 10, 8, 6);
    }
  }

  // Elevated rail + looping train (screen-space so it always reads).
  ctx.fillStyle = '#2c2c34';
  ctx.fillRect(0, 58, GAME_WIDTH, 4);
  for (let p = -40; p < GAME_WIDTH + 40; p += 70) {
    const px = p - (camera.x * 0.35) % 70;
    ctx.fillStyle = '#3a3a44';
    ctx.fillRect(px + 24, 62, 4, 28);
  }
  const trainCycle = 11000;
  const tu = (nowMs % trainCycle) / trainCycle;
  const trainX = -160 + tu * (GAME_WIDTH + 320);
  ctx.fillStyle = neon ? '#3a1450' : '#2c2c34';
  ctx.fillRect(trainX, 42, 128, 18);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(trainX + 118, 46, 8, 8);
  for (let w = 8; w < 114; w += 20) {
    ctx.fillStyle = neon ? '#8be9fd' : '#8ecae6';
    ctx.fillRect(trainX + w, 46, 12, 8);
  }
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(trainX + 10, 58, 8, 4);
  ctx.fillRect(trainX + 108, 58, 8, 4);

  // Distant two-way traffic on a road deck.
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(0, GROUND_Y - 26, GAME_WIDTH, 10);
  ctx.fillStyle = 'rgba(241,196,15,0.55)';
  for (let d = 0; d < GAME_WIDTH; d += 16) ctx.fillRect(d, GROUND_Y - 22, 8, 2);
  for (let i = 0; i < 6; i++) {
    const speed = 32 + i * 14;
    const dir = i % 2 === 0 ? 1 : -1;
    const span = GAME_WIDTH + 80;
    const cx = dir > 0
      ? ((nowMs / speed) + i * 95) % span - 50
      : span - ((nowMs / speed) + i * 95) % span - 50;
    const bus = i === 2;
    ctx.fillStyle = bus ? '#f4a261' : (i % 2 ? '#e63946' : '#3a86ff');
    ctx.fillRect(cx, GROUND_Y - 34, bus ? 36 : 22, 10);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(dir > 0 ? cx + (bus ? 32 : 18) : cx, GROUND_Y - 32, 3, 3);
  }

  // Helicopter, slow and high.
  const heliX = ((nowMs / 28) % (GAME_WIDTH + 80)) - 40;
  const heliY = 18 + Math.sin(nowMs / 500) * 4;
  ctx.fillStyle = '#4a4a52';
  ctx.fillRect(heliX, heliY, 18, 6);
  ctx.fillRect(heliX + 16, heliY + 2, 10, 2);
  ctx.strokeStyle = 'rgba(220,220,230,0.7)';
  ctx.lineWidth = 1;
  const rotor = Math.sin(nowMs / 40) * 12;
  ctx.beginPath();
  ctx.moveTo(heliX + 8 - rotor, heliY - 2);
  ctx.lineTo(heliX + 8 + rotor, heliY - 2);
  ctx.stroke();

  // Near storefronts with awnings and flickering signs.
  for (let i = 0; i < width / 140 + 1; i++) {
    const x = parallaxX(20 + i * 140, camera, 0.62);
    if (x + 70 < 0 || x > GAME_WIDTH) continue;
    const shopH = 42 + (i % 3) * 8;
    ctx.fillStyle = hash01(i + 6) > 0.5 ? '#3d3d48' : '#2c2c36';
    ctx.fillRect(x, GROUND_Y - shopH, 64, shopH);
    const awning = neon
      ? (i % 2 ? '#ff4fd0' : '#8be9fd')
      : ['#e63946', '#3a86ff', '#f4a261', '#2a9d3f'][i % 4];
    ctx.fillStyle = awning;
    ctx.fillRect(x - 2, GROUND_Y - shopH, 68, 8);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 24, GROUND_Y - 22, 12, 22);
    const signOn = ((Math.floor(nowMs / 280) + i) % 5) !== 1;
    ctx.fillStyle = signOn ? awning : '#1a1a1a';
    ctx.fillRect(x + 8, GROUND_Y - shopH + 14, 20, 8);
    ctx.fillStyle = night || neon ? winOn : '#8ecae6';
    ctx.fillRect(x + 40, GROUND_Y - shopH + 16, 16, 14);
  }

  // Billboard that cycles color.
  const billX = parallaxX(Math.floor(camera.x * 0.5 / 400) * 400 + 180, camera, 0.5);
  if (billX > -80 && billX < GAME_WIDTH) {
    const pulse = 0.55 + Math.sin(nowMs / 220) * 0.35;
    ctx.fillStyle = neon ? `rgba(255,79,208,${pulse})` : `rgba(255,210,63,${pulse})`;
    ctx.fillRect(billX, 70, 72, 28);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(billX + 34, 98, 4, 36);
  }

  // Street lamps + traffic-light cycle.
  for (let i = 0; i < width / 160 + 1; i++) {
    const x = parallaxX(40 + i * 160, camera, 0.72);
    if (x < -10 || x > GAME_WIDTH + 10) continue;
    ctx.fillStyle = '#4a4a52';
    ctx.fillRect(x, GROUND_Y - 70, 4, 70);
    ctx.fillStyle = rain ? 'rgba(180,200,230,0.4)' : 'rgba(255, 220, 120, 0.55)';
    ctx.beginPath();
    ctx.arc(x + 2, GROUND_Y - 72, 7, 0, Math.PI * 2);
    ctx.fill();
    if (i % 3 === 0) {
      const phase = Math.floor(nowMs / 900) % 3;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x + 6, GROUND_Y - 64, 8, 20);
      ctx.fillStyle = phase === 0 ? '#e63946' : '#4a1010';
      ctx.fillRect(x + 7, GROUND_Y - 62, 6, 5);
      ctx.fillStyle = phase === 1 ? '#f1c40f' : '#4a4010';
      ctx.fillRect(x + 7, GROUND_Y - 55, 6, 5);
      ctx.fillStyle = phase === 2 ? '#2a9d3f' : '#0e2a12';
      ctx.fillRect(x + 7, GROUND_Y - 48, 6, 5);
    }
  }

  // Decorative walkers on the near sidewalk.
  for (let i = 0; i < 4; i++) {
    const walk = ((nowMs / (18 + i * 3)) + i * 140) % (GAME_WIDTH + 30) - 20;
    const bob = Math.abs(Math.sin(nowMs / 180 + i)) * 2;
    ctx.fillStyle = i % 2 ? '#4a4a52' : '#6c757d';
    ctx.fillRect(walk, GROUND_Y - 18 - bob, 5, 12);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(walk + 1, GROUND_Y - 22 - bob, 4, 4);
  }

  if (rain) {
    ctx.strokeStyle = 'rgba(200,220,255,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 42; i++) {
      const rx = ((nowMs * 0.45 + i * 97) % (GAME_WIDTH + 16)) - 8;
      const ry = ((nowMs * 0.95 + i * 53) % (GAME_HEIGHT + 16)) - 8;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 2, ry + 9);
      ctx.stroke();
    }
  }
}

export function renderTerrain(ctx, camera, level, nowMs = 0) {
  const city = level.world === 'city';
  for (const solid of level.solids) {
    // Carts render themselves (they move); skip them here so the generic
    // "thin solid = lily pad" rule below doesn't draw a pad under one.
    if (solid.isCart) continue;

    const screenX = solid.x - camera.x;
    if (screenX + solid.width < 0 || screenX > GAME_WIDTH) continue;

    if (solid.isBeam) {
      ctx.fillStyle = city ? '#6a6a74' : '#5e3c22';
      ctx.fillRect(screenX, solid.y, solid.width, solid.height);
      ctx.fillStyle = city ? '#f1c40f' : '#e0b23a';
      ctx.fillRect(screenX, solid.y, solid.width, 3);
      continue;
    }

    // Lily pads and hay bales are drawn as themselves; wide ground strips
    // get tiled with the grass/dirt tile texture.
    if (solid.height <= 12) {
      if (city) {
        ctx.fillStyle = '#5a5a64';
        ctx.fillRect(screenX, solid.y, solid.width, 8);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(screenX + 2, solid.y, solid.width - 4, 2);
      } else {
        drawSprite(ctx, LILYPAD, screenX - (spriteSize(LILYPAD).width - solid.width) / 2, solid.y, { scale: 3 });
      }
      continue;
    }
    if (solid.width <= 40) {
      drawSprite(ctx, city ? CRATE : HAY_BALE, screenX, solid.y, { scale: 3 });
      continue;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(screenX, solid.y, solid.width, solid.height);
    ctx.clip();
    if (city) {
      ctx.fillStyle = '#3a3a44';
      ctx.fillRect(screenX, solid.y, solid.width, solid.height);
      ctx.fillStyle = '#5a5a64';
      ctx.fillRect(screenX, solid.y, solid.width, 6);
      ctx.fillStyle = '#2a2a32';
      ctx.fillRect(screenX, solid.y + 6, solid.width, 2);
      if (solid.belt) {
        const shift = ((nowMs / 40) * solid.belt) % 14;
        for (let rx = -14 + shift; rx < solid.width; rx += 14) {
          ctx.fillStyle = '#4a4a52';
          ctx.fillRect(screenX + rx, solid.y + 8, 10, 10);
          ctx.fillStyle = '#f1c40f';
          ctx.fillRect(screenX + rx + 2, solid.y + 11, 6, 3);
        }
      } else {
        ctx.fillStyle = 'rgba(241,196,15,0.45)';
        for (let d = 12; d < solid.width - 8; d += 22) {
          ctx.fillRect(screenX + d, solid.y + 18, 10, 2);
        }
      }
    } else {
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(screenX, solid.y, solid.width, solid.height);
      const tileCanvas = getSpriteCanvas(GROUND_TILE, 3, false);
      for (let tx = 0; tx < solid.width + groundTileSize.width; tx += groundTileSize.width) {
        ctx.drawImage(tileCanvas, screenX + tx, solid.y);
      }
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
  if (level.world === 'city') {
    ctx.fillStyle = '#2c2c36';
    ctx.fillRect(screenX - 8, g.y + 20, 36, g.height - 20);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(screenX, g.y + 48, 18, 42);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(screenX - 10, g.y + 16, 40, 8);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(screenX + 4, g.y + 4, 12, 12);
    return;
  }
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
