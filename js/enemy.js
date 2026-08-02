// Frog enemy: sits on a lily pad, periodically hops in place, and
// occasionally lashes out with its tongue if the player wanders into
// range. Neutralized by a stomp-from-above or a propeller projectile.

import {
  GRAVITY, FROG_HOP_INTERVAL_MS, FROG_HOP_VELOCITY, FROG_TONGUE_RANGE,
  FROG_TONGUE_DURATION_MS, FROG_TONGUE_COOLDOWN_MS,
} from './constants.js';
import { FROG_IDLE, FROG_HOP } from './sprites.js';
import { drawSprite, spriteSize } from './pixelArt.js';

function randRange([min, max]) {
  return min + Math.random() * (max - min);
}

const DEATH_FADE_MS = 350;

export class Frog {
  constructor(padCenterX, padTopY) {
    const size = spriteSize(FROG_IDLE);
    this.width = size.width;
    this.height = size.height;
    this.restX = padCenterX - this.width / 2;
    this.restY = padTopY - this.height;
    this.x = this.restX;
    this.y = this.restY;
    this.vy = 0;
    this.facing = -1;
    this.state = 'idle'; // idle | hop | tongue | dying
    this.nextHopAt = performance.now() + randRange(FROG_HOP_INTERVAL_MS);
    this.nextTongueAt = performance.now() + randRange(FROG_TONGUE_COOLDOWN_MS);
    this.tongueEndAt = 0;
    this.deathTimer = 0;
    this.dead = false;
  }

  getHitbox() {
    if (this.state === 'dying') return null;
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  /** Tongue hazard hitbox, or null when not actively attacking. */
  getTongueHitbox() {
    if (this.state !== 'tongue') return null;
    const mouthY = this.y + this.height * 0.35;
    const reach = FROG_TONGUE_RANGE;
    const x = this.facing > 0 ? this.x + this.width : this.x - reach;
    return { x, y: mouthY, width: reach, height: 6 };
  }

  stomp() {
    if (this.state === 'dying') return;
    this.state = 'dying';
    this.deathTimer = DEATH_FADE_MS;
  }

  killByProjectile() {
    this.stomp(); // same fade-out behavior either way
  }

  update(dtMs, nowMs, playerBox) {
    if (this.state === 'dying') {
      this.deathTimer -= dtMs;
      if (this.deathTimer <= 0) this.dead = true;
      return;
    }

    const dt = dtMs / 16.6667;

    // Hopping in place, purely cosmetic + makes them feel alive.
    if (this.state === 'hop') {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y >= this.restY) {
        this.y = this.restY;
        this.vy = 0;
        this.state = 'idle';
        this.nextHopAt = nowMs + randRange(FROG_HOP_INTERVAL_MS);
      }
    } else if (this.state === 'idle' && nowMs >= this.nextHopAt) {
      this.state = 'hop';
      this.vy = FROG_HOP_VELOCITY;
    }

    // Tongue attack: only fires while grounded/idle, and only if the
    // player is roughly at the same height and within reach.
    if (this.state === 'tongue') {
      if (nowMs >= this.tongueEndAt) {
        this.state = 'idle';
        this.nextTongueAt = nowMs + randRange(FROG_TONGUE_COOLDOWN_MS);
      }
    } else if (playerBox && nowMs >= this.nextTongueAt && this.state === 'idle') {
      const sameLevel = Math.abs(playerBox.y - this.y) < this.height * 1.5;
      const dx = playerBox.x - this.x;
      if (sameLevel && Math.abs(dx) < FROG_TONGUE_RANGE + this.width) {
        this.facing = dx > 0 ? 1 : -1;
        this.state = 'tongue';
        this.tongueEndAt = nowMs + FROG_TONGUE_DURATION_MS;
      }
    }
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    if (this.state === 'dying') {
      const t = Math.max(0, this.deathTimer / DEATH_FADE_MS);
      ctx.save();
      ctx.globalAlpha = t;
      ctx.translate(screenX + this.width / 2, this.y + this.height);
      ctx.scale(1 + (1 - t) * 0.4, t);
      drawSprite(ctx, FROG_IDLE, -this.width / 2, -this.height, { flip: this.facing < 0 });
      ctx.restore();
      return;
    }

    const sprite = this.state === 'hop' ? FROG_HOP : FROG_IDLE;
    drawSprite(ctx, sprite, screenX, this.y, { flip: this.facing < 0 });

    const tongue = this.getTongueHitbox();
    if (tongue) {
      ctx.fillStyle = '#ffb6c1';
      ctx.fillRect(tongue.x - camera.x, tongue.y, tongue.width, tongue.height);
    }
  }
}
