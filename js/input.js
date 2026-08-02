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

export const Input = {
  left: () => anyDown(KEY_LEFT),
  right: () => anyDown(KEY_RIGHT),
  up: () => anyDown(KEY_UP),
  down: () => anyDown(KEY_DOWN),
  shoot: () => anyDown(KEY_SHOOT),
};
