import { PROJECTILE_SPEED, PROJECTILE_LIFETIME_MS } from './constants.js';
import { PROPELLER_ICON } from './sprites.js';
import { getSpriteCanvas } from './pixelArt.js';

const SIZE = 22; // rendered square size in world pixels

export class Projectile {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction; // 1 right, -1 left
    this.age = 0;
    this.dead = false;
  }

  getHitbox() {
    return { x: this.x, y: this.y - SIZE / 2, width: SIZE, height: SIZE };
  }

  update(dtMs) {
    const dt = dtMs / 16.6667;
    this.x += this.direction * PROJECTILE_SPEED * dt;
    this.age += dtMs;
    if (this.age > PROJECTILE_LIFETIME_MS) this.dead = true;
  }

  render(ctx, camera) {
    const canvas = getSpriteCanvas(PROPELLER_ICON, 3, false);
    const screenX = this.x - camera.x;
    const screenY = this.y;
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate((this.age / 40) % (Math.PI * 2));
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    ctx.restore();
  }
}
