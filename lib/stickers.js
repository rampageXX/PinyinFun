/*
 * lib/stickers.js — awarding and reading the 贴纸册.
 *
 * Every sticker's condition is checked against live state rather than being
 * granted at the moment it happens. That way a sticker can never be lost to
 * a crash mid-session, and back-filling new stickers into an existing save
 * just works.
 */

function getEarnedStickers() {
  return getLocal('stickers') || [];
}

function hasSticker(id) {
  return getEarnedStickers().indexOf(id) !== -1;
}

function stickerEarned(sticker) {
  const state = getLessonState();
  const mastered = state.masteredLessons || [];

  switch (sticker.kind) {
    case 'lesson':     return mastered.indexOf(sticker.lesson) !== -1;
    case 'lessonsAll': return mastered.length >= sticker.n;
    case 'streak':     return getStreak().longest >= sticker.n;
    case 'points':     return getPoints() >= sticker.n;
    case 'sounds':     return masteredSoundCount() >= sticker.n;
    default:           return false;
  }
}

/*
 * Re-evaluate everything and return only what is newly earned, so the
 * result screen can animate exactly those.
 */
function awardStickers() {
  const earned = getEarnedStickers();
  const fresh = STICKERS.filter(s => earned.indexOf(s.id) === -1 && stickerEarned(s));
  if (fresh.length) {
    setLocal('stickers', earned.concat(fresh.map(s => s.id)));
  }
  return fresh;
}

/* Progress toward the next sticker of each kind — what the album shows in
 * the empty slots, so a locked sticker is a goal rather than a blank. */
function stickerHint(sticker) {
  switch (sticker.kind) {
    case 'lesson': {
      const lesson = getLessonById(sticker.lesson);
      return lesson ? '学完第 ' + lesson.order + ' 课' : '';
    }
    case 'lessonsAll': return '学完全部 14 课';
    case 'streak':     return '连续 ' + sticker.n + ' 天';
    case 'points':     return sticker.n + ' 分';
    case 'sounds':     return '会 ' + sticker.n + ' 个字母';
    default:           return '';
  }
}
