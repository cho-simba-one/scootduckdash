// Centralized keyboard state. Everything else just asks "is this key
// down right now" -- no scattered addEventListener calls all over the
// codebase (DRY, single source of truth).

import { KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SHOOT } from './constants.js';

const down = new Set();

window.addEventListener('keydown', (e) => {
  down.add(e.code);
  // Stop arrow keys / space from scrolling the page behind the canvas.
  if ([...KEY_LEFT, ...KEY_RIGHT, ...KEY_UP, ...KEY_DOWN, ...KEY_SHOOT].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  down.delete(e.code);
});

// Some browsers/OSes drop keyup when focus leaves the window mid-press;
// clear everything so the duck doesn't get stuck running forever.
window.addEventListener('blur', () => down.clear());

function anyDown(codes) {
  return codes.some((c) => down.has(c));
}

// --- Virtual input (on-screen touch buttons) --------------------------
// Touch controls call these instead of dispatching fake keyboard events --
// they just poke the same `down` Set real keys use, so Input.left()/etc.
// (and everything downstream in player.js/game.js) never has to know or
// care whether a press came from a physical key or a tapped button.
const VIRTUAL_CODE = {
  left: KEY_LEFT[0],
  right: KEY_RIGHT[0],
  up: KEY_UP[0],
  down: KEY_DOWN[0],
  shoot: KEY_SHOOT[0],
};

function pressVirtual(action) {
  const code = VIRTUAL_CODE[action];
  if (code) down.add(code);
}

function releaseVirtual(action) {
  const code = VIRTUAL_CODE[action];
  if (code) down.delete(code);
}

export const Input = {
  left: () => anyDown(KEY_LEFT),
  right: () => anyDown(KEY_RIGHT),
  up: () => anyDown(KEY_UP),
  down: () => anyDown(KEY_DOWN),
  shoot: () => anyDown(KEY_SHOOT),
  pressVirtual,
  releaseVirtual,
};
