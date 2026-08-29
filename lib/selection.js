/*
 * lib/selection.js — what the child practises today.
 *
 * Seeded by the date string so the mission is stable: closing the app
 * halfway through and reopening it gives the same items back, not a fresh
 * random set. The seeded helpers are ported verbatim from Bonjourly's
 * dailySelection.js.
 *
 * Mix: 60% from the current lesson, 40% review of earlier lessons weighted
 * by weakness. Lessons 1, 2 and 9 introduce no blendable syllables at all,
 * so callers must cope with a short or empty syllable pool — buildSchedule()
 * in games/dailyMission.js does.
 */

/* mulberry32 — small, fast, and deterministic from a string seed. */
function seededRng(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  let state = h >>> 0;
  return function () {
    state += 0x6D2B79F5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = t ^ (t + Math.imul(t ^ (t >>> 7), 61 | t));
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function seededSample(arr, n, rng) {
  const pool = [...arr];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

/* Weaker items are likelier to be picked. Weight is 100 − strength, so a
 * forgotten sound is roughly twice as likely as one that is half learned. */
function weightedSample(items, strengths, n, rng) {
  if (items.length <= n) return [...items];
  const pool = [...items];
  const weights = pool.map(it => Math.max(1, 100 - ((strengths[it.id] || {}).strength ?? 50)));
  const out = [];

  for (let i = 0; i < n && pool.length; i++) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = rng() * total;
    let idx = 0;
    while (idx < pool.length - 1 && r > weights[idx]) { r -= weights[idx]; idx++; }
    out.push(pool[idx]);
    pool.splice(idx, 1);
    weights.splice(idx, 1);
  }
  return out;
}

/*
 * pickTodaysItems(dateString, lesson)
 *   -> { sounds: [...], syllables: [...] }
 * Everything the day's mission may draw on, already balanced between new
 * material and review.
 */
function pickTodaysItems(dateString, lesson) {
  const rng = seededRng(dateString + '_' + lesson.id);
  const strengths = getStrengths();
  const order = lesson.order;

  const currentSounds = lessonSounds(lesson);
  const pastSounds    = SOUNDS.filter(s => lessonOrderOf(s) < order);

  const currentSyl = syllablesForLesson(lesson.id);
  const pastSyl    = SYLLABLES.filter(s => parseInt(s.lesson.slice(-2), 10) < order);

  return {
    // Every letter the lesson teaches, and today's before any review.
    //
    // These used to be capped at 4 and then shuffled in with the review items,
    // which meant a lesson's own letter could go unasked: 课2 could be cleared
    // at 10/10 without ü ever appearing, and 课8 teaches 8 letters of which
    // only 4 could even enter the pool. The mission drills this list in order,
    // so the letters she is actually learning come first.
    sounds: seededShuffle(currentSounds, rng)
      .concat(weightedSample(pastSounds, strengths, 3, rng)),
    syllables: seededShuffle(
      seededSample(currentSyl, Math.min(4, currentSyl.length), rng)
        .concat(weightedSample(pastSyl, strengths, 3, rng)),
      rng),
    rng,
  };
}

/*
 * Everything the child has been taught so far. Nothing outside this may ever
 * appear on screen — offering ü as a wrong answer in lesson 1 asks her to
 * rule out a letter she has never seen, which teaches nothing and just makes
 * the question feel arbitrary.
 */
function availableSounds(order) {
  const n = order || currentLesson().order;
  return soundsUpToLesson(n);
}

/*
 * Distractors that teach. A child who confuses b with d learns nothing from
 * being offered b, m, s, ang — the wrong answers have to be the ones she
 * would actually reach for. confusable comes first, then same-type sounds,
 * and only then anything else. Every tier is filtered to the pool, so a
 * confusable pointing at a later lesson is skipped rather than leaked.
 */
function pickDistractors(sound, count, pool) {
  const candidates = pool || availableSounds();
  const allowed = new Set(candidates.map(s => s.id));
  const taken = new Set([sound.id]);
  const out = [];

  const push = list => list.forEach(s => {
    if (out.length < count && s && allowed.has(s.id) && !taken.has(s.id)) {
      taken.add(s.id);
      out.push(s);
    }
  });

  push((sound.confusable || []).map(getSound));
  push(shuffle(candidates.filter(s => s.type === sound.type && s.sub === sound.sub)));
  push(shuffle(candidates.filter(s => s.type === sound.type)));
  push(shuffle(candidates));

  return out;
}
