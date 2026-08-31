// Bootstrap: wires up the canvas, translates raw mouse events into game
// logical coordinates (the canvas is scaled by CSS to fit any screen --
// including a phone-shaped one later), and runs the animation loop.

import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { Game, STATE } from './game.js';
import { Input } from './input.js';
import { isInsideButton } from './titleScreen.js';
import { setupTouchControls } from './touchControls.js';
import { setupCheatEntry } from './cheats.js';

const canvas = document.getElementById('game-canvas');
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const game = new Game(ctx);
const touchControls = setupTouchControls();
setupCheatEntry(document.getElementById('cheat-entry'));

function canvasPosFromEvent(evt) {
  const rect = canvas.getBoundingClientRect();
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return {
    x: (clientX - rect.left) * (GAME_WIDTH / rect.width),
    y: (clientY - rect.top) * (GAME_HEIGHT / rect.height),
  };
}

canvas.addEventListener('mousemove', (evt) => {
  const { x, y } = canvasPosFromEvent(evt);
  game.handleMouseMove(x, y);
  canvas.style.cursor = game.pointer || isInsideButton(x, y) ? 'pointer' : 'default';
});

canvas.addEventListener('click', (evt) => {
  const { x, y } = canvasPosFromEvent(evt);
  game.handleClick(x, y);
});

let lastTime = performance.now();
function frame(now) {
  requestAnimationFrame(frame); // scheduled first so an exception below can't kill the loop
  Input.pollGamepad(); // merge pad state before anything reads Input
  const dtMs = Math.min(now - lastTime, 50); // clamp so a tab-switch stall can't cause a physics blowup
  lastTime = now;
  game.update(dtMs, now);
  game.render(now);
  touchControls.setVisible(game.state === STATE.PLAYING);
}
requestAnimationFrame(frame);
