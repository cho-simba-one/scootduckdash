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

function parallaxY(worldY, camera, factor) {
  return worldY - camera.y * factor;
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
  } else if (level.world === 'travel') {
    renderTravelLandmarks(ctx, camera, level, nowMs);
  } else if (level.world === 'mill') {
    renderMillSkyline(ctx, camera, level, nowMs);
  } else {
    for (const cloud of level.clouds) {
      drawSprite(ctx, CLOUD, parallaxX(cloud.x, camera, 0.2), parallaxY(cloud.y, camera, 0.15), { scale: 3 });
    }
    for (const b of level.buildings) {
      const sprite = b.type === 'farmhouse' ? FARMHOUSE : BARN;
      drawSprite(ctx, sprite, parallaxX(b.x, camera, 0.5), parallaxY(b.y, camera, 0.35), { scale: 2 });
    }
    for (const a of level.animals) {
      const bob = Math.sin(nowMs / 400 + a.seed * 10) * 2;
      const sprite = a.type === 'dog' ? DOG : GOOSE;
      drawSprite(ctx, sprite, parallaxX(a.x, camera, 0.75), parallaxY(a.y + bob, camera, 0.55), { scale: 2.5 });
    }
  }

  const [waterTop, waterBottom] = level.theme.water;
  for (const pond of level.ponds) {
    const screenX = parallaxX(pond.x, camera, 1);
    if (screenX + pond.width < 0 || screenX > GAME_WIDTH) continue;
    const gy = GROUND_Y - camera.y;
    if (gy >= GAME_HEIGHT) continue;
    const gh = GAME_HEIGHT - gy;
    const grad = ctx.createLinearGradient(0, gy, 0, GAME_HEIGHT);
    grad.addColorStop(0, waterTop);
    grad.addColorStop(1, waterBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(screenX, gy, pond.width, gh);
    if (level.world === 'city') {
      ctx.fillStyle = '#111111';
      ctx.fillRect(screenX, gy, pond.width, 10);
      fillCaution(ctx, screenX, gy, 10, gh);
      fillCaution(ctx, screenX + pond.width - 10, gy, 10, gh);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(screenX + 10, gy, pond.width - 20, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      const steam = (nowMs / 350 + pond.x) % 36;
      ctx.fillRect(screenX + pond.width * 0.28, gy - steam * 0.45, 7, steam * 0.45);
      ctx.fillRect(screenX + pond.width * 0.62, gy - steam * 0.3, 5, steam * 0.3);
    } else if (level.world === 'travel') {
      fillSandstone(ctx, screenX, gy, 8, gh);
      fillSandstone(ctx, screenX + pond.width - 8, gy, 8, gh);
    } else if (level.world === 'mill') {
      fillMillWood(ctx, screenX, gy, 8, gh);
      fillMillWood(ctx, screenX + pond.width - 8, gy, 8, gh);
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const rippleY = gy + 14 + i * 12 + Math.sin(nowMs / 500 + i) * 2;
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

function fillSandstone(ctx, x, y, w, h) {
  ctx.fillStyle = '#111111';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#f3d39a';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#c48a3a';
  ctx.fillRect(x, y + Math.max(2, h - 3), w, Math.min(3, h));
}

function fillMillWood(ctx, x, y, w, h) {
  ctx.fillStyle = '#111111';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#8a6230';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#c48a3a';
  ctx.fillRect(x, y, w, Math.min(4, h));
  ctx.fillStyle = '#5c3a18';
  for (let d = 8; d < h - 4; d += 8) {
    ctx.fillRect(x, y + d, w, 1);
  }
}

function renderMillSkyline(ctx, camera, level, nowMs) {
  const horizon = GROUND_Y - 86 - camera.y * 0.25;
  const width = level.width;
  // Far silos.
  for (let i = 0; i < width / 280 + 2; i++) {
    const x = parallaxX(40 + i * 280, camera, 0.35);
    if (x < -50 || x > GAME_WIDTH + 50) continue;
    const h = 70 + (i % 3) * 18;
    ctx.fillStyle = '#6a4a28';
    ctx.fillRect(x, horizon - h, 28, h);
    ctx.fillStyle = '#c48a3a';
    ctx.fillRect(x, horizon - h, 28, 6);
    ctx.beginPath();
    ctx.ellipse(x + 14, horizon - h, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2810';
    ctx.fillRect(x + 11, horizon - h - 18, 6, 18);
  }
  // Mill house with loft window.
  for (let i = 0; i < width / 520 + 1; i++) {
    const x = parallaxX(160 + i * 520, camera, 0.5);
    if (x < -90 || x > GAME_WIDTH + 90) continue;
    ctx.fillStyle = '#5a3a1c';
    ctx.fillRect(x, horizon - 62, 86, 62);
    ctx.fillStyle = '#3a2410';
    ctx.beginPath();
    ctx.moveTo(x - 6, horizon - 62);
    ctx.lineTo(x + 43, horizon - 92);
    ctx.lineTo(x + 92, horizon - 62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe6a0';
    ctx.fillRect(x + 12, horizon - 48, 14, 16);
    ctx.fillRect(x + 58, horizon - 48, 14, 16);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x + 36, horizon - 78, 12, 12);
  }
  // Waterwheel.
  const wheelX = parallaxX(Math.floor(camera.x * 0.45 / 640) * 640 + 420, camera, 0.45);
  if (wheelX > -40 && wheelX < GAME_WIDTH + 40) {
    const cx = wheelX + 18;
    const cy = horizon - 8;
    ctx.strokeStyle = '#3a2410';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(nowMs / 700);
    ctx.strokeStyle = '#8a6230';
    ctx.lineWidth = 2;
    for (let s = 0; s < 6; s++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(20, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
  // Chaff.
  ctx.fillStyle = 'rgba(196, 138, 58, 0.35)';
  for (let i = 0; i < 18; i++) {
    const fx = ((nowMs * 0.04 + i * 73) % (GAME_WIDTH + 20)) - 10;
    const fy = 20 + (i * 17 + nowMs * 0.02) % Math.max(8, horizon);
    ctx.fillRect(fx, fy, 2, 3);
  }
}

function renderTravelLandmarks(ctx, camera, level, nowMs) {
  const mark = level.landmark || 'giza';
  const horizon = GROUND_Y - 86;
  if (mark === 'giza' || mark === 'sphinx') {
    for (let i = 0; i < 8; i++) {
      const x = parallaxX(80 + i * 220, camera, 0.18);
      const h = 50 + (i % 3) * 22;
      ctx.fillStyle = i % 2 ? '#e0b56a' : '#d4a04a';
      ctx.beginPath();
      ctx.moveTo(x, horizon);
      ctx.lineTo(x + 40, horizon - h);
      ctx.lineTo(x + 80, horizon);
      ctx.closePath();
      ctx.fill();
    }
    if (mark === 'sphinx') {
      const x = parallaxX(300, camera, 0.28);
      ctx.fillStyle = '#c99548';
      ctx.fillRect(x, horizon - 36, 70, 36);
      ctx.fillRect(x + 18, horizon - 52, 34, 18);
    }
  } else if (mark === 'nile') {
    for (let i = 0; i < 6; i++) {
      const x = parallaxX(40 + i * 200, camera, 0.2);
      ctx.fillStyle = '#2f6b3a';
      ctx.fillRect(x + 10, horizon - 28, 6, 28);
      ctx.fillStyle = '#3fae4a';
      ctx.beginPath();
      ctx.ellipse(x + 13, horizon - 34, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (mark === 'canyon' || mark === 'canyonFloor') {
    for (let i = 0; i < 10; i++) {
      const x = parallaxX(i * 90, camera, 0.16);
      const h = 40 + hash01(i + 2) * 70;
      ctx.fillStyle = i % 3 === 0 ? '#a33b1a' : '#c45c26';
      ctx.fillRect(x, horizon - h, 80, h);
      ctx.fillStyle = '#e08a4a';
      ctx.fillRect(x, horizon - h + 12, 80, 6);
    }
  } else if (mark === 'paris') {
    const x = parallaxX(200, camera, 0.22);
    ctx.strokeStyle = '#2a2a34';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, horizon);
    ctx.lineTo(x + 30, horizon - 90);
    ctx.lineTo(x + 60, horizon);
    ctx.moveTo(x + 8, horizon - 30);
    ctx.lineTo(x + 52, horizon - 30);
    ctx.stroke();
  } else if (mark === 'wall') {
    for (let i = 0; i < 14; i++) {
      const x = parallaxX(i * 50, camera, 0.2);
      ctx.fillStyle = '#8a8f80';
      ctx.fillRect(x, horizon - 34, 48, 34);
      ctx.fillRect(x + 4, horizon - 42, 12, 8);
      ctx.fillRect(x + 28, horizon - 42, 12, 8);
    }
  } else if (mark === 'rio') {
    for (let i = 0; i < 7; i++) {
      const x = parallaxX(i * 110, camera, 0.18);
      const h = 36 + hash01(i) * 50;
      ctx.fillStyle = '#2f8f4a';
      ctx.beginPath();
      ctx.moveTo(x, horizon);
      ctx.lineTo(x + 40, horizon - h);
      ctx.lineTo(x + 80, horizon);
      ctx.fill();
    }
    const sx = parallaxX(240, camera, 0.25);
    ctx.fillStyle = '#f4f0e0';
    ctx.fillRect(sx + 18, horizon - 64, 8, 40);
    ctx.fillRect(sx, horizon - 50, 44, 8);
  } else if (mark === 'liberty') {
    const x = parallaxX(180, camera, 0.24);
    ctx.fillStyle = '#3fae8a';
    ctx.fillRect(x + 16, horizon - 70, 12, 70);
    ctx.fillRect(x, horizon - 48, 44, 8);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x + 40, horizon - 78, 6, 14);
  } else {
    // Finale: a few silhouettes from the trip.
    const x1 = parallaxX(80, camera, 0.16);
    ctx.fillStyle = '#e0b56a';
    ctx.beginPath();
    ctx.moveTo(x1, horizon);
    ctx.lineTo(x1 + 36, horizon - 60);
    ctx.lineTo(x1 + 72, horizon);
    ctx.fill();
    const x2 = parallaxX(260, camera, 0.18);
    ctx.fillStyle = '#c45c26';
    ctx.fillRect(x2, horizon - 48, 64, 48);
    const x3 = parallaxX(430, camera, 0.2);
    ctx.strokeStyle = '#2a2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x3, horizon);
    ctx.lineTo(x3 + 22, horizon - 70);
    ctx.lineTo(x3 + 44, horizon);
    ctx.stroke();
  }

  const sunX = GAME_WIDTH - 60;
  ctx.fillStyle = level.theme.sun;
  ctx.beginPath();
  ctx.arc(sunX, 42, 18, 0, Math.PI * 2);
  ctx.fill();

  if (level.theme.stars) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) * GAME_WIDTH);
      const y = Math.floor(Math.abs((Math.sin(i * 78.233) * 12345.6789) % 1) * 110);
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const hawkX = ((nowMs / 24) % (GAME_WIDTH + 80)) - 40;
  ctx.fillStyle = '#5e3c22';
  ctx.fillRect(hawkX, 28 + Math.sin(nowMs / 400) * 4, 16, 5);
}

/** Yellow/black caution fill -- city platforms have to read against the skyline. */
function fillCaution(ctx, x, y, w, h) {
  ctx.fillStyle = '#111111';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#111111';
  for (let i = 0; i < w; i += 10) ctx.fillRect(x + i, y, 5, h);
}

/** Far skyline lives ABOVE the play band so boards/cabs aren't camouflage. */
function renderCitySkyline(ctx, camera, level, nowMs) {
  const width = level.width;
  const theme = level.theme;
  const neon = theme === THEMES.cityNeon;
  const rain = theme === THEMES.cityRain;
  const night = !!theme.stars;
  const horizon = GROUND_Y - 88;
  const winOn = neon ? '#ff79c6' : rain ? '#c5d4e8' : night ? '#ffe08a' : '#fff4c2';
  const winOff = neon ? '#3a1450' : '#1a1a22';
  const farFill = neon ? '#1a0820' : rain ? '#2a3340' : '#141820';
  const farAlt = neon ? '#2a1038' : rain ? '#323c48' : '#1b2230';
  const midFill = neon ? '#3a1450' : rain ? '#3a4450' : '#2a3144';
  const midAlt = neon ? '#4a2068' : rain ? '#444e5a' : '#323a52';

  for (let i = 0; i < width / 68 + 2; i++) {
    const h = 40 + hash01(i + 3) * 70;
    const x = parallaxX(i * 68, camera, 0.1);
    if (x + 70 < 0 || x > GAME_WIDTH) continue;
    ctx.fillStyle = i % 3 === 0 ? farFill : farAlt;
    ctx.fillRect(x, horizon - h, 60, h);
    if (hash01(i + 2) > 0.4) {
      ctx.fillStyle = '#4a4a52';
      ctx.fillRect(x + 28, horizon - h - 16, 2, 16);
      const blink = Math.floor(nowMs / 420 + i) % 2 === 0;
      ctx.fillStyle = blink ? '#e63946' : '#4a1010';
      ctx.fillRect(x + 27, horizon - h - 20, 4, 4);
    }
  }

  for (let i = 0; i < width / 88 + 2; i++) {
    const h = 54 + hash01(i + 9) * 72;
    const bw = 46 + (i % 3) * 12;
    const x = parallaxX(i * 88, camera, 0.3);
    if (x + bw < 0 || x > GAME_WIDTH) continue;
    const top = horizon - h;
    ctx.fillStyle = hash01(i) > 0.5 ? midFill : midAlt;
    ctx.fillRect(x, top, bw, h);
    for (let wy = top + 6; wy < horizon - 8; wy += 8) {
      for (let wx = x + 4; wx < x + bw - 4; wx += 8) {
        const on = ((Math.floor(nowMs / 360) + Math.floor(wx) + Math.floor(wy / 2)) % 7) !== 0;
        ctx.fillStyle = on ? winOn : winOff;
        ctx.fillRect(wx, wy, 4, 5);
      }
    }
  }

  ctx.fillStyle = '#2c2c34';
  ctx.fillRect(0, 58, GAME_WIDTH, 4);
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

  // Distant traffic on the horizon road -- never at duck height.
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(0, horizon - 8, GAME_WIDTH, 6);
  for (let i = 0; i < 5; i++) {
    const speed = 40 + i * 16;
    const cx = ((nowMs / speed) + i * 110) % (GAME_WIDTH + 50) - 30;
    ctx.fillStyle = i % 2 ? '#e63946' : '#3a86ff';
    ctx.fillRect(cx, horizon - 14, 16, 6);
  }

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

  const billX = parallaxX(Math.floor(camera.x * 0.5 / 400) * 400 + 180, camera, 0.5);
  if (billX > -80 && billX < GAME_WIDTH) {
    const pulse = 0.55 + Math.sin(nowMs / 220) * 0.35;
    ctx.fillStyle = neon ? `rgba(255,79,208,${pulse})` : `rgba(255,210,63,${pulse})`;
    ctx.fillRect(billX, 62, 72, 22);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(billX + 34, 84, 4, horizon - 84);
  }

  // Hanging lamps only -- no poles through the play band.
  for (let i = 0; i < width / 180 + 1; i++) {
    const x = parallaxX(50 + i * 180, camera, 0.45);
    if (x < -10 || x > GAME_WIDTH + 10) continue;
    ctx.fillStyle = rain ? 'rgba(180,200,230,0.35)' : 'rgba(255, 220, 120, 0.4)';
    ctx.beginPath();
    ctx.arc(x + 2, horizon - 10, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  if (rain) {
    ctx.strokeStyle = 'rgba(200,220,255,0.28)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 28; i++) {
      const rx = ((nowMs * 0.45 + i * 97) % (GAME_WIDTH + 16)) - 8;
      const ry = ((nowMs * 0.95 + i * 53) % Math.max(8, horizon)) ;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 2, ry + 8);
      ctx.stroke();
    }
  }
}

export function renderTerrain(ctx, camera, level, nowMs = 0) {
  const city = level.world === 'city';
  const mill = level.world === 'mill';
  for (const solid of level.solids) {
    // Carts render themselves (they move); skip them here so the generic
    // "thin solid = lily pad" rule below doesn't draw a pad under one.
    if (solid.isCart) continue;

    const screenX = solid.x - camera.x;
    const screenY = solid.y - camera.y;
    if (screenX + solid.width < 0 || screenX > GAME_WIDTH) continue;
    if (screenY + solid.height < 0 || screenY > GAME_HEIGHT) continue;

    if (solid.isBeam) {
      if (city) fillCaution(ctx, screenX, screenY, solid.width, solid.height);
      else if (level.world === 'travel') fillSandstone(ctx, screenX, screenY, solid.width, solid.height);
      else if (mill) fillMillWood(ctx, screenX, screenY, solid.width, solid.height);
      else {
        ctx.fillStyle = '#5e3c22';
        ctx.fillRect(screenX, screenY, solid.width, solid.height);
        ctx.fillStyle = '#e0b23a';
        ctx.fillRect(screenX, screenY, solid.width, 3);
      }
      continue;
    }

    // Lily pads and hay bales are drawn as themselves; wide ground strips
    // get tiled with the grass/dirt tile texture.
    if (solid.height <= 12) {
      if (city) {
        fillCaution(ctx, screenX, screenY, solid.width, 8);
      } else if (level.world === 'travel') {
        fillSandstone(ctx, screenX, screenY, solid.width, 8);
      } else if (mill) {
        fillMillWood(ctx, screenX, screenY, solid.width, 8);
      } else {
        drawSprite(ctx, LILYPAD, screenX - (spriteSize(LILYPAD).width - solid.width) / 2, screenY, { scale: 3 });
      }
      continue;
    }
    if (solid.width <= 40) {
      if (city) fillCaution(ctx, screenX, screenY, solid.width, solid.height);
      else if (level.world === 'travel') fillSandstone(ctx, screenX, screenY, solid.width, solid.height);
      else if (mill) fillMillWood(ctx, screenX, screenY, solid.width, solid.height);
      else drawSprite(ctx, HAY_BALE, screenX, screenY, { scale: 3 });
      continue;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(screenX, screenY, solid.width, solid.height);
    ctx.clip();
    if (level.world === 'travel') {
      ctx.fillStyle = '#c9a45c';
      ctx.fillRect(screenX, screenY, solid.width, solid.height);
      ctx.fillStyle = '#111111';
      ctx.fillRect(screenX, screenY, solid.width, 7);
      ctx.fillStyle = '#f3d39a';
      ctx.fillRect(screenX, screenY, solid.width, 5);
    } else if (mill) {
      ctx.fillStyle = '#6b4420';
      ctx.fillRect(screenX, screenY, solid.width, solid.height);
      ctx.fillStyle = '#111111';
      ctx.fillRect(screenX, screenY, solid.width, 7);
      ctx.fillStyle = '#c48a3a';
      ctx.fillRect(screenX, screenY, solid.width, 5);
      if (solid.belt) {
        const shift = ((nowMs / 40) * solid.belt) % 14;
        for (let rx = -14 + shift; rx < solid.width; rx += 14) {
          ctx.fillStyle = '#8a6230';
          ctx.fillRect(screenX + rx, screenY + 10, 10, 10);
          ctx.fillStyle = '#e0b23a';
          ctx.fillRect(screenX + rx + 2, screenY + 13, 6, 3);
        }
      } else {
        ctx.fillStyle = '#5c3a18';
        for (let d = 14; d < solid.width - 8; d += 18) {
          ctx.fillRect(screenX + d, screenY + 12, 14, 2);
        }
      }
    } else if (city) {
      ctx.fillStyle = '#2a2a32';
      ctx.fillRect(screenX, screenY, solid.width, solid.height);
      ctx.fillStyle = '#111111';
      ctx.fillRect(screenX, screenY, solid.width, 8);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(screenX, screenY, solid.width, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(screenX, screenY, 3, 5);
      ctx.fillRect(screenX + solid.width - 3, screenY, 3, 5);
      if (solid.belt) {
        const shift = ((nowMs / 40) * solid.belt) % 14;
        for (let rx = -14 + shift; rx < solid.width; rx += 14) {
          ctx.fillStyle = '#4a4a52';
          ctx.fillRect(screenX + rx, screenY + 10, 10, 10);
          ctx.fillStyle = '#ffd23f';
          ctx.fillRect(screenX + rx + 2, screenY + 13, 6, 3);
        }
      } else {
        ctx.fillStyle = '#c8c8d0';
        for (let d = 14; d < solid.width - 8; d += 22) {
          ctx.fillRect(screenX + d, screenY + 18, 12, 3);
        }
      }
    } else {
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(screenX, screenY, solid.width, solid.height);
      const tileCanvas = getSpriteCanvas(GROUND_TILE, 3, false);
      for (let tx = 0; tx < solid.width + groundTileSize.width; tx += groundTileSize.width) {
        ctx.drawImage(tileCanvas, screenX + tx, screenY);
      }
    }
    ctx.restore();
  }
}

/** Scenery colour wash for sunset/night. Drawn after the backdrop, before
 * terrain, so platforms and the duck stay readable. */
export function renderThemeOverlay(ctx, theme) {
  if (!theme.overlay) return;
  ctx.fillStyle = theme.overlay;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

export function renderGoal(ctx, camera, level) {
  const g = level.goal;
  const screenX = g.x - camera.x;
  const gy = g.y - camera.y;
  if (screenX < -40 || screenX > GAME_WIDTH + 40) return;
  if (gy > GAME_HEIGHT + 20 || gy + g.height < -20) return;
  if (level.world === 'travel') {
    ctx.fillStyle = '#111111';
    ctx.fillRect(screenX - 10, gy + 18, 40, g.height - 18);
    fillSandstone(ctx, screenX - 10, gy + 16, 40, 10);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(screenX + 4, gy + 4, 12, 12);
    return;
  }
  if (level.world === 'city') {
    ctx.fillStyle = '#111111';
    ctx.fillRect(screenX - 10, gy + 18, 40, g.height - 18);
    fillCaution(ctx, screenX - 10, gy + 16, 40, 10);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(screenX, gy + 48, 18, 42);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(screenX + 4, gy + 4, 12, 12);
    return;
  }
  if (level.world === 'mill') {
    ctx.fillStyle = '#111111';
    ctx.fillRect(screenX - 10, gy + 18, 40, g.height - 18);
    fillMillWood(ctx, screenX - 10, gy + 16, 40, 10);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(screenX + 4, gy + 4, 12, 12);
    return;
  }
  ctx.fillStyle = '#8a8f98';
  ctx.fillRect(screenX, gy, 6, g.height);
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(screenX + 6, gy);
  ctx.lineTo(screenX + 34, gy + 10);
  ctx.lineTo(screenX + 6, gy + 20);
  ctx.closePath();
  ctx.fill();
}
