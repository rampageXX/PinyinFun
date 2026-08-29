/*
 * games/readPick.js — 我会读
 *
 * The other four games all run sound → letter: she hears something and picks
 * the shape. This one runs the other way. The pinyin is on the screen, and she
 * has to work out what it says before choosing which recording matches it.
 *
 * That direction is the point of pinyin. Reading is the skill it exists for,
 * and nothing else in the app asks her to do it — 听音选一选 rewards
 * recognising a shape she has already heard, which is a different and easier
 * thing.
 *
 * Distractors are chosen to make the reading matter:
 *   1. the same syllable in another tone — bā against bá. She cannot get this
 *      from the letters alone; she has to read the mark.
 *   2. the same 韵母 under another 声母 — bā against pā.
 *   3. anything else she has met.
 * The first is by far the most valuable, so it is preferred wherever the
 * syllable has more than one real tone.
 *
 * Tapping an option plays it and selects it; 确定 commits. Listening as often
 * as she likes before deciding is the whole activity, so choosing and
 * confirming have to be separate — otherwise the first tap ends the question.
 *
 * initReadPick(syllable, syllablePool, onComplete)
 *     -> onComplete({correct, timeMs})
 */

function initReadPick(syllable, syllablePool, onComplete) {
  const area = document.getElementById('game-area');
  clearEl(area);

  const start = Date.now();
  let answered = false;
  let picked = null;

  const target = syllable.tones[Math.floor(Math.random() * syllable.tones.length)];

  gameHeader(area, '我会读', '看着拼音读一读，哪个声音是它？');

  // What she has to read. Big, with the 汉字 under it — the character is the
  // reward for getting the reading right, not a clue to it.
  const prompt = document.createElement('div');
  prompt.className = 'card';
  prompt.style.cssText = 'text-align:center; padding:22px 14px; margin-bottom:18px;';

  const py = document.createElement('div');
  py.style.cssText =
    'font-family:var(--font-pinyin); font-size:2.9rem; color:var(--ink); line-height:1.2;';
  py.textContent = target.pinyin;

  const hz = document.createElement('div');
  hz.style.cssText = 'font-size:1.6rem; margin-top:6px; color:var(--ink-mid);';
  hz.textContent = target.hanzi || '';

  prompt.append(py, hz);
  area.appendChild(prompt);

  const options = shuffle([target, ...readDistractors(syllable, target, 2, syllablePool)]);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid; grid-template-columns:1fr; gap:12px;';

  const cards = new Map();
  options.forEach((opt, i) => {
    const card = document.createElement('button');
    card.className = 'sound-card';
    card.style.cssText =
      'display:flex; align-items:center; justify-content:flex-start; gap:14px;' +
      'padding:16px 18px; min-height:76px; width:100%;';
    card.setAttribute('aria-label', '听第 ' + (i + 1) + ' 个');

    const horn = document.createElement('span');
    horn.style.cssText = 'font-size:1.9rem; flex:none;';
    horn.textContent = '🔊';

    const n = document.createElement('span');
    n.style.cssText = 'font-size:1.1rem; color:var(--ink-light);';
    n.textContent = String(i + 1);

    card.append(horn, n);
    card.addEventListener('click', () => choose(card, opt));
    cards.set(opt.audio, card);
    grid.appendChild(card);
  });
  area.appendChild(grid);

  const confirm = document.createElement('button');
  confirm.className = 'btn btn-primary btn-full';
  confirm.style.cssText += 'margin-top:18px; min-height:64px;';
  confirm.textContent = '确定';
  confirm.disabled = true;
  confirm.style.opacity = '0.45';
  confirm.addEventListener('click', commit);
  area.appendChild(confirm);

  /* Tapping an option plays it and marks it as the current choice. She may
     change her mind as often as she likes; nothing is judged until 确定. */
  function choose(card, opt) {
    if (answered) return;
    picked = { card: card, opt: opt };
    cards.forEach(c => {
      c.style.borderColor = '';
      c.classList.remove('is-selected');
    });
    card.style.borderColor = 'var(--sea)';
    card.classList.add('is-selected');
    confirm.disabled = false;
    confirm.style.opacity = '1';
    playAudio(opt.audio);
  }

  function commit() {
    if (answered || !picked) return;
    answered = true;
    lockOptions(grid);
    confirm.disabled = true;
    confirm.style.opacity = '0.45';

    const isCorrect = picked.opt.audio === target.audio;
    flashResult({
      picked: picked.card,
      correctEl: cards.get(target.audio),
      isCorrect: isCorrect,
      replaySrc: isCorrect ? null : target.audio,
      onDone: () => onComplete({ correct: isCorrect, timeMs: Date.now() - start }),
    });
  }
}

/*
 * Wrong answers that are worth ruling out. Same syllable, other tone first:
 * that is the one she cannot answer without actually reading the mark.
 */
function readDistractors(syllable, target, count, pool) {
  const out = [];
  const seen = { [target.audio]: true };

  const take = reading => {
    if (!reading || seen[reading.audio] || out.length >= count) return;
    seen[reading.audio] = true;
    out.push(reading);
  };

  // 1. the same syllable in another tone
  shuffle((syllable.tones || []).filter(t => t.audio !== target.audio)).forEach(take);

  // 2. the same 韵母 under a different 声母
  if (out.length < count) {
    shuffle((pool || []).filter(s => s.yunmu === syllable.yunmu && s.base !== syllable.base))
      .forEach(s => take(pickToneReading(s, target.tone)));
  }

  // 3. anything else she has met
  if (out.length < count) {
    shuffle((pool || []).filter(s => s.base !== syllable.base))
      .forEach(s => take(pickToneReading(s, target.tone)));
  }

  return out.slice(0, count);
}

/* Prefer the same tone, so the difference is the syllable and not the mark. */
function pickToneReading(syl, tone) {
  if (!syl || !syl.tones || !syl.tones.length) return null;
  return syl.tones.filter(t => t.tone === tone)[0] || syl.tones[0];
}
