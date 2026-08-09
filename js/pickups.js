// Collectables. Kept out of hazards.js because a thing that REWARDS you is
// not a thing that hurts you -- sharing a file would only mean the word
// "entity" appearing twice, which isn't cohesion.
//
// A pickup is deliberately dumb: it knows where it is, whether it's been
// taken, and how to draw itself. Deciding what collecting it DOES belongs to
// the game loop, so adding a new pickup type never means editing this file's
// existing behaviour.

import { HEART_PICKUP } from './sprites.js';
import { drawSprite, spriteSize } from './pixelArt.js';

const COLLECT_FADE_MS = 400;

export class Pickup {
  /** @param {string} kind - what the game loop should grant, e.g. 'heart'. */
  constructor(x, y, kind = 'heart') {
    const size = spriteSize(HEART_PICKUP, 3);
    this.width = size.width;
    this.height = size.height;
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.kind = kind;
    this.collected = false;
    this.dead = false;
    this.fade = COLLECT_FADE_MS;
  }

  getHitbox() {
    if (this.collected) return null;
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  collect() {
    if (this.collected) return false;
    this.collected = true;
    return true; // tells the caller this was the collecting frame, not a repeat
  }

  update(dtMs, nowMs) {
    if (this.collected) {
      this.fade -= dtMs;
      if (this.fade <= 0) this.dead = true;
      return;
    }
    // Gentle hover so it reads as a collectable rather than scenery.
    this.y = this.baseY + Math.sin(nowMs / 300 + this.x) * 3;
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    if (this.collected) {
      // Float up and fade out -- confirms the pickup registered.
      const t = Math.max(0, this.fade / COLLECT_FADE_MS);
      drawSprite(ctx, HEART_PICKUP, screenX, this.y - (1 - t) * 24, {
        scale: 3, alpha: t,
      });
      return;
    }
    drawSprite(ctx, HEART_PICKUP, screenX, this.y, { scale: 3 });
  }
}
