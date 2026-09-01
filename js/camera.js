// Side-scrolling camera. Farm/city/world keep the original X-only follow
// (player a third in from the left, y glued at 0) so stages 1-30 do not
// move a pixel. Mill stages opt into explore mode.
//
// Explore mode, rebuilt after playtest feedback ("too jumpy -- jumping
// takes the platforms off screen so you are guessing where to land"):
//   - X keeps the duck CENTERED and eases toward it. The old version
//     jumped the target by a third of a screen the instant you turned
//     around, which is the snap that read as jitter.
//   - Y anchors on the last GROUND the duck stood on, not on the duck.
//     A jump therefore does not scroll the world at all -- the platform
//     you launched from stays on screen, which is the whole point. The
//     camera only chases Y when the duck leaves a generous band (fell to
//     a lower floor, rode a lift, climbed away), and eases when it does.
//
// The bound comes from the LEVEL, not a global constant -- levels have
// different widths, and a shared constant would scroll past the end of
// the short ones and stop short on the long ones.

import { GAME_WIDTH, GAME_HEIGHT, PLAYER_WIDTH } from './constants.js';

// Screen-space band the duck may occupy before Y starts following. Wide
// enough that a full jump (79px apex) never moves the camera.
const BAND_TOP = GAME_HEIGHT * 0.20;
const BAND_BOTTOM = GAME_HEIGHT * 0.74;
const ANCHOR_Y = GAME_HEIGHT * 0.58; // where a standing duck sits on screen

/** Frame-rate independent easing: fraction of the remaining gap to close. */
function ease(current, target, dtMs, halfLifeMs) {
  const t = 1 - Math.pow(0.5, dtMs / halfLifeMs);
  return current + (target - current) * t;
}

export class Camera {
  constructor(levelWidth, opts = {}) {
    this.x = 0;
    this.y = 0;
    this.levelWidth = levelWidth;
    this.minY = opts.minY ?? 0;
    this.maxY = opts.maxY ?? 0;
    this.explore = !!opts.explore;
    this.anchorY = null;  // last grounded height; null until first update
    this.snapped = false; // first frame jumps into place instead of easing
  }

  clampX(x) {
    return Math.max(0, Math.min(x, this.levelWidth - GAME_WIDTH));
  }

  clampY(y) {
    return Math.max(this.minY, Math.min(y, this.maxY));
  }

  follow(targetX, targetY = 0, facing = 1, grounded = true, dtMs = 16.7) {
    if (!this.explore) {
      // Stages 1-30: untouched, deliberately.
      const desired = targetX - GAME_WIDTH / 3;
      this.x = this.clampX(desired);
      this.y = 0;
      return;
    }

    // --- X: centered, eased ---------------------------------------------
    const desiredX = this.clampX(targetX + PLAYER_WIDTH / 2 - GAME_WIDTH / 2);

    // --- Y: anchored to the floor, not to the jump arc ------------------
    if (grounded) this.anchorY = targetY;
    if (this.anchorY === null) this.anchorY = targetY;
    let desiredY = this.clampY(this.anchorY - ANCHOR_Y);

    // ...unless the duck is about to leave the frame anyway. Then follow
    // just enough to put it back on the band edge.
    const screenY = targetY - desiredY;
    if (screenY < BAND_TOP) desiredY = this.clampY(targetY - BAND_TOP);
    else if (screenY > BAND_BOTTOM) desiredY = this.clampY(targetY - BAND_BOTTOM);

    if (!this.snapped) {
      this.x = desiredX;
      this.y = desiredY;
      this.snapped = true;
      return;
    }
    this.x = ease(this.x, desiredX, dtMs, 90);
    this.y = ease(this.y, desiredY, dtMs, 140); // slower: vertical pans read worse
  }

  sx(x) {
    return x - this.x;
  }

  sy(y) {
    return y - this.y;
  }
}
