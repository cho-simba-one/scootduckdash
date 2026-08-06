// Top-level state machine: TITLE -> PLAYING -> WIN / GAMEOVER -> TITLE.
// Owns the update/render loop; delegates specifics to player/enemy/level/
// background/titleScreen modules so this file stays a orchestrator, not
// a dumping ground.

import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y, PLAYER_HEIGHT, PLAYER_MAX_HEARTS } from './constants.js';
import { Input } from './input.js';
import { Player, overlaps } from './player.js';
import { Camera } from './camera.js';
import { createLevel } from './level.js';
import { renderSky, renderBackground, renderTerrain, renderGoal } from './background.js';
import * as titleScreen from './titleScreen.js';

const RESTART_BUTTON = { x: GAME_WIDTH / 2 - 90, y: 160, width: 180, height: 40 };

export const STATE = { TITLE: 'TITLE', PLAYING: 'PLAYING', WIN: 'WIN', GAMEOVER: 'GAMEOVER' };

export class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.state = STATE.TITLE;
    this.level = null;
    this.player = null;
    this.camera = new Camera();
    this.projectiles = [];
  }

  startGame() {
    this.level = createLevel();
    this.player = new Player(40, GROUND_Y - PLAYER_HEIGHT);
    this.camera = new Camera();
    this.projectiles = [];
    this.state = STATE.PLAYING;
  }

  backToTitle() {
    this.state = STATE.TITLE;
  }

  handleMouseMove(mx, my) {
    if (this.state === STATE.TITLE) titleScreen.setHover(mx, my);
  }

  handleClick(mx, my) {
    if (this.state === STATE.TITLE && titleScreen.isInsideButton(mx, my)) {
      this.startGame();
      return;
    }
    if ((this.state === STATE.WIN || this.state === STATE.GAMEOVER) && insideRect(mx, my, RESTART_BUTTON)) {
      this.backToTitle();
    }
  }

  update(dtMs, nowMs) {
    if (this.state !== STATE.PLAYING) return;

    const player = this.player;
    const level = this.level;

    player.update(dtMs, level.solids, nowMs);
    if (Input.shoot()) {
      const shot = player.tryShoot(nowMs);
      if (shot) this.projectiles.push(shot);
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
        } else {
          player.takeDamage(nowMs, frog.x);
        }
      }

      const tongueBox = frog.getTongueHitbox();
      if (tongueBox && overlaps(playerBox, tongueBox)) {
        player.takeDamage(nowMs, frog.x);
      }

      if (frogBox) {
        for (const shot of this.projectiles) {
          if (!shot.dead && overlaps(shot.getHitbox(), frogBox)) {
            frog.killByProjectile();
            shot.dead = true;
          }
        }
      }
    }
    level.frogs = level.frogs.filter((f) => !f.dead);

    // Fell in a pond -- ouch, respawn at the last checkpoint reached.
    if (player.y > GAME_HEIGHT + 60) {
      const checkpointX = [...level.checkpoints].reverse().find((cx) => cx <= player.x) ?? level.checkpoints[0];
      player.takeDamage(nowMs, player.x);
      player.x = checkpointX;
      player.y = GROUND_Y - PLAYER_HEIGHT;
      player.vx = 0;
      player.vy = 0;
    }

    if (overlaps(playerBox, level.goal)) this.state = STATE.WIN;
    if (player.dead) this.state = STATE.GAMEOVER;

    this.camera.follow(player.x);
  }

  render(nowMs) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (this.state === STATE.TITLE) {
      titleScreen.render(ctx, nowMs);
      return;
    }

    renderSky(ctx);
    renderBackground(ctx, this.camera, this.level, nowMs);
    renderTerrain(ctx, this.camera, this.level);
    for (const frog of this.level.frogs) frog.render(ctx, this.camera);
    renderGoal(ctx, this.camera, this.level);
    this.player.render(ctx, this.camera, nowMs);
    for (const shot of this.projectiles) shot.render(ctx, this.camera);

    renderHud(ctx, this.player);

    if (this.state === STATE.WIN) renderEndScreen(ctx, 'DEMO COMPLETE!', '#2a9d3f');
    if (this.state === STATE.GAMEOVER) renderEndScreen(ctx, 'GAME OVER', '#e63946');
  }
}

function insideRect(mx, my, r) {
  return mx >= r.x && mx <= r.x + r.width && my >= r.y && my <= r.y + r.height;
}

function renderHud(ctx, player) {
  for (let i = 0; i < PLAYER_MAX_HEARTS; i++) {
    drawHeart(ctx, 16 + i * 26, 16, i < player.hearts);
  }
}

function drawHeart(ctx, x, y, filled) {
  ctx.fillStyle = filled ? '#e63946' : 'rgba(0,0,0,0.15)';
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
