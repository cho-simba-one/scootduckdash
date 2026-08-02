// Simple side-scrolling camera: keeps the player roughly a third of the
// way from the left edge, clamped so we never show past the level bounds.

import { GAME_WIDTH, LEVEL_WIDTH } from './constants.js';

export class Camera {
  constructor() {
    this.x = 0;
  }

  follow(targetX) {
    const desired = targetX - GAME_WIDTH / 3;
    this.x = Math.max(0, Math.min(desired, LEVEL_WIDTH - GAME_WIDTH));
  }
}
