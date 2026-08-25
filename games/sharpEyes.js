/*
 * games/sharpEyes.js — 火眼金睛
 *
 * A timed grid: tap every copy of one letter among the letters it is
 * genuinely confused with. b against d and p against q are the classic
 * first-grade difficulty — the shapes are reflections of each other, and
 * telling them apart is a visual skill that only speed drilling builds.
 *
 * Scoring is hits minus false taps, so scanning carefully beats mashing.
 * The round is short (15s) and always ends on a positive note: the child
 * sees how many she found, never how many she missed.
 *
 * initSharpEyes(sound, pool, onComplete) -> onComplete({correct, timeMs})
 * `correct` is true when she found most of them without many false taps.
 */

const SHARP_EYES_SECONDS = 15;
const SHARP_EYES_CELLS   = 20;

function initSharpEyes(sound, pool, onComplete) {
  const area = document.getElementById('game-area');
  clearEl(area);

  const start = Date.now();
  let found = 0, wrong = 0, finished = false;

  const candidates = pool || availableSounds();
  const allowed = new Set(candidates.map(s => s.id));

  // Fill the grid with the target and its confusables only. Padding it with
  // unrelated letters would make the task easy for the wrong reason. A
  // confusable belonging to a later lesson is dropped, not shown early.
  const confusables = (sound.confusable || [])
    .map(getSound).filter(s => s && allowed.has(s.id));
  const others = confusables.length
    ? confusables
    : shuffle(candidates.filter(s => s.type === sound.type && s.id !== sound.id)).slice(0, 3);

  if (!others.length) {                      // nothing to contrast against
    onComplete({ correct: true, timeMs: 0 });
    return;
  }

  const targetCount = 5 + Math.floor(Math.random() * 3);   // 5-7 of them
  const cells = shuffle([
    ...Array.from({ length: targetCount }, () => sound),
    ...Array.from({ length: SHARP_EYES_CELLS - targetCount },
      (_, i) => others[i % others.length]),
  ]);

  gameHeader(area, '火眼金睛', `把所有的 ${sound.text} 都找出来`);

  /* ── Timer bar ─────────────────────────────────────────────────── */

  const bar = document.createElement('div');
  bar.style.cssText =
    'height:12px; border-radius:999px; background:var(--paper-edge); overflow:hidden; margin-bottom:6px;';
  const fill = document.createElement('div');
  fill.style.cssText =
    `height:100%; width:100%; background:var(--sea); border-radius:999px;
     transition:width ${SHARP_EYES_SECONDS}s linear;`;
  bar.appendChild(fill);

  const status = document.createElement('div');
  status.style.cssText =
    'display:flex; justify-content:space-between; font-size:0.8rem; color:var(--ink-light); margin-bottom:14px;';
  const foundLabel = document.createElement('span');
  foundLabel.textContent = `找到 0 / ${targetCount}`;
  const targetLabel = document.createElement('span');
  targetLabel.style.cssText = 'font-family:var(--font-pinyin); font-size:1.1rem; color:var(--ink); font-weight:700;';
  targetLabel.textContent = sound.text;
  status.append(foundLabel, targetLabel);

  area.append(bar, status);

  /* ── Grid ──────────────────────────────────────────────────────── */

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid; grid-template-columns:repeat(4,1fr); gap:8px;';

  cells.forEach(cell => {
    const btn = document.createElement('button');
    btn.className = 'sound-card';
    btn.style.cssText =
      'padding:0; min-height:66px; display:flex; align-items:center; justify-content:center;' +
      'font-family:var(--font-pinyin); font-size:1.9rem; color:var(--ink);';
    btn.textContent = cell.text;
    btn.addEventListener('click', () => tap(btn, cell));
    grid.appendChild(btn);
  });
  area.appendChild(grid);

  // Kick the transition off on the next frame so it actually animates.
  requestAnimationFrame(() => { fill.style.width = '0%'; });
  const timer = setTimeout(finish, SHARP_EYES_SECONDS * 1000);

  function tap(btn, cell) {
    if (finished || btn.disabled) return;
    btn.disabled = true;

    if (cell.id === sound.id) {
      found++;
      btn.classList.add('is-correct', 'animate-pop');
      foundLabel.textContent = `找到 ${found} / ${targetCount}`;
      sfxTap();
      playAudio(sound.audio);
      if (found === targetCount) finish();
    } else {
      wrong++;
      btn.classList.add('is-wrong');
      btn.style.opacity = '0.55';
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    grid.querySelectorAll('button').forEach(b => { b.disabled = true; });

    // Reveal any the child did not get to, so the round still teaches.
    Array.from(grid.children).forEach((btn, i) => {
      if (cells[i].id === sound.id && !btn.classList.contains('is-correct')) {
        btn.style.borderColor = 'var(--sea)';
        btn.style.background = 'var(--sea-pale)';
      }
    });

    const passed = found >= Math.ceil(targetCount * 0.6) && wrong <= 2;
    setTimeout(() => onComplete({ correct: passed, timeMs: Date.now() - start }), 1200);
  }
}
