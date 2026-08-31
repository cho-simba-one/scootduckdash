// Top-level state machine: TITLE -> PLAYING -> WIN / GAMEOVER -> TITLE.
// Owns the update/render loop; delegates specifics to player/enemy/level/
// background/titleScreen modules so this file stays a orchestrator, not
// a dumping ground.

import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y, PLAYER_HEIGHT, PLAYER_MAX_HEARTS } from './constants.js';
import { Input } from './input.js';
import { Player, overlaps } from './player.js';
import { Pickup } from './pickups.js';
import { Camera } from './camera.js';
import { createLevel, LEVEL_COUNT, STAGE_NAMES } from './level.js';
import { markEgg, consumeLuckyRun, eggCount, allEggsFound } from './secrets.js';
import {
  renderSky, renderBackground, renderTerrain, renderGoal, renderThemeOverlay,
} from './background.js';
import * as titleScreen from './titleScreen.js';
import * as controlsScreen from './controlsScreen.js';
import { Music } from './music.js';
import { isGod, isWarp, onGodChange, onWarpChange, requestCheatKeyboard } from './cheats.js';

const HUD_HEARTS = { x: 8, y: 6, width: 86, height: 28 };

const RESTART_BUTTON = { x: GAME_WIDTH / 2 - 90, y: 160, width: 180, height: 40 };
const MUTE_BUTTON = { x: GAME_WIDTH - 34, y: 8, width: 26, height: 22 };
const LEVEL_START_BUTTON = { x: GAME_WIDTH / 2 - 70, y: 214, width: 140, height: 36 };
const WARP_START_BUTTON = { x: GAME_WIDTH / 2 - 70, y: 214, width: 140, height: 36 };
const WARP_LIST = { x: 24, y: 36, width: GAME_WIDTH - 48, rowH: 22, rows: 6 };
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
    this.introHover = false;
    this.shotsThisLevel = 0;
    this.ignoreShoot = false;
    this.warpIndex = 0;
    this.warpScroll = 0;
    this.warpHoverRow = -1;
    this.warpUp = false;
    this.warpDown = false;
    this.warpHold = 0;
    this.pointer = false;
    this.showControls = false;
    this.controlsHover = false;
    this.keyCWas = false;
    this.titleShootWas = true; // true so a held Space can't insta-start on load
    onGodChange((on) => {
      if (!on || !this.player) return;
      this.player.dead = false;
      this.player.hearts = PLAYER_MAX_HEARTS;
      if (this.state === STATE.GAMEOVER) {
        this.state = STATE.PLAYING;
        Music.start();
      }
    });
    onWarpChange((on) => {
      if (!on) return;
      if (this.state === STATE.TITLE || !this.player) return;
      // Drop back to the current intro so the picker is on screen now,
      // not only after the next clear.
      this.warpIndex = this.levelIndex;
      this.ensureWarpVisible();
      this.loadLevel(this.levelIndex, this.player.hearts);
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
    const spawn = this.level.spawn;
    this.player = new Player(spawn.x, spawn.y);
    this.player.hearts = hearts;
    this.camera = new Camera(this.level.width, {
      explore: this.level.world === 'mill',
      minY: this.level.camMinY,
      maxY: 0,
    });
    this.camera.follow(this.player.x, this.player.y, this.player.facing);
    this.level.lastSave = { x: spawn.x, y: spawn.y };
    this.projectiles = [];
    this.shotsThisLevel = 0;
    this.ignoreShoot = false;
    this.state = STATE.INTRO;
    this.warpIndex = index;
    this.ensureWarpVisible();
    Music.setLevel(index);       // each level gets its own track
    Music.restoreMusicLevel();   // undo any ducking from the clear fanfare
    if (consumeLuckyRun()) {
      this.level.pickups.push(new Pickup(80, GROUND_Y - 54, 'heart'));
    }
  }

  ensureWarpVisible() {
    const { rows } = WARP_LIST;
    if (this.warpIndex < this.warpScroll) this.warpScroll = this.warpIndex;
    if (this.warpIndex >= this.warpScroll + rows) {
      this.warpScroll = this.warpIndex - rows + 1;
    }
    const maxScroll = Math.max(0, STAGE_NAMES.length - rows);
    if (this.warpScroll > maxScroll) this.warpScroll = maxScroll;
    if (this.warpScroll < 0) this.warpScroll = 0;
  }

  warpTo(index) {
    const count = STAGE_NAMES.length;
    const next = ((index % count) + count) % count;
    if (next === this.levelIndex && this.state === STATE.INTRO) {
      this.warpIndex = next;
      this.ensureWarpVisible();
      return;
    }
    const hearts = this.player ? this.player.hearts : PLAYER_MAX_HEARTS;
    this.loadLevel(next, hearts);
    Music.start();
  }

  startButton() {
    return isWarp() && this.state === STATE.INTRO ? WARP_START_BUTTON : LEVEL_START_BUTTON;
  }

  beginLevel() {
    this.state = STATE.PLAYING;
    this.ignoreShoot = true;
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
    let hearts = Math.min(PLAYER_MAX_HEARTS, this.player.hearts + 1);
    if (this.shotsThisLevel === 0) {
      hearts = Math.min(PLAYER_MAX_HEARTS, hearts + 1);
    }
    this.loadLevel(next, hearts);
    Music.start();
  }

  backToTitle() {
    this.state = STATE.TITLE;
  }

  handleMouseMove(mx, my) {
    this.pointer = false;
    if (this.state === STATE.TITLE) {
      this.controlsHover = controlsScreen.isInsideControlsButton(mx, my);
      this.pointer = titleScreen.setHover(mx, my) || titleScreen.isInsideTitle(mx, my)
        || this.controlsHover;
      return;
    }
    if (this.state === STATE.INTRO) {
      this.introHover = insideRect(mx, my, this.startButton());
      this.warpHoverRow = (isWarp() && !this.introHover) ? warpRowAt(my, this.warpScroll) : -1;
      this.pointer = this.introHover || this.warpHoverRow >= 0 || (isWarp() && !!warpCaretAt(mx, my));
      return;
    }
    if (this.state === STATE.WIN || this.state === STATE.GAMEOVER) {
      this.pointer = insideRect(mx, my, RESTART_BUTTON);
    }
  }

  handleClick(mx, my) {
    if (insideRect(mx, my, MUTE_BUTTON)) {
      Music.toggleMute();
      return;
    }
    if (this.showControls && this.state !== STATE.PLAYING) {
      this.showControls = false; // any tap closes the overlay
      return;
    }
    if (this.state === STATE.TITLE && controlsScreen.isInsideControlsButton(mx, my)) {
      this.showControls = true;
      return;
    }
    if (this.state === STATE.TITLE && titleScreen.isInsideButton(mx, my)) {
      this.startGame();
      return;
    }
    if (this.state === STATE.TITLE && titleScreen.isInsideDuck(mx, my)) {
      titleScreen.tapDuck();
      return;
    }
    if (this.state === STATE.INTRO && isWarp()) {
      if (insideRect(mx, my, WARP_START_BUTTON)) {
        this.beginLevel();
        return;
      }
      const caret = warpCaretAt(mx, my);
      if (caret === 'up') {
        this.warpTo(this.levelIndex - WARP_LIST.rows);
        return;
      }
      if (caret === 'down') {
        this.warpTo(this.levelIndex + WARP_LIST.rows);
        return;
      }
      const row = warpRowAt(my, this.warpScroll);
      if (row >= 0) {
        this.warpTo(row);
        return;
      }
    }
    if (this.state === STATE.INTRO && insideRect(mx, my, this.startButton())) {
      this.beginLevel();
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
    // Controls overlay: the C key or a gamepad's SELECT toggles it on any
    // non-play screen. While open it swallows menu input so START can't
    // accidentally begin a level underneath it.
    const keyC = Input.keyDown('KeyC');
    const togglePressed = (keyC && !this.keyCWas) || Input.selectEdge();
    this.keyCWas = keyC;
    if (togglePressed && this.state !== STATE.PLAYING) {
      this.showControls = !this.showControls;
    }
    if (this.showControls && this.state !== STATE.PLAYING) {
      this.titleShootWas = Input.shoot();
      return;
    }

    // Title: a gamepad START / Space begins the game (rising edge only,
    // so returning from a run with the button held doesn't restart).
    if (this.state === STATE.TITLE) {
      const shoot = Input.shoot();
      if (shoot && !this.titleShootWas) this.startGame();
      this.titleShootWas = shoot;
      return;
    }

    // Intro waits on START (click/tap or Space). Level-clear is still timed
    // so the fanfare can finish.
    if (this.state === STATE.INTRO) {
      if (isWarp()) {
        const up = Input.up();
        const down = Input.down();
        if (up && !down) {
          if (!this.warpUp) {
            this.warpTo(this.levelIndex - 1);
            this.warpHold = 0;
          } else {
            this.warpHold += dtMs;
            if (this.warpHold > 280) {
              this.warpTo(this.levelIndex - 1);
              this.warpHold = 90;
            }
          }
        } else if (down && !up) {
          if (!this.warpDown) {
            this.warpTo(this.levelIndex + 1);
            this.warpHold = 0;
          } else {
            this.warpHold += dtMs;
            if (this.warpHold > 280) {
              this.warpTo(this.levelIndex + 1);
              this.warpHold = 90;
            }
          }
        } else {
          this.warpHold = 0;
        }
        this.warpUp = up;
        this.warpDown = down;
      } else {
        this.warpUp = false;
        this.warpDown = false;
        this.warpHold = 0;
      }
      if (Input.shoot()) this.beginLevel();
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
    for (const taxi of level.taxis) taxi.update(dtMs);
    for (const crane of level.cranes) crane.update(dtMs);

    const wasGrounded = player.grounded;
    const heartsBefore = player.hearts;

    // Carry riders BEFORE the player's own physics, so the deck and its
    // passenger move as one body and collision then resolves exactly once.
    // Doing it afterwards double-applies the motion: resolveAxis has already
    // snapped the rider onto the moved deck, so adding dy again produced a
    // ~1.75px vertical jitter that reversed at each end of a cart's stroke.
    for (const cart of level.carts) cart.carry(player);
    for (const taxi of level.taxis) taxi.carry(player);
    for (const crane of level.cranes) crane.carry(player);

    player.update(dtMs, level.solids, nowMs, level.allowWhip);
    if (player.whipStarted) {
      player.whipStarted = false;
      Music.play('whip');
    }

    if (player.groundSolid && player.groundSolid.belt) {
      player.x += player.groundSolid.belt * 1.55 * (dtMs / 16.6667);
    }

    if (level.wind && !player.grounded) {
      player.vx += level.wind * (dtMs / 16.6667);
    }

    for (const pad of level.bounces) {
      pad.update(dtMs);
      if (player.vy > 0.4 && overlaps(player.getHitbox(), pad.getHitbox())) {
        player.vy = pad.bounce();
        player.grounded = false;
        player.groundSolid = null;
        Music.play('bounce');
      }
    }

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
        if (pickup.kind === 'egg') {
          markEgg(this.levelIndex);
          Music.play('egg');
        } else {
          Music.play('pickup');
        }
      }
    }
    level.pickups = level.pickups.filter((p) => !p.dead);

    if (this.ignoreShoot) {
      this.ignoreShoot = false;
    } else if (Input.shoot()) {
      const shot = player.tryShoot(nowMs);
      if (shot) {
        this.projectiles.push(shot);
        this.shotsThisLevel += 1;
        Music.play('shoot');
      }
    }

    for (const shot of this.projectiles) shot.update(dtMs);
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    const playerBox = player.getHitbox();
    for (const frog of level.frogs) {
      frog.update(dtMs, nowMs, playerBox);

      const frogBox = frog.getHitbox();
      if (frogBox && player.isWhipping() && overlaps(player.getWhipHitbox(), frogBox)) {
        frog.stomp();
        Music.play('whip');
        Music.play('frog');
      } else if (frogBox && overlaps(playerBox, frogBox)) {
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

      if (player.isWhipping() && overlaps(player.getWhipHitbox(), gooseBox)) {
        goose.stomp();
        Music.play('whip');
        Music.play('goose');
      } else if (overlaps(playerBox, gooseBox)) {
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

    for (const pig of level.pigs) {
      pig.update(dtMs, nowMs, playerBox);
      hitFoe(player, playerBox, this.projectiles, pig, nowMs, 'pig');
    }
    level.pigs = level.pigs.filter((p) => !p.dead);

    for (const bee of level.bees) {
      bee.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, bee, nowMs, 'bee');
    }
    level.bees = level.bees.filter((b) => !b.dead);

    for (const mole of level.moles) {
      mole.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, mole, nowMs, 'mole');
    }
    level.moles = level.moles.filter((m) => !m.dead);

    for (const crow of level.crows) {
      crow.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, crow, nowMs, 'crow');
    }
    level.crows = level.crows.filter((c) => !c.dead);

    for (const rat of level.rats) {
      rat.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, rat, nowMs, 'rat');
    }
    level.rats = level.rats.filter((r) => !r.dead);

    for (const pigeon of level.pigeons) {
      pigeon.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, pigeon, nowMs, 'pigeon');
    }
    level.pigeons = level.pigeons.filter((p) => !p.dead);

    for (const snake of level.snakes) {
      snake.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, snake, nowMs, 'snake');
    }
    level.snakes = level.snakes.filter((s) => !s.dead);

    for (const scorp of level.scorpions) {
      scorp.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, scorp, nowMs, 'scorpion');
    }
    level.scorpions = level.scorpions.filter((s) => !s.dead);

    for (const goat of level.goats) {
      goat.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, goat, nowMs, 'goat');
    }
    level.goats = level.goats.filter((g) => !g.dead);

    for (const hawk of level.hawks) {
      hawk.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, hawk, nowMs, 'hawk');
    }
    level.hawks = level.hawks.filter((h) => !h.dead);

    for (const cat of level.cats) {
      cat.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, cat, nowMs, 'cat');
    }
    level.cats = level.cats.filter((c) => !c.dead);

    for (const drone of level.drones) {
      drone.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, drone, nowMs, 'drone');
    }
    level.drones = level.drones.filter((d) => !d.dead);

    for (const dump of level.dumpsters) {
      dump.update(dtMs);
      hitFoe(player, playerBox, this.projectiles, dump, nowMs, 'dumpster');
    }
    level.dumpsters = level.dumpsters.filter((d) => !d.dead);

    for (const wave of level.traffic) {
      wave.update(dtMs);
      const box = wave.getHitbox();
      if (box && overlaps(playerBox, box)) {
        const stompDepth = playerBox.y + playerBox.height - box.y;
        const isStomp = player.vy > 0 && stompDepth < box.height * 0.7;
        if (isStomp) {
          player.stompBounce();
          Music.play('stomp');
        } else {
          player.takeDamage(nowMs, wave.x);
        }
      }
    }

    for (const taxi of level.taxis) {
      if (player.groundSolid === taxi.solid) continue;
      const box = taxi.getHitbox();
      if (box && overlaps(playerBox, box) && player.vy <= 0) {
        player.takeDamage(nowMs, taxi.solid.x);
      }
    }

    for (const jet of [...level.hydrants, ...level.geysers]) {
      jet.update(dtMs);
      const box = jet.getHitbox();
      if (box && overlaps(playerBox, box)) player.takeDamage(nowMs, jet.x);
    }

    // The boss is an entity, not a game state -- but he does NOT go through
    // hitFoe, because against a boss the hit-source matters: only the whip
    // lands, stomps clank off the hard hat, and propeller shots get eaten
    // by the clipboard. Sfx flags are set by the boss and consumed here,
    // matching the frog-tongue precedent.
    if (level.boss) {
      const boss = level.boss;
      boss.update(dtMs, nowMs, playerBox);
      const bossBox = boss.getHitbox();
      if (bossBox) {
        if (player.isWhipping() && overlaps(player.getWhipHitbox(), bossBox)) {
          if (boss.whipHit()) Music.play('boss');
        } else if (overlaps(playerBox, bossBox)) {
          const stompDepth = playerBox.y + playerBox.height - bossBox.y;
          if (player.vy > 0 && stompDepth < bossBox.height * 0.5) {
            player.stompBounce(); // hard hat: safe pogo, zero damage
            boss.deflect();
            Music.play('bounce');
          } else if (stompDepth > bossBox.height * 0.3) {
            player.takeDamage(nowMs, boss.x);
          }
          // Shallow standing contact (his hat brushing a perched duck's
          // feet as he walks under) is free -- perches must be safe from
          // everything except the attacks that are MEANT to flush you off.
        }
        for (const shot of this.projectiles) {
          if (!shot.dead && overlaps(shot.getHitbox(), bossBox)) {
            shot.dead = true; // filed by the clipboard, no damage
            boss.deflect();
          }
        }
      }
      for (const box of boss.getHazardBoxes()) {
        if (overlaps(playerBox, box)) player.takeDamage(nowMs, boss.x);
      }
      if (boss.throwPending) {
        boss.throwPending = false;
        Music.play('bossThrow');
      }
      if (boss.slamPending) {
        boss.slamPending = false;
        Music.play('bossSlam');
      }
      if (boss.blockPending) {
        boss.blockPending = false;
        Music.play('bossBlock');
      }
      if (boss.downPending) {
        boss.downPending = false;
        Music.play('bossDown');
      }
    }

    if (level.world === 'mill' && level.saves && level.saves.length) {
      for (const s of level.saves) {
        if (Math.abs(player.x - s.x) < 80 && Math.abs(player.y - s.y) < 70) {
          level.lastSave = s;
        }
      }
    }

    // Fell in a pond -- ouch, respawn at the last checkpoint reached.
    if (player.y > GAME_HEIGHT + 60) {
      Music.play('splash');
      player.takeDamage(nowMs, player.x);
      if (level.world === 'mill' && level.lastSave) {
        player.x = level.lastSave.x;
        player.y = level.lastSave.y;
      } else {
        const checkpointX = [...level.checkpoints].reverse().find((cx) => cx <= player.x) ?? level.checkpoints[0];
        player.x = checkpointX;
        player.y = GROUND_Y - PLAYER_HEIGHT;
      }
      player.vx = 0;
      player.vy = 0;
    }

    // Any heart lost that wasn't already covered by a splash gets the hurt
    // sting -- checked once here rather than at every damage site.
    if (player.hearts < heartsBefore) Music.play('hurt');

    // A live boss keeps the goal locked -- no new game state, one condition.
    if (overlaps(playerBox, level.goal) && (!level.boss || level.boss.defeated)) {
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

    this.camera.follow(player.x, player.y, player.facing);
  }

  render(nowMs) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (this.state === STATE.TITLE) {
      titleScreen.render(ctx, nowMs);
      controlsScreen.renderButton(ctx, this.controlsHover);
      if (this.showControls) controlsScreen.render(ctx);
      drawMuteButton(ctx, Music.muted);
      return;
    }

    const level = this.level;
    renderSky(ctx, level.theme);
    renderBackground(ctx, this.camera, level, nowMs);
    renderThemeOverlay(ctx, level.theme); // scenery only -- platforms stay readable
    renderTerrain(ctx, this.camera, level, nowMs);
    for (const cart of level.carts) cart.render(ctx, this.camera);
    for (const taxi of level.taxis) taxi.render(ctx, this.camera);
    for (const crane of level.cranes) crane.render(ctx, this.camera);
    for (const jet of level.hydrants) jet.render(ctx, this.camera);
    for (const jet of level.geysers) jet.render(ctx, this.camera);
    for (const wave of level.traffic) wave.render(ctx, this.camera);
    for (const pad of level.bounces) pad.render(ctx, this.camera);
    for (const pickup of level.pickups) pickup.render(ctx, this.camera);
    for (const frog of level.frogs) frog.render(ctx, this.camera);
    for (const pig of level.pigs) pig.render(ctx, this.camera);
    for (const bee of level.bees) bee.render(ctx, this.camera);
    for (const mole of level.moles) mole.render(ctx, this.camera);
    for (const crow of level.crows) crow.render(ctx, this.camera);
    for (const rat of level.rats) rat.render(ctx, this.camera);
    for (const pigeon of level.pigeons) pigeon.render(ctx, this.camera);
    for (const snake of level.snakes) snake.render(ctx, this.camera);
    for (const scorp of level.scorpions) scorp.render(ctx, this.camera);
    for (const goat of level.goats) goat.render(ctx, this.camera);
    for (const hawk of level.hawks) hawk.render(ctx, this.camera);
    for (const cat of level.cats) cat.render(ctx, this.camera);
    for (const drone of level.drones) drone.render(ctx, this.camera);
    for (const dump of level.dumpsters) dump.render(ctx, this.camera);
    for (const goose of level.geese) goose.render(ctx, this.camera);
    if (level.boss) level.boss.render(ctx, this.camera);
    renderGoal(ctx, this.camera, level);
    this.player.render(ctx, this.camera, nowMs);
    for (const shot of this.projectiles) shot.render(ctx, this.camera);

    renderHud(ctx, this.player, level);

    if (this.state === STATE.INTRO) {
      if (isWarp()) {
        renderWarpPanel(ctx, this, this.introHover);
      } else {
        renderIntro(ctx, level, this.introHover);
      }
    }
    if (this.state === STATE.LEVEL_CLEAR) {
      renderCard(ctx, 'LEVEL CLEAR!', level.name, '+1 heart');
    }
    if (this.state === STATE.WIN) {
      renderEndScreen(
        ctx,
        allEggsFound() ? 'EGG HUNTER!' : 'YOU WIN!',
        '#2a9d3f',
        level.world === 'mill'
          ? "Shift's over. The pie is a little dusty and also the best pie of his life."
          : level.world === 'travel'
            ? 'The clapper snaps back in. The bell dings. Grandma Goose hears it from here.'
            : 'Scoot rings the new bell all the way home.',
      );
    }
    if (this.state === STATE.GAMEOVER) renderEndScreen(ctx, 'GAME OVER', '#e63946');
    if (this.showControls && this.state !== STATE.PLAYING) controlsScreen.render(ctx);

    drawMuteButton(ctx, Music.muted); // always last so it stays on top of overlays
  }
}

function hitFoe(player, playerBox, shots, foe, nowMs, sfx) {
  const box = foe.getHitbox();
  if (!box) return;
  if (player.isWhipping() && overlaps(player.getWhipHitbox(), box)) {
    foe.stomp();
    Music.play('whip');
    Music.play(sfx);
    return;
  }
  if (overlaps(playerBox, box)) {
    const stompDepth = playerBox.y + playerBox.height - box.y;
    const isStomp = player.vy > 0 && stompDepth < box.height * 0.65;
    if (isStomp) {
      foe.stomp();
      player.stompBounce();
      Music.play('stomp');
      Music.play(sfx);
    } else {
      player.takeDamage(nowMs, foe.x);
    }
  }
  for (const shot of shots) {
    if (!shot.dead && overlaps(shot.getHitbox(), box)) {
      foe.killByProjectile();
      shot.dead = true;
      Music.play(sfx);
    }
  }
}

function warpRowAt(my, scroll) {
  const { y, rowH, rows } = WARP_LIST;
  if (my < y || my >= y + rows * rowH) return -1;
  const i = scroll + Math.floor((my - y) / rowH);
  if (i < 0 || i >= STAGE_NAMES.length) return -1;
  return i;
}

function warpCaretAt(mx, my) {
  if (insideRect(mx, my, HUD_HEARTS) || insideRect(mx, my, MUTE_BUTTON)) return null;
  const { y, rowH, rows } = WARP_LIST;
  if (my >= 18 && my < y) return 'up';
  if (my >= y + rows * rowH && my < WARP_START_BUTTON.y - 4) return 'down';
  return null;
}

function renderWarpPanel(ctx, game, startHover) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23f';
  ctx.font = "14px 'Press Start 2P', monospace";
  ctx.fillText('WARP', GAME_WIDTH / 2, 24);

  const { x, y, width, rowH, rows } = WARP_LIST;
  for (let i = 0; i < rows; i++) {
    const idx = game.warpScroll + i;
    if (idx >= STAGE_NAMES.length) break;
    const rowY = y + i * rowH;
    const selected = idx === game.levelIndex;
    const hover = idx === game.warpHoverRow;
    if (selected) {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x, rowY, width, rowH - 2);
      ctx.fillStyle = '#1a1a1a';
    } else if (hover) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x, rowY, width, rowH - 2);
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#cdeeff';
    }
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText(STAGE_NAMES[idx], GAME_WIDTH / 2, rowY + 15);
  }

  ctx.fillStyle = '#8ecae6';
  ctx.font = "8px 'Press Start 2P', monospace";
  if (game.warpScroll > 0) ctx.fillText('^', GAME_WIDTH / 2, y - 2);
  if (game.warpScroll + rows < STAGE_NAMES.length) {
    ctx.fillText('v', GAME_WIDTH / 2, y + rows * rowH + 8);
  }
  ctx.fillText('ARROWS OR TAP  -  SPACE STARTS', GAME_WIDTH / 2, 204);

  const b = WARP_START_BUTTON;
  ctx.fillStyle = startHover ? '#ffe873' : '#ffd23f';
  ctx.fillRect(b.x, b.y, b.width, b.height);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x, b.y, b.width, b.height);
  ctx.fillStyle = '#1a1a1a';
  ctx.font = "14px 'Press Start 2P', monospace";
  ctx.fillText('START', GAME_WIDTH / 2, b.y + 24);
  ctx.textAlign = 'left';
}

function renderIntro(ctx, level, hover) {
  ctx.fillStyle = 'rgba(0,0,0,0.64)';
  ctx.fillRect(0, 32, GAME_WIDTH, GAME_HEIGHT - 32);

  ctx.textAlign = 'center';
  let y = 54;
  if (level.cityGate) {
    ctx.fillStyle = '#ff79c6';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText('THE CITY', GAME_WIDTH / 2, y);
    y += 16;
  } else if (level.travelGate) {
    ctx.fillStyle = '#f4c48a';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText('THE WORLD', GAME_WIDTH / 2, y);
    y += 16;
  } else if (level.millGate) {
    ctx.fillStyle = '#c48a3a';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText('THE MILL', GAME_WIDTH / 2, y);
    y += 16;
  }

  ctx.fillStyle = '#ffd23f';
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.fillText(level.name, GAME_WIDTH / 2, y);
  y += 20;

  ctx.fillStyle = '#ffffff';
  ctx.font = "8px 'Press Start 2P', monospace";
  y = wrapText(ctx, level.story || level.subtitle || '', GAME_WIDTH / 2, y, GAME_WIDTH - 32, 14);

  const hint = level.skill || level.subtitle || '';
  if (hint) {
    y += 8;
    ctx.fillStyle = '#cdeeff';
    wrapText(ctx, hint, GAME_WIDTH / 2, y, GAME_WIDTH - 32, 12);
  }

  const b = LEVEL_START_BUTTON;
  ctx.fillStyle = hover ? '#ffe873' : '#ffd23f';
  ctx.fillRect(b.x, b.y, b.width, b.height);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x, b.y, b.width, b.height);
  ctx.fillStyle = '#1a1a1a';
  ctx.font = "14px 'Press Start 2P', monospace";
  ctx.fillText('START', GAME_WIDTH / 2, b.y + 24);
  ctx.textAlign = 'left';
}

/** Compact banner for the clear screen. */
function renderCard(ctx, heading, name, note, opts = {}) {
  const tall = !!opts.button;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, GAME_HEIGHT / 2 - (tall ? 78 : 52), GAME_WIDTH, tall ? 168 : 104);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23f';
  ctx.font = "16px 'Press Start 2P', monospace";
  ctx.fillText(heading, GAME_WIDTH / 2, GAME_HEIGHT / 2 - (tall ? 44 : 16));

  ctx.fillStyle = '#ffffff';
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.fillText(name, GAME_WIDTH / 2, GAME_HEIGHT / 2 - (tall ? 18 : -10));

  ctx.fillStyle = '#cdeeff';
  ctx.font = "8px 'Press Start 2P', monospace";
  wrapText(ctx, note, GAME_WIDTH / 2, GAME_HEIGHT / 2 + (tall ? 4 : 32), GAME_WIDTH - 40, 12);

  if (opts.button) {
    const b = LEVEL_START_BUTTON;
    ctx.fillStyle = opts.hover ? '#ffe873' : '#ffd23f';
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x, b.y, b.width, b.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.fillText(opts.button, GAME_WIDTH / 2, b.y + 24);
  }
  ctx.textAlign = 'left';
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, yy);
    yy += lineHeight;
  }
  return yy;
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

  // Stage name only -- never a count. A bonus heart bobs through
  // y=33..57 (baseY 36, +/-3 bob, and the sprite is 6 rows at scale 3 = 18px
  // tall -- it's the sprite HEIGHT that makes the band, and undercounting it
  // is how two earlier attempts at this landed inside the heart).
  ctx.font = "8px 'Press Start 2P', monospace";
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillText(level.name, 16, 66);
  if (eggCount() > 0) {
    ctx.fillStyle = '#e0b23a';
    ctx.fillText(`EGGS ${eggCount()}`, 16, 80);
  }

  // Boss bar: title plus heart pips, top-right, only once he's engaged.
  const boss = level.boss;
  if (boss && boss.engaged && !boss.defeated) {
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillText(boss.title, GAME_WIDTH - 16, 24);
    ctx.textAlign = 'left';
    for (let i = 0; i < boss.maxHp; i++) {
      ctx.fillStyle = i < boss.hp ? '#8c2f2f' : 'rgba(0,0,0,0.15)';
      ctx.fillRect(GAME_WIDTH - 16 - (boss.maxHp - i) * 16, 32, 12, 12);
    }
  }
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

function renderEndScreen(ctx, message, color, note = '') {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.font = "bold 24px 'Press Start 2P', monospace";
  ctx.fillStyle = color;
  ctx.fillText(message, GAME_WIDTH / 2, 96);

  if (note) {
    ctx.fillStyle = '#ffffff';
    ctx.font = "8px 'Press Start 2P', monospace";
    wrapText(ctx, note, GAME_WIDTH / 2, 124, GAME_WIDTH - 40, 14);
  }

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
