// Replay bait that survives a refresh: golden eggs, and a one-run lucky flag
// from tapping the title duck. Nothing here writes gameplay rules -- it just
// remembers what the player already found.

const EGG_KEY = 'duckDashEggs';

// Internal only -- the HUD never prints this. Bump when a world adds eggs.
export const EGG_TOTAL = 15;

export function foundEggs() {
  try {
    const raw = JSON.parse(localStorage.getItem(EGG_KEY) || '[]');
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

export function hasEgg(id) {
  return foundEggs().includes(String(id));
}

export function markEgg(id) {
  const next = new Set(foundEggs());
  next.add(String(id));
  localStorage.setItem(EGG_KEY, JSON.stringify([...next]));
}

export function eggCount() {
  return foundEggs().length;
}

export function allEggsFound() {
  return eggCount() >= EGG_TOTAL;
}

/** Set by tapping the title duck 7 times. Consumed on the next START. */
export let luckyRun = false;

export function armLuckyRun() {
  luckyRun = true;
}

export function consumeLuckyRun() {
  const was = luckyRun;
  luckyRun = false;
  return was;
}
