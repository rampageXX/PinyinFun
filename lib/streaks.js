/*
 * lib/streaks.js — daily streak with a monthly freeze.
 * Ported from Bonjourly minus the JSONBin sync; this app has no server.
 *
 * The freeze exists so that one missed day does not wipe out weeks of work.
 * A 7-year-old does not choose whether the family is travelling.
 */

function getStreak() {
  return getLocal('streak') || {
    current: 0,
    longest: 0,
    lastPlayed: null,
    freezeMonth: null,        // 'YYYY-MM' in which the freeze was spent
    penaltyDaysLeft: 0,
  };
}

function saveStreak(s) { setLocal('streak', s); }

function yesterdayOf(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return toDateString(d);
}

/* Called once when a session completes. Returns the updated streak. */
function recordPlayed() {
  const s = getStreak();
  const today = getTodayString();
  if (s.lastPlayed === today) return s;          // already counted today

  if (s.lastPlayed === yesterdayOf(today) || s.lastPlayed === null) {
    s.current += 1;
  } else {
    s.current = 1;                               // gap: start over
  }

  s.longest = Math.max(s.longest, s.current);
  s.lastPlayed = today;
  saveStreak(s);
  return s;
}

/*
 * Called at boot. If exactly one day was missed and this month's freeze is
 * unspent, the streak survives; otherwise it breaks and word decay doubles
 * for three days, which brings the forgotten sounds back to the surface.
 */
function checkStreakBreak() {
  const s = getStreak();
  const today = getTodayString();
  if (!s.lastPlayed || s.lastPlayed === today) return { broken: false, frozen: false };

  const yesterday = yesterdayOf(today);
  if (s.lastPlayed === yesterday) return { broken: false, frozen: false };

  const month = today.slice(0, 7);
  const missedOnlyYesterday = s.lastPlayed === yesterdayOf(yesterday);

  if (missedOnlyYesterday && s.freezeMonth !== month) {
    s.freezeMonth = month;
    s.lastPlayed = yesterday;                    // pretend yesterday counted
    saveStreak(s);
    return { broken: false, frozen: true };
  }

  const lost = s.current;
  s.current = 0;
  s.penaltyDaysLeft = 3;
  saveStreak(s);
  return { broken: true, frozen: false, lost };
}
