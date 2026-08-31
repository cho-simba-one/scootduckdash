// City-world baddies and street gadgets. Same hitbox contract as farm
// critters so game.js can reuse hitFoe. Hydrants/geysers/traffic are
// timers, not stomps -- they hurt when the jet (or the car) is on.

import { GROUND_Y, CART_SPEED } from './constants.js';
import { RAT, PIGEON, TAXI, CAT, DRONE } from './sprites.js';
import { drawSprite, spriteSize } from './pixelArt.js';

const DEATH_FADE_MS = 300;

function fadeKill(self, ctx, camera, sprite, flip, scale = 3) {
  const t = Math.max(0, self.deathTimer / DEATH_FADE_MS);
  const screenX = self.x - camera.x;
  ctx.save();
  ctx.globalAlpha = t;
  ctx.translate(screenX + self.width / 2, self.y + self.height);
  ctx.scale(1, t);
  drawSprite(ctx, sprite, -self.width / 2, -self.height, { flip, scale });
  ctx.restore();
}

/** Fast ground scurrier. Jump it -- it's too low to duck "through". */
export class Rat {
  constructor(x) {
    const size = spriteSize(RAT, 2);
    this.width = size.width;
    this.height = size.height;
    this.originX = x;
    this.x = x;
    this.y = GROUND_Y - this.height;
    this.dir = 1;
    this.state = 'run';
    this.dead = false;
    this.deathTimer = 0;
  }

  getHitbox() {
    if (this.state === 'dying') return null;
    return { x: this.x, y: this.y + 2, width: this.width, height: this.height - 2 };
  }

  stomp() {
    if (this.state === 'dying') return;
    this.state = 'dying';
    this.deathTimer = DEATH_FADE_MS;
  }

  killByProjectile() { this.stomp(); }

  update(dtMs) {
    if (this.state === 'dying') {
      this.deathTimer -= dtMs;
      if (this.deathTimer <= 0) this.dead = true;
      return;
    }
    const dt = dtMs / 16.6667;
    this.x += this.dir * 2.4 * dt;
    if (this.x > this.originX + 110) { this.x = this.originX + 110; this.dir = -1; }
    if (this.x < this.originX - 10) { this.x = this.originX - 10; this.dir = 1; }
  }

  render(ctx, camera) {
    if (this.state === 'dying') return fadeKill(this, ctx, camera, RAT, this.dir < 0, 2);
    drawSprite(ctx, RAT, this.x - camera.x, this.y, { scale: 2, flip: this.dir < 0 });
  }
}

/** Rooftop/air pest. Shorter, twitchier path than a crow. */
export class Pigeon {
  constructor(x, y, span = 200) {
    const size = spriteSize(PIGEON, 2);
    this.width = size.width;
    this.height = size.height;
    this.originX = x;
    this.originY = y;
    this.span = span;
    this.x = x;
    this.y = y;
    this.t = 0;
    this.dir = 1;
    this.state = 'fly';
    this.dead = false;
    this.deathTimer = 0;
  }

  getHitbox() {
    if (this.state === 'dying') return null;
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  stomp() {
    if (this.state === 'dying') return;
    this.state = 'dying';
    this.deathTimer = DEATH_FADE_MS;
  }

  killByProjectile() { this.stomp(); }

  update(dtMs) {
    if (this.state === 'dying') {
      this.deathTimer -= dtMs;
      if (this.deathTimer <= 0) this.dead = true;
      return;
    }
    this.t += dtMs;
    const u = (this.t / 1400) % 2;
    const phase = u < 1 ? u : 2 - u;
    this.x = this.originX + phase * this.span;
    this.dir = u < 1 ? 1 : -1;
    this.y = this.originY + Math.abs(Math.sin(this.t / 180)) * 28;
  }

  render(ctx, camera) {
    if (this.state === 'dying') return fadeKill(this, ctx, camera, PIGEON, this.dir < 0, 2);
    drawSprite(ctx, PIGEON, this.x - camera.x, this.y, { scale: 2, flip: this.dir < 0 });
  }
}

/** One-way looping cab. The roof is a moving platform (isCart). The
 * bumper is a hit if you meet it from the side instead of landing on top. */
export class Taxi {
  constructor(x, y, range) {
    this.width = 70;
    this.height = 16;
    this.originX = x;
    this.originY = y;
    this.range = range;
    this.t = 0;
    this.dx = 0;
    this.dy = 0;
    this.solid = { x, y, width: this.width, height: this.height, isCart: true, isTaxi: true };
    this.dead = false;
  }

  getHitbox() {
    return {
      x: this.solid.x + 4,
      y: this.solid.y + 6,
      width: this.width - 8,
      height: 10,
    };
  }

  stomp() { /* roof is a platform, not a kill */ }
  killByProjectile() { /* paint-job immune */ }

  update(dtMs) {
    this.t += dtMs;
    const phase = (this.t / 2200) % 1;
    const prevX = this.solid.x;
    this.solid.x = this.originX + phase * this.range;
    this.solid.y = this.originY;
    this.dx = this.solid.x - prevX;
    this.dy = 0;
    this.x = this.solid.x;
    this.y = this.solid.y;
  }

  carry(entity) {
    if (entity.groundSolid !== this.solid) return;
    entity.x += this.dx;
    entity.y += this.dy;
  }

  render(ctx, camera) {
    const screenX = this.solid.x - camera.x;
    drawSprite(ctx, TAXI, screenX, this.solid.y - 10, { scale: 2 });
  }
}

/** Sideways water jet. Standing hits it; ducking slips under. */
export class Hydrant {
  constructor(x, dir = 1) {
    this.x = x;
    this.dir = dir;
    this.t = 0;
    this.on = false;
    this.dead = false;
    this.width = 16;
    this.y = GROUND_Y - 18;
  }

  getHitbox() {
    if (!this.on) return null;
    const length = 78;
    const y = GROUND_Y - 32;
    const x = this.dir > 0 ? this.x + 12 : this.x - length;
    return { x, y, width: length, height: 12 };
  }

  stomp() {}
  killByProjectile() {}

  update(dtMs) {
    this.t += dtMs;
    const u = this.t % 2200;
    this.on = u > 900 && u < 1500;
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(screenX, GROUND_Y - 18, 14, 18);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(screenX + 4, GROUND_Y - 22, 6, 6);
    const jet = this.getHitbox();
    if (!jet) return;
    ctx.fillStyle = 'rgba(90,180,230,0.55)';
    ctx.fillRect(jet.x - camera.x, jet.y, jet.width, jet.height);
    ctx.fillStyle = 'rgba(180,220,255,0.7)';
    for (let i = 0; i < 5; i++) {
      const drop = (this.t / 40 + i * 17) % jet.width;
      ctx.fillRect(jet.x - camera.x + drop, jet.y + (i % 3) * 4, 4, 3);
    }
  }
}

/** Vertical steam from a manhole. Jump when it sleeps. */
export class Geyser {
  constructor(x) {
    this.x = x;
    this.t = Math.random() * 2000;
    this.on = false;
    this.dead = false;
    this.y = GROUND_Y;
    this.width = 22;
  }

  getHitbox() {
    if (!this.on) return null;
    return { x: this.x, y: GROUND_Y - 64, width: 22, height: 64 };
  }

  stomp() {}
  killByProjectile() {}

  update(dtMs) {
    this.t += dtMs;
    const u = this.t % 2600;
    this.on = u > 1600;
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(screenX - 2, GROUND_Y - 4, 26, 6);
    ctx.fillStyle = '#4a4a52';
    ctx.fillRect(screenX + 2, GROUND_Y - 3, 6, 4);
    ctx.fillRect(screenX + 14, GROUND_Y - 3, 6, 4);
    if (!this.on) return;
    const puff = ((this.t / 80) % 10);
    for (let i = 0; i < 4; i++) {
      const rise = (puff + i * 14) % 64;
      ctx.fillStyle = `rgba(220,220,230,${0.5 - i * 0.08})`;
      ctx.fillRect(screenX + 2 + (i % 2) * 4, GROUND_Y - 8 - rise, 14 + i * 2, 12);
    }
  }
}

/** Alley cat. Sits, then pounces. Jump the leap or shoot it. */
export class Cat {
  constructor(x) {
    const size = spriteSize(CAT, 3);
    this.width = size.width;
    this.height = size.height;
    this.originX = x;
    this.x = x;
    this.y = GROUND_Y - this.height;
    this.dir = 1;
    this.state = 'sit';
    this.t = 0;
    this.vy = 0;
    this.dead = false;
    this.deathTimer = 0;
  }

  getHitbox() {
    if (this.state === 'dying') return null;
    return { x: this.x + 2, y: this.y + 2, width: this.width - 4, height: this.height - 2 };
  }

  stomp() {
    if (this.state === 'dying') return;
    this.state = 'dying';
    this.deathTimer = DEATH_FADE_MS;
  }

  killByProjectile() { this.stomp(); }

  update(dtMs) {
    if (this.state === 'dying') {
      this.deathTimer -= dtMs;
      if (this.deathTimer <= 0) this.dead = true;
      return;
    }
    const dt = dtMs / 16.6667;
    this.t += dtMs;
    if (this.state === 'sit') {
      if (this.t > 1100) {
        this.state = 'pounce';
        this.vy = -6.4;
        this.t = 0;
      }
      return;
    }
    this.x += this.dir * 3.1 * dt;
    this.vy += 0.55 * dt;
    this.y += this.vy * dt;
    if (this.y >= GROUND_Y - this.height) {
      this.y = GROUND_Y - this.height;
      this.vy = 0;
      this.state = 'sit';
      this.t = 0;
      if (this.x > this.originX + 120) this.dir = -1;
      if (this.x < this.originX - 20) this.dir = 1;
    }
  }

  render(ctx, camera) {
    if (this.state === 'dying') return fadeKill(this, ctx, camera, CAT, this.dir < 0, 3);
    drawSprite(ctx, CAT, this.x - camera.x, this.y, { scale: 3, flip: this.dir < 0 });
  }
}

/** Security drone. Swoops lower on the back half of its path. Shoot it. */
export class Drone {
  constructor(x, y, span = 220) {
    const size = spriteSize(DRONE, 2);
    this.width = size.width;
    this.height = size.height;
    this.originX = x;
    this.originY = y;
    this.span = span;
    this.x = x;
    this.y = y;
    this.t = 0;
    this.dir = 1;
    this.state = 'fly';
    this.dead = false;
    this.deathTimer = 0;
  }

  getHitbox() {
    if (this.state === 'dying') return null;
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  stomp() {
    if (this.state === 'dying') return;
    this.state = 'dying';
    this.deathTimer = DEATH_FADE_MS;
  }

  killByProjectile() { this.stomp(); }

  update(dtMs) {
    if (this.state === 'dying') {
      this.deathTimer -= dtMs;
      if (this.deathTimer <= 0) this.dead = true;
      return;
    }
    this.t += dtMs;
    const u = (this.t / 1600) % 2;
    const phase = u < 1 ? u : 2 - u;
    this.x = this.originX + phase * this.span;
    this.dir = u < 1 ? 1 : -1;
    const dip = Math.max(0, Math.sin(this.t / 200)) * 36;
    this.y = this.originY + dip;
  }

  render(ctx, camera) {
    if (this.state === 'dying') return fadeKill(this, ctx, camera, DRONE, false, 2);
    const screenX = this.x - camera.x;
    const spin = Math.sin(this.t / 40);
    ctx.fillStyle = '#8d99ae';
    ctx.fillRect(screenX - 4 + spin * 6, this.y - 3, 10, 2);
    ctx.fillRect(screenX + this.width - 6 - spin * 6, this.y - 3, 10, 2);
    drawSprite(ctx, DRONE, screenX, this.y, { scale: 2 });
  }
}

/** Lid slams on a timer. Closed is scenery. Open lid is a hit -- wait it out. */
export class Dumpster {
  constructor(x) {
    this.x = x;
    this.width = 30;
    this.height = 20;
    this.y = GROUND_Y - this.height;
    this.t = Math.random() * 1800;
    this.open = false;
    this.state = 'idle';
    this.dead = false;
    this.deathTimer = 0;
  }

  getHitbox() {
    if (this.state === 'dying' || !this.open) return null;
    return { x: this.x, y: GROUND_Y - 40, width: this.width, height: 40 };
  }

  stomp() {
    if (this.state === 'dying' || !this.open) return;
    this.state = 'dying';
    this.deathTimer = DEATH_FADE_MS;
  }

  killByProjectile() { this.stomp(); }

  update(dtMs) {
    if (this.state === 'dying') {
      this.deathTimer -= dtMs;
      if (this.deathTimer <= 0) this.dead = true;
      return;
    }
    this.t += dtMs;
    const u = this.t % 2400;
    this.open = u > 1400;
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    if (this.state === 'dying') {
      const t = Math.max(0, this.deathTimer / DEATH_FADE_MS);
      ctx.save();
      ctx.globalAlpha = t;
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(screenX, this.y + (1 - t) * 16, this.width, this.height * t);
      ctx.restore();
      return;
    }
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(screenX, this.y, this.width, this.height);
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(screenX + 3, this.y + 6, 8, 10);
    ctx.fillRect(screenX + 19, this.y + 6, 8, 10);
    ctx.fillStyle = '#40916c';
    if (this.open) {
      ctx.fillRect(screenX - 2, this.y - 18, this.width + 4, 8);
    } else {
      ctx.fillRect(screenX - 1, this.y - 4, this.width + 2, 6);
    }
  }
}

/** Construction crane hook -- a vertical lift, same rider contract as a cart. */
export class Crane {
  constructor(x, y, range) {
    this.width = 50;
    this.height = 12;
    this.originX = x;
    this.originY = y;
    this.range = range;
    this.t = 0;
    this.dx = 0;
    this.dy = 0;
    this.solid = { x, y, width: this.width, height: this.height, isCart: true, isCrane: true };
    this.dead = false;
  }

  update(dtMs) {
    this.t += dtMs;
    const phase = (1 - Math.cos((this.t / 1000) * CART_SPEED)) / 2;
    const prevY = this.solid.y;
    this.solid.x = this.originX;
    this.solid.y = this.originY - phase * this.range;
    this.dx = 0;
    this.dy = this.solid.y - prevY;
    this.x = this.solid.x;
    this.y = this.solid.y;
  }

  carry(entity) {
    if (entity.groundSolid !== this.solid) return;
    entity.x += this.dx;
    entity.y += this.dy;
  }

  render(ctx, camera) {
    const screenX = this.solid.x - camera.x;
    const y = this.solid.y;
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX + this.width / 2, 0);
    ctx.lineTo(screenX + this.width / 2, y);
    ctx.stroke();
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(screenX, y, this.width, this.height);
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < this.width; i += 10) {
      ctx.fillRect(screenX + i, y, 5, this.height);
    }
  }
}

/** Timed street traffic. Jump the car; walking into it hurts. */
export class Traffic {
  constructor(x, width) {
    this.zoneX = x;
    this.zoneW = width;
    this.width = 30;
    this.height = 14;
    this.t = 0;
    this.on = false;
    this.x = x;
    this.y = GROUND_Y - 14;
    this.dead = false;
  }

  getHitbox() {
    if (!this.on) return null;
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  stomp() {}
  killByProjectile() {}

  update(dtMs) {
    this.t += dtMs;
    const cycle = 2000;
    const u = this.t % cycle;
    this.on = u < 900;
    this.x = this.zoneX + (u / 900) * Math.max(40, this.zoneW - this.width);
  }

  render(ctx, camera) {
    if (!this.on) return;
    const screenX = this.x - camera.x;
    ctx.fillStyle = '#e63946';
    ctx.fillRect(screenX, this.y, this.width, this.height);
    ctx.fillStyle = '#8ecae6';
    ctx.fillRect(screenX + 18, this.y + 3, 8, 6);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(screenX + this.width - 4, this.y + 5, 3, 3);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(screenX + 4, this.y + 12, 6, 3);
    ctx.fillRect(screenX + 20, this.y + 12, 6, 3);
  }
}
