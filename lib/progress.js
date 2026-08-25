/*
 * lib/progress.js — lesson mastery and unlocking.
 * Adapted from Bonjourly's lessonProgress.js, applied to sound ids.
 *
 * Mastery is deliberately generous. The gate exists to stop a child racing
 * ahead of the sounds she can actually hear, not to demand perfection —
 * a lesson she has met and can mostly do should let her move on, and the
 * spaced repetition in lib/strength.js will keep bringing back whatever is
 * still shaky. A gate that is too strict just makes the app feel stuck.
 */

const MASTERY_MIN_ATTEMPTS = 2;    // each sound seen at least twice
const MASTERY_STRONG_RATIO = 0.8;  // 80% of them at strength >= 80

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

/*
 * Called after every mission. Marks the current lesson mastered if it now
 * qualifies, advances to the next one, and returns what changed so the
 * result screen can celebrate it.
 */
function checkProgress() {
  const state = getLessonState();
  const lesson = getLessonById(state.currentLessonId);
  if (!lesson) return null;

  const mastered = state.masteredLessons || [];
  if (mastered.indexOf(lesson.id) !== -1) return null;
  if (!isLessonMastered(lesson, getStrengths())) return null;

  state.masteredLessons = mastered.concat([lesson.id]);

  const next = getLessonByOrder(lesson.order + 1);
  if (next) {
    state.currentLessonId = next.id;
    state.startedAt[next.id] = getTodayString();
  }
  saveLessonState(state);

  return { mastered: lesson, unlocked: next || null };
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
