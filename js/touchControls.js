// On-screen touch controls for phones/tablets (or any coarse-pointer
// device). Mirrors the keyboard 1:1 via Input.pressVirtual/releaseVirtual
// (see input.js) so gameplay code never has to know or care where a press
// came from. Only injected into the DOM on touch-capable devices -- desktop
// keyboard players never see it.

import { Input } from './input.js';

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/** Injects the on-screen control buttons (no-op if not a touch device or
 * already set up). Returns a `setVisible(bool)` you can call each frame to
 * show/hide the whole cluster (e.g. hide it on the title/win/gameover
 * screens where it'd just be clutter over menu buttons). */
export function setupTouchControls() {
  if (!isTouchDevice()) return { setVisible: () => {} };

  document.body.classList.add('touch-device');

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
  document.body.appendChild(root);

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
