import {
  GRAVITY, MAX_FALL_SPEED, PLAYER_MOVE_ACCEL, PLAYER_FRICTION,
  PLAYER_MAX_SPEED, PLAYER_DUCK_MAX_SPEED, PLAYER_JUMP_VELOCITY,
  PLAYER_STOMP_BOUNCE, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DUCK_HEIGHT,
  PLAYER_MAX_HEARTS, PLAYER_INVINCIBLE_MS, PROJECTILE_COOLDOWN_MS,
  WHIP_DURATION_MS, WHIP_POP, WHIP_SPEED_BONUS, WHIP_MAX_SPEED, WHIP_MAX_PER_JUMP,
  WHIP_GRAVITY_MUL, WHIP_REACH,
} from './constants.js';
import { DUCK_IDLE, DUCK_RUN1, DUCK_RUN2, DUCK_JUMP, DUCK_DUCK, DUCK_WHIP, withWhiteEye } from './sprites.js';
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
    this.whipsUsed = 0; // per airborne period, reset on landing
    this.whipStarted = false;
    this.wasDown = false;
    this.wasUp = true;  // true so the press that STARTED the jump can't whip
  }

  get width() {
    return PLAYER_WIDTH;
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
    const y = b.y + b.height * 0.4;
    const h = b.height * 0.6;
    if (this.facing > 0) {
      return { x: b.x + b.width * 0.35, y, width: b.width * 0.65 + WHIP_REACH, height: h };
    }
    return { x: b.x - WHIP_REACH, y, width: b.width * 0.65 + WHIP_REACH, height: h };
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

    const down = Input.down();
    const downPressed = down && !this.wasDown;
    const up = Input.up();
    const upPressed = up && !this.wasUp;
    const duckDelta = PLAYER_HEIGHT - PLAYER_DUCK_HEIGHT;

    // Ducking can only start/stop while grounded -- classic Mario rule.
    // Grow/shrink FROM THE FEET so a lily pad doesn't vanish under you.
    if (this.grounded) {
      this.whipTimer = 0;
      this.whipsUsed = 0;
      if (down && !this.ducking) {
        this.y += duckDelta;
        this.ducking = true;
      } else if (!down && this.ducking) {
        const standY = this.y - duckDelta;
        if (fits(solids, this.x, standY, this.width, PLAYER_HEIGHT)) {
          this.y = standY;
          this.ducking = false;
        }
      }
    } else {
      if (this.ducking) {
        this.y -= duckDelta;
        this.ducking = false;
      }
      // Double-jump input: tap jump AGAIN in the air to whip, up to
      // WHIP_MAX_PER_JUMP times. Down still whips too -- it is the older
      // input and the touch pad has a dedicated duck button. Both require
      // a FRESH tap, so holding the button from take-off (or from a
      // crouch) can never auto-whip.
      if (allowWhip && this.whipsUsed < WHIP_MAX_PER_JUMP && (upPressed || downPressed)) {
        this.whipsUsed += 1;
        this.whipTimer = WHIP_DURATION_MS;
        this.whipStarted = true;
        this.vy += WHIP_POP;
        this.vx += this.facing * WHIP_SPEED_BONUS;
      }
    }
    this.wasDown = down;
    this.wasUp = up;

    if (this.whipTimer > 0) this.whipTimer -= dtMs;

    // --- Horizontal movement -------------------------------------------------
    const maxSpeed = this.whipTimer > 0
      ? WHIP_MAX_SPEED
      : (this.ducking ? PLAYER_DUCK_MAX_SPEED : PLAYER_MAX_SPEED);
    let moveInput = 0;
    if (Input.left()) moveInput -= 1;
    if (Input.right()) moveInput += 1;
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
    if (up && this.grounded && !this.ducking) {
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
    if (this.whipTimer > 0) return DUCK_WHIP;
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
    const screenY = this.y - camera.y;
    if (this.whipTimer > 0) {
      renderTailWhip(ctx, grid, screenX, screenY, this.facing, this.whipTimer);
      return;
    }
    drawSprite(ctx, grid, screenX, screenY, { flip: this.facing < 0 });
  }
}

/** Duck stays on the stem; the deck yaws around it on the floor plane and
 * kicks forward -- Mario tail, not a full-body spin (that's a future slam). */
function renderTailWhip(ctx, grid, screenX, y, facing, whipTimer) {
  const size = spriteSize(grid);
  const t = 1 - Math.max(0, whipTimer) / WHIP_DURATION_MS;
  const lean = facing * 0.18;
  ctx.save();
  ctx.translate(screenX + size.width / 2, y + size.height * 0.7);
  ctx.rotate(lean);
  drawSprite(ctx, grid, -size.width / 2, -size.height * 0.7, { flip: facing < 0 });
  ctx.restore();

  const stemX = screenX + (facing > 0 ? size.width * 0.76 : size.width * 0.24);
  const stemY = y + size.height * 0.72;
  const yaw = facing * (-0.35 + t * Math.PI * 1.15);
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const len = 26;
  const endX = stemX + facing * cos * len;
  const endY = stemY + sin * 6;
  const thick = 5 + (1 - Math.abs(cos)) * 5;

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 210, 63, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(stemX, stemY, 16, facing > 0 ? -0.6 : Math.PI - 0.2, facing > 0 ? 0.9 : Math.PI + 0.6);
  ctx.stroke();

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = thick + 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(stemX, stemY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.strokeStyle = '#2a9d3f';
  ctx.lineWidth = thick;
  ctx.beginPath();
  ctx.moveTo(stemX, stemY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(endX, endY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d99ae';
  ctx.beginPath();
  ctx.arc(endX, endY, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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

function fits(solids, x, y, w, h) {
  const box = { x, y, width: w, height: h };
  for (const solid of solids) {
    if (overlaps(box, solid)) return false;
  }
  return true;
}
