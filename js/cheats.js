// Typed cheats. Kept out of input.js because a sequence buffer is not
// "is this key down" -- and everything that cares about god mode can
// import isGod() without knowing how it got turned on.

const IDDQD = 'iddqd';
let buffer = '';
let god = false;
const listeners = [];

window.addEventListener('keydown', (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return;
  buffer = (buffer + e.key.toLowerCase()).slice(-IDDQD.length);
  if (buffer !== IDDQD) return;
  buffer = '';
  god = !god;
  for (const fn of listeners) fn(god);
});

export function isGod() {
  return god;
}

/** Called when IDDQD flips, so a GAME OVER can stand the duck back up. */
export function onGodChange(fn) {
  listeners.push(fn);
}
