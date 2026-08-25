/*
 * games/blendBuilder.js — 拼一拼
 *
 * The most important game in the app. 拼读 — putting a 声母 and a 韵母
 * together to make a syllable — is the whole skill the pinyin unit exists to
 * teach; everything else is recognition practice around it.
 *
 * Hear a syllable, then build it: one row of 声母 cards, one row of 韵母
 * cards (three rows when the syllable is 三拼音节 and has a 介母). Tapping a
 * card drops it into that row's slot. Separating the rows is deliberate —
 * it makes the anatomy of a syllable visible, so the child learns that a
 * syllable HAS parts, not just that this picture goes with that sound.
 *
 * On a correct build the parts slide together and playSequence says
 * "b … ā … bā", which is exactly the 前音轻短后音重 the teacher models.
 *
 * initBlendBuilder(syllable, pool, onComplete) -> onComplete({correct, timeMs})
 */

function initBlendBuilder(syllable, pool, onComplete) {
  const area = document.getElementById('game-area');
  clearEl(area);

  const start = Date.now();
  let answered = false;

  const target = syllable.tones[Math.floor(Math.random() * syllable.tones.length)];
  const isSanpin = !!syllable.jiemu;

  // The韵母 slot shows the tone mark, so the parts really do spell the target.
  const tonedYunmu = writeTone(syllable.yunmu, target.tone);

  const parts = isSanpin
    ? [{ role: 'shengmu', text: syllable.shengmu },
       { role: 'jiemu',   text: syllable.jiemu },
       { role: 'yunmu',   text: tonedYunmu }]
    : [{ role: 'shengmu', text: syllable.shengmu },
       { role: 'yunmu',   text: tonedYunmu }];

  gameHeader(area, '拼一拼',
    isSanpin ? '听一听，用三张卡片拼出来' : '听一听，用两张卡片拼出来');
  bigSpeaker(area, [target.audio], '播放 ' + target.pinyin);

  /* ── Slots ─────────────────────────────────────────────────────── */

  const slotRow = document.createElement('div');
  slotRow.style.cssText =
    'display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:6px;';

  const slots = parts.map((part, i) => {
    if (i > 0) {
      const plus = document.createElement('span');
      plus.style.cssText = 'font-size:1.6rem; color:var(--ink-light);';
      plus.textContent = '+';
      slotRow.appendChild(plus);
    }
    const slot = document.createElement('div');
    slot.className = 'stave stave-4';
    slot.dataset.role = part.role;
    slot.style.cssText =
      'width:76px; height:80px; border-radius:16px; background-color:var(--paper-warm);' +
      'display:flex; align-items:center; justify-content:center;' +
      'font-family:var(--font-pinyin); font-size:2.2rem; color:var(--ink);';
    slotRow.appendChild(slot);
    return slot;
  });

  const eq = document.createElement('span');
  eq.style.cssText = 'font-size:1.6rem; color:var(--ink-light);';
  eq.textContent = '=';

  const result = document.createElement('div');
  result.style.cssText =
    'min-width:104px; height:80px; border-radius:16px; border:3px dashed var(--paper-edge);' +
    'display:flex; align-items:center; justify-content:center;' +
    'font-family:var(--font-pinyin); font-size:2.2rem; color:var(--ink-light);';
  result.textContent = '?';

  slotRow.append(eq, result);
  area.appendChild(slotRow);

  const revealed = document.createElement('div');
  revealed.style.cssText = 'text-align:center; height:52px; margin:8px 0 14px;';
  area.appendChild(revealed);

  /* ── Card rows, one per part ───────────────────────────────────── */

  const chosen = {};
  const rowsWrap = document.createElement('div');
  rowsWrap.style.cssText = 'display:flex; flex-direction:column; gap:10px;';

  parts.forEach(part => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; gap:10px; justify-content:center; flex-wrap:wrap;';
    row.dataset.role = part.role;

    optionsFor(part, syllable, tonedYunmu, pool).forEach(text => {
      const card = document.createElement('button');
      card.className = 'sound-card';
      card.style.cssText =
        'min-width:74px; padding:14px 10px; font-family:var(--font-pinyin);' +
        'font-size:1.9rem; color:var(--ink);';
      card.textContent = text;
      card.addEventListener('click', () => choose(part.role, text, card, row));
      row.appendChild(card);
    });

    rowsWrap.appendChild(row);
  });
  area.appendChild(rowsWrap);

  /* A child can fill one row and stall, with nothing on screen telling her a
   * slot is still empty. After a few seconds of no progress the empty slots
   * pulse and the target plays again. */
  let nudgeTimer = null;
  function scheduleNudge() {
    clearTimeout(nudgeTimer);
    nudgeTimer = setTimeout(() => {
      if (answered) return;
      const empty = parts.filter(p => !chosen[p.role]);
      if (!empty.length) return;
      empty.forEach(p => {
        const slot = slots.find(s => s.dataset.role === p.role);
        slot.classList.add('animate-pop');
        slot.style.borderColor = 'var(--sea)';
        setTimeout(() => slot.classList.remove('animate-pop'), 340);
      });
      playAudio(target.audio);
      scheduleNudge();
    }, 7000);
  }
  scheduleNudge();

  function choose(role, text, card, row) {
    if (answered) return;
    scheduleNudge();

    // One card per row stays selected; tapping another swaps it.
    row.querySelectorAll('button').forEach(b => {
      b.style.background = 'var(--paper)';
      b.style.borderColor = 'var(--paper-edge)';
    });
    card.style.background = 'var(--sea-pale)';
    card.style.borderColor = 'var(--sea)';

    chosen[role] = text;
    const slot = slots.find(s => s.dataset.role === role);
    slot.textContent = text;
    slot.classList.add('animate-pop');
    setTimeout(() => slot.classList.remove('animate-pop'), 340);
    playAudio(partAudio(role, text, syllable));

    if (parts.every(p => chosen[p.role])) setTimeout(check, 420);
  }

  function check() {
    if (answered) return;
    const built = parts.map(p => chosen[p.role]).join('');
    const isCorrect = built === parts.map(p => p.text).join('');

    if (!isCorrect) {
      slotRow.classList.add('is-wrong');
      setTimeout(() => slotRow.classList.remove('is-wrong'), 450);
      answered = true;
      clearTimeout(nudgeTimer);
      lockOptions(rowsWrap);

      // Show the right build rather than just marking it wrong.
      parts.forEach((p, i) => { slots[i].textContent = p.text; });
      result.textContent = target.pinyin;
      result.className = 'sound-letter ' + toneClass(target.pinyin);
      result.style.cssText =
        'min-width:104px; height:80px; border-radius:16px; border:3px solid var(--paper-edge);' +
        'display:flex; align-items:center; justify-content:center;' +
        'font-family:var(--font-pinyin); font-size:2.2rem;';
      setTimeout(() => playSequence(partSrcs(parts, syllable, target)), 400);
      setTimeout(() => onComplete({ correct: false, timeMs: Date.now() - start }), 2200);
      return;
    }

    answered = true;
    clearTimeout(nudgeTimer);
    lockOptions(rowsWrap);

    result.textContent = target.pinyin;
    result.classList.add('animate-pop', toneClass(target.pinyin));
    result.style.borderStyle = 'solid';
    result.style.borderColor = 'var(--yes)';
    result.style.background = 'var(--yes-fill)';
    result.style.color = 'var(--ink)';

    // 前音轻短后音重: parts first, then the whole syllable.
    playSequence(partSrcs(parts, syllable, target), () => {
      clearEl(revealed);
      const han = document.createElement('div');
      han.style.cssText = 'font-size:1.9rem; font-weight:700;';
      han.textContent = target.hanzi;
      revealed.appendChild(han);
      revealed.classList.add('animate-pop');
    });

    setTimeout(() => onComplete({ correct: true, timeMs: Date.now() - start }), 2000);
  }
}

/* The correct part plus two plausible wrong ones, drawn from the confusable
 * sets so the choice is a real discrimination — and only from sounds the
 * child has already been taught. */
function optionsFor(part, syllable, tonedYunmu, pool) {
  const candidates = pool || availableSounds();

  if (part.role === 'jiemu') {
    return shuffle(['i', 'u', 'ü']);
  }

  if (part.role === 'shengmu') {
    const sound = getSoundByText(syllable.shengmu);
    const others = sound
      ? pickDistractors(sound, 2, candidates.filter(s => s.type === 'shengmu')) : [];
    return shuffle([syllable.shengmu, ...others.map(s => s.text)]);
  }

  const sound = getSoundByText(syllable.yunmu);
  const others = sound
    ? pickDistractors(sound, 2, candidates.filter(s => s.type === 'yunmu')) : [];
  const tone = toneOf(tonedYunmu);
  return shuffle([tonedYunmu, ...others.map(s => writeTone(s.text, tone))]);
}

/* Audio for a single part. 韵母 cards carry a tone mark, but the recorded
 * 韵母 sound is toneless, so the mark is stripped before lookup. */
function partAudio(role, text, syllable) {
  if (role === 'jiemu') {
    const s = getSoundByText(text);
    return s ? s.audio : null;
  }
  const bare = stripTone(text);
  const s = getSoundByText(bare);
  return s ? s.audio : null;
}

function partSrcs(parts, syllable, target) {
  const srcs = parts.map(p => partAudio(p.role, p.text, syllable)).filter(Boolean);
  srcs.push(target.audio);
  return srcs;
}

const TONED_TO_BARE = {
  'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
  'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
  'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
  'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
  'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
  'ǖ': 'ü', 'ǘ': 'ü', 'ǚ': 'ü', 'ǜ': 'ü',
};

function stripTone(text) {
  return Array.from(text).map(ch => TONED_TO_BARE[ch] || ch).join('');
}
