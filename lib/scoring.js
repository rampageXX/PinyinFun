/*
 * lib/scoring.js — points for a single answer.
 * Ported unchanged from Bonjourly. A wrong answer scores zero rather than
 * negative: at this age losing points is discouraging, and the spaced
 * repetition in lib/strength.js already handles the consequence.
 */

const BASE_POINTS     = 100;
const MAX_SPEED_BONUS = 50;
const SPEED_WINDOW_MS = 12000;   // full bonus if answered within 12s
const STREAK_BONUS    = 25;

function calculateScore(opts) {
  if (!opts.correct) return { base: 0, speedBonus: 0, streakBonus: 0, total: 0 };

  const clamped = Math.min(Math.max(opts.timeMs || 0, 0), SPEED_WINDOW_MS);
  const speedBonus  = Math.round(MAX_SPEED_BONUS * (1 - clamped / SPEED_WINDOW_MS));
  const streakBonus = opts.sessionStreak >= 3 && opts.sessionStreak % 3 === 0 ? STREAK_BONUS : 0;

  return { base: BASE_POINTS, speedBonus, streakBonus, total: BASE_POINTS + speedBonus + streakBonus };
}

function addPoints(n) {
  const total = (getLocal('points') || 0) + n;
  setLocal('points', total);
  return total;
}

function getPoints() {
  return getLocal('points') || 0;
}
