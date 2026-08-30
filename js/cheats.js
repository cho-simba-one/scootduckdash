// Typed cheats. Kept out of input.js because a sequence buffer is not
// "is this key down" -- and everything that cares about god mode can
// import isGod() without knowing how it got turned on.
//
// Desktop: letter keys anywhere (capture-phase, so the canvas never has
// to be "focused"). Phone: tap the title (or the HUD hearts) to pop the
// OS keyboard into a hidden field, then type the same letters.

const IDDQD = 'iddqd';
let buffer = '';
let god = false;
const listeners = [];

function letterFromEvent(e) {
  if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) {
    return e.key.toLowerCase();
  }
  // Some WebViews report blank/Unidentified for e.key. Physical code still works.
  const fromCode = { KeyI: 'i', KeyD: 'd', KeyQ: 'q' };
  return fromCode[e.code] || '';
}

function feed(ch) {
  if (!ch) return;
  if (!'idq'.includes(ch)) {
    buffer = '';
    return;
  }
  buffer = (buffer + ch).slice(-IDDQD.length);
  if (buffer !== IDDQD) return;
  buffer = '';
  god = !god;
  for (const fn of listeners) fn(god);
  blurCheatEntry();
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

/** Called when IDDQD flips, so a GAME OVER can stand the duck back up. */
export function onGodChange(fn) {
  listeners.push(fn);
}
