// Landmark-world critters. Same hitbox contract as farm/city foes.
// The hawk is the souvenir thief the story is chasing.

import { GROUND_Y } from './constants.js';
import { SNAKE, SCORPION, GOAT, HAWK } from './sprites.js';
import { drawSprite, spriteSize } from './pixelArt.js';

const DEATH_FADE_MS = 300;

function fadeKill(self, ctx, camera, sprite, flip, scale = 3) {
  const t = Math.max(0, self.deathTimer / DEATH_FADE_MS);
  const screenX = self.x - camera.x;
  ctx.save();
  ctx.globalAlpha = t;
  ctx.translate(screenX + self.width / 2, self.y - camera.y + self.height);
  ctx.scale(1, t);
  drawSprite(ctx, sprite, -self.width / 2, -self.height, { flip, scale });
  ctx.restore();
}

/** Low sand wriggler. Jump it or whip it. */
export class Snake {
  constructor(x) {
    const size = spriteSize(SNAKE, 2);
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
    this.x += this.dir * 1.9 * dt;
    if (this.x > this.originX + 100) { this.x = this.originX + 100; this.dir = -1; }
    if (this.x < this.originX - 8) { this.x = this.originX - 8; this.dir = 1; }
  }

  render(ctx, camera) {
    if (this.state === 'dying') return fadeKill(this, ctx, camera, SNAKE, this.dir < 0, 2);
    drawSprite(ctx, SNAKE, this.x - camera.x, this.y - camera.y, { scale: 2, flip: this.dir < 0 });
  }
}

/** Desert tank. Slow, tail up. Jump, shoot, or whip. */
export class Scorpion {
  constructor(x) {
    const size = spriteSize(SCORPION, 3);
    this.width = size.width;
    this.height = size.height;
    this.originX = x;
    this.x = x;
    this.y = GROUND_Y - this.height;
    this.dir = 1;
    this.state = 'walk';
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
    this.x += this.dir * 1.15 * dt;
    if (this.x > this.originX + 90) { this.x = this.originX + 90; this.dir = -1; }
    if (this.x < this.originX - 10) { this.x = this.originX - 10; this.dir = 1; }
  }

  render(ctx, camera) {
    if (this.state === 'dying') return fadeKill(this, ctx, camera, SCORPION, this.dir < 0, 3);
    drawSprite(ctx, SCORPION, this.x - camera.x, this.y - camera.y, { scale: 3, flip: this.dir < 0 });
  }
}

/** Canyon goat. Sits, then hops. Whip it mid-leap or jump it. */
export class Goat {
  constructor(x) {
    const size = spriteSize(GOAT, 3);
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
      if (this.t > 900) {
        this.state = 'hop';
        this.vy = -5.8;
        this.t = 0;
      }
      return;
    }
    this.x += this.dir * 2.6 * dt;
    this.vy += 0.55 * dt;
    this.y += this.vy * dt;
    if (this.y >= GROUND_Y - this.height) {
      this.y = GROUND_Y - this.height;
      this.vy = 0;
      this.state = 'sit';
      this.t = 0;
      if (this.x > this.originX + 110) this.dir = -1;
      if (this.x < this.originX - 16) this.dir = 1;
    }
  }

  render(ctx, camera) {
    if (this.state === 'dying') return fadeKill(this, ctx, camera, GOAT, this.dir < 0, 3);
    drawSprite(ctx, GOAT, this.x - camera.x, this.y - camera.y, { scale: 3, flip: this.dir < 0 });
  }
}

/** Souvenir hawk. Dives on a longer path than a pigeon. */
export class Hawk {
  constructor(x, y, span = 240) {
    const size = spriteSize(HAWK, 2);
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
    const u = (this.t / 1700) % 2;
    const phase = u < 1 ? u : 2 - u;
    this.x = this.originX + phase * this.span;
    this.dir = u < 1 ? 1 : -1;
    this.y = this.originY + Math.sin(this.t / 220) * 22 + Math.abs(Math.sin(this.t / 500)) * 18;
  }

  render(ctx, camera) {
    if (this.state === 'dying') return fadeKill(this, ctx, camera, HAWK, this.dir < 0, 2);
    drawSprite(ctx, HAWK, this.x - camera.x, this.y - camera.y, { scale: 2, flip: this.dir < 0 });
  }
}
