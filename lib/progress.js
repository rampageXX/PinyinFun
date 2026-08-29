/*
 * lib/progress.js — lesson mastery and unlocking.
 * Adapted from Bonjourly's lessonProgress.js, applied to sound ids.
 *
 * Progression works like a game: clear the level, the next one opens, right
 * away. A mission at >= CLEAR_RATIO clears the current lesson and moves her on
 * immediately — no waiting, no calendar. If she is on a roll at bedtime she can
 * keep going, which is the whole point of it feeling like a game.
 *
 * Order is still the textbook's, so she never meets a letter out of sequence;
 * what is gone is any limit on how fast she works through it.
 *
 * Clearing also requires that every letter the lesson teaches has actually been
 * asked at least once. From 课3 on, six of the ten slots go to blending and
 * tone drills, so a lesson teaching more than four letters cannot cover them
 * all in one mission — 课8 teaches eight. Without this she could clear 课8
 * having met half of it. The day seed reshuffles, so a second sitting picks up
 * the rest; the big lessons simply take two.
 *
 * The bar is one constant. 9 of 10 leaves room for a single slip — 火眼金睛 is
 * timed, and one stray tap should not cost her the level — while still meaning
 * she has to know the lesson. Move CLEAR_RATIO rather than reworking the flow.
 */

const MASTERY_MIN_ATTEMPTS = 2;    // each sound seen at least twice
const MASTERY_STRONG_RATIO = 0.8;  // 80% of them at strength >= 80
const CLEAR_RATIO = 0.9;           // 9 of 10 clears the level

function isLessonMastered(lesson, strengths) {
  const ids = lesson.sounds || [];
  if (!ids.length) return false;

  const seenEnough = ids.filter(id => (strengths[id] || {}).attempts >= MASTERY_MIN_ATTEMPTS);
  if (seenEnough.length < ids.length) return false;

  const strong = ids.filter(id => ((strengths[id] || {}).strength || 0) >= 80);
  return strong.length / ids.length >= MASTERY_STRONG_RATIO;
}

function lessonProgressPct(lesson) {
  const ids = lesson.sounds || [];
  if (!ids.length) return 0;
  const strengths = getStrengths();
  const total = ids.reduce((sum, id) => sum + ((strengths[id] || {}).strength || 0), 0);
  return Math.round(total / (ids.length * 100) * 100);
}

/* Letters of a lesson that have never been asked. Clearing waits for these. */
function untestedSounds(lesson, strengths) {
  return (lesson.sounds || []).filter(function (id) {
    return !((strengths[id] || {}).attempts > 0);
  });
}

/* The date a lesson was cleared, or undefined if it has not been. */
function lessonClearedOn(lessonId) {
  return (getLessonState().clearedOn || {})[lessonId];
}

/*
 * Called after every mission with its result. A run at or above CLEAR_RATIO
 * clears the current lesson, awards its sticker and opens the next one on the
 * spot. Returns what the result screen needs to celebrate it.
 */
function checkProgress(result) {
  const state = getLessonState();
  const lesson = getLessonById(state.currentLessonId);
  if (!lesson) return null;

  const next = getLessonByOrder(lesson.order + 1) || null;
  const clearedOn = state.clearedOn || {};
  const already = !!clearedOn[lesson.id];

  const total = (result && result.total) || 0;
  const scored = total > 0 && (result.correct / total) >= CLEAR_RATIO;
  const untested = untestedSounds(lesson, getStrengths());
  const cleared = scored && untested.length === 0;

  if (!cleared) {
    return { lesson: lesson, cleared: null, unlocked: null, next: next,
             alreadyCleared: already, scored: scored, untested: untested };
  }

  // Recorded even on a repeat clear: the date is the parent's history, and
  // it is what isLessonUnlocked() reads to open the next island.
  if (!already) {
    clearedOn[lesson.id] = getTodayString();
    state.clearedOn = clearedOn;
    const mastered = state.masteredLessons || [];
    if (mastered.indexOf(lesson.id) === -1) state.masteredLessons = mastered.concat([lesson.id]);
  }

  // Straight on to the next level. Only move forward — replaying an old lesson
  // she has already cleared must not drag her back down the map.
  let unlocked = null;
  if (next && getLessonById(state.currentLessonId).order < next.order) {
    state.currentLessonId = next.id;
    if (!state.startedAt[next.id]) state.startedAt[next.id] = getTodayString();
    unlocked = next;
  }
  saveLessonState(state);

  return { lesson: lesson, cleared: lesson, unlocked: unlocked, next: next,
           alreadyCleared: already, scored: true, untested: [] };
}

/* Let a parent (or a confident child) jump to a lesson that is unlocked. */
function setCurrentLesson(lessonId) {
  const lesson = getLessonById(lessonId);
  if (!lesson || !isLessonUnlocked(lesson)) return false;
  const state = getLessonState();
  state.currentLessonId = lessonId;
  if (!state.startedAt[lessonId]) state.startedAt[lessonId] = getTodayString();
  saveLessonState(state);
  return true;
}

/* How many of the 63 sounds are at 会了 — the headline number for a parent. */
function masteredSoundCount() {
  const strengths = getStrengths();
  return SOUNDS.filter(s => ((strengths[s.id] || {}).strength || 0) >= 80).length;
}
