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

import {
  STEP_SECONDS, noteFreq, BASS_PATTERN, MELODY_PATTERN,
  KICK_STEPS, HAT_STEPS, VICTORY_JINGLE, GAMEOVER_JINGLE,
} from './musicData.js';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const MASTER_VOLUME = 0.45;
const MUTE_STORAGE_KEY = 'duckDashMuted';

function playTone(ctx, dest, freq, startTime, duration, { type = 'square', gain = 0.15 } = {}) {
  if (!freq) return; // rest
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  const g = ctx.createGain();
  const attack = 0.005;
  const release = Math.min(0.05, duration * 0.4);
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
  osc.frequency.setValueAtTime(150, startTime);
  osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.12);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.6, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

  osc.connect(g).connect(dest);
  osc.start(startTime);
  osc.stop(startTime + 0.16);
}

function playHat(ctx, dest, startTime) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.05));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.25, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

  noise.connect(hp).connect(g).connect(dest);
  noise.start(startTime);
  noise.stop(startTime + 0.06);
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
      this.master.connect(this.ctx.destination);
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
      this.currentStep = (this.currentStep + 1) % MELODY_PATTERN.length;
    }
    this.timerId = setTimeout(() => this.scheduler(), LOOKAHEAD_MS);
  }

  scheduleStep(step, time) {
    const bar16 = step % BASS_PATTERN.length;

    const bassNote = BASS_PATTERN[bar16];
    playTone(this.ctx, this.master, noteFreq(bassNote), time, STEP_SECONDS * 0.9, {
      type: 'sawtooth', gain: 0.12,
    });

    const leadNote = MELODY_PATTERN[step];
    if (leadNote) {
      playTone(this.ctx, this.master, noteFreq(leadNote), time, STEP_SECONDS * 1.8, {
        type: 'square', gain: 0.14,
      });
    }

    if (KICK_STEPS.includes(bar16)) playKick(this.ctx, this.master, time);
    if (HAT_STEPS.includes(bar16)) playHat(this.ctx, this.master, time);
  }

  /** Plays a short one-shot jingle (victory/game-over stinger) layered on
   * top of whatever the loop is doing -- doesn't stop or desync the beat. */
  playJingle(notes) {
    this.ensureContext();
    let t = this.ctx.currentTime + 0.02;
    for (const [note, steps] of notes) {
      const duration = steps * STEP_SECONDS;
      playTone(this.ctx, this.master, noteFreq(note), t, duration * 0.95, {
        type: 'triangle', gain: 0.22,
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
