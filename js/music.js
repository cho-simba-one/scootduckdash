// Web Audio synth engine + step sequencer. Generates every sound live --
// no audio files to ship, same "everything's procedurally code-drawn"
// philosophy as pixelArt.js does for graphics. See musicData.js for the
// actual composition (notes/patterns); this file only knows how to *play*
// notes, not what tune it's playing.
//
// Scheduling uses the standard Web Audio "lookahead" pattern (schedule a
// little window of upcoming notes slightly ahead of real time, on a fast
// timer) so playback stays tight even though setTimeout/setInterval alone
// are too jittery for music -- see Chris Wilson's "A Tale of Two Clocks".
//
// v4: full "80s getaway driver techno" -- sawtooth bass (the actual analog
// synth texture that vibe needs) run through a fairly dark lowpass filter
// so it stays warm/driving instead of buzzy, a quiet sustained pad wash for
// atmosphere, and a soft kick pulse. Deliberately no melodic hook riding on
// top -- that's what kept reading as a cute nursery tune no matter how the
// bass underneath sounded.

import {
  STEP_SECONDS, noteFreq, BASS_PATTERN, PAD_CHORD, KICK_STEPS, LOOP_STEPS,
  VICTORY_JINGLE, GAMEOVER_JINGLE,
} from './musicData.js';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const MASTER_VOLUME = 0.38;
const MUTE_STORAGE_KEY = 'duckDashMuted';

function playTone(ctx, dest, freq, startTime, duration, { type = 'triangle', gain = 0.1 } = {}) {
  if (!freq) return; // rest
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  const g = ctx.createGain();
  const attack = 0.01;
  const release = Math.min(0.12, duration * 0.4);
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(gain, startTime + attack);
  g.gain.setValueAtTime(gain, Math.max(startTime + attack, startTime + duration - release));
  g.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(g).connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function playKick(ctx, dest, startTime) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(130, startTime);
  osc.frequency.exponentialRampToValueAtTime(45, startTime + 0.14);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.4, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

  osc.connect(g).connect(dest);
  osc.start(startTime);
  osc.stop(startTime + 0.18);
}

class MusicPlayer {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    this.playing = false;
    this.currentStep = 0;
    this.nextStepTime = 0;
    this.timerId = null;

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') this.toggleMute();
    });
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;

      // A darker lowpass than a plain "make it softer" pass would use --
      // this is what tames a sawtooth into warm analog-synth territory
      // instead of a harsh buzz, while still keeping its edge/character.
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      filter.Q.value = 0.7;

      this.master.connect(filter).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  /** Starts the looping backing track (no-op if already playing). Must be
   * called from within a user-gesture handler (click/tap/keydown) -- browsers
   * block audio until one fires. */
  start() {
    this.ensureContext();
    if (this.playing) return;
    this.playing = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.scheduler();
  }

  stop() {
    this.playing = false;
    if (this.timerId) clearTimeout(this.timerId);
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem(MUTE_STORAGE_KEY, this.muted ? '1' : '0');
    if (this.master) this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
    return this.muted;
  }

  scheduler() {
    while (this.ctx && this.nextStepTime < this.ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += STEP_SECONDS;
      this.currentStep = (this.currentStep + 1) % LOOP_STEPS;
    }
    this.timerId = setTimeout(() => this.scheduler(), LOOKAHEAD_MS);
  }

  scheduleStep(step, time) {
    const bassNote = BASS_PATTERN[step];
    playTone(this.ctx, this.master, noteFreq(bassNote), time, STEP_SECONDS * 0.85, {
      type: 'sawtooth', gain: 0.15,
    });

    // Sustained pad chord, retriggered once per bar -- pure atmosphere,
    // no melody to notice or hum.
    if (step === 0) {
      const padDuration = STEP_SECONDS * LOOP_STEPS * 0.95;
      for (const note of PAD_CHORD) {
        playTone(this.ctx, this.master, noteFreq(note), time, padDuration, {
          type: 'triangle', gain: 0.05,
        });
      }
    }

    if (KICK_STEPS.includes(step)) playKick(this.ctx, this.master, time);
  }

  /** Plays a short one-shot jingle (victory/game-over stinger) layered on
   * top of whatever the loop is doing -- doesn't stop or desync the beat. */
  playJingle(notes) {
    this.ensureContext();
    let t = this.ctx.currentTime + 0.02;
    for (const [note, steps] of notes) {
      const duration = steps * STEP_SECONDS;
      playTone(this.ctx, this.master, noteFreq(note), t, duration * 0.95, {
        type: 'triangle', gain: 0.16,
      });
      t += duration;
    }
  }

  playVictoryJingle() {
    this.playJingle(VICTORY_JINGLE);
  }

  playGameOverJingle() {
    this.playJingle(GAMEOVER_JINGLE);
  }
}

export const Music = new MusicPlayer();
