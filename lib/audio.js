/*
 * lib/audio.js — playback for pre-generated pinyin MP3s.
 *
 * Why not the Web Speech API (which is what Bonjourly uses for French):
 * browser zh-CN voices read an isolated Latin letter as its English name,
 * so speaking "b" produces "bee". Every sound in this app is therefore a
 * static MP3 generated ahead of time by tools/gen_audio.py.
 *
 * Overrides
 *   Two sounds cannot be synthesised reliably — `eng` maps to the rare
 *   character 鞥, and `ong` has no standalone syllable in Mandarin at all.
 *   Dropping a hand-recorded file at audio/overrides/<same path> makes it
 *   win over the generated one, with no code change. resolveSrc() checks
 *   the override map that probeOverrides() builds at startup.
 *
 * iOS
 *   Safari refuses to play audio until a user gesture has started one.
 *   unlockAudio() is called from the first tap and plays a silent buffer,
 *   after which programmatic playback works for the rest of the session.
 */

const AUDIO_CACHE   = {};     // src -> HTMLAudioElement
const OVERRIDES     = {};     // original src -> override src
let   currentAudio  = null;
let   audioUnlocked = false;

/* ── Override discovery ───────────────────────────────────────────────
 * A HEAD request per candidate would be 63 round trips, and file:// does
 * not support HEAD at all. Instead we optimistically try to load each
 * declared override and keep the ones that decode. Only sounds flagged
 * needsRecording are probed, so this stays cheap. */
function probeOverrides(sounds) {
  (sounds || []).filter(s => s.needsRecording).forEach(s => {
    const candidate = 'audio/overrides/' + s.audio;
    const probe = new Audio();
    probe.addEventListener('canplaythrough', () => { OVERRIDES[s.audio] = candidate; }, { once: true });
    probe.addEventListener('error', () => {}, { once: true });
    probe.src = candidate;
    probe.load();
  });
}

function resolveSrc(src) {
  return OVERRIDES[src] || src;
}

/* ── Playback ─────────────────────────────────────────────────────── */

function getAudioEl(src) {
  const resolved = resolveSrc(src);
  if (!AUDIO_CACHE[resolved]) {
    const el = new Audio(resolved);
    el.preload = 'auto';
    AUDIO_CACHE[resolved] = el;
  }
  return AUDIO_CACHE[resolved];
}

/*
 * playAudio(src, onEnd)
 *   Stops whatever is playing, then plays src from the start.
 *   onEnd fires on completion AND on failure, so callers never hang
 *   waiting for audio that will not arrive.
 */
function playAudio(src, onEnd) {
  if (!src) { if (onEnd) onEnd(); return; }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  const el = getAudioEl(src);
  currentAudio = el;

  const done = () => {
    el.removeEventListener('ended', done);
    el.removeEventListener('error', done);
    if (currentAudio === el) currentAudio = null;
    if (onEnd) onEnd();
  };
  el.addEventListener('ended', done);
  el.addEventListener('error', done);

  el.currentTime = 0;
  const p = el.play();
  if (p && p.catch) p.catch(() => done());
}

/*
 * playSequence(srcs, onEnd, gapMs)
 *   The 拼读 move: "b" … "ā" … "bā". A short gap between parts is what
 *   makes blending audible — 前音轻短后音重, two sounds meeting.
 */
function playSequence(srcs, onEnd, gapMs) {
  const gap = gapMs == null ? 260 : gapMs;
  let i = 0;
  (function next() {
    if (i >= srcs.length) { if (onEnd) onEnd(); return; }
    const src = srcs[i++];
    playAudio(src, () => setTimeout(next, gap));
  })();
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/* Warm the cache for everything a lesson will play, so the first tap is
 * not the one that waits for the network. */
function preloadSrcs(srcs) {
  (srcs || []).forEach(src => { if (src) getAudioEl(src).load(); });
}

/* ── iOS unlock ───────────────────────────────────────────────────── */

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      const buf = ctx.createBuffer(1, 1, 22050);
      const node = ctx.createBufferSource();
      node.buffer = buf;
      node.connect(ctx.destination);
      node.start(0);
      if (ctx.resume) ctx.resume();
    }
  } catch {
    /* No Web Audio support: normal <audio> playback still works. */
  }
}

/* ── Last resort ──────────────────────────────────────────────────────
 * Only for text that has no generated MP3 (a chant line added but not yet
 * regenerated). Never used for bare letters, where it is actively wrong. */
function speakFallback(text) {
  if (typeof speechSynthesis === 'undefined' || !text) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 0.85;
  speechSynthesis.speak(utter);
}
