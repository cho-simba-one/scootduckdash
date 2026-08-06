// Composition data for the Duck Scooter Dash theme. Kept separate from the
// synth engine (music.js) so "what the song IS" and "how notes get played"
// don't tangle -- change the tune here without touching audio-engine code.
//
// Vibe brief (v3): back to the driving, pulsing minor-key arpeggio backbone
// (the Knight-Rider-esque bass ostinato from v1 -- Captain liked that one)
// under a catchy chiptune lead hook, upbeat and energetic. Softer than v1's
// timbre though (triangle waves + a lowpass filter in music.js, not raw
// square/sawtooth) so it stays punchy without being harsh. No drums, no
// spoken lyrics -- just an instrumental, upbeat and "involved" bassline.

export const BPM = 140;

// One "step" = one 16th note. Everything below is indexed in 16th steps.
export const STEP_SECONDS = 60 / BPM / 4;

// Equal-tempered note frequencies (A4 = 440Hz) for the handful of notes this
// tune actually uses -- a full chromatic generator would be overkill here.
const NOTE_FREQ = {
  A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00,
  A4: 440.00, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

/** Looks up a note name's frequency, or returns null for a rest (null/undefined entry). */
export function noteFreq(name) {
  return name ? NOTE_FREQ[name] ?? null : null;
}

// --- Bass ostinato: 1 bar (16 steps), loops continuously underneath ------
// Fast pulsing arpeggio across the A-minor triad -- the driving backbone
// the whole track rides on.
export const BASS_PATTERN = [
  'A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'A3', 'C4',
  'E4', 'A4', 'E4', 'C4', 'A3', 'E4', 'C4', 'A3',
];

// --- Lead hook: 2 bars (32 steps), the memorable melodic riff on top -----
// 8th-note rhythm (only even step indices carry a note) so it breathes
// against the busier 16th-note bass pulse instead of turning to mush.
export const MELODY_PATTERN = [
  'E5', null, 'D5', null, 'C5', null, 'D5', null,
  'E5', null, 'E5', null, 'E5', null, null, null,
  'D5', null, 'D5', null, 'D5', null, null, null,
  'C5', null, 'D5', null, 'E5', null, 'C5', null,
];

// --- One-shot stingers (state-transition jingles, not looped) ------------
// Simple ascending/descending runs -- (note, stepsLong) pairs so each note
// can have a different sustain instead of every note being one step long.
export const VICTORY_JINGLE = [
  ['C5', 2], ['E5', 2], ['G5', 2], ['C5', 1], ['G5', 1], ['C5', 4],
];

export const GAMEOVER_JINGLE = [
  ['A4', 3], ['G4', 3], ['E4', 3], ['A3', 6],
];
