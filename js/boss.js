// Boss encounters. Bosses are entities, not game states: level data declares
// them as a named object (heterogeneous tuning, cardinality 1):
//   boss: { type: 'work', x: 820, floorY: 18, minX: 200, maxX: 1420, hp: 6 }
// and game.js runs one dedicated combat block against them.
//
// Bosses do NOT go through hitFoe: the whole point of a boss is that the
// hit-source matters (whip lands, stomp clanks off the hard hat, propeller
// shots get eaten by the clipboard), and hitFoe deliberately erases the
// source. Boss-owned hazards (cards, shockwaves) are exposed through
// getHazardBoxes() and are never pushed into the player's projectile list.
//
// Sfx: bosses set *Pending flags; game.js consumes them and calls
// Music.play -- entities never import Music (frog-tongue precedent).

const MERCY_MS = 900;          // i-frames after a landed whip
const BLOCK_COOLDOWN_MS = 250; // don't machine-gun the clank sound
const DEATH_FALL_MS = 900;
const CARD_GRAVITY = 0.14;     // per 60fps frame, dt-normalized in update
const CARD_SIZE = 13;
const WAVE_W = 18;
const WAVE_H = 14;
const FLICKER_MS = 80;

/**
 * THE FOREMAN -- "Nobody Clocks Out Early." Level 40, top of the mill.
 *
 * Whip-only: his hard hat beats stomps and his clipboard beats paperwork
 * (propeller shots). He is vulnerable ONLY while dizzy (after slamming a
 * wall) or recovering (after a ground pound) -- whip him mid-attack and he
 * blocks. The fight is dodge -> window -> strike:
 *   - CHARGE: head-down dash, low profile; hop onto an arena platform and
 *     let him pass. He hits the wall and goes dizzy (long window).
 *   - POUND: leaps to where you are and slams the floor, sending a
 *     shockwave both ways along the ledge; jump it or perch. Short window.
 *   - VOLLEY: hurls aimed TIME CARDS in arcs; keep moving.
 * Every lost point of HP makes everything faster and adds cards.
 */
class WorkBoss {
  constructor(spec) {
    this.width = 66;   // 1.5x the original build -- he got a promotion
    this.height = 84;
    this.x = spec.x;
    this.floorY = spec.floorY;
    this.y = spec.floorY - this.height;
    this.minX = spec.minX;
    this.maxX = spec.maxX - this.width;
    this.maxHp = spec.hp ?? 6;
    this.hp = this.maxHp;
    this.title = 'THE FOREMAN';
    this.facing = -1;
    this.state = 'pace'; // pace|windup|charge|dizzy|volley|pound|recover|dying
    this.stateUntil = 0;
    this.now = 0;
    this.mercyUntil = 0;
    this.blockMutedUntil = 0;
    this.engaged = false;
    this.defeated = false;
    this.dead = false;
    this.deathTimer = 0;
    this.vy = 0;            // only used mid-pound
    this.poundVx = 0;
    this.volleyLeft = 0;
    this.volleyNextAt = 0;
    this.cards = [];        // { x, y, vx, vy, spin }
    this.waves = [];        // { x, y, vx }
    this.throwPending = false;
    this.slamPending = false;
    this.blockPending = false;
    this.downPending = false;
    this.wobble = 0;
  }

  get anger() {
    return this.maxHp - this.hp;
  }

  /** Speed multiplier: 1.0 fresh, up to ~1.5 at one HP left. */
  get haste() {
    return 1 + this.anger * (0.5 / Math.max(1, this.maxHp - 1));
  }

  get vulnerable() {
    return this.state === 'dizzy' || this.state === 'recover';
  }

  getHitbox() {
    if (this.state === 'dying' || this.dead) return null;
    if (this.now < this.mercyUntil) return null; // i-frames
    if (this.state === 'charge') {
      // Head-down linebacker profile: low enough that a duck perched on an
      // arena platform (top y -40) clears him with room to spare.
      return { x: this.x + 4, y: this.floorY - 46, width: this.width - 8, height: 46 };
    }
    return { x: this.x + 6, y: this.y + 8, width: this.width - 12, height: this.height - 8 };
  }

  getHazardBoxes() {
    const boxes = this.cards.map((c) => ({ x: c.x, y: c.y, width: CARD_SIZE, height: CARD_SIZE }));
    for (const w of this.waves) {
      boxes.push({ x: w.x, y: w.y, width: WAVE_W, height: WAVE_H });
    }
    return boxes;
  }

  /**
   * The ONLY damage path. Returns true if the hit landed so game.js can
   * play the hit sound; a block sets blockPending instead (clank).
   */
  whipHit() {
    if (this.state === 'dying' || this.now < this.mercyUntil) return false;
    if (!this.vulnerable) {
      if (this.now >= this.blockMutedUntil) {
        this.blockPending = true;
        this.blockMutedUntil = this.now + BLOCK_COOLDOWN_MS;
      }
      return false;
    }
    this.hp -= 1;
    this.mercyUntil = this.now + MERCY_MS;
    if (this.hp <= 0) {
      this.state = 'dying';
      this.deathTimer = DEATH_FALL_MS;
      this.downPending = true;
      this.cards = [];
      this.waves = [];
    }
    return true;
  }

  /** Deflections that aren't whips: hard hat, clipboard. Just the clank. */
  deflect() {
    if (this.now >= this.blockMutedUntil) {
      this.blockPending = true;
      this.blockMutedUntil = this.now + BLOCK_COOLDOWN_MS;
    }
  }

  throwCard(vx, vy) {
    this.cards.push({
      x: this.x + this.width / 2,
      y: this.y + 16,
      vx, vy,
      spin: Math.random() * Math.PI,
    });
    this.throwPending = true;
  }

  chooseAttack(playerBox, nowMs) {
    const dist = Math.abs((playerBox.x + playerBox.width / 2) - (this.x + this.width / 2));
    const r = Math.random();
    if (dist > 300 ? r < 0.55 : r < 0.25) {
      this.state = 'windup';
      this.stateUntil = nowMs + 520 / this.haste;
    } else if (dist <= 300 && r < 0.7) {
      // Leap to where the duck is standing; landing slams the floor.
      this.state = 'pound';
      this.vy = -8;
      const targetX = playerBox.x + playerBox.width / 2 - this.width / 2;
      const airFrames = 46; // ~2*|vy|/gravity at 60fps
      this.poundVx = Math.max(-6, Math.min(6, (targetX - this.x) / airFrames));
    } else {
      this.state = 'volley';
      this.volleyLeft = 3 + (this.anger >= 2 ? 1 : 0) + (this.anger >= 4 ? 1 : 0);
      this.volleyNextAt = nowMs;
      this.stateUntil = 0;
    }
  }

  update(dtMs, nowMs, playerBox) {
    this.now = nowMs;
    const f = dtMs / (1000 / 60);

    if (this.state === 'dying') {
      this.deathTimer -= dtMs;
      if (this.deathTimer <= 0 && !this.defeated) {
        this.defeated = true;
        this.dead = true;
      }
      return;
    }

    if (!this.engaged && playerBox
        && Math.abs(playerBox.x - this.x) < 480
        && playerBox.y < this.floorY + 140) {
      this.engaged = true;
    }
    if (!this.engaged) return;

    const playerMidX = playerBox ? playerBox.x + playerBox.width / 2 : this.x;
    switch (this.state) {
      case 'pace': {
        this.facing = playerMidX < this.x + this.width / 2 ? -1 : 1;
        this.x += this.facing * 1.2 * this.haste * f;
        if (!this.stateUntil) this.stateUntil = nowMs + 1000 / this.haste;
        if (nowMs >= this.stateUntil) {
          this.stateUntil = 0;
          if (playerBox) this.chooseAttack(playerBox, nowMs);
        }
        break;
      }
      case 'windup': // lean back, direction locks at launch
        if (nowMs >= this.stateUntil) {
          this.facing = playerMidX < this.x + this.width / 2 ? -1 : 1;
          this.state = 'charge';
        }
        break;
      case 'charge':
        this.x += this.facing * Math.min(7, 5 * this.haste) * f;
        if (this.x <= this.minX || this.x >= this.maxX) {
          this.x = Math.max(this.minX, Math.min(this.x, this.maxX));
          this.state = 'dizzy';
          this.stateUntil = nowMs + 2000;
          this.wobble = 0;
          // The impact shakes two cards loose, tossed back into the arena.
          this.throwCard(-this.facing * 1.6, -3.4);
          this.throwCard(-this.facing * 2.6, -3.8);
        }
        break;
      case 'pound':
        this.x += this.poundVx * f;
        this.vy += 0.35 * f;
        this.y += this.vy * f;
        if (this.vy > 0 && this.y >= this.floorY - this.height) {
          this.y = this.floorY - this.height;
          this.vy = 0;
          this.slamPending = true;
          this.waves.push({ x: this.x - WAVE_W, y: this.floorY - WAVE_H, vx: -3.2 * this.haste });
          this.waves.push({ x: this.x + this.width, y: this.floorY - WAVE_H, vx: 3.2 * this.haste });
          this.state = 'recover';
          this.stateUntil = nowMs + 900;
          this.wobble = 0;
        }
        break;
      case 'volley':
        this.facing = playerMidX < this.x + this.width / 2 ? -1 : 1;
        if (this.volleyLeft > 0 && nowMs >= this.volleyNextAt) {
          this.volleyLeft -= 1;
          this.volleyNextAt = nowMs + 240 / this.haste;
          // Aimed: lead toward the duck with a little spread per card.
          const aim = Math.max(-4, Math.min(4, (playerMidX - (this.x + this.width / 2)) / 90));
          this.throwCard(aim + (Math.random() - 0.5), -3.2 - Math.random() * 0.6);
        }
        if (this.volleyLeft <= 0) {
          this.state = 'pace';
          this.stateUntil = 0;
        }
        break;
      case 'dizzy':
      case 'recover':
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

    for (const wave of this.waves) wave.x += wave.vx * f;
    // Shockwaves die at the ledge ends (the arena floor spans the ledge).
    this.waves = this.waves.filter((w) => w.x > this.minX - 120 && w.x < this.maxX + this.width + 120);
  }

  render(ctx, camera) {
    this.renderHazards(ctx, camera);
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    if (sx < -120 || sx > ctx.canvas.width + 120) return;

    const flicker = this.now < this.mercyUntil
      && Math.floor(this.now / FLICKER_MS) % 2 === 0;
    if (flicker && this.state !== 'dying') return;

    ctx.save();
    if (this.state === 'dying') {
      const t = Math.max(0, this.deathTimer / DEATH_FALL_MS);
      ctx.globalAlpha = t;
      ctx.translate(sx + this.width / 2, sy + this.height);
      ctx.rotate((1 - t) * (Math.PI / 2) * this.facing);
      ctx.translate(-this.width / 2, -this.height);
    } else if (this.vulnerable) {
      ctx.translate(sx + this.width / 2, sy);
      ctx.rotate(Math.sin(this.wobble / 90) * 0.12);
      ctx.translate(-this.width / 2, 0);
    } else {
      ctx.translate(sx, sy);
    }
    // Body art is authored at 44x56; he is drawn at 1.5x.
    ctx.scale(this.width / 44, this.height / 56);
    const lean = this.state === 'windup' ? -1 : this.state === 'charge' ? 1 : 0;
    this.drawBody(ctx, lean);
    ctx.restore();
  }

  drawBody(ctx, lean) {
    const w = 44; // authoring size; render() scales to this.width/height
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
    ctx.fillStyle = this.vulnerable ? '#fff' : '#1d1d1d'; // eyes
    ctx.fillRect((flip ? 13 : w - 19) + leanX, 4, 4, 4);
    ctx.fillRect((flip ? 21 : w - 27) + leanX, 4, 4, 4);
    ctx.fillStyle = '#d9d2c0';                       // clipboard
    ctx.fillRect((flip ? w - 10 : -4) + leanX, 22, 12, 16);
    ctx.fillStyle = '#8c2f2f';                       // MILL PROPERTY stamp
    ctx.fillRect((flip ? w - 7 : -1) + leanX, 26, 6, 4);
  }

  renderHazards(ctx, camera) {
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
    for (const wave of this.waves) {
      const wx = wave.x - camera.x;
      const wy = wave.y - camera.y;
      ctx.fillStyle = 'rgba(122, 99, 68, 0.85)'; // dust ridge along the floor
      ctx.beginPath();
      ctx.moveTo(wx, wy + WAVE_H);
      ctx.quadraticCurveTo(wx + WAVE_W / 2, wy - 6, wx + WAVE_W, wy + WAVE_H);
      ctx.closePath();
      ctx.fill();
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
