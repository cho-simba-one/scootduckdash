// New baddies and the bounce pad. Same public shape as Frog/Goose
// (getHitbox / update / render, plus stomp / killByProjectile) so game.js
// can treat them as one list of "things that can hurt you."

import { GROUND_Y, PLAYER_PAD_BOUNCE } from './constants.js';
import { PIG, BEE, MOLE, CROW, BOUNCE_FLOWER } from './sprites.js';
import { drawSprite, spriteSize } from './pixelArt.js';

const DEATH_FADE_MS = 320;

function fadeKill(self, ctx, camera, sprite, flip) {
  const t = Math.max(0, self.deathTimer / DEATH_FADE_MS);
  const screenX = self.x - camera.x;
  ctx.save();
  ctx.globalAlpha = t;
  ctx.translate(screenX + self.width / 2, self.y + self.height);
  ctx.scale(1, t);
  drawSprite(ctx, sprite, -self.width / 2, -self.height, { flip });
  ctx.restore();
}

/** Low pink tank. Walks, then charges if you're in front. Jump over it. */
export class Pig {
  constructor(x) {
    const size = spriteSize(PIG);
    this.width = size.width;
    this.height = size.height;
    this.originX = x;
    this.x = x;
    this.y = GROUND_Y - this.height;
    this.dir = 1;
    this.state = 'walk'; // walk | charge | dying
    this.chargeUntil = 0;
    this.dead = false;
    this.deathTimer = 0;
  }

  getHitbox() {
    if (this.state === 'dying') return null;
    return { x: this.x + 4, y: this.y + 4, width: this.width - 8, height: this.height - 4 };
  }

  stomp() {
    if (this.state === 'dying') return;
    this.state = 'dying';
    this.deathTimer = DEATH_FADE_MS;
  }

  killByProjectile() { this.stomp(); }

  update(dtMs, nowMs, playerBox) {
    if (this.state === 'dying') {
      this.deathTimer -= dtMs;
      if (this.deathTimer <= 0) this.dead = true;
      return;
    }
    const dt = dtMs / 16.6667;
    if (this.state === 'charge' && nowMs >= this.chargeUntil) this.state = 'walk';

    if (playerBox && this.state === 'walk') {
      const dx = playerBox.x - this.x;
      const inFront = Math.sign(dx) === this.dir || Math.abs(dx) < 20;
      const close = Math.abs(dx) < 170 && Math.abs(playerBox.y - this.y) < 40;
      if (inFront && close) {
        this.dir = dx >= 0 ? 1 : -1;
        this.state = 'charge';
        this.chargeUntil = nowMs + 700;
      }
    }

    const speed = this.state === 'charge' ? 3.3 : 0.7;
    this.x += this.dir * speed * dt;
    if (this.x > this.originX + 90) { this.x = this.originX + 90; this.dir = -1; }
    if (this.x < this.originX - 20) { this.x = this.originX - 20; this.dir = 1; }
  }

  render(ctx, camera) {
    if (this.state === 'dying') return fadeKill(this, ctx, camera, PIG, this.dir < 0);
    drawSprite(ctx, PIG, this.x - camera.x, this.y, { flip: this.dir < 0 });
  }
}

/** Tiny flyer. Shoot them -- stomping works but they're small. */
export class Bee {
  constructor(x, y, patrol = 180) {
    const size = spriteSize(BEE, 2);
    this.width = size.width;
    this.height = size.height;
    this.originX = x;
    this.baseY = y;
    this.patrol = patrol;
    this.x = x;
    this.y = y;
    this.t = 0;
    this.state = 'fly';
    this.dead = false;
    this.deathTimer = 0;
    this.dir = 1;
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
    const u = (this.t / 900) % 2;
    const phase = u < 1 ? u : 2 - u;
    this.x = this.originX + phase * this.patrol;
    this.dir = u < 1 ? 1 : -1;
    this.y = this.baseY + Math.sin(this.t / 140) * 10;
  }

  render(ctx, camera) {
    if (this.state === 'dying') return fadeKill(this, ctx, camera, BEE, this.dir < 0);
    drawSprite(ctx, BEE, this.x - camera.x, this.y, { scale: 2, flip: this.dir < 0 });
  }
}

/** Pops out of a hole on a timer. Walk when it's down, wait when it's up. */
export class Mole {
  constructor(x) {
    const size = spriteSize(MOLE);
    this.width = size.width;
    this.height = size.height;
    this.x = x;
    this.y = GROUND_Y - 4;
    this.upY = GROUND_Y - this.height;
    this.downY = GROUND_Y - 4;
    this.up = false;
    this.t = Math.random() * 1800;
    this.state = 'idle';
    this.dead = false;
    this.deathTimer = 0;
  }

  getHitbox() {
    if (this.state === 'dying' || !this.up) return null;
    return { x: this.x + 2, y: this.y, width: this.width - 4, height: this.height };
  }

  stomp() {
    if (this.state === 'dying' || !this.up) return;
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
    const cycle = 2400;
    const u = this.t % cycle;
    this.up = u > 1400;
    this.y = this.up ? this.upY : this.downY;
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(screenX + this.width / 2, GROUND_Y, this.width / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (this.state === 'dying') return fadeKill(this, ctx, camera, MOLE, false);
    if (this.up) drawSprite(ctx, MOLE, screenX, this.y);
  }
}

/** Swoops in an arc, then climbs back. Different path from a goose patrol. */
export class Crow {
  constructor(x, y, span = 280) {
    const size = spriteSize(CROW, 2);
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
    const cycle = 2600;
    const u = (this.t % cycle) / cycle;
    this.x = this.originX + u * this.span;
    // Dive in the middle of the pass, climb at the ends.
    this.y = this.originY + Math.sin(u * Math.PI) * 70;
    this.dir = 1;
  }

  render(ctx, camera) {
    if (this.state === 'dying') return fadeKill(this, ctx, camera, CROW, false);
    drawSprite(ctx, CROW, this.x - camera.x, this.y, { scale: 2 });
  }
}

/** Land on it falling to get a super-jump. Not a solid -- a trigger. */
export class BouncePad {
  constructor(x, y) {
    const size = spriteSize(BOUNCE_FLOWER);
    this.width = size.width;
    this.height = size.height;
    this.x = x;
    this.y = y;
    this.squash = 0;
  }

  getHitbox() {
    return { x: this.x, y: this.y + this.height * 0.35, width: this.width, height: this.height * 0.65 };
  }

  bounce() {
    this.squash = 1;
    return PLAYER_PAD_BOUNCE;
  }

  update(dtMs) {
    if (this.squash > 0) this.squash = Math.max(0, this.squash - dtMs / 180);
  }

  render(ctx, camera) {
    const squish = 1 - this.squash * 0.35;
    ctx.save();
    ctx.translate(this.x - camera.x + this.width / 2, this.y + this.height);
    ctx.scale(1 + this.squash * 0.2, squish);
    drawSprite(ctx, BOUNCE_FLOWER, -this.width / 2, -this.height);
    ctx.restore();
  }
}


