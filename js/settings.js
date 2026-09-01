// Player display/control preferences, persisted across sessions.
//
// Two knobs, both reachable from the CONTROLS overlay (and F / T keys):
//   - fullscreen: not a stored preference. Browsers only grant it from a
//     user gesture and drop it on navigation, so storing "was fullscreen"
//     would be a promise we cannot keep on load. Live state only.
//   - touch pads: 'auto' (show on touch devices during play), 'on' (always
//     during play -- touchscreen laptops, or just preference), 'off'.
//
// Storage mirrors secrets.js: every access wrapped, because private-mode
// Safari throws on localStorage and a settings read must never take the
// game down with it.

const KEY = 'duckDashPrefs';
const TOUCH_MODES = ['auto', 'on', 'off'];

const prefs = { touchMode: 'auto' };

try {
  const raw = window.localStorage.getItem(KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    if (TOUCH_MODES.includes(saved.touchMode)) prefs.touchMode = saved.touchMode;
  }
} catch (err) {
  // Storage unavailable -- defaults are fine, the game still plays.
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch (err) {
    /* not fatal: the setting just won't survive a reload */
  }
}

export function touchMode() {
  return prefs.touchMode;
}

/** auto -> on -> off -> auto. Returns the new mode. */
export function cycleTouchMode() {
  const i = TOUCH_MODES.indexOf(prefs.touchMode);
  prefs.touchMode = TOUCH_MODES[(i + 1) % TOUCH_MODES.length];
  save();
  return prefs.touchMode;
}

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/** Should the on-screen pads be on screen right now? */
export function touchPadsVisible(isPlaying) {
  if (!isPlaying) return false;
  if (prefs.touchMode === 'off') return false;
  if (prefs.touchMode === 'on') return true;
  return isTouchDevice();
}

// --- Fullscreen -------------------------------------------------------
// iOS Safari on iPhone has no element fullscreen API at all; report that
// honestly instead of drawing a toggle that silently does nothing.

const frame = () => document.getElementById('game-frame') || document.documentElement;

export function fullscreenSupported() {
  const el = frame();
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

export function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

/** Must be called from a user gesture (click/keydown), not from rAF. */
export function toggleFullscreen() {
  const el = frame();
  if (isFullscreen()) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) Promise.resolve(exit.call(document)).catch(() => {});
    return;
  }
  const request = el.requestFullscreen || el.webkitRequestFullscreen;
  // A rejected request (no gesture, or iOS) must not break the frame loop.
  if (request) Promise.resolve(request.call(el)).catch(() => {});
}
