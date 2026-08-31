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

// --- Gamepad (standard mapping) ---------------------------------------
// Polled once per frame from main.js. Buttons feed the same `down` Set the
// keyboard and touch controls use (edge-triggered so a idle pad never
// clobbers a held key). SNES-flavored mapping: bottom button jumps like B,
// right button ducks/tail-whips like A, left/top shoot like Y/X. START
// feeds Space (menus advance on it; a tap mid-play fires one propeller
// shot, which is harmless). SELECT is exposed as a consumable edge for the
// controls overlay.
const PAD = { left: false, right: false, up: false, down: false, shoot: false };
let padSelectWas = false;
let selectQueued = false;
let padSeen = false;

function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let pad = null;
  for (const p of pads) {
    if (p && p.connected) { pad = p; break; }
  }
  if (!pad) {
    if (padSeen) {
      // Pad unplugged mid-press: release everything it was holding.
      for (const action of Object.keys(PAD)) {
        if (PAD[action]) { releaseVirtual(action); PAD[action] = false; }
      }
      padSelectWas = false;
      padSeen = false;
    }
    return;
  }
  padSeen = true;
  const btn = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
  const ax = pad.axes[0] ?? 0;
  const ay = pad.axes[1] ?? 0;
  const start = btn(9);
  const want = {
    left: btn(14) || ax < -0.4,
    right: btn(15) || ax > 0.4,
    up: btn(12) || btn(0) || ay < -0.6,
    down: btn(13) || btn(1) || ay > 0.6,
    shoot: btn(2) || btn(3) || start,
  };
  for (const action of Object.keys(PAD)) {
    if (want[action] && !PAD[action]) pressVirtual(action);
    else if (!want[action] && PAD[action]) releaseVirtual(action);
    PAD[action] = want[action];
  }
  const select = btn(8);
  if (select && !padSelectWas) selectQueued = true;
  padSelectWas = select;
}

/** True once per SELECT press -- reading it consumes the edge. */
function selectEdge() {
  const q = selectQueued;
  selectQueued = false;
  return q;
}

export const Input = {
  left: () => anyDown(KEY_LEFT),
  right: () => anyDown(KEY_RIGHT),
  up: () => anyDown(KEY_UP),
  down: () => anyDown(KEY_DOWN),
  shoot: () => anyDown(KEY_SHOOT),
  keyDown: (code) => down.has(code),
  pressVirtual,
  releaseVirtual,
  pollGamepad,
  selectEdge,
};
