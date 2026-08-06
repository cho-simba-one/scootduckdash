// Composition data for the Duck Scooter Dash theme. Kept separate from the
// synth engine (music.js) so "what the song IS" and "how notes get played"
// don't tangle -- change the tune here without touching audio-engine code.
//
// Vibe brief (v2, softened per feedback -- the original was a fast pulsing
// arpeggio + drums and it read as loud/harsh): a slow, gentle quarter-note
// bass-and-pad backing in A minor, mellow enough to sit *under* the spoken
// lyrics (see lyrics.js) instead of competing with them. No drums. 100 BPM.

export const BPM = 100;

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

// --- Bass pad: 1 bar (16 steps), loops continuously underneath -----------
// Slow quarter notes swaying through the A-minor triad -- calm, not driving.
export const BASS_PATTERN = [
  'A3', null, null, null,
  'C4', null, null, null,
  'E4', null, null, null,
  'C4', null, null, null,
];

// --- Lead pad: 2 bars (32 steps), a soft melodic drift on top ------------
// Also quarter notes -- gentle and spacious, leaving plenty of room for the
// spoken lyrics to be the thing you actually notice.
export const MELODY_PATTERN = [
  'E5', null, null, null, 'D5', null, null, null,
  'C5', null, null, null, 'D5', null, null, null,
  'E5', null, null, null, 'D5', null, null, null,
  'C5', null, null, null, null, null, null, null,
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
