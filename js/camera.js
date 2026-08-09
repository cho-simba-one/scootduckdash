// Simple side-scrolling camera: keeps the player roughly a third of the
// way from the left edge, clamped so we never show past the level bounds.
//
// The bound comes from the LEVEL, not a global constant -- levels have
// different widths, and a shared constant would scroll past the end of
// the short ones and stop short on the long ones.

import { GAME_WIDTH } from './constants.js';

export class Camera {
  constructor(levelWidth) {
    this.x = 0;
    this.levelWidth = levelWidth;
  }

  follow(targetX) {
    const desired = targetX - GAME_WIDTH / 3;
    this.x = Math.max(0, Math.min(desired, this.levelWidth - GAME_WIDTH));
  }
}
