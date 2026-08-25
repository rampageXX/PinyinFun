/*
 * app.js — screen navigation and rendering.
 * Screen machinery follows Bonjourly's pattern: every screen is a section
 * in index.html, toggled with .hidden. No router, no framework.
 */

let currentScreen = 'start-screen';

/* ── Navigation ───────────────────────────────────────────────────── */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  el.scrollTop = 0;
  window.scrollTo(0, 0);
  currentScreen = id;
}

function navTo(screenId, btn) {
  stopAudio();
  showScreen(screenId);

  if (screenId === 'sounds-screen')       renderSounds();
  if (screenId === 'audio-check-screen')  renderAudioCheck();

  // Keep the nav highlight in sync even when navigation came from a card
  // rather than from the nav bar itself.
  const target = btn || document.querySelector(`.nav-btn[data-screen="${screenId}"]`);
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (target) target.classList.add('active');
}

/* ── Start ────────────────────────────────────────────────────────── */

function handleStart() {
  // The first tap is the only chance to unlock audio on iOS.
  unlockAudio();
  setLocal('started', true);
  enterApp();
}

function enterApp() {
  document.getElementById('bottom-nav').classList.remove('hidden');
  renderHome();
  navTo('home-screen');
}

function renderHome() {
  const name = getLocal('name');
  if (name) document.getElementById('home-name').textContent = name;
}

/* ── 字母表 — every sound, grouped the way the textbook groups them ── */

const SOUND_GROUPS = [
  { key: 'dan',     title: '单韵母',       sub: '6 个',  filter: s => s.sub === 'dan' },
  { key: 'shengmu', title: '声母',         sub: '23 个', filter: s => s.type === 'shengmu' },
  { key: 'fu',      title: '复韵母',       sub: '9 个',  filter: s => s.sub === 'fu' },
  { key: 'qian',    title: '前鼻韵母',     sub: '5 个',  filter: s => s.sub === 'qian' },
  { key: 'hou',     title: '后鼻韵母',     sub: '4 个',  filter: s => s.sub === 'hou' },
  { key: 'zhengti', title: '整体认读音节', sub: '16 个 · 不能拼读，直接读出',
    filter: s => s.type === 'zhengti' },
];

function renderSounds() {
  const root = document.getElementById('sounds-content');
  clearEl(root);
  document.getElementById('sounds-count').textContent = SOUNDS.length + ' 个';

  SOUND_GROUPS.forEach(group => {
    const items = SOUNDS.filter(group.filter);
    if (!items.length) return;

    const label = document.createElement('div');
    label.className = 'section-label';
    label.style.marginTop = '22px';
    label.textContent = `${group.title} · ${group.sub}`;
    root.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'sounds-grid';
    items.forEach(s => grid.appendChild(buildSoundCard(s)));
    root.appendChild(grid);
  });

  preloadSrcs(SOUNDS.map(s => s.audio));
}

function buildSoundCard(sound) {
  const card = document.createElement('button');
  card.className = 'sound-card';
  card.setAttribute('aria-label', `播放 ${sound.text}`);

  const stave = document.createElement('div');
  stave.className = 'sound-stave stave stave-4';

  const letter = document.createElement('span');
  letter.className = 'sound-letter';
  letter.textContent = sound.text;
  stave.appendChild(letter);

  const pic = document.createElement('div');
  pic.className = 'sound-pic';
  pic.textContent = sound.pic || '';

  card.appendChild(stave);
  card.appendChild(pic);

  if (sound.mnemonic) {
    const hint = document.createElement('div');
    hint.className = 'sound-label';
    hint.textContent = sound.mnemonic;
    card.appendChild(hint);
  }

  card.addEventListener('click', () => {
    card.classList.add('animate-pop');
    setTimeout(() => card.classList.remove('animate-pop'), 340);
    playAudio(sound.audio);
  });

  return card;
}

/* ── 音频检查 ─────────────────────────────────────────────────────────
 * Generated speech is the one part of this app that can be wrong in a way
 * no test catches, so a parent listens to all 63 once and marks failures.
 * Sounds flagged needsRecording are floated to the top: they are the two
 * that have no correct Chinese character to synthesise from. */

function renderAudioCheck() {
  const root = document.getElementById('check-list');
  clearEl(root);

  const marks = getLocal('audio_check') || {};
  const ordered = [...SOUNDS].sort((a, b) =>
    (b.needsRecording ? 1 : 0) - (a.needsRecording ? 1 : 0));

  ordered.forEach(sound => {
    const row = document.createElement('div');
    row.className = 'check-row' + (sound.needsRecording ? ' flagged' : '');

    const letter = document.createElement('div');
    letter.className = 'check-letter';
    letter.textContent = sound.text;

    const meta = document.createElement('div');
    meta.className = 'check-meta';
    meta.textContent = sound.needsRecording
      ? `${sound.hanzi} · ${sound.recordNote || '需要自己录音'}`
      : `合成自「${sound.hanzi}」`;

    const play = document.createElement('button');
    play.className = 'check-play';
    play.textContent = '▶';
    play.setAttribute('aria-label', `播放 ${sound.text}`);
    play.addEventListener('click', () => playAudio(sound.audio));

    const ok = document.createElement('button');
    ok.className = 'check-mark' + (marks[sound.id] === 'ok' ? ' ok' : '');
    ok.textContent = '✓';
    ok.setAttribute('aria-label', `${sound.text} 读得对`);

    const bad = document.createElement('button');
    bad.className = 'check-mark' + (marks[sound.id] === 'bad' ? ' bad' : '');
    bad.textContent = '✗';
    bad.setAttribute('aria-label', `${sound.text} 读得不对`);

    ok.addEventListener('click', () => markAudio(sound.id, 'ok'));
    bad.addEventListener('click', () => markAudio(sound.id, 'bad'));

    row.append(letter, meta, play, ok, bad);
    root.appendChild(row);
  });

  renderCheckSummary();
}

function markAudio(soundId, verdict) {
  const marks = getLocal('audio_check') || {};
  marks[soundId] = marks[soundId] === verdict ? undefined : verdict;
  if (marks[soundId] === undefined) delete marks[soundId];
  setLocal('audio_check', marks);
  renderAudioCheck();
}

function renderCheckSummary() {
  const marks = getLocal('audio_check') || {};
  const badIds = Object.keys(marks).filter(id => marks[id] === 'bad');
  const box = document.getElementById('check-summary');

  if (!badIds.length) { box.classList.add('hidden'); return; }

  clearEl(box);
  box.classList.remove('hidden');

  const label = document.createElement('div');
  label.className = 'section-label';
  label.textContent = `需要重录 · ${badIds.length} 个`;
  box.appendChild(label);

  const list = document.createElement('div');
  list.style.cssText = 'font-size:0.82rem; line-height:2; color:var(--ink-mid);';
  badIds.forEach(id => {
    const s = getSound(id);
    if (!s) return;
    const line = document.createElement('div');
    const strong = document.createElement('strong');
    strong.style.fontFamily = 'var(--font-pinyin)';
    strong.textContent = s.text;
    const code = document.createElement('code');
    code.textContent = 'audio/overrides/' + s.audio;
    line.append(strong, ' → ', code);
    list.appendChild(line);
  });
  box.appendChild(list);
}

/* ── Misc ─────────────────────────────────────────────────────────── */

function resetAll() {
  if (!confirm('清空这台设备上的全部进度？不能撤销。')) return;
  ['started', 'name', 'strengths', 'lessons_state', 'streak', 'audio_check', 'stickers']
    .forEach(removeLocal);
  showToast('已清空');
  setTimeout(() => location.reload(), 800);
}

let toastTimer = null;
function showToast(msg, duration = 2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

/* ── Boot ─────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  probeOverrides(SOUNDS);

  // Any first tap unlocks audio, not just the start button — the child may
  // land straight on the home screen on a return visit.
  document.addEventListener('pointerdown', unlockAudio, { once: true });

  if (getLocal('started')) {
    enterApp();
  } else {
    showScreen('start-screen');
  }
});
