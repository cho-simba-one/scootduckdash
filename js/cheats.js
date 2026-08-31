// Typed cheats. Kept out of input.js because a sequence buffer is not
// "is this key down" -- and everything that cares about a cheat can
// import the flag without knowing how it got turned on.
//
// Desktop: letter keys anywhere (capture-phase, so the canvas never has
// to be "focused"). Phone: tap the title (or the HUD hearts) to pop the
// OS keyboard into a hidden field, then type the same letters.
//
//   IDDQD -- god mode (gold hearts, never stays down)
//   IDKFA -- warp picker on every stage intro

const GOD_CODE = 'iddqd';
const WARP_CODE = 'idkfa';
const CHEAT_LETTERS = 'idqkfa';
const BUFFER_LEN = 5;

const FROM_CODE = {
  KeyI: 'i', KeyD: 'd', KeyQ: 'q', KeyK: 'k', KeyF: 'f', KeyA: 'a',
};

let buffer = '';
let god = false;
let warp = false;
const godListeners = [];
const warpListeners = [];

function letterFromEvent(e) {
  if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) {
    return e.key.toLowerCase();
  }
  // Some WebViews report blank/Unidentified for e.key. Physical code still works.
  return FROM_CODE[e.code] || '';
}

function feed(ch) {
  if (!ch) return;
  if (!CHEAT_LETTERS.includes(ch)) {
    buffer = '';
    return;
  }
  buffer = (buffer + ch).slice(-BUFFER_LEN);
  if (buffer === GOD_CODE) {
    buffer = '';
    god = !god;
    for (const fn of godListeners) fn(god);
    blurCheatEntry();
    return;
  }
  if (buffer === WARP_CODE) {
    buffer = '';
    warp = !warp;
    for (const fn of warpListeners) fn(warp);
    blurCheatEntry();
  }
}

function onKeyDown(e) {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  // Hidden-field typing is handled by the input event so we don't double-count.
  if (e.target && e.target.id === 'cheat-entry') return;
  feed(letterFromEvent(e));
}

document.addEventListener('keydown', onKeyDown, true);

function blurCheatEntry() {
  const el = document.getElementById('cheat-entry');
  if (el) el.blur();
}

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/** Phone only: focus the hidden field so the OS keyboard comes up. Must
 * be called from a tap. Desktop must NOT steal focus -- that would eat
 * arrow keys and space. */
export function requestCheatKeyboard() {
  if (!isTouchDevice()) return;
  const el = document.getElementById('cheat-entry');
  if (!el) return;
  el.value = '';
  el.focus({ preventScroll: true });
}

export function setupCheatEntry(el) {
  if (!el) return;
  el.addEventListener('input', () => {
    const v = el.value.toLowerCase();
    el.value = '';
    for (const ch of v) feed(ch);
  });
}

export function isGod() {
  return god;
}

export function isWarp() {
  return warp;
}

/** Called when IDDQD flips, so a GAME OVER can stand the duck back up. */
export function onGodChange(fn) {
  godListeners.push(fn);
}

/** Called when IDKFA flips, so the current intro can grow a picker. */
export function onWarpChange(fn) {
  warpListeners.push(fn);
}
