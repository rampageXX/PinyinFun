/*
 * games/toneTrain.js — 声调小火车
 *
 * Hear a syllable, tap its tone. Tones are the part a child outside a
 * Mandarin-speaking environment gets wrong longest, and they are invisible
 * in the letters themselves, so they get drilled on their own.
 *
 * Each carriage draws the tone's actual contour as an SVG line — flat,
 * rising, dipping, falling. The shape and the colour say the same thing two
 * ways, which is also what makes it work for a colour-blind child.
 *
 * initToneTrain(syllable, onComplete) -> onComplete({correct, timeMs})
 */

const TONE_CONTOURS = {
  1: 'M4,10 L44,10',                    // ˉ high flat
  2: 'M4,28 L44,6',                     // ˊ rising
  3: 'M4,10 Q14,30 24,26 Q34,22 44,4',  // ˇ dipping
  4: 'M4,6  L44,30',                    // ˋ falling
};
const TONE_NAMES = { 1: '一声', 2: '二声', 3: '三声', 4: '四声' };

function initToneTrain(syllable, onComplete) {
  const area = document.getElementById('game-area');
  clearEl(area);

  const start = Date.now();
  let answered = false;

  // Pick one reading of the syllable to ask about.
  const target = syllable.tones[Math.floor(Math.random() * syllable.tones.length)];

  gameHeader(area, '声调小火车', '听一听，是第几声？');
  bigSpeaker(area, [target.audio], '播放 ' + target.pinyin);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid; grid-template-columns:repeat(2,1fr); gap:12px;';

  const cards = new Map();
  // Always offer all four tones, in fixed order. The child is learning a
  // fixed set, so shuffling would only add noise — 一声 is always first.
  [1, 2, 3, 4].forEach(tone => {
    const written = writeTone(syllable.base, tone);
    const card = buildToneCard(tone, written, btn => handlePick(btn, tone));
    cards.set(tone, card);
    grid.appendChild(card);
  });
  area.appendChild(grid);

  function handlePick(btn, tone) {
    if (answered) return;
    answered = true;
    lockOptions(grid);

    const isCorrect = tone === target.tone;
    flashResult({
      picked: btn,
      correctEl: cards.get(target.tone),
      isCorrect,
      replaySrc: isCorrect ? null : target.audio,
      onDone: () => onComplete({ correct: isCorrect, timeMs: Date.now() - start }),
    });
  }
}

function buildToneCard(tone, written, onPick) {
  const btn = document.createElement('button');
  btn.className = 'sound-card';
  btn.style.padding = '12px 8px 10px';
  btn.setAttribute('aria-label', TONE_NAMES[tone]);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 48 34');
  svg.setAttribute('width', '54');
  svg.setAttribute('height', '38');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', TONE_CONTOURS[tone]);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', `var(--tone${tone})`);
  path.setAttribute('stroke-width', '4');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);

  const text = document.createElement('div');
  text.className = 'sound-letter t' + tone;
  text.style.cssText = 'font-size:2.1rem; transform:none; margin-top:2px;';
  text.textContent = written;

  const name = document.createElement('div');
  name.className = 'sound-label';
  name.textContent = TONE_NAMES[tone];

  btn.append(svg, text, name);
  btn.addEventListener('click', () => onPick(btn));
  return btn;
}

/*
 * Write a tone mark onto a bare syllable: 有a不放过，没a找o e，
 * i u 并列标在后. The same rule the child is taught in lesson 10, so the
 * app must not cheat it — a mis-placed mark here would teach the error.
 */
const TONE_VOWELS = {
  a: 'āáǎà', o: 'ōóǒò', e: 'ēéěè',
  i: 'īíǐì', u: 'ūúǔù', 'ü': 'ǖǘǚǜ',
};

function writeTone(base, tone) {
  if (!tone) return base;
  for (const v of ['a', 'o', 'e']) {
    const i = base.indexOf(v);
    if (i !== -1) return base.slice(0, i) + TONE_VOWELS[v][tone - 1] + base.slice(i + 1);
  }
  for (let i = base.length - 1; i >= 0; i--) {
    if (TONE_VOWELS[base[i]]) {
      return base.slice(0, i) + TONE_VOWELS[base[i]][tone - 1] + base.slice(i + 1);
    }
  }
  return base;
}
