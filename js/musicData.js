// Composition data for the Duck Scooter Dash theme. Kept separate from the
// synth engine (music.js) so "what the song IS" and "how notes get played"
// don't tangle -- change the tune here without touching audio-engine code.
//
// Vibe brief (v4): full send on "80s getaway-driver techno," Knight-Rider
// inspired. Earlier attempts kept a bouncy pentatonic lead hook on top of
// the arpeggio, which read as twee/cute (the "Mary Had a Little Lamb"
// complaint) no matter how the bass underneath sounded. This version drops
// the melodic hook entirely -- just the driving arpeggio bass, a dark
// sustained pad wash for atmosphere, and a soft kick pulse for a techno
// heartbeat. No "tune" to hum, just mood and drive.

export const BPM = 132;

// One "step" = one 16th note. Everything below is indexed in 16th steps.
export const STEP_SECONDS = 60 / BPM / 4;

// The whole pattern is just 1 bar (16 steps) now -- there's no multi-bar
// melody to justify a longer loop, and the pad/kick both retrigger every bar.
export const LOOP_STEPS = 16;

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

// --- Bass ostinato: driving 16th-note pulse, mostly bouncing between the
// root and the fifth (A3/E4) -- that's the actual core of the Knight Rider
// pulse, not a full triad arpeggio -- with brief passing tones for interest.
export const BASS_PATTERN = [
  'A3', 'E4', 'A3', 'E4', 'A3', 'C4', 'A3', 'E4',
  'A3', 'E4', 'A3', 'E4', 'A3', 'C4', 'E4', 'A3',
];

// --- Sustained pad chord: retriggered once per bar, held almost the whole
// bar, very quiet -- pure atmosphere/wash, not a melody to notice or hum.
export const PAD_CHORD = ['A3', 'C4', 'E4'];

// --- Soft kick pulse: quarter notes, the techno "heartbeat" under the
// arpeggio. Deliberately no hi-hats/noise percussion -- that's what read as
// harsh before.
export const KICK_STEPS = [0, 4, 8, 12];

// --- One-shot stingers (state-transition jingles, not looped) ------------
// Simple ascending/descending runs -- (note, stepsLong) pairs so each note
// can have a different sustain instead of every note being one step long.
export const VICTORY_JINGLE = [
  ['C5', 2], ['E5', 2], ['G5', 2], ['C5', 1], ['G5', 1], ['C5', 4],
];

export const GAMEOVER_JINGLE = [
  ['A4', 3], ['G4', 3], ['E4', 3], ['A3', 6],
];
