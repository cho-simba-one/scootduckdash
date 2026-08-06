// Spoken/sung "vocals" for the theme, using the browser's built-in
// SpeechSynthesis API -- real words, zero audio files or third-party TTS
// service, same procedural-everything philosophy as the rest of the game.
//
// This runs as its own loosely-timed loop alongside the (precisely
// scheduled) instrumental in music.js. The Speech API has no sample-accurate
// timing controls, so we don't fight it -- lines just play through in
// sequence like ad-libs over the top, not locked to the beat grid.

const LYRICS = [
  "It's a duck on a scooter,",
  "it's a Scooter Duck Dash!",
  'Cruising through the farmyard',
  'in a yellow feathered flash.',
  'Hopping over lily pads,',
  'dodging all the frogs,',
  'quack quack, here he comes,',
  'the fastest duck around!',
];

const GAP_BETWEEN_LOOPS_MS = 4000;

class LyricsPlayer {
  constructor() {
    this.enabled = 'speechSynthesis' in window;
    this.muted = false;
    this.playing = false;
    this.lineIndex = 0;
    this.loopTimer = null;
  }

  /** Starts the looping lyric cycle (no-op if unsupported or already
   * playing). Call from a user-gesture handler alongside Music.start(). */
  start() {
    if (!this.enabled || this.playing) return;
    this.playing = true;
    this.lineIndex = 0;
    this.speakNext();
  }

  stop() {
    this.playing = false;
    if (this.loopTimer) clearTimeout(this.loopTimer);
    if (this.enabled) window.speechSynthesis.cancel();
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted && this.enabled) window.speechSynthesis.cancel();
  }

  speakNext() {
    if (!this.playing) return;

    if (this.muted) {
      this.loopTimer = setTimeout(() => this.speakNext(), 800);
      return;
    }

    if (this.lineIndex >= LYRICS.length) {
      this.lineIndex = 0;
      this.loopTimer = setTimeout(() => this.speakNext(), GAP_BETWEEN_LOOPS_MS);
      return;
    }

    const utter = new SpeechSynthesisUtterance(LYRICS[this.lineIndex]);
    utter.pitch = 1.4; // a bit higher/cuter -- more "duck", less "default robot"
    utter.rate = 0.92; // slightly slower so it reads as sung, not rushed
    utter.volume = 0.85;
    utter.onend = () => {
      this.lineIndex += 1;
      this.speakNext();
    };
    utter.onerror = () => {
      this.lineIndex += 1;
      this.speakNext();
    };
    window.speechSynthesis.speak(utter);
  }
}

export const Lyrics = new LyricsPlayer();
