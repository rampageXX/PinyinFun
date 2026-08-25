/*
 * data/lessons/_registry.js — loaded before every lesson file.
 * Each lessonNN.js calls registerLesson({...}) to add itself.
 * Same pattern as Bonjourly's registry.
 *
 * Globals exported:
 *   LESSONS           ordered array of lesson objects
 *   registerLesson()  called by each lesson file
 *   getLessonById()   lesson object or undefined
 *   getLessonState()  / saveLessonState()   localStorage-backed progress
 *   currentLesson()   the lesson the child is working on right now
 */

const LESSONS = [];

function registerLesson(lesson) {
  LESSONS.push(lesson);
  LESSONS.sort(function (a, b) { return a.order - b.order; });
}

function getLessonById(id) {
  return LESSONS.find(function (l) { return l.id === id; });
}

function getLessonByOrder(order) {
  return LESSONS.find(function (l) { return l.order === order; });
}

/* The sound objects a lesson introduces, resolved from data/sounds.js. */
function lessonSounds(lesson) {
  return (lesson.sounds || []).map(getSound).filter(Boolean);
}

/* The syllables a lesson practises. Lessons declare none explicitly —
 * data/syllables.js already assigns every syllable to the lesson that
 * completes it, which keeps the two files from drifting apart. */
function lessonSyllables(lesson) {
  return typeof syllablesForLesson === 'function' ? syllablesForLesson(lesson.id) : [];
}

/* ── Progress state ───────────────────────────────────────────────── */

function getLessonState() {
  return getLocal('lessons_state') || {
    currentLessonId: 'lesson-01',
    startedAt: {},
    masteredLessons: [],
    stagesDone: {},        // { 'lesson-01': ['recognise','blend'] }
  };
}

function saveLessonState(state) {
  setLocal('lessons_state', state);
}

function currentLesson() {
  const state = getLessonState();
  return getLessonById(state.currentLessonId) || LESSONS[0];
}

/* A lesson is unlocked when it is the first one, or the previous one is
 * mastered. Lessons are never locked behind a paywall of perfection —
 * mastery is generous (see lib/progress.js) so a child keeps moving. */
function isLessonUnlocked(lesson) {
  if (lesson.order === 1) return true;
  const state = getLessonState();
  const prev = getLessonByOrder(lesson.order - 1);
  return !!prev && (state.masteredLessons || []).indexOf(prev.id) !== -1;
}

function isLessonMasteredId(lessonId) {
  return (getLessonState().masteredLessons || []).indexOf(lessonId) !== -1;
}
