/*
 * lib/sfx.js — feedback chimes, synthesised rather than shipped.
 *
 * These are a handful of sine tones from the Web Audio API, not MP3s. Three
 * reasons: no files to load before the first tap, nothing to keep in sync with
 * the speech audio, and the volume is under our control so a chime can never
 * drown out the pinyin the child is supposed to be listening to.
 *
 * They stay quiet and short on purpose. The sounds that matter in this app are
 * the letters; everything else is punctuation.
 */

let sfxCtx = null;
let sfxEnabled = true;

function sfxContext() {
  if (sfxCtx) return sfxCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  sfxCtx = new Ctx();
  return sfxCtx;
}

/* One note. Triangle waves are soft enough not to sound like an alarm. */
function tone(freq, startAt, duration, peak) {
  const ctx = sfxContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;

  const t = ctx.currentTime + startAt;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function play(notes) {
  if (!sfxEnabled) return;
  const ctx = sfxContext();
  if (!ctx) return;
  if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
  notes.forEach(n => tone(n[0], n[1], n[2], n[3]));
}

/* Rising major third — the universal "yes". */
function sfxCorrect() {
  play([[659.25, 0, 0.12, 0.10], [880.00, 0.09, 0.20, 0.09]]);
}

/* A soft two-note dip. Deliberately NOT a buzzer: at this age being wrong is
 * normal, and the sound should say "try again", not "you failed". */
function sfxWrong() {
  play([[311.13, 0, 0.14, 0.06], [261.63, 0.10, 0.22, 0.05]]);
}

/* An arpeggio for a sticker or a new lesson — the only time it gets loud. */
function sfxUnlock() {
  play([
    [523.25, 0,    0.14, 0.09],
    [659.25, 0.10, 0.14, 0.09],
    [783.99, 0.20, 0.16, 0.09],
    [1046.5, 0.31, 0.34, 0.10],
  ]);
}

/* A tick for a card landing in a slot. */
function sfxTap() {
  play([[880, 0, 0.05, 0.035]]);
}

function setSfxEnabled(on) {
  sfxEnabled = !!on;
  setLocal('sfx', sfxEnabled);
}

function initSfx() {
  const saved = getLocal('sfx');
  sfxEnabled = saved === null ? true : !!saved;
}
