// Gameplay sound effects. Every sound is synthesized on the fly -- no audio
// files, matching how pixelArt.js draws all the graphics in code.
//
// These are DEFINITIONS only: each entry is a small function describing how
// to build one sound. The engine (music.js) owns the AudioContext and calls
// these, so there's exactly one context and one mute control in the app
// rather than a second audio stack fighting the first.
//
// Design rule: each creature gets a distinct timbre AND register so you can
// identify what happened without looking:
//   frog   -> low, wet, downward pitch bend
//   goose  -> mid, nasal, harsh sawtooth honk
//   cart   -> creaky wooden rattle (filtered noise)
//   shoot  -> short high blip
//   jump   -> quick upward chirp
//   hurt   -> harsh downward buzz
//   splash -> noise burst swept downward

/** Short pitched blip with an optional glide from->to. */
function tone(ctx, dest, { from, to = from, dur = 0.12, type = 'square', gain = 0.12, delay = 0 }) {
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(g).connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Filtered noise burst -- the basis for splashes, rattles and thuds. */
function noise(ctx, dest, { dur = 0.2, type = 'bandpass', freq = 1200, q = 1,
                            sweepTo = null, gain = 0.12, delay = 0 } = {}) {
  const t0 = ctx.currentTime + delay;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(freq, t0);
  filter.Q.value = q;
  if (sweepTo !== null) filter.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + dur);

  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.connect(filter).connect(g).connect(dest);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export const SFX = {
  /** Propeller shot -- short, high, mechanical. */
  shoot(ctx, dest) {
    tone(ctx, dest, { from: 900, to: 1500, dur: 0.07, type: 'square', gain: 0.07 });
  },

  /** Duck jump -- quick upward chirp. */
  jump(ctx, dest) {
    tone(ctx, dest, { from: 320, to: 720, dur: 0.11, type: 'triangle', gain: 0.09 });
  },

  /** Frog defeated -- low wet croak collapsing downward. */
  frog(ctx, dest) {
    tone(ctx, dest, { from: 300, to: 110, dur: 0.2, type: 'sawtooth', gain: 0.11 });
    tone(ctx, dest, { from: 150, to: 60, dur: 0.24, type: 'square', gain: 0.06, delay: 0.03 });
    noise(ctx, dest, { dur: 0.12, freq: 700, sweepTo: 200, gain: 0.06, delay: 0.02 });
  },

  /** Frog tongue lash -- a quick wet whip, distinct from the death croak. */
  tongue(ctx, dest) {
    noise(ctx, dest, { dur: 0.1, type: 'bandpass', freq: 1800, sweepTo: 500, q: 3, gain: 0.09 });
  },

  /** Goose defeated -- harsh nasal honk. Two detuned saws give the buzz. */
  goose(ctx, dest) {
    tone(ctx, dest, { from: 520, to: 380, dur: 0.22, type: 'sawtooth', gain: 0.10 });
    tone(ctx, dest, { from: 526, to: 384, dur: 0.22, type: 'sawtooth', gain: 0.07 });
    tone(ctx, dest, { from: 260, to: 190, dur: 0.26, type: 'square', gain: 0.05, delay: 0.02 });
  },

  /** Landing on a cart -- creaky wooden clunk plus a rattle. */
  cart(ctx, dest) {
    tone(ctx, dest, { from: 190, to: 130, dur: 0.1, type: 'square', gain: 0.07 });
    noise(ctx, dest, { dur: 0.22, type: 'bandpass', freq: 900, sweepTo: 320, q: 2.2, gain: 0.09 });
  },

  /** Player takes a hit -- harsh downward buzz, unmistakably bad. */
  hurt(ctx, dest) {
    tone(ctx, dest, { from: 420, to: 90, dur: 0.3, type: 'sawtooth', gain: 0.13 });
    noise(ctx, dest, { dur: 0.16, type: 'lowpass', freq: 1400, sweepTo: 200, gain: 0.09 });
  },

  /** Falling in the pond -- big downward-swept splash. */
  splash(ctx, dest) {
    noise(ctx, dest, { dur: 0.45, type: 'lowpass', freq: 3000, sweepTo: 250, gain: 0.16 });
    tone(ctx, dest, { from: 260, to: 70, dur: 0.35, type: 'sine', gain: 0.08 });
  },

  /** Stomp connect -- satisfying short thud, layered under the enemy sound. */
  stomp(ctx, dest) {
    tone(ctx, dest, { from: 220, to: 80, dur: 0.12, type: 'triangle', gain: 0.11 });
  },

  /** Collected a bonus -- bright ascending arpeggio. Deliberately the only
   * RISING major figure in the whole set, so a reward can never be mistaken
   * for one of the hazards. */
  pickup(ctx, dest) {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      tone(ctx, dest, {
        from: freq, dur: 0.16, type: 'triangle', gain: 0.13, delay: i * 0.055,
      });
    });
  },

  pig(ctx, dest) {
    tone(ctx, dest, { from: 240, to: 140, dur: 0.18, type: 'square', gain: 0.11 });
    noise(ctx, dest, { dur: 0.14, freq: 400, sweepTo: 120, gain: 0.07 });
  },

  bee(ctx, dest) {
    tone(ctx, dest, { from: 880, to: 1400, dur: 0.08, type: 'square', gain: 0.06 });
    tone(ctx, dest, { from: 900, to: 1500, dur: 0.08, type: 'square', gain: 0.04, delay: 0.04 });
  },

  mole(ctx, dest) {
    noise(ctx, dest, { dur: 0.18, type: 'lowpass', freq: 500, sweepTo: 90, gain: 0.1 });
    tone(ctx, dest, { from: 160, to: 70, dur: 0.16, type: 'triangle', gain: 0.07 });
  },

  crow(ctx, dest) {
    tone(ctx, dest, { from: 640, to: 280, dur: 0.2, type: 'sawtooth', gain: 0.09 });
    tone(ctx, dest, { from: 650, to: 290, dur: 0.2, type: 'sawtooth', gain: 0.05 });
  },

  bounce(ctx, dest) {
    tone(ctx, dest, { from: 400, to: 920, dur: 0.16, type: 'triangle', gain: 0.11 });
    tone(ctx, dest, { from: 600, to: 1200, dur: 0.12, type: 'square', gain: 0.05, delay: 0.04 });
  },

  quack(ctx, dest) {
    tone(ctx, dest, { from: 380, to: 220, dur: 0.14, type: 'sawtooth', gain: 0.12 });
    tone(ctx, dest, { from: 260, to: 140, dur: 0.18, type: 'square', gain: 0.08, delay: 0.05 });
  },

  egg(ctx, dest) {
    const notes = [659.25, 783.99, 987.77, 1318.51];
    notes.forEach((freq, i) => {
      tone(ctx, dest, {
        from: freq, dur: 0.18, type: 'triangle', gain: 0.14, delay: i * 0.07,
      });
    });
  },
};
