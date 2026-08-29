/*
 * lib/stories.js — which 故事 are open, and which have been read.
 *
 * A story unlocks when the lesson named by `unlockAfter` has been cleared, so
 * reading arrives as a reward for finishing a lesson rather than as another
 * thing owed. Nothing here gates on score: a story is not a test, and she may
 * reread one as often as she likes.
 */

function isStoryUnlocked(story) {
  if (!story) return false;
  return !!(getLessonState().clearedOn || {})[story.unlockAfter];
}

function getReadStories() {
  return getLocal('stories_read') || [];
}

function isStoryRead(id) {
  return getReadStories().indexOf(id) !== -1;
}

/* Reading one to the end marks it. Rereading is free and changes nothing. */
function markStoryRead(id) {
  const read = getReadStories();
  if (read.indexOf(id) !== -1) return false;
  read.push(id);
  setLocal('stories_read', read);
  return true;
}

/* Stories in order, each tagged with whether she can open it yet. */
function storiesWithState() {
  return STORIES.slice()
    .sort(function (a, b) { return a.order - b.order; })
    .map(function (s) {
      return { story: s, unlocked: isStoryUnlocked(s), read: isStoryRead(s.id) };
    });
}

/* The one to offer on the home screen: first unlocked and not yet read. */
function nextStory() {
  const found = storiesWithState().filter(function (s) {
    return s.unlocked && !s.read;
  })[0];
  return found ? found.story : null;
}

function unlockedStoryCount() {
  return storiesWithState().filter(function (s) { return s.unlocked; }).length;
}
