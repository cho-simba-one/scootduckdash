// On-screen touch controls for phones/tablets (or any coarse-pointer
// device). Mirrors the keyboard 1:1 via Input.pressVirtual/releaseVirtual
// (see input.js) so gameplay code never has to know or care where a press
// came from.
//
// The DOM is always injected, on every device: whether it's actually
// SHOWN is settings.touchPadsVisible()'s call, so a player can force the
// pads on (touchscreen laptop) or off (phone with a gamepad) from the
// CONTROLS screen. Deciding visibility here as well would be the same
// rule in two places.

import { Input } from './input.js';
import { isTouchDevice } from './settings.js';

/** Injects the on-screen control buttons. Returns a `setVisible(bool)`
 * called each frame with the current preference + play state. */
export function setupTouchControls() {
  if (isTouchDevice()) document.body.classList.add('touch-device');

  const root = document.createElement('div');
  root.id = 'touch-controls';
  root.innerHTML = `
    <div class="tc-cluster tc-move">
      <button type="button" class="tc-btn tc-move-btn" data-action="left" aria-label="Move left">&#9664;</button>
      <button type="button" class="tc-btn tc-move-btn" data-action="right" aria-label="Move right">&#9654;</button>
    </div>
    <div class="tc-cluster tc-actions">
      <button type="button" class="tc-btn tc-shoot-btn" data-action="shoot" aria-label="Shoot">&#9679;</button>
      <button type="button" class="tc-btn tc-duck-btn" data-action="down" aria-label="Duck">&#9660;</button>
      <button type="button" class="tc-btn tc-jump-btn" data-action="up" aria-label="Jump">&#9650;</button>
    </div>
  `;
  root.classList.add('hidden'); // frame loop flips this on once gameplay actually starts
  // MUST live inside #game-frame: that is the element that goes fullscreen,
  // and fullscreen renders only that element and its DESCENDANTS. Parented
  // to <body> the pads were simply not drawn once fullscreen was on.
  (document.getElementById('game-frame') || document.body).appendChild(root);

  root.querySelectorAll('.tc-btn').forEach((btn) => {
    const action = btn.dataset.action;
    const press = (e) => {
      e.preventDefault();
      Input.pressVirtual(action);
      btn.classList.add('active');
    };
    const release = (e) => {
      e.preventDefault();
      Input.releaseVirtual(action);
      btn.classList.remove('active');
    };
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('touchcancel', release, { passive: false });
    // Also wired for mouse -- covers touch-and-mouse hybrid laptops, and
    // makes the buttons genuinely "clickable" for anyone testing on desktop.
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
  });

  return {
    setVisible(visible) {
      root.classList.toggle('hidden', !visible);
    },
  };
}
