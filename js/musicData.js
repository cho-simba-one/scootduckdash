// Composition data for the Duck Scooter Dash theme. Kept separate from the
// synth engine (music.js) so "what the song IS" and "how notes get played"
// don't tangle -- change the tune here without touching audio-engine code.
//
// Vibe brief (v5, total rewrite): "hacker techno" -- Mr. Robot / Matrix
// terminal energy, not "80s getaway driver" energy. Everything before this
// was some flavor of driving/upbeat arpeggio, which kept missing the mark.
// This version is deliberately COLD and SPARSE instead: a slow hypnotic
// bass pulse that dips into a dissonant minor-second neighbor tone (proper
// "something's not right" tension, not a pleasant triad), irregular
// glitchy "data blip" hits instead of a beat you'd nod along to, and a deep
// sub-bass drone underneath. Nothing here should read as an upbeat tune.

export const BPM = 96;

// One "step" = one 16th note. Everything below is indexed in 16th steps.
export const STEP_SECONDS = 60 / BPM / 4;

export const LOOP_STEPS = 16; // 1 bar -- short, repetitive, hypnotic on purpose

// Equal-tempered note frequencies (A4 = 440Hz). Low register (2s/3s) for the
// cold bass/drone, high register (5s/6) for the sparse digital "blips".
const NOTE_FREQ = {
  A2: 110.00, D3: 146.83,
  A3: 220.00, Bb3: 233.08, C4: 261.63,
  D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
  C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.50,
};

/** Looks up a note name's frequency, or returns null for a rest (null/undefined entry). */
export function noteFreq(name) {
  return name ? NOTE_FREQ[name] ?? null : null;
}

// --- Bass pulse: slow 8th-note hypnotic throb, mostly sitting on the root
// but dipping into a dissonant minor-second neighbor (A3 -> Bb3) for tension
// instead of a "nice"-sounding triad move. This is deliberately repetitive
// and a little uneasy, not catchy.
export const BASS_PATTERN = [
  'A3', null, 'A3', null, 'A3', null, 'Bb3', null,
  'A3', null, 'A3', null, 'A3', null, 'Bb3', null,
];

// --- Data blips: sparse, irregular high hits -- a "terminal processing"
// texture, not a melody. Deliberately off-grid/asymmetric placement.
export const BLIP_PATTERN = [
  null, null, null, 'G5', null, null, null, null,
  null, 'C6', null, null, null, 'E5', null, null,
];

// --- Sub-bass drone: one long low note held almost the whole bar, very
// quiet -- cold atmosphere, not a melodic pad.
export const DRONE_NOTE = 'A2';

// --- Glitch clicks: sparse, irregular percussive ticks -- texture, not a
// beat you'd nod along to. No steady four-on-the-floor anything.
export const CLICK_STEPS = [0, 6, 10, 13];

// --- One-shot stingers (state-transition jingles, not looped) ------------
export const VICTORY_JINGLE = [
  ['C5', 2], ['E5', 2], ['G5', 2], ['C5', 1], ['G5', 1], ['C5', 4],
];

export const GAMEOVER_JINGLE = [
  ['A4', 3], ['G4', 3], ['E4', 3], ['A3', 6],
];
