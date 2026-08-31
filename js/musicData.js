// Composition data for Duck Scooter Dash. Kept separate from the synth
// engine (music.js) so "what the song IS" and "how notes get played" don't
// tangle -- retune a track here without touching audio-engine code.
//
// There is one TRACK per level, each matched to that level's theme. The
// engine reads whichever track is selected; adding a level means adding a
// track object here, nothing more.

// Equal-tempered note frequencies (A4 = 440Hz).
const NOTE_FREQ = {
  A1: 55.00, C2: 65.41, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, G2: 98.00,
  Ab2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47, C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81,
  F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13,
  E4: 329.63, F4: 349.23, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
  C6: 1046.50, E6: 1318.51, G6: 1567.98,
};

/** Frequency for a note name, or null for a rest. */
export function noteFreq(name) {
  return name ? NOTE_FREQ[name] ?? null : null;
}

function stepSeconds(bpm) {
  return 60 / bpm / 4; // one step = one 16th note
}

// --- Track 1: Farmyard Frolic (day) -------------------------------------
// The established "hacker techno" identity, kept intact: cold square bass
// dipping to a dissonant minor second, sparse data blips, sub drone.
const FARMYARD = {
  name: 'Farmyard Frolic',
  bpm: 96,
  loopSteps: 16,
  bass: {
    type: 'square', gain: 0.09, length: 1.6,
    pattern: ['A3', null, 'A3', null, 'A3', null, 'Bb3', null,
              'A3', null, 'A3', null, 'A3', null, 'Bb3', null],
  },
  lead: {
    type: 'square', gain: 0.06, length: 0.7,
    pattern: [null, null, null, 'G5', null, null, null, null,
              null, 'C6', null, null, null, 'E5', null, null],
  },
  drone: { note: 'A2', type: 'sine', gain: 0.10 },
  clicks: [0, 6, 10, 13],
};

// --- Track 2: Orchard Sunset ---------------------------------------------
// Warmer and faster -- a rolling triangle-wave bassline that actually walks
// somewhere, with a wistful sawtooth motif over it. Still not "cheerful",
// but it moves like a chase where the day is running out.
const ORCHARD = {
  name: 'Orchard Sunset',
  bpm: 112,
  loopSteps: 16,
  bass: {
    type: 'triangle', gain: 0.11, length: 1.1,
    pattern: ['D3', null, 'A3', null, 'F3', null, 'A3', null,
              'C3', null, 'G3', null, 'E3', null, 'G3', null],
  },
  lead: {
    type: 'sawtooth', gain: 0.05, length: 1.4,
    pattern: [null, null, 'D5', null, null, 'F5', null, null,
              'E5', null, null, null, 'D5', null, 'C5', null],
  },
  drone: { note: 'D2', type: 'triangle', gain: 0.08 },
  clicks: [0, 4, 8, 12], // steadier pulse than level 1 -- more urgency
};

// --- Track 3: Midnight Pond ----------------------------------------------
// Slow, deep and dread-laden. Long sine sub, a sparse minor motif drifting
// on top, and irregular clicks so it never settles into a groove.
const MIDNIGHT = {
  name: 'Midnight Pond',
  bpm: 76,
  loopSteps: 16,
  bass: {
    type: 'sine', gain: 0.13, length: 2.4,
    pattern: ['C3', null, null, null, 'C3', null, null, null,
              'Bb2', null, null, null, 'G2', null, null, null],
  },
  lead: {
    type: 'triangle', gain: 0.055, length: 2.2,
    // Eb gives the minor colour that makes this read as dread rather than calm.
    pattern: [null, null, null, null, 'G4', null, null, null,
              null, null, 'Eb4', null, null, null, 'D4', null],
  },
  drone: { note: 'C2', type: 'sine', gain: 0.12 },
  clicks: [0, 7, 11],
};

// --- Track 4: Dawn Hayride -----------------------------------------------
// Brighter pulse than Orchard, still not cheerful -- a running eighth-note
// triangle that keeps you moving so the carts don't leave without you.
const DAWN = {
  name: 'Dawn Hayride',
  bpm: 120,
  loopSteps: 16,
  bass: {
    type: 'triangle', gain: 0.11, length: 0.9,
    pattern: ['F3', null, 'C4', null, 'A3', null, 'C4', null,
              'G3', null, 'D4', null, 'Bb3', null, 'D4', null],
  },
  lead: {
    type: 'square', gain: 0.05, length: 0.8,
    pattern: [null, 'A4', null, null, 'C5', null, null, 'F5',
              null, null, 'E5', null, null, 'C5', null, null],
  },
  drone: { note: 'F2', type: 'sine', gain: 0.09 },
  clicks: [0, 4, 8, 12],
};

// --- Track 5: Storm on the Pond ------------------------------------------
// Low saw rumble, slow, minor. Clicks refuse a steady beat on purpose.
const STORM = {
  name: 'Storm on the Pond',
  bpm: 88,
  loopSteps: 16,
  bass: {
    type: 'sawtooth', gain: 0.08, length: 1.8,
    pattern: ['G2', null, null, 'G2', null, null, 'Bb2', null,
              'F2', null, null, 'F2', null, null, 'G2', null],
  },
  lead: {
    type: 'triangle', gain: 0.05, length: 1.6,
    pattern: [null, null, 'D4', null, null, null, null, 'Bb3',
              null, null, null, 'G4', null, null, 'F4', null],
  },
  drone: { note: 'G2', type: 'sine', gain: 0.11 },
  clicks: [0, 5, 9, 14],
};

const PIGPEN = {
  name: 'Pig Pen',
  bpm: 108,
  loopSteps: 16,
  bass: {
    type: 'square', gain: 0.10, length: 1.0,
    pattern: ['E3', null, 'E3', 'G3', null, 'E3', null, 'B3',
              'E3', null, 'E3', 'G3', null, 'D3', null, 'E3'],
  },
  lead: {
    type: 'sawtooth', gain: 0.045, length: 0.9,
    pattern: [null, 'E5', null, null, 'G5', null, 'B4', null,
              null, null, 'E5', null, null, 'D5', null, null],
  },
  drone: { note: 'E2', type: 'triangle', gain: 0.08 },
  clicks: [0, 3, 8, 11],
};

const MEADOW = {
  name: 'Bee Meadow',
  bpm: 128,
  loopSteps: 16,
  bass: {
    type: 'triangle', gain: 0.10, length: 0.7,
    pattern: ['G3', 'D4', null, 'G3', 'A3', 'E4', null, 'A3',
              'F3', 'C4', null, 'F3', 'G3', 'D4', null, 'G3'],
  },
  lead: {
    type: 'square', gain: 0.05, length: 0.5,
    pattern: ['G5', null, 'B4', null, 'D5', null, 'G5', null,
              'A5', null, 'D5', null, 'G5', null, 'E5', null],
  },
  drone: { note: 'G2', type: 'sine', gain: 0.07 },
  clicks: [0, 4, 6, 8, 12, 14],
};

const MOLES = {
  name: 'Mole Patch',
  bpm: 92,
  loopSteps: 16,
  bass: {
    type: 'sine', gain: 0.12, length: 1.6,
    pattern: ['D3', null, null, 'A2', null, null, 'D3', null,
              'C3', null, null, 'G2', null, null, 'Bb2', null],
  },
  lead: {
    type: 'triangle', gain: 0.05, length: 1.8,
    pattern: [null, null, 'D4', null, null, null, 'F4', null,
              null, null, 'A4', null, null, 'G4', null, null],
  },
  drone: { note: 'D2', type: 'sine', gain: 0.10 },
  clicks: [0, 6, 13],
};

const GALE = {
  name: 'Crow Ridge',
  bpm: 118,
  loopSteps: 16,
  bass: {
    type: 'sawtooth', gain: 0.08, length: 1.1,
    pattern: ['A2', null, 'E3', null, 'A2', null, 'C3', null,
              'G2', null, 'D3', null, 'G2', null, 'Bb2', null],
  },
  lead: {
    type: 'triangle', gain: 0.055, length: 1.2,
    pattern: ['E5', null, null, 'C5', null, 'A4', null, null,
              'D5', null, null, 'Bb4', null, 'G4', null, null],
  },
  drone: { note: 'A1', type: 'sine', gain: 0.09 },
  clicks: [0, 2, 8, 10],
};

const FAIR = {
  name: 'Moonlit Fair',
  bpm: 100,
  loopSteps: 16,
  bass: {
    type: 'square', gain: 0.09, length: 1.4,
    pattern: ['C3', null, 'G3', null, 'Eb3', null, 'Bb2', null,
              'C3', null, 'G3', null, 'F3', null, 'G2', null],
  },
  lead: {
    type: 'sawtooth', gain: 0.04, length: 1.5,
    pattern: [null, 'G4', null, 'C5', null, null, 'Eb5', null,
              null, 'D5', null, null, 'Bb4', null, 'G4', null],
  },
  drone: { note: 'C2', type: 'triangle', gain: 0.10 },
  clicks: [0, 5, 8, 13],
};

const CURB = {
  name: 'Curb Check', bpm: 114, loopSteps: 16,
  bass: { type: 'square', gain: 0.10, length: 0.9,
    pattern: ['A2', null, 'A2', 'E3', null, 'A2', null, 'G2',
              'A2', null, 'A2', 'E3', null, 'C3', null, 'A2'] },
  lead: { type: 'sawtooth', gain: 0.04, length: 0.7,
    pattern: [null, 'A4', null, 'E5', null, null, 'C5', null,
              null, 'A4', null, null, 'G4', null, 'E4', null] },
  drone: { note: 'A1', type: 'sine', gain: 0.08 }, clicks: [0, 4, 8, 12],
};
const SQUARE = {
  name: 'Pigeon Square', bpm: 122, loopSteps: 16,
  bass: { type: 'triangle', gain: 0.10, length: 0.8,
    pattern: ['D3', 'A3', null, 'D3', 'F3', 'C4', null, 'F3',
              'G2', 'D3', null, 'G2', 'A2', 'E3', null, 'A2'] },
  lead: { type: 'square', gain: 0.045, length: 0.5,
    pattern: ['D5', null, 'F5', null, 'A4', null, 'D5', null,
              'E5', null, 'A4', null, 'C5', null, 'G4', null] },
  drone: { note: 'D2', type: 'triangle', gain: 0.07 }, clicks: [0, 3, 8, 11],
};
const RUSH = {
  name: 'Rush Hour', bpm: 132, loopSteps: 16,
  bass: { type: 'sawtooth', gain: 0.08, length: 0.7,
    pattern: ['E2', 'E3', 'E2', 'G2', 'E2', 'E3', 'B2', 'E3',
              'D2', 'D3', 'D2', 'F2', 'D2', 'D3', 'A2', 'D3'] },
  lead: { type: 'square', gain: 0.04, length: 0.4,
    pattern: ['B4', 'E5', null, 'G5', null, 'E5', 'B4', null,
              'A4', 'D5', null, 'F5', null, 'D5', 'A4', null] },
  drone: { note: 'E2', type: 'sine', gain: 0.08 }, clicks: [0, 2, 4, 8, 10, 12],
};
const STEAM = {
  name: 'Alley Steam', bpm: 96, loopSteps: 16,
  bass: { type: 'sine', gain: 0.12, length: 1.5,
    pattern: ['G2', null, null, 'D3', null, null, 'G2', null,
              'F2', null, null, 'C3', null, null, 'Bb2', null] },
  lead: { type: 'triangle', gain: 0.05, length: 1.4,
    pattern: [null, null, 'G4', null, null, 'Bb4', null, null,
              null, 'F4', null, null, 'D4', null, 'G4', null] },
  drone: { note: 'G2', type: 'sine', gain: 0.1 }, clicks: [0, 7, 11],
};
const BELT = {
  name: 'Belt Yard', bpm: 110, loopSteps: 16,
  bass: { type: 'square', gain: 0.09, length: 1.0,
    pattern: ['C3', null, 'G3', 'C3', null, 'Eb3', null, 'G3',
              'Bb2', null, 'F3', 'Bb2', null, 'D3', null, 'F3'] },
  lead: { type: 'sawtooth', gain: 0.04, length: 0.9,
    pattern: ['C5', null, null, 'G4', null, 'Eb5', null, null,
              'Bb4', null, null, 'F4', null, 'D5', null, null] },
  drone: { note: 'C2', type: 'triangle', gain: 0.08 }, clicks: [0, 4, 9, 12],
};
const SCAFF = {
  name: 'Scaffold Run', bpm: 116, loopSteps: 16,
  bass: { type: 'triangle', gain: 0.10, length: 0.85,
    pattern: ['A2', 'E3', 'A2', null, 'C3', 'G3', 'C3', null,
              'G2', 'D3', 'G2', null, 'Bb2', 'F3', 'Bb2', null] },
  lead: { type: 'square', gain: 0.045, length: 0.6,
    pattern: [null, 'A4', 'C5', null, 'E5', null, 'C5', null,
              null, 'G4', 'Bb4', null, 'D5', null, 'Bb4', null] },
  drone: { note: 'A2', type: 'sine', gain: 0.07 }, clicks: [0, 5, 8, 13],
};
const MARKET = {
  name: 'Night Market', bpm: 104, loopSteps: 16,
  bass: { type: 'sawtooth', gain: 0.07, length: 1.2,
    pattern: ['F2', null, 'C3', null, 'Ab2', null, 'Eb3', null,
              'F2', null, 'C3', null, 'Bb2', null, 'F3', null] },
  lead: { type: 'triangle', gain: 0.05, length: 1.1,
    pattern: ['Ab4', null, null, 'C5', null, 'F5', null, null,
              'Eb5', null, null, 'Bb4', null, 'Ab4', null, null] },
  drone: { note: 'F2', type: 'sine', gain: 0.09 }, clicks: [0, 6, 10],
};
const OVER = {
  name: 'Overpass', bpm: 124, loopSteps: 16,
  bass: { type: 'square', gain: 0.09, length: 0.75,
    pattern: ['D2', 'D3', null, 'D2', 'F2', 'A2', null, 'D3',
              'C2', 'C3', null, 'C2', 'Eb2', 'G2', null, 'C3'] },
  lead: { type: 'sawtooth', gain: 0.04, length: 0.55,
    pattern: ['A4', null, 'D5', null, 'F5', null, 'A4', null,
              'G4', null, 'C5', null, 'Eb5', null, 'G4', null] },
  drone: { note: 'D2', type: 'triangle', gain: 0.08 }, clicks: [0, 2, 8, 10],
};
const HAT = {
  name: 'Hard Hat', bpm: 108, loopSteps: 16,
  bass: { type: 'sine', gain: 0.11, length: 1.1,
    pattern: ['E2', null, 'B2', null, 'E3', null, 'G2', null,
              'D2', null, 'A2', null, 'D3', null, 'F2', null] },
  lead: { type: 'square', gain: 0.04, length: 0.8,
    pattern: [null, 'E4', null, 'G4', null, 'B4', null, 'E5',
              null, 'D4', null, 'F4', null, 'A4', null, 'D5'] },
  drone: { note: 'E2', type: 'sine', gain: 0.09 }, clicks: [0, 4, 7, 12],
};
const NEON = {
  name: 'Neon Run', bpm: 120, loopSteps: 16,
  bass: { type: 'sawtooth', gain: 0.08, length: 0.9,
    pattern: ['C3', null, 'G3', 'Bb2', null, 'F3', 'Ab2', null,
              'C3', null, 'G3', 'Eb3', null, 'Bb2', 'F3', null] },
  lead: { type: 'triangle', gain: 0.055, length: 0.7,
    pattern: ['G5', null, 'Eb5', null, 'C5', null, 'Bb4', null,
              'Ab4', null, 'C5', null, 'Eb5', null, 'G5', null] },
  drone: { note: 'C2', type: 'sine', gain: 0.1 }, clicks: [0, 3, 8, 11, 14],
};

const GIZA = {
  name: 'Giza Dawn', bpm: 108, loopSteps: 16,
  bass: { type: 'square', gain: 0.09, length: 1.1,
    pattern: ['D3', null, 'A3', null, 'F3', null, 'A3', null,
              'C3', null, 'G3', null, 'Eb3', null, 'G3', null] },
  lead: { type: 'triangle', gain: 0.045, length: 0.8,
    pattern: [null, 'D5', null, 'F5', null, null, 'A4', null,
              null, 'C5', null, 'Eb5', null, null, 'G4', null] },
  drone: { note: 'D2', type: 'sine', gain: 0.09 }, clicks: [0, 5, 8, 13],
};
const SPHINX = {
  name: 'Sphinx Dunes', bpm: 100, loopSteps: 16,
  bass: { type: 'sawtooth', gain: 0.07, length: 1.3,
    pattern: ['G2', null, null, 'D3', null, 'G2', 'Bb2', null,
              'F2', null, null, 'C3', null, 'F2', 'Ab2', null] },
  lead: { type: 'square', gain: 0.04, length: 0.9,
    pattern: ['G4', null, null, 'Bb4', null, null, 'D5', null,
              'F4', null, null, 'Ab4', null, null, 'C5', null] },
  drone: { note: 'G2', type: 'triangle', gain: 0.08 }, clicks: [0, 7, 11],
};
const NILE = {
  name: 'Nile Crossing', bpm: 92, loopSteps: 16,
  bass: { type: 'sine', gain: 0.12, length: 1.5,
    pattern: ['A2', null, null, 'E3', null, null, 'A2', null,
              'G2', null, null, 'D3', null, null, 'C3', null] },
  lead: { type: 'triangle', gain: 0.05, length: 1.3,
    pattern: [null, null, 'A4', null, null, 'C5', null, null,
              null, 'G4', null, null, 'E4', null, 'A4', null] },
  drone: { note: 'A1', type: 'sine', gain: 0.1 }, clicks: [0, 6, 12],
};
const RIM = {
  name: 'Canyon Rim', bpm: 118, loopSteps: 16,
  bass: { type: 'square', gain: 0.09, length: 0.8,
    pattern: ['E2', 'E3', null, 'E2', 'G2', 'B2', null, 'E3',
              'D2', 'D3', null, 'D2', 'F2', 'A2', null, 'D3'] },
  lead: { type: 'sawtooth', gain: 0.04, length: 0.55,
    pattern: ['B4', null, 'E5', null, 'G5', null, 'B4', null,
              'A4', null, 'D5', null, 'F5', null, 'A4', null] },
  drone: { note: 'E2', type: 'triangle', gain: 0.08 }, clicks: [0, 2, 8, 10],
};
const SWITCH = {
  name: 'Switchbacks', bpm: 112, loopSteps: 16,
  bass: { type: 'triangle', gain: 0.10, length: 0.9,
    pattern: ['C3', 'G3', 'C3', null, 'Eb3', 'Bb3', 'Eb3', null,
              'Bb2', 'F3', 'Bb2', null, 'G2', 'D3', 'G2', null] },
  lead: { type: 'square', gain: 0.04, length: 0.6,
    pattern: [null, 'C5', 'Eb5', null, 'G5', null, 'Eb5', null,
              null, 'Bb4', 'D5', null, 'F5', null, 'D5', null] },
  drone: { note: 'C2', type: 'sine', gain: 0.08 }, clicks: [0, 4, 9, 12],
};
const PARIS = {
  name: 'Paris Lights', bpm: 104, loopSteps: 16,
  bass: { type: 'sawtooth', gain: 0.07, length: 1.2,
    pattern: ['F2', null, 'C3', null, 'Ab2', null, 'Eb3', null,
              'F2', null, 'C3', null, 'Bb2', null, 'F3', null] },
  lead: { type: 'triangle', gain: 0.05, length: 1.0,
    pattern: ['Ab4', null, null, 'C5', null, 'F5', null, null,
              'Eb5', null, null, 'Bb4', null, 'Ab4', null, null] },
  drone: { note: 'F2', type: 'sine', gain: 0.09 }, clicks: [0, 6, 10],
};
const WALLT = {
  name: 'Great Wall', bpm: 110, loopSteps: 16,
  bass: { type: 'square', gain: 0.09, length: 1.0,
    pattern: ['A2', null, 'E3', 'A2', null, 'C3', null, 'E3',
              'G2', null, 'D3', 'G2', null, 'Bb2', null, 'D3'] },
  lead: { type: 'sawtooth', gain: 0.04, length: 0.7,
    pattern: ['A4', null, 'C5', null, 'E5', null, 'A4', null,
              'G4', null, 'Bb4', null, 'D5', null, 'G4', null] },
  drone: { note: 'A2', type: 'triangle', gain: 0.07 }, clicks: [0, 5, 8, 13],
};
const RIO = {
  name: 'Rio Ridge', bpm: 122, loopSteps: 16,
  bass: { type: 'triangle', gain: 0.10, length: 0.75,
    pattern: ['D3', 'A3', null, 'D3', 'F3', 'C4', null, 'F3',
              'G2', 'D3', null, 'G2', 'A2', 'E3', null, 'A2'] },
  lead: { type: 'square', gain: 0.045, length: 0.5,
    pattern: ['D5', null, 'F5', null, 'A4', null, 'D5', null,
              'E5', null, 'A4', null, 'C5', null, 'G4', null] },
  drone: { note: 'D2', type: 'sine', gain: 0.08 }, clicks: [0, 3, 8, 11],
};
const HARBOR = {
  name: 'Liberty Harbor', bpm: 116, loopSteps: 16,
  bass: { type: 'sawtooth', gain: 0.08, length: 0.85,
    pattern: ['C3', null, 'G3', 'C3', null, 'Eb3', null, 'G3',
              'Bb2', null, 'F3', 'Bb2', null, 'D3', null, 'F3'] },
  lead: { type: 'triangle', gain: 0.045, length: 0.7,
    pattern: ['G5', null, 'Eb5', null, 'C5', null, 'Bb4', null,
              'F5', null, 'D5', null, 'Bb4', null, 'G4', null] },
  drone: { note: 'C2', type: 'sine', gain: 0.09 }, clicks: [0, 4, 8, 12],
};
const SCOOT = {
  name: 'World Scoot-Off', bpm: 120, loopSteps: 16,
  bass: { type: 'square', gain: 0.09, length: 0.9,
    pattern: ['C3', null, 'G3', 'Bb2', null, 'F3', 'Ab2', null,
              'C3', null, 'G3', 'Eb3', null, 'Bb2', 'F3', null] },
  lead: { type: 'triangle', gain: 0.055, length: 0.7,
    pattern: ['G5', null, 'Eb5', null, 'C5', null, 'Bb4', null,
              'Ab4', null, 'C5', null, 'Eb5', null, 'G5', null] },
  drone: { note: 'C2', type: 'sine', gain: 0.1 }, clicks: [0, 3, 8, 11, 14],
};

const DOCK = {
  name: 'Loading Dock', bpm: 92, loopSteps: 16,
  bass: { type: 'square', gain: 0.09, length: 1.5,
    pattern: ['G2', null, 'G2', null, 'Bb2', null, 'G2', null,
              'F2', null, 'F2', null, 'Ab2', null, 'F2', null] },
  lead: { type: 'triangle', gain: 0.045, length: 1.1,
    pattern: [null, null, 'G4', null, null, 'Bb4', null, null,
              null, 'F4', null, null, 'D4', null, 'G4', null] },
  drone: { note: 'G2', type: 'sine', gain: 0.09 }, clicks: [0, 6, 10, 14],
};
const CATWALK = {
  name: 'Catwalk West', bpm: 100, loopSteps: 16,
  bass: { type: 'triangle', gain: 0.10, length: 1.2,
    pattern: ['D3', null, 'A3', null, 'C3', null, 'G3', null,
              'Bb2', null, 'F3', null, 'A2', null, 'E3', null] },
  lead: { type: 'sawtooth', gain: 0.04, length: 1.3,
    pattern: [null, 'D5', null, null, 'A4', null, 'C5', null,
              null, 'Bb4', null, null, 'F4', null, 'A4', null] },
  drone: { note: 'D2', type: 'triangle', gain: 0.08 }, clicks: [0, 4, 8, 12],
};
const HOPPER = {
  name: 'Hopper House', bpm: 108, loopSteps: 16,
  bass: { type: 'square', gain: 0.09, length: 0.85,
    pattern: ['E2', 'E3', null, 'E2', 'G2', 'E3', null, 'B2',
              'D2', 'D3', null, 'D2', 'F2', 'D3', null, 'A2'] },
  lead: { type: 'square', gain: 0.04, length: 0.5,
    pattern: ['B4', null, 'E5', null, 'G4', null, 'B4', null,
              'A4', null, 'D5', null, 'F4', null, 'A4', null] },
  drone: { note: 'E2', type: 'sine', gain: 0.08 }, clicks: [0, 3, 8, 11],
};
const DEADEND = {
  name: 'Dead End East', bpm: 88, loopSteps: 16,
  bass: { type: 'sine', gain: 0.12, length: 2.0,
    pattern: ['A2', null, null, 'E3', null, null, 'A2', null,
              'G2', null, null, 'D3', null, null, 'C3', null] },
  lead: { type: 'triangle', gain: 0.04, length: 1.6,
    pattern: [null, null, 'A4', null, null, null, 'E4', null,
              null, 'G4', null, null, 'D4', null, 'C4', null] },
  drone: { note: 'A1', type: 'sine', gain: 0.1 }, clicks: [0, 7, 13],
};
const SHAFT = {
  name: 'Elevator Shaft', bpm: 96, loopSteps: 16,
  bass: { type: 'triangle', gain: 0.10, length: 1.4,
    pattern: ['C3', null, null, 'G3', 'C3', null, 'Eb3', null,
              'Bb2', null, null, 'F3', 'Bb2', null, 'D3', null] },
  lead: { type: 'square', gain: 0.04, length: 0.8,
    pattern: [null, 'C5', null, 'G4', null, 'Eb5', null, null,
              null, 'Bb4', null, 'F4', null, 'D5', null, null] },
  drone: { note: 'C2', type: 'triangle', gain: 0.09 }, clicks: [0, 5, 8, 13],
};
const WING = {
  name: 'West Wing', bpm: 102, loopSteps: 16,
  bass: { type: 'triangle', gain: 0.09, length: 1.3,
    pattern: ['F3', null, 'C4', null, 'Eb3', null, 'Bb3', null,
              'G3', null, 'D4', null, 'F3', null, 'C4', null] },
  lead: { type: 'sawtooth', gain: 0.035, length: 1.5,
    pattern: ['F4', null, null, 'A4', null, 'C5', null, null,
              'G4', null, null, 'Bb4', null, 'D5', null, null] },
  drone: { note: 'F2', type: 'sine', gain: 0.08 }, clicks: [0, 6, 10],
};
const GEAR = {
  name: 'Gear Loft', bpm: 118, loopSteps: 16,
  bass: { type: 'square', gain: 0.09, length: 0.7,
    pattern: ['G2', 'D3', 'G2', 'Bb2', 'G2', 'D3', 'F2', 'C3',
              'G2', 'D3', 'G2', 'Bb2', 'G2', 'D3', 'Eb2', 'Bb2'] },
  lead: { type: 'sawtooth', gain: 0.04, length: 0.45,
    pattern: ['G4', 'Bb4', null, 'D5', null, 'Bb4', 'G4', null,
              'F4', 'Ab4', null, 'C5', null, 'Ab4', 'F4', null] },
  drone: { note: 'G2', type: 'triangle', gain: 0.08 }, clicks: [0, 2, 4, 8, 10, 12],
};
const SHIFT = {
  name: 'Night Shift', bpm: 80, loopSteps: 16,
  bass: { type: 'sine', gain: 0.13, length: 2.2,
    pattern: ['E2', null, null, null, 'B2', null, null, null,
              'D2', null, null, null, 'A2', null, 'G2', null] },
  lead: { type: 'triangle', gain: 0.04, length: 1.8,
    pattern: [null, null, null, 'E4', null, null, 'B4', null,
              null, null, 'D4', null, null, 'A4', null, null] },
  drone: { note: 'E2', type: 'sine', gain: 0.11 }, clicks: [0, 9, 14],
};
const DUST = {
  name: 'Dust Storm', bpm: 124, loopSteps: 16,
  bass: { type: 'sawtooth', gain: 0.08, length: 0.75,
    pattern: ['A2', 'E3', 'A2', 'C3', 'A2', 'E3', 'G2', 'D3',
              'A2', 'E3', 'A2', 'C3', 'A2', 'E3', 'Bb2', 'F3'] },
  lead: { type: 'square', gain: 0.04, length: 0.5,
    pattern: ['A4', null, 'E5', null, 'C5', null, 'A4', null,
              'G4', null, 'D5', null, 'Bb4', null, 'G4', null] },
  drone: { note: 'A2', type: 'sine', gain: 0.09 }, clicks: [0, 3, 6, 8, 11, 14],
};
const PIE = {
  name: 'Pie Safe', bpm: 120, loopSteps: 16,
  bass: { type: 'square', gain: 0.09, length: 0.9,
    pattern: ['C3', null, 'G3', 'Bb2', null, 'F3', 'Ab2', null,
              'C3', null, 'G3', 'Eb3', null, 'Bb2', 'F3', null] },
  lead: { type: 'triangle', gain: 0.05, length: 0.7,
    pattern: ['G5', null, 'Eb5', null, 'C5', null, 'Bb4', null,
              'Ab4', null, 'C5', null, 'Eb5', null, 'G5', null] },
  drone: { note: 'C2', type: 'sine', gain: 0.1 }, clicks: [0, 3, 8, 11, 14],
};

export const TRACKS = [
  FARMYARD, ORCHARD, MIDNIGHT, DAWN, STORM, PIGPEN, MEADOW, MOLES, GALE, FAIR,
  CURB, SQUARE, RUSH, STEAM, BELT, SCAFF, MARKET, OVER, HAT, NEON,
  GIZA, SPHINX, NILE, RIM, SWITCH, PARIS, WALLT, RIO, HARBOR, SCOOT,
  DOCK, CATWALK, HOPPER, DEADEND, SHAFT, WING, GEAR, SHIFT, DUST, PIE,
];

/** Track for a level index, clamped so extra levels reuse the last one. */
export function trackFor(levelIndex) {
  return TRACKS[Math.max(0, Math.min(levelIndex, TRACKS.length - 1))];
}

export function trackStepSeconds(track) {
  return stepSeconds(track.bpm);
}

// --- One-shot stingers ---------------------------------------------------
// Deliberately BIG. These mark real accomplishment, so they're written as
// layered events (chords + octave doubling + a rising run) rather than the
// thin single-voice arpeggio the first version used.
//
// Each event: { notes: [...] played together, steps, type, gain, detune }

// Level clear: a triumphant rising fanfare in C major, four chord stabs
// climbing to a held octave-doubled tonic.
export const LEVEL_CLEAR_FANFARE = [
  { notes: ['C4', 'E4', 'G4'], steps: 1.5, gain: 0.20 },
  { notes: ['E4', 'G4', 'C5'], steps: 1.5, gain: 0.21 },
  { notes: ['G4', 'C5', 'E5'], steps: 1.5, gain: 0.22 },
  { notes: ['C5', 'E5', 'G5'], steps: 2.5, gain: 0.24 },
  { notes: ['G4', 'C5', 'E5', 'G5', 'C6'], steps: 7, gain: 0.26, type: 'triangle' },
];

// Final victory: everything the level-clear does, then a held six-note
// major stack with an octave above it. This should feel like a big deal.
export const VICTORY_FANFARE = [
  { notes: ['C4', 'E4', 'G4'], steps: 1, gain: 0.20 },
  { notes: ['E4', 'G4', 'C5'], steps: 1, gain: 0.21 },
  { notes: ['G4', 'C5', 'E5'], steps: 1, gain: 0.22 },
  { notes: ['C5', 'E5', 'G5'], steps: 1, gain: 0.23 },
  { notes: ['E5', 'G5', 'C6'], steps: 1, gain: 0.24 },
  { notes: ['G5', 'C6', 'E6'], steps: 2, gain: 0.25 },
  { notes: ['C4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6', 'G6'], steps: 12, gain: 0.30, type: 'triangle' },
];

// Death: a heavy descending minor collapse ending on a low held root.
export const GAMEOVER_FANFARE = [
  { notes: ['A4', 'C5', 'E5'], steps: 2, gain: 0.20 },
  { notes: ['G4', 'Bb4', 'D5'], steps: 2, gain: 0.19 },
  { notes: ['F4', 'A4', 'C5'], steps: 2, gain: 0.18 },
  { notes: ['E4', 'G4', 'B4'], steps: 3, gain: 0.17 },
  { notes: ['A2', 'A3', 'C4'], steps: 10, gain: 0.24, type: 'sawtooth' },
];
