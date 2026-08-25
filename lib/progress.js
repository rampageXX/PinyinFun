/*
 * lib/progress.js — lesson mastery and unlocking.
 * Adapted from Bonjourly's lessonProgress.js, applied to sound ids.
 *
 * Pacing follows the school week rather than how fast she can tap. A lesson is
 * *cleared* by one perfect daily mission, and the next lesson opens the
 * following day — so a lesson a day, in textbook order, is the fastest the app
 * will go. Grinding four lessons in an afternoon is exactly what this stops.
 *
 * The bar is one constant. 9 of 10 leaves room for a single slip — 火眼金睛 is
 * timed, and one stray tap should not cost her the day — while still meaning
 * she has to know the lesson. Move CLEAR_RATIO rather than reworking the flow.
 */

const MASTERY_MIN_ATTEMPTS = 2;    // each sound seen at least twice
const MASTERY_STRONG_RATIO = 0.8;  // 80% of them at strength >= 80
const CLEAR_RATIO = 0.9;           // 9 of 10 clears the day's lesson

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

/* The date a lesson was cleared, or undefined if it has not been. */
function lessonClearedOn(lessonId) {
  return (getLessonState().clearedOn || {})[lessonId];
}

/*
 * Called after every mission with its result. A perfect run clears the current
 * lesson — it does NOT move her on. The next lesson opens tomorrow, via
 * advanceIfDue(), which is what keeps this to one lesson a day.
 *
 * Returns what the result screen needs: whether today was perfect, and which
 * lesson is waiting tomorrow.
 */
function checkProgress(result) {
  const state = getLessonState();
  const lesson = getLessonById(state.currentLessonId);
  if (!lesson) return null;

  const next = getLessonByOrder(lesson.order + 1) || null;
  const clearedOn = state.clearedOn || {};
  const already = !!clearedOn[lesson.id];

  const total = result && result.total || 0;
  const perfect = total > 0 && (result.correct / total) >= CLEAR_RATIO;

  if (already || !perfect) {
    return { lesson: lesson, perfect: perfect, cleared: null, next: next, alreadyCleared: already };
  }

  clearedOn[lesson.id] = getTodayString();
  state.clearedOn = clearedOn;
  // Still recorded as mastered: the map, the stickers and the parent view all
  // read this, and a cleared lesson is a finished one.
  const mastered = state.masteredLessons || [];
  if (mastered.indexOf(lesson.id) === -1) state.masteredLessons = mastered.concat([lesson.id]);
  saveLessonState(state);

  return { lesson: lesson, perfect: true, cleared: lesson, next: next, alreadyCleared: false };
}

/*
 * Opens tomorrow's lesson. Called on every app entry: if the current lesson was
 * cleared on an earlier day, she moves up one. Strictly one step per call, so
 * a week away does not skip her past six lessons she never did.
 */
function advanceIfDue() {
  const state = getLessonState();
  const lesson = getLessonById(state.currentLessonId);
  if (!lesson) return null;

  const on = (state.clearedOn || {})[lesson.id];
  if (!on || on >= getTodayString()) return null;   // uncleared, or cleared today

  const next = getLessonByOrder(lesson.order + 1);
  if (!next) return null;

  state.currentLessonId = next.id;
  if (!state.startedAt[next.id]) state.startedAt[next.id] = getTodayString();
  saveLessonState(state);
  return next;
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
