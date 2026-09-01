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
let   detachCurrent = null;   // removes the in-flight element's listeners
let   sequenceTimer = null;   // the gap between 拼读 parts
let   generation    = 0;      // bumped per request; strands anything older

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

/*
 * Order of preference: something recorded on this device, then a hand-recorded
 * file shipped in audio/overrides/, then the synthesised clip. A recording made
 * in 家长 wins because it was made deliberately, by someone who had just
 * listened to the alternative and judged it wrong.
 */
function resolveSrc(src) {
  if (typeof recordingUrl === 'function') {
    const mine = recordingUrl(src);
    if (mine) return mine;
  }
  return OVERRIDES[src] || src;
}

/* Drop the cached <audio> for a path. Elements are cached one per resolved
   src, so without this a new recording would not be heard until a reload. */
function forgetAudio(src) {
  [src, OVERRIDES[src], (typeof recordingUrl === 'function' ? recordingUrl(src) : null)]
    .forEach(function (key) {
      if (key && AUDIO_CACHE[key]) {
        try { AUDIO_CACHE[key].pause(); } catch (e) { /* not started */ }
        delete AUDIO_CACHE[key];
      }
    });
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
 * Elements are cached one per file, so a listener left on one outlives the
 * question that added it. Pausing fires neither `ended` nor `error`, so an
 * interrupted clip used to keep its handler forever — and since 课3's bā
 * blend is [b, ā, bā], it shares audio/yun/a.mp3 with 课1's letter a.
 * Tapping a in 课1 then fired 课3's leftover handler and played bā.
 *
 * Two things prevent that now: every play detaches its own listeners the
 * moment it is superseded, and every request carries a generation number, so
 * a callback that does slip through cannot restart a sequence that belongs
 * to a lesson the child has already left.
 */
function cancelCurrent() {
  if (detachCurrent) detachCurrent();
  if (sequenceTimer) { clearTimeout(sequenceTimer); sequenceTimer = null; }
  if (currentAudio) {
    currentAudio.pause();
    try { currentAudio.currentTime = 0; } catch (e) { /* not seekable yet */ }
    currentAudio = null;
  }
}

/* Plays one clip under an existing generation. Internal: it does not bump. */
function playOne(src, gen, onEnd) {
  if (!src) { if (onEnd) onEnd(); return; }

  const el = getAudioEl(src);
  currentAudio = el;

  const detach = () => {
    el.removeEventListener('ended', done);
    el.removeEventListener('error', done);
    if (detachCurrent === detach) detachCurrent = null;
  };
  function done() {
    detach();
    if (gen !== generation) return;          // superseded — stay silent
    if (currentAudio === el) currentAudio = null;
    if (onEnd) onEnd();
  }

  detachCurrent = detach;
  el.addEventListener('ended', done);
  el.addEventListener('error', done);

  try { el.currentTime = 0; } catch (e) { /* not seekable yet */ }
  const p = el.play();
  if (p && p.catch) p.catch(() => done());
}

/*
 * playAudio(src, onEnd)
 *   Stops whatever is playing, then plays src from the start.
 *   onEnd fires on completion AND on failure, so callers never hang
 *   waiting for audio that will not arrive.
 */
function playAudio(src, onEnd) {
  if (!src) { if (onEnd) onEnd(); return; }
  generation++;
  cancelCurrent();
  playOne(src, generation, onEnd);
}

/*
 * playSequence(srcs, onEnd, gapMs)
 *   The 拼读 move: "b" … "ā" … "bā". A short gap between parts is what
 *   makes blending audible — 前音轻短后音重, two sounds meeting.
 *   The whole sequence runs under one generation, so stopAudio() or any
 *   new request abandons the rest of it.
 */
function playSequence(srcs, onEnd, gapMs) {
  const gap = gapMs == null ? 260 : gapMs;
  generation++;
  cancelCurrent();
  const gen = generation;

  let i = 0;
  (function next() {
    if (gen !== generation) return;                     // cancelled
    if (i >= (srcs || []).length) { if (onEnd) onEnd(); return; }
    playOne(srcs[i++], gen, () => {
      if (gen !== generation) return;
      sequenceTimer = setTimeout(next, gap);
    });
  })();
}

function stopAudio() {
  generation++;
  cancelCurrent();
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
