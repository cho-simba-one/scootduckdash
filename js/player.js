import {
  GRAVITY, MAX_FALL_SPEED, PLAYER_MOVE_ACCEL, PLAYER_FRICTION,
  PLAYER_MAX_SPEED, PLAYER_DUCK_MAX_SPEED, PLAYER_JUMP_VELOCITY,
  PLAYER_STOMP_BOUNCE, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DUCK_HEIGHT,
  PLAYER_MAX_HEARTS, PLAYER_INVINCIBLE_MS, PROJECTILE_COOLDOWN_MS,
  WHIP_DURATION_MS, WHIP_POP, WHIP_SPEED_BONUS, WHIP_MAX_SPEED,
  WHIP_GRAVITY_MUL, WHIP_REACH,
} from './constants.js';
import { DUCK_IDLE, DUCK_RUN1, DUCK_RUN2, DUCK_JUMP, DUCK_DUCK, withWhiteEye } from './sprites.js';
import { isGod } from './cheats.js';
import { drawSprite, spriteSize } from './pixelArt.js';
import { Input } from './input.js';
import { Projectile } from './projectile.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.grounded = false;
    this.groundSolid = null; // what we're standing on, so carts can carry us
    this.ducking = false;
    this.hearts = PLAYER_MAX_HEARTS;
    this.invincibleUntil = 0;
    this.lastShotAt = -Infinity;
    this.animTimer = 0;
    this.animFrame = 0;
    this.dead = false;
    this.whipTimer = 0;
    this.whipUsed = false;
    this.whipStarted = false;
  }

  get width() {
    return this.ducking ? spriteSize(DUCK_DUCK).width : PLAYER_WIDTH;
  }

  get height() {
    return this.ducking ? PLAYER_DUCK_HEIGHT : PLAYER_HEIGHT;
  }

  getHitbox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  isWhipping() {
    return this.whipTimer > 0;
  }

  getWhipHitbox() {
    const b = this.getHitbox();
    return {
      x: b.x - WHIP_REACH,
      y: b.y - WHIP_REACH,
      width: b.width + WHIP_REACH * 2,
      height: b.height + WHIP_REACH * 2,
    };
  }

  isInvincible(nowMs) {
    return nowMs < this.invincibleUntil;
  }

  /** Returns a new Projectile if the cooldown allows firing, else null. */
  tryShoot(nowMs) {
    if (nowMs - this.lastShotAt < PROJECTILE_COOLDOWN_MS) return null;
    this.lastShotAt = nowMs;
    const muzzleX = this.facing > 0 ? this.x + this.width : this.x;
    const muzzleY = this.y + this.height * 0.32;
    return new Projectile(muzzleX, muzzleY, this.facing);
  }

  takeDamage(nowMs, knockbackFromX) {
    if (this.isInvincible(nowMs) || this.dead) return;
    if (isGod()) {
      // Knockback only -- the duck never loses a heart and never stays down.
      this.vy = -5;
      this.vx = this.x < knockbackFromX ? -3.5 : 3.5;
      return;
    }
    this.hearts -= 1;
    this.invincibleUntil = nowMs + PLAYER_INVINCIBLE_MS;
    this.vy = -5;
    this.vx = this.x < knockbackFromX ? -3.5 : 3.5;
    if (this.hearts <= 0) this.dead = true;
  }

  stompBounce() {
    this.vy = PLAYER_STOMP_BOUNCE;
  }

  update(dtMs, solids, nowMs, allowWhip = false) {
    const dt = dtMs / 16.6667; // normalize to "60fps units" so tuning numbers stay sane

    // Ducking can only start/stop while grounded -- classic Mario rule.
    if (this.grounded) {
      this.ducking = Input.down();
      this.whipTimer = 0;
      this.whipUsed = false;
    } else if (allowWhip && !this.whipUsed && Input.down()) {
      this.whipUsed = true;
      this.whipTimer = WHIP_DURATION_MS;
      this.whipStarted = true;
      this.vy += WHIP_POP;
      this.vx += this.facing * WHIP_SPEED_BONUS;
    }

    if (this.whipTimer > 0) this.whipTimer -= dtMs;

    // --- Horizontal movement -------------------------------------------------
    const maxSpeed = this.whipTimer > 0
      ? WHIP_MAX_SPEED
      : (this.ducking ? PLAYER_DUCK_MAX_SPEED : PLAYER_MAX_SPEED);
    let moveInput = 0;
    if (!this.ducking) {
      if (Input.left()) moveInput -= 1;
      if (Input.right()) moveInput += 1;
    }
    if (moveInput !== 0) {
      this.vx += moveInput * PLAYER_MOVE_ACCEL * dt;
      this.facing = moveInput;
    } else {
      const decel = PLAYER_FRICTION * dt;
      if (this.vx > 0) this.vx = Math.max(0, this.vx - decel);
      else if (this.vx < 0) this.vx = Math.min(0, this.vx + decel);
    }
    this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

    // --- Jump ------------------------------------------------------------
    if (Input.up() && this.grounded && !this.ducking) {
      this.vy = PLAYER_JUMP_VELOCITY;
      this.grounded = false;
    }

    // --- Gravity -----------------------------------------------------------
    const g = GRAVITY * (this.whipTimer > 0 ? WHIP_GRAVITY_MUL : 1);
    this.vy = Math.min(this.vy + g * dt, MAX_FALL_SPEED);

    // --- Move + collide, one axis at a time ---------------------------------
    this.x += this.vx * dt;
    resolveAxis(this, solids, 'x');
    this.grounded = false;
    this.groundSolid = null;
    this.y += this.vy * dt;
    resolveAxis(this, solids, 'y');

    // --- Animation state -----------------------------------------------------
    this.animTimer += dtMs;
    if (this.animTimer > 120) {
      this.animTimer = 0;
      this.animFrame = 1 - this.animFrame;
    }
  }

  currentSprite() {
    if (!this.grounded) return DUCK_JUMP;
    if (this.ducking) return DUCK_DUCK;
    if (Math.abs(this.vx) > 0.15) return this.animFrame === 0 ? DUCK_RUN1 : DUCK_RUN2;
    return DUCK_IDLE;
  }

  render(ctx, camera, nowMs) {
    const flicker = this.isInvincible(nowMs) && Math.floor(nowMs / 90) % 2 === 0;
    if (flicker) return;
    const grid = isGod() ? withWhiteEye(this.currentSprite()) : this.currentSprite();
    const screenX = this.x - camera.x;
    if (this.whipTimer > 0) {
      const size = spriteSize(grid);
      const spin = (1 - this.whipTimer / WHIP_DURATION_MS) * Math.PI * 2 * this.facing;
      ctx.save();
      ctx.translate(screenX + size.width / 2, this.y + size.height / 2);
      ctx.rotate(spin);
      drawSprite(ctx, grid, -size.width / 2, -size.height / 2, { flip: this.facing < 0 });
      ctx.strokeStyle = 'rgba(255,210,63,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, size.width * 0.55, 0, Math.PI * 1.2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    drawSprite(ctx, grid, screenX, this.y, { flip: this.facing < 0 });
  }
}

/** Discrete AABB collision resolution along a single axis. Simple, cheap,
 * and plenty accurate for our modest platforming speeds. */
function resolveAxis(entity, solids, axis) {
  const box = entity.getHitbox();
  for (const solid of solids) {
    if (!overlaps(box, solid)) continue;
    if (axis === 'x') {
      if (entity.vx > 0) entity.x = solid.x - box.width;
      else if (entity.vx < 0) entity.x = solid.x + solid.width;
      entity.vx = 0;
    } else {
      if (entity.vy > 0) {
        entity.y = solid.y - box.height;
        entity.grounded = true;
        entity.groundSolid = solid; // remembered so moving platforms can carry us
      } else if (entity.vy < 0) {
        entity.y = solid.y + solid.height;
      }
      entity.vy = 0;
    }
    box.x = entity.x;
    box.y = entity.y;
  }
}

export function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
