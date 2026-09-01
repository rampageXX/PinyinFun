/*
 * lib/words.js — which 词语 themes are open, and which words she has worked on.
 *
 * A theme opens when its lesson is cleared, the same key 故事 uses. That is the
 * whole progression: no second track to keep in step, and the word book carries
 * on opening for the entire run of the app rather than arriving at once.
 *
 * "Studied" here means she opened the word and heard it. It is deliberately not
 * a claim that she knows it — nothing tests these yet. When the 看字选音 and
 * 听音选字 drills arrive they will write into lib/strength.js like everything
 * else, and this becomes the weaker of two numbers rather than the only one.
 */

function isWordThemeUnlocked(theme) {
  if (!theme) return false;
  // 基础 is free. A new tab that opens as a wall of padlocks is a dead room,
  // and 人 大 小 上 下 are words she meets in the 儿歌 before clearing anything.
  if (!theme.unlockAfter) return true;
  return !!(getLessonState().clearedOn || {})[theme.unlockAfter];
}

function getStudiedWords() {
  return getLocal('words_studied') || [];
}

function isWordStudied(id) {
  return getStudiedWords().indexOf(id) !== -1;
}

function markWordStudied(id) {
  const seen = getStudiedWords();
  if (seen.indexOf(id) !== -1) return false;
  seen.push(id);
  setLocal('words_studied', seen);
  return true;
}

/* Themes in lesson order, each tagged with whether it is open and how far in. */
function wordThemesWithState() {
  const studied = getStudiedWords();
  return WORD_THEMES.map(function (t) {
    const done = t.words.filter(function (w) {
      return studied.indexOf(w.id) !== -1;
    }).length;
    return {
      theme: t,
      unlocked: isWordThemeUnlocked(t),
      studied: done,
      total: t.words.length,
    };
  });
}

/* The headline number for the tab, and for a parent glancing at 家长. */
function studiedWordCount() {
  return getStudiedWords().length;
}

function unlockedWordCount() {
  return wordThemesWithState()
    .filter(function (s) { return s.unlocked; })
    .reduce(function (n, s) { return n + s.total; }, 0);
}
