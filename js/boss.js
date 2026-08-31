// Boss encounters. Same public shape as Frog/Pig (getHitbox / update /
// render / stomp / killByProjectile) so game.js's hitFoe works on a boss
// unmodified -- HP is an implementation detail hidden behind stomp().
//
// One boss per level, declared in level data as a named object (not a
// positional tuple -- bosses have heterogeneous tuning and cardinality 1):
//   boss: { type: 'work', x: 800, floorY: 18, minX: 180, maxX: 1380, hp: 3 }
//
// Boss-owned hazards (thrown time cards) live inside the boss and are
// exposed via getHazardBoxes(); they are NEVER pushed into the player's
// projectile list, or hitFoe would make the boss shoot itself to death.

const MERCY_MS = 900;        // i-frames after a hit -- hitFoe has no cooldown
const DEATH_FALL_MS = 900;   // comic keel-over before .dead flips
const CARD_GRAVITY = 0.14;   // per-frame at 60fps, dt-normalized in update
const CARD_SIZE = 13;
const FLICKER_MS = 80;       // mercy flicker interval

/**
 * THE FOREMAN -- "Nobody Clocks Out Early." Level 40, top of the mill.
 * Paces between the pie safe and the east wall, telegraphs, charges, and
 * slams into the arena edge; the slam scatters rubber TIME CARD stamps.
 * Three stomps (or whips, or propeller shots) end his shift. Each hit
 * makes him faster and angrier. During mercy frames getHitbox() is null,
 * so he can neither be hit nor hurt by touch -- classic i-frame flicker.
 */
class WorkBoss {
  constructor(spec) {
    this.width = 44;
    this.height = 56;
    this.x = spec.x;
    this.floorY = spec.floorY;
    this.y = spec.floorY - this.height;
    this.minX = spec.minX;
    this.maxX = spec.maxX - this.width;
    this.maxHp = spec.hp ?? 3;
    this.hp = this.maxHp;
    this.title = 'THE FOREMAN';
    this.facing = -1;
    this.state = 'pace'; // pace | windup | charge | dizzy | dying
    this.stateUntil = 0;
    this.now = 0;
    this.mercyUntil = 0;
    this.engaged = false;
    this.defeated = false;
    this.dead = false;
    this.deathTimer = 0;
    this.cards = [];       // thrown hazards: { x, y, vx, vy, spin }
    this.throwPending = false; // game.js consumes these for sfx --
    this.downPending = false;  // entities never import Music themselves
    this.wobble = 0;
  }

  get angerLevel() {
    return this.maxHp - this.hp; // 0..maxHp-1 while alive
  }

  getHitbox() {
    if (this.state === 'dying' || this.dead) return null;
    if (this.now < this.mercyUntil) return null; // i-frames
    return { x: this.x + 4, y: this.y + 6, width: this.width - 8, height: this.height - 6 };
  }

  getHazardBoxes() {
    return this.cards.map((c) => ({ x: c.x, y: c.y, width: CARD_SIZE, height: CARD_SIZE }));
  }

  takeHit(n) {
    if (this.state === 'dying' || this.now < this.mercyUntil) return;
    this.hp -= n;
    this.mercyUntil = this.now + MERCY_MS;
    if (this.hp <= 0) {
      this.state = 'dying';
      this.deathTimer = DEATH_FALL_MS;
      this.downPending = true;
      this.cards = []; // paperwork stops mattering the moment the shift ends
    } else {
      // A hit interrupts whatever he was doing -- brief dizzy, then angrier.
      this.state = 'dizzy';
      this.stateUntil = this.now + 900;
    }
  }

  stomp() { this.takeHit(1); }
  killByProjectile() { this.takeHit(1); }

  throwCards(count, dir) {
    for (let i = 0; i < count; i++) {
      this.cards.push({
        x: this.x + this.width / 2,
        y: this.y + 10,
        vx: dir * (1.4 + i * 0.8),
        vy: -3.6 - i * 0.3,
        spin: Math.random() * Math.PI,
      });
    }
    this.throwPending = true;
  }

  update(dtMs, nowMs, playerBox) {
    this.now = nowMs;
    const f = dtMs / (1000 / 60); // frame factor, same dt style as player.js

    if (this.state === 'dying') {
      this.deathTimer -= dtMs;
      if (this.deathTimer <= 0 && !this.defeated) {
        this.defeated = true;
        this.dead = true;
      }
      return;
    }

    // Wake up when Scoot reaches the top floor and gets close.
    if (!this.engaged && playerBox
        && Math.abs(playerBox.x - this.x) < 480
        && playerBox.y < this.floorY + 140) {
      this.engaged = true;
    }
    if (!this.engaged) return;

    const anger = this.angerLevel;
    switch (this.state) {
      case 'pace': {
        // Drift toward the duck, then commit to a charge.
        const targetX = playerBox ? playerBox.x : this.x;
        this.facing = targetX < this.x ? -1 : 1;
        this.x += this.facing * (1.1 + anger * 0.35) * f;
        if (!this.stateUntil) this.stateUntil = nowMs + 1400 - anger * 250;
        if (nowMs >= this.stateUntil) {
          this.state = 'windup';
          this.stateUntil = nowMs + 650 - anger * 120;
        }
        break;
      }
      case 'windup':
        // Telegraph: lean back, clipboard up. Direction locks here.
        if (nowMs >= this.stateUntil) {
          this.state = 'charge';
          this.stateUntil = 0;
        }
        break;
      case 'charge':
        this.x += this.facing * (4.2 + anger * 0.7) * f;
        if (this.x <= this.minX || this.x >= this.maxX) {
          this.x = Math.max(this.minX, Math.min(this.x, this.maxX));
          this.state = 'dizzy';
          this.stateUntil = nowMs + 1500 - anger * 200;
          this.throwCards(2 + (anger >= 2 ? 1 : 0), -this.facing);
        }
        break;
      case 'dizzy':
        this.wobble += dtMs;
        if (nowMs >= this.stateUntil) {
          this.state = 'pace';
          this.stateUntil = 0;
        }
        break;
    }
    this.x = Math.max(this.minX, Math.min(this.x, this.maxX));

    for (const card of this.cards) {
      card.x += card.vx * f;
      card.vy += CARD_GRAVITY * f;
      card.y += card.vy * f;
      card.spin += 0.2 * f;
    }
    this.cards = this.cards.filter((c) => c.y < this.floorY + 600);
  }

  render(ctx, camera) {
    this.renderCards(ctx, camera);
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    if (sx < -80 || sx > ctx.canvas.width + 80) return;

    // Mercy flicker: skip every other slice so hits read as i-frames.
    const flicker = this.now < this.mercyUntil
      && Math.floor(this.now / FLICKER_MS) % 2 === 0;
    if (flicker && this.state !== 'dying') return;

    ctx.save();
    if (this.state === 'dying') {
      // Comic keel-over: fade while tipping about the bottom edge.
      const t = Math.max(0, this.deathTimer / DEATH_FALL_MS);
      ctx.globalAlpha = t;
      ctx.translate(sx + this.width / 2, sy + this.height);
      ctx.rotate((1 - t) * (Math.PI / 2) * this.facing);
      ctx.translate(-this.width / 2, -this.height);
    } else if (this.state === 'dizzy') {
      ctx.translate(sx + this.width / 2, sy);
      ctx.rotate(Math.sin(this.wobble / 90) * 0.12);
      ctx.translate(-this.width / 2, 0);
    } else {
      ctx.translate(sx, sy);
    }
    this.drawBody(ctx, this.state === 'windup' ? -1 : 0);
    ctx.restore();
  }

  drawBody(ctx, lean) {
    const w = this.width;
    const flip = this.facing < 0;
    const leanX = lean * 4 * this.facing;
    // Burly beaver foreman: brown fur, denim overalls, hard hat, clipboard.
    ctx.fillStyle = '#7a4f2b';                       // fur
    ctx.fillRect(6 + leanX, 14, w - 12, 26);         // torso
    ctx.fillStyle = '#3a5a8c';                       // overalls
    ctx.fillRect(6 + leanX, 28, w - 12, 20);
    ctx.fillRect(12 + leanX, 20, 4, 10);             // straps
    ctx.fillRect(w - 16 + leanX, 20, 4, 10);
    ctx.fillStyle = '#7a4f2b';
    ctx.fillRect(8, 46, 10, 10);                     // legs
    ctx.fillRect(w - 18, 46, 10, 10);
    ctx.fillRect(10 + leanX, 0, w - 20, 18);         // head
    ctx.fillStyle = '#f2c14e';                       // hard hat
    ctx.fillRect(8 + leanX, -4, w - 16, 6);
    ctx.fillRect(12 + leanX, -8, w - 24, 5);
    ctx.fillStyle = '#fff';                          // beaver teeth
    ctx.fillRect((flip ? 12 : w - 20) + leanX, 12, 8, 6);
    ctx.fillStyle = this.state === 'dizzy' ? '#fff' : '#1d1d1d'; // eyes
    ctx.fillRect((flip ? 13 : w - 19) + leanX, 4, 4, 4);
    ctx.fillRect((flip ? 21 : w - 27) + leanX, 4, 4, 4);
    ctx.fillStyle = '#d9d2c0';                       // clipboard
    ctx.fillRect((flip ? w - 10 : -4) + leanX, 22, 12, 16);
    ctx.fillStyle = '#8c2f2f';                       // MILL PROPERTY stamp
    ctx.fillRect((flip ? w - 7 : -1) + leanX, 26, 6, 4);
  }

  renderCards(ctx, camera) {
    for (const card of this.cards) {
      ctx.save();
      ctx.translate(card.x - camera.x + CARD_SIZE / 2, card.y - camera.y + CARD_SIZE / 2);
      ctx.rotate(card.spin);
      ctx.fillStyle = '#d9d2c0';
      ctx.fillRect(-CARD_SIZE / 2, -CARD_SIZE / 2, CARD_SIZE, CARD_SIZE);
      ctx.fillStyle = '#8c2f2f';
      ctx.fillRect(-CARD_SIZE / 2 + 2, -2, CARD_SIZE - 4, 4);
      ctx.restore();
    }
  }
}

const BOSS_TYPES = { work: WorkBoss };

/** Build a boss from its level-data spec. Unknown types fail LOUDLY at
 *  level load, not silently at first render. */
export function createBoss(spec) {
  const BossClass = BOSS_TYPES[spec.type];
  if (!BossClass) throw new Error(`unknown boss type: ${spec.type}`);
  return new BossClass(spec);
}
