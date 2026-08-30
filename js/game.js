// Top-level state machine: TITLE -> PLAYING -> WIN / GAMEOVER -> TITLE.
// Owns the update/render loop; delegates specifics to player/enemy/level/
// background/titleScreen modules so this file stays a orchestrator, not
// a dumping ground.

import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y, PLAYER_HEIGHT, PLAYER_MAX_HEARTS } from './constants.js';
import { Input } from './input.js';
import { Player, overlaps } from './player.js';
import { Camera } from './camera.js';
import { createLevel, LEVEL_COUNT } from './level.js';
import {
  renderSky, renderBackground, renderTerrain, renderGoal, renderThemeOverlay,
} from './background.js';
import * as titleScreen from './titleScreen.js';
import { Music } from './music.js';
import { isGod, onGodChange, requestCheatKeyboard } from './cheats.js';

const HUD_HEARTS = { x: 8, y: 6, width: 86, height: 28 };

const RESTART_BUTTON = { x: GAME_WIDTH / 2 - 90, y: 160, width: 180, height: 40 };
const MUTE_BUTTON = { x: GAME_WIDTH - 34, y: 8, width: 26, height: 22 };
const LEVEL_INTRO_MS = 1600; // "LEVEL n" card shown before play begins
// Longer than the intro so the clear fanfare gets to finish before the next
// level's track kicks in -- cutting your own victory music off feels cheap.
const LEVEL_CLEAR_MS = 3200;

export const STATE = {
  TITLE: 'TITLE',
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  WIN: 'WIN',
  GAMEOVER: 'GAMEOVER',
};

export class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.state = STATE.TITLE;
    this.level = null;
    this.player = null;
    this.camera = null;
    this.projectiles = [];
    this.levelIndex = 0;
    this.introUntil = 0;
    this.wasOnCart = false; // edge-detects landing on a cart, for its creak
    onGodChange((on) => {
      if (!on || !this.player) return;
      this.player.dead = false;
      this.player.hearts = PLAYER_MAX_HEARTS;
      if (this.state === STATE.GAMEOVER) {
        this.state = STATE.PLAYING;
        Music.start();
      }
    });
  }

  startGame() {
    this.levelIndex = 0;
    this.loadLevel(0, PLAYER_MAX_HEARTS);
    Music.start(); // no-op if already playing -- safe to call on every (re)start
  }

  /** Build a level and show its intro card. Hearts carry across levels. */
  loadLevel(index, hearts) {
    this.levelIndex = index;
    this.level = createLevel(index);
    this.player = new Player(40, GROUND_Y - PLAYER_HEIGHT);
    this.player.hearts = hearts;
    this.camera = new Camera(this.level.width);
    this.camera.follow(this.player.x);
    this.projectiles = [];
    this.introUntil = performance.now() + LEVEL_INTRO_MS;
    this.state = STATE.INTRO;
    Music.setLevel(index);       // each level gets its own track
    Music.restoreMusicLevel();   // undo any ducking from the clear fanfare
  }

  advanceLevel() {
    const next = this.levelIndex + 1;
    if (next >= LEVEL_COUNT) {
      this.state = STATE.WIN;
      Music.stop();
      Music.playVictoryJingle();
      return;
    }
    // Reward clearing a level with a heart back (capped) so a rough level
    // doesn't doom the whole run.
    const hearts = Math.min(PLAYER_MAX_HEARTS, this.player.hearts + 1);
    this.loadLevel(next, hearts);
    Music.start();
  }

  backToTitle() {
    this.state = STATE.TITLE;
  }

  handleMouseMove(mx, my) {
    if (this.state === STATE.TITLE) titleScreen.setHover(mx, my);
  }

  handleClick(mx, my) {
    if (insideRect(mx, my, MUTE_BUTTON)) {
      Music.toggleMute();
      return;
    }
    if (this.state === STATE.TITLE && titleScreen.isInsideButton(mx, my)) {
      this.startGame();
      return;
    }
    if (this.state === STATE.TITLE && titleScreen.isInsideTitle(mx, my)) {
      requestCheatKeyboard();
      return;
    }
    if (this.state !== STATE.TITLE && insideRect(mx, my, HUD_HEARTS)) {
      requestCheatKeyboard();
      return;
    }
    if ((this.state === STATE.WIN || this.state === STATE.GAMEOVER) && insideRect(mx, my, RESTART_BUTTON)) {
      this.backToTitle();
    }
  }

  update(dtMs, nowMs) {
    // Intro and level-clear cards are timed pauses -- the world holds still.
    if (this.state === STATE.INTRO) {
      if (nowMs >= this.introUntil) this.state = STATE.PLAYING;
      return;
    }
    if (this.state === STATE.LEVEL_CLEAR) {
      if (nowMs >= this.introUntil) this.advanceLevel();
      return;
    }
    if (this.state !== STATE.PLAYING) return;

    const player = this.player;
    const level = this.level;

    // Carts move BEFORE the player so he collides against this frame's
    // position -- otherwise a rising cart clips straight through him.
    for (const cart of level.carts) cart.update(dtMs);

    const wasGrounded = player.grounded;
    const heartsBefore = player.hearts;

    // Carry riders BEFORE the player's own physics, so the deck and its
    // passenger move as one body and collision then resolves exactly once.
    // Doing it afterwards double-applies the motion: resolveAxis has already
    // snapped the rider onto the moved deck, so adding dy again produced a
    // ~1.75px vertical jitter that reversed at each end of a cart's stroke.
    for (const cart of level.carts) cart.carry(player);

    player.update(dtMs, level.solids, nowMs);

    // Left the ground under his own power (not knocked back) -- that's a jump.
    if (wasGrounded && !player.grounded && player.vy < 0) Music.play('jump');

    // Landing on a cart gets its own creak, so riding one is audible.
    const onCart = player.groundSolid && player.groundSolid.isCart;
    if (onCart && !this.wasOnCart) Music.play('cart');
    this.wasOnCart = onCart;

    // Bonus pickups -- the payoff for riding a lift cart up to the high route.
    for (const pickup of level.pickups) {
      pickup.update(dtMs, nowMs);
      const box = pickup.getHitbox();
      if (!box || !overlaps(player.getHitbox(), box)) continue;

      // Don't consume a heart the player can't benefit from -- leave it
      // floating so it's still there after they take a hit.
      if (pickup.kind === 'heart' && player.hearts >= PLAYER_MAX_HEARTS) continue;

      if (pickup.collect()) {
        if (pickup.kind === 'heart') player.hearts += 1;
        Music.play('pickup');
      }
    }
    level.pickups = level.pickups.filter((p) => !p.dead);

    if (Input.shoot()) {
      const shot = player.tryShoot(nowMs);
      if (shot) {
        this.projectiles.push(shot);
        Music.play('shoot');
      }
    }

    for (const shot of this.projectiles) shot.update(dtMs);
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    const playerBox = player.getHitbox();
    for (const frog of level.frogs) {
      frog.update(dtMs, nowMs, playerBox);

      const frogBox = frog.getHitbox();
      if (frogBox && overlaps(playerBox, frogBox)) {
        const stompDepth = playerBox.y + playerBox.height - frogBox.y;
        const isStomp = player.vy > 0 && stompDepth < frogBox.height * 0.6;
        if (isStomp) {
          frog.stomp();
          player.stompBounce();
          Music.play('stomp');
          Music.play('frog');
        } else {
          player.takeDamage(nowMs, frog.x);
        }
      }

      const tongueBox = frog.getTongueHitbox();
      if (tongueBox && overlaps(playerBox, tongueBox)) {
        player.takeDamage(nowMs, frog.x);
      }

      // Announce a tongue lash the frame it starts, so the hazard is audible
      // before it connects rather than only when it hurts you.
      if (frog.state === 'tongue' && !frog.tongueAnnounced) {
        frog.tongueAnnounced = true;
        Music.play('tongue');
      } else if (frog.state !== 'tongue') {
        frog.tongueAnnounced = false;
      }

      if (frogBox) {
        for (const shot of this.projectiles) {
          if (!shot.dead && overlaps(shot.getHitbox(), frogBox)) {
            frog.killByProjectile();
            shot.dead = true;
            Music.play('frog');
          }
        }
      }
    }
    level.frogs = level.frogs.filter((f) => !f.dead);

    // Geese share the frog's stomp/shoot contract, so the same rules apply.
    for (const goose of level.geese) {
      goose.update(dtMs, nowMs);
      const gooseBox = goose.getHitbox();
      if (!gooseBox) continue;

      if (overlaps(playerBox, gooseBox)) {
        const stompDepth = playerBox.y + playerBox.height - gooseBox.y;
        const isStomp = player.vy > 0 && stompDepth < gooseBox.height * 0.7;
        if (isStomp) {
          goose.stomp();
          player.stompBounce();
          Music.play('stomp');
          Music.play('goose');
        } else {
          player.takeDamage(nowMs, goose.x);
        }
      }

      for (const shot of this.projectiles) {
        if (!shot.dead && overlaps(shot.getHitbox(), gooseBox)) {
          goose.killByProjectile();
          shot.dead = true;
          Music.play('goose');
        }
      }
    }
    level.geese = level.geese.filter((g) => !g.dead);

    // Fell in a pond -- ouch, respawn at the last checkpoint reached.
    if (player.y > GAME_HEIGHT + 60) {
      Music.play('splash');
      const checkpointX = [...level.checkpoints].reverse().find((cx) => cx <= player.x) ?? level.checkpoints[0];
      player.takeDamage(nowMs, player.x);
      player.x = checkpointX;
      player.y = GROUND_Y - PLAYER_HEIGHT;
      player.vx = 0;
      player.vy = 0;
    }

    // Any heart lost that wasn't already covered by a splash gets the hurt
    // sting -- checked once here rather than at every damage site.
    if (player.hearts < heartsBefore) Music.play('hurt');

    if (overlaps(playerBox, level.goal)) {
      const isFinalLevel = this.levelIndex >= LEVEL_COUNT - 1;
      if (isFinalLevel) {
        this.state = STATE.WIN;
        Music.stop(); // main theme cuts out -- only the fanfare should play
        Music.playVictoryJingle();
      } else {
        this.state = STATE.LEVEL_CLEAR;
        this.introUntil = nowMs + LEVEL_CLEAR_MS;
        Music.playLevelClearFanfare(); // clearing a level is an achievement too
      }
    }
    if (player.dead && this.state !== STATE.GAMEOVER) {
      if (isGod()) {
        player.dead = false;
        player.hearts = PLAYER_MAX_HEARTS;
      } else {
        this.state = STATE.GAMEOVER;
        Music.stop(); // main theme cuts out -- only the fanfare should play
        Music.playGameOverJingle();
      }
    }

    this.camera.follow(player.x);
  }

  render(nowMs) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (this.state === STATE.TITLE) {
      titleScreen.render(ctx, nowMs);
      drawMuteButton(ctx, Music.muted);
      return;
    }

    const level = this.level;
    renderSky(ctx, level.theme);
    renderBackground(ctx, this.camera, level, nowMs);
    renderTerrain(ctx, this.camera, level);
    for (const cart of level.carts) cart.render(ctx, this.camera);
    for (const pickup of level.pickups) pickup.render(ctx, this.camera);
    for (const frog of level.frogs) frog.render(ctx, this.camera);
    for (const goose of level.geese) goose.render(ctx, this.camera);
    renderGoal(ctx, this.camera, level);
    this.player.render(ctx, this.camera, nowMs);
    for (const shot of this.projectiles) shot.render(ctx, this.camera);

    renderThemeOverlay(ctx, level.theme); // mood wash over the world only
    renderHud(ctx, this.player, level);

    if (this.state === STATE.INTRO) {
      renderCard(ctx, `LEVEL ${level.index + 1}`, level.name, level.subtitle);
    }
    if (this.state === STATE.LEVEL_CLEAR) {
      renderCard(ctx, 'LEVEL CLEAR!', level.name, '+1 heart');
    }
    if (this.state === STATE.WIN) renderEndScreen(ctx, 'YOU WIN!', '#2a9d3f');
    if (this.state === STATE.GAMEOVER) renderEndScreen(ctx, 'GAME OVER', '#e63946');

    drawMuteButton(ctx, Music.muted); // always last so it stays on top of overlays
  }
}

/** Centered banner used for both the level intro and the clear screen. */
function renderCard(ctx, heading, name, note) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, GAME_HEIGHT / 2 - 52, GAME_WIDTH, 104);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23f';
  ctx.font = "20px 'Press Start 2P', monospace";
  ctx.fillText(heading, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16);

  ctx.fillStyle = '#ffffff';
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.fillText(name, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);

  ctx.fillStyle = '#cdeeff';
  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillText(note, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 32);
  ctx.textAlign = 'left';
}

function drawMuteButton(ctx, muted) {
  const b = MUTE_BUTTON;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(b.x, b.y, b.width, b.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x, b.y, b.width, b.height);
  ctx.fillStyle = '#fff';
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(muted ? 'X' : '\u266A', b.x + b.width / 2, b.y + b.height / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function insideRect(mx, my, r) {
  return mx >= r.x && mx <= r.x + r.width && my >= r.y && my <= r.y + r.height;
}

function renderHud(ctx, player, level) {
  const gold = isGod();
  for (let i = 0; i < PLAYER_MAX_HEARTS; i++) {
    drawHeart(ctx, 16 + i * 26, 16, gold || i < player.hearts, gold);
  }

  // Level counter, below the high route. A bonus heart bobs through
  // y=33..57 (baseY 36, +/-3 bob, and the sprite is 6 rows at scale 3 = 18px
  // tall -- it's the sprite HEIGHT that makes the band, and undercounting it
  // is how two earlier attempts at this landed inside the heart).
  ctx.font = "8px 'Press Start 2P', monospace";
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillText(`LEVEL ${level.index + 1}/${LEVEL_COUNT}  ${level.name}`, 16, 66);
}

function drawHeart(ctx, x, y, filled, gold = false) {
  ctx.fillStyle = filled ? (gold ? '#ffd23f' : '#e63946') : 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.arc(x + 5, y + 5, 5, Math.PI, 0);
  ctx.arc(x + 15, y + 5, 5, Math.PI, 0);
  ctx.lineTo(x + 10, y + 18);
  ctx.closePath();
  ctx.fill();
}

function renderEndScreen(ctx, message, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.font = "bold 24px 'Press Start 2P', monospace";
  ctx.fillStyle = color;
  ctx.fillText(message, GAME_WIDTH / 2, 110);

  const b = RESTART_BUTTON;
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(b.x, b.y, b.width, b.height);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x, b.y, b.width, b.height);
  ctx.fillStyle = '#1a1a1a';
  ctx.font = "14px 'Press Start 2P', monospace";
  ctx.fillText('BACK TO TITLE', GAME_WIDTH / 2, b.y + 26);
  ctx.textAlign = 'left';
}
