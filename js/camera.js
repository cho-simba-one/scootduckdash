// Side-scrolling camera. Farm/city/world keep the original X-only follow
// (player a third in from the left, y glued at 0) so stages 1-30 do not
// move a pixel. Mill stages opt into explore mode: look-ahead by facing
// so a left-hand catwalk is on screen, and Y follow so a loft is not a
// clip at the top of the frame.
//
// The bound comes from the LEVEL, not a global constant -- levels have
// different widths, and a shared constant would scroll past the end of
// the short ones and stop short on the long ones.

import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

export class Camera {
  constructor(levelWidth, opts = {}) {
    this.x = 0;
    this.y = 0;
    this.levelWidth = levelWidth;
    this.minY = opts.minY ?? 0;
    this.maxY = opts.maxY ?? 0;
    this.explore = !!opts.explore;
  }

  follow(targetX, targetY = 0, facing = 1) {
    if (!this.explore) {
      const desired = targetX - GAME_WIDTH / 3;
      this.x = Math.max(0, Math.min(desired, this.levelWidth - GAME_WIDTH));
      this.y = 0;
      return;
    }
    const look = facing >= 0 ? GAME_WIDTH / 3 : (GAME_WIDTH * 2) / 3;
    this.x = Math.max(0, Math.min(targetX - look, this.levelWidth - GAME_WIDTH));
    const lookY = GAME_HEIGHT * 0.58;
    this.y = Math.max(this.minY, Math.min(targetY - lookY, this.maxY));
  }

  sx(x) {
    return x - this.x;
  }

  sy(y) {
    return y - this.y;
  }
}
