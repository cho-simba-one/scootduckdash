// Hazards introduced after level 1: patrolling geese and moving hay carts.
//
// Kept out of enemy.js because a Frog is a stationary perch-dweller with a
// tongue, while these two are movement puzzles. Same public shape as Frog
// (getHitbox / update / render) so game.js treats them uniformly.

import { GOOSE_PATROL_SPEED, CART_SPEED } from './constants.js';
import { GOOSE, HAY_BALE } from './sprites.js';
import { drawSprite, spriteSize } from './pixelArt.js';

const DEATH_FADE_MS = 350;

/**
 * A goose that flies back and forth along a fixed horizontal stretch,
 * bobbing as it goes. Killable exactly like a frog (stomp or projectile),
 * so the player's existing toolkit already works on it -- no new verbs.
 */
export class Goose {
  constructor(x, y, patrolWidth) {
    const size = spriteSize(GOOSE);
    this.width = size.width * 2;
    this.height = size.height * 2;
    this.originX = x;
    this.patrolWidth = patrolWidth;
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.dir = 1;
    this.state = 'flying'; // flying | dying
    this.deathTimer = 0;
    this.dead = false;
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

  killByProjectile() {
    this.stomp();
  }

  update(dtMs, nowMs) {
    if (this.state === 'dying') {
      this.deathTimer -= dtMs;
      if (this.deathTimer <= 0) this.dead = true;
      return;
    }
    const dt = dtMs / 16.6667;
    this.x += this.dir * GOOSE_PATROL_SPEED * dt;
    if (this.x > this.originX + this.patrolWidth) {
      this.x = this.originX + this.patrolWidth;
      this.dir = -1;
    } else if (this.x < this.originX) {
      this.x = this.originX;
      this.dir = 1;
    }
    // Gentle sine bob makes the flight path read as "flying", and adds a
    // little timing challenge to jumping over one.
    this.y = this.baseY + Math.sin(nowMs / 260 + this.originX) * 8;
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    if (this.state === 'dying') {
      const t = Math.max(0, this.deathTimer / DEATH_FADE_MS);
      ctx.save();
      ctx.globalAlpha = t;
      ctx.translate(screenX + this.width / 2, this.y + this.height);
      ctx.scale(1, t);
      drawSprite(ctx, GOOSE, -this.width / 2, -this.height, { scale: 2, flip: this.dir < 0 });
      ctx.restore();
      return;
    }
    drawSprite(ctx, GOOSE, screenX, this.y, { scale: 2, flip: this.dir < 0 });
  }
}

/**
 * A hay cart that slides along a fixed track, horizontally or vertically.
 *
 * It exposes a live `solid` object which is pushed into the level's solids
 * array ONCE at build time and then mutated in place each frame. That way
 * the existing collision code needs no concept of "moving platform" -- it
 * just sees a solid that happens to be somewhere new this frame.
 */
export class Cart {
  constructor(x, y, range, axis) {
    // Deliberately wider than the hay sprite: a 30px cart gives a 26px duck
    // only 4px of footing, which reads as unfair rather than challenging.
    this.width = spriteSize(HAY_BALE).width * 2;
    this.height = 12; // thin rideable lid, matching how hay platforms collide
    this.originX = x;
    this.originY = y;
    this.range = range;
    this.axis = axis; // 'h' | 'v'
    this.t = 0;
    this.dx = 0; // this frame's travel, so riders can be carried along
    this.dy = 0;
    this.solid = { x, y, width: this.width, height: this.height, isCart: true };
  }

  update(dtMs) {
    this.t += dtMs;
    // Cosine ease so the cart slows at each end instead of snapping
    // direction -- much easier to land on, and looks mechanical.
    const phase = (1 - Math.cos((this.t / 1000) * CART_SPEED)) / 2;
    const offset = phase * this.range;
    const prevX = this.solid.x;
    const prevY = this.solid.y;
    if (this.axis === 'h') {
      this.solid.x = this.originX + offset;
      this.solid.y = this.originY;
    } else {
      this.solid.x = this.originX;
      this.solid.y = this.originY - offset;
    }
    this.dx = this.solid.x - prevX;
    this.dy = this.solid.y - prevY;
  }

  /** Drag anything standing on this cart along with it. Without this the
   * cart slides out from under the player and they drop straight in. */
  carry(entity) {
    if (entity.groundSolid !== this.solid) return;
    entity.x += this.dx;
    entity.y += this.dy;
  }

  render(ctx, camera) {
    const screenX = this.solid.x - camera.x;
    const y = this.solid.y;
    // Two bales side by side to fill the wider deck.
    drawSprite(ctx, HAY_BALE, screenX, y, { scale: 3 });
    drawSprite(ctx, HAY_BALE, screenX + this.width / 2, y, { scale: 3 });

    // Wheels + axle so a moving cart reads differently from static hay.
    // Without this the player can't tell a hazard from scenery until it
    // has already moved, which isn't a fair challenge.
    const w = this.width;
    ctx.fillStyle = '#5e3c22';
    ctx.fillRect(screenX + 2, y + 28, w - 4, 4);
    ctx.fillStyle = '#1a1a1a';
    for (const wx of [screenX + 6, screenX + w - 12]) {
      ctx.beginPath();
      ctx.arc(wx + 3, y + 34, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8d99ae';
    for (const wx of [screenX + 6, screenX + w - 12]) {
      ctx.beginPath();
      ctx.arc(wx + 3, y + 34, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
