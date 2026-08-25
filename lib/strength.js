/*
 * lib/strength.js — spaced repetition, one record per sound or syllable id.
 * Ported from Bonjourly's wordStrength.js; the constants are unchanged
 * because they are tuned for a daily five-minute session.
 */

const STRENGTH_CORRECT = 15;
const STRENGTH_WRONG   = -20;
const DECAY_NORMAL     = -5;
const DECAY_POST_BREAK = -10;   // doubles for 3 days after a broken streak

function updateStrength(itemId, correct) {
  if (!itemId) return;
  const strengths = getLocal('strengths') || {};
  const entry = strengths[itemId] || { strength: 50, last_seen: null, attempts: 0, wrong: 0 };
  entry.strength  = Math.max(0, Math.min(100, entry.strength + (correct ? STRENGTH_CORRECT : STRENGTH_WRONG)));
  entry.last_seen = getTodayString();
  entry.attempts  = (entry.attempts || 0) + 1;
  if (!correct) entry.wrong = (entry.wrong || 0) + 1;
  strengths[itemId] = entry;
  setLocal('strengths', strengths);
}

function getStrength(itemId) {
  const strengths = getLocal('strengths') || {};
  return strengths[itemId] ? strengths[itemId].strength : null;
}

function getStrengths() {
  return getLocal('strengths') || {};
}

/* Applied once per day at boot. Sounds not seen since their last review
 * fade, which is what pulls them back into the daily mission. */
function applyDailyDecay() {
  const strengths = getLocal('strengths') || {};
  const today = getTodayString();
  if (getLocal('last_decay') === today) return;

  const streakData = getLocal('streak') || {};
  const penalty = streakData.penaltyDaysLeft > 0;
  const amount  = penalty ? DECAY_POST_BREAK : DECAY_NORMAL;

  Object.keys(strengths).forEach(id => {
    const e = strengths[id];
    if (e.last_seen && e.last_seen < today) {
      e.strength = Math.max(0, e.strength + amount);
    }
  });

  setLocal('strengths', strengths);
  setLocal('last_decay', today);

  if (penalty) {
    streakData.penaltyDaysLeft--;
    setLocal('streak', streakData);
  }
}

/* Four bands, shown to the parent as a heatmap and used to weight review. */
function strengthLabel(strength) {
  if (strength >= 80) return { key: 'strong',    text: '会了',   color: 'var(--yes)' };
  if (strength >= 40) return { key: 'learning',  text: '学习中', color: 'var(--sun)' };
  if (strength >= 10) return { key: 'fading',    text: '模糊',   color: 'var(--stave)' };
  return                     { key: 'forgotten', text: '忘了',   color: 'var(--ink-light)' };
}
