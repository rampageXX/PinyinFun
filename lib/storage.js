/*
 * lib/storage.js — localStorage wrapper.
 * Ported from Bonjourly with the namespace changed, so the two apps can
 * live on the same device without colliding.
 */

const NS = 'pinyin_';

function getLocal(key) {
  try {
    const val = localStorage.getItem(NS + key);
    return val !== null ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

function setLocal(key, val) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(val));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

function removeLocal(key) {
  localStorage.removeItem(NS + key);
}

/* 'YYYY-MM-DD' in the device's own timezone — the key every daily
 * calculation is seeded from. */
function getTodayString() {
  return toDateString(new Date());
}

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
