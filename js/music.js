// Web Audio synth engine + step sequencer. Generates every sound live --
// no audio files to ship, same "everything's procedurally code-drawn"
// philosophy as pixelArt.js does for graphics. See musicData.js for the
// compositions and sfx.js for the sound effects; this file only knows how
// to *play* things, not what tune or noise it's playing.
//
// Scheduling uses the standard Web Audio "lookahead" pattern (schedule a
// little window of upcoming notes slightly ahead of real time, on a fast
// timer) so playback stays tight even though setTimeout/setInterval alone
// are too jittery for music -- see Chris Wilson's "A Tale of Two Clocks".
//
// One AudioContext for the whole app. SFX route to `master` directly while
// the music goes through `musicGain`, so a stinger can duck the backing
// track without touching effect volumes -- and one mute control covers both.

import {
  noteFreq, trackFor, trackStepSeconds,
  LEVEL_CLEAR_FANFARE, VICTORY_FANFARE, GAMEOVER_FANFARE,
} from './musicData.js';
import { SFX } from './sfx.js';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const MASTER_VOLUME = 0.32;
const MUSIC_VOLUME = 1.0;
const MUTE_STORAGE_KEY = 'duckDashMuted';

function playTone(ctx, dest, freq, startTime, duration, { type = 'sine', gain = 0.1 } = {}) {
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

/** Short, sparse percussive tick -- texture, not a kick you'd feel in your chest. */
function playClick(ctx, dest, startTime) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.03));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2500;
  bp.Q.value = 1.2;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.18, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);

  noise.connect(bp).connect(g).connect(dest);
  noise.start(startTime);
  noise.stop(startTime + 0.04);
}

class MusicPlayer {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    this.playing = false;
    this.currentStep = 0;
    this.nextStepTime = 0;
    this.timerId = null;
    this.track = trackFor(0);

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

      // Music sits on its own sub-mix so a fanfare can duck the backing
      // track without dragging the sound effects down with it.
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = MUSIC_VOLUME;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2600;
      filter.Q.value = 0.7;

      this.musicGain.connect(this.master);
      this.master.connect(filter).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  /** Switch to the track for a level. Restarts the loop if already playing. */
  setLevel(levelIndex) {
    const next = trackFor(levelIndex);
    if (next === this.track) return;
    this.track = next;
    if (this.playing) {
      // Re-seed the sequencer so the new track starts cleanly at step 0
      // rather than inheriting the old track's position and tempo.
      this.currentStep = 0;
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }
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
    const stepSeconds = trackStepSeconds(this.track);
    while (this.ctx && this.nextStepTime < this.ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += stepSeconds;
      this.currentStep = (this.currentStep + 1) % this.track.loopSteps;
    }
    this.timerId = setTimeout(() => this.scheduler(), LOOKAHEAD_MS);
  }

  scheduleStep(step, time) {
    const track = this.track;
    const stepSeconds = trackStepSeconds(track);
    const dest = this.musicGain;

    const bass = track.bass;
    playTone(this.ctx, dest, noteFreq(bass.pattern[step]), time, stepSeconds * bass.length,
      { type: bass.type, gain: bass.gain });

    const lead = track.lead;
    playTone(this.ctx, dest, noteFreq(lead.pattern[step]), time, stepSeconds * lead.length,
      { type: lead.type, gain: lead.gain });

    // Sub-drone, retriggered once per bar and held almost the whole loop.
    if (step === 0) {
      const droneDuration = stepSeconds * track.loopSteps * 0.95;
      playTone(this.ctx, dest, noteFreq(track.drone.note), time, droneDuration,
        { type: track.drone.type, gain: track.drone.gain });
    }

    if (track.clicks.includes(step)) playClick(this.ctx, dest, time);
  }

  /** Plays a layered one-shot fanfare and ducks the backing track under it
   * so the moment actually lands instead of fighting the loop. */
  playFanfare(events) {
    this.ensureContext();
    const stepSeconds = trackStepSeconds(this.track);

    // Duck the music sub-mix; it's restored when the next track starts.
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(0.12, now + 0.08);

    let t = now + 0.02;
    for (const event of events) {
      const duration = event.steps * stepSeconds;
      for (const note of event.notes) {
        playTone(this.ctx, this.master, noteFreq(note), t, duration * 0.98, {
          type: event.type ?? 'square',
          // Split the level across the stack so a five-note chord doesn't
          // clip; each added voice would otherwise sum into distortion.
          gain: event.gain / Math.sqrt(event.notes.length),
        });
      }
      t += duration;
    }
  }

  /** Restore the music sub-mix after a fanfare has ducked it. */
  restoreMusicLevel() {
    if (!this.musicGain) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(MUSIC_VOLUME, now + 0.6);
  }

  playLevelClearFanfare() {
    this.playFanfare(LEVEL_CLEAR_FANFARE);
  }

  playVictoryJingle() {
    this.playFanfare(VICTORY_FANFARE);
  }

  playGameOverJingle() {
    this.playFanfare(GAMEOVER_FANFARE);
  }

  /**
   * Fire a named sound effect. Silently does nothing before the audio
   * context exists (i.e. before the player's first gesture) rather than
   * throwing -- gameplay must never depend on audio being available.
   */
  play(effectName) {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const effect = SFX[effectName];
    if (effect) effect(this.ctx, this.master);
  }
}

export const Music = new MusicPlayer();
