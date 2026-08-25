/*
 * lib/ruby.js — 汉字 with pinyin printed above, the way the textbook prints it.
 *
 * The child is learning pinyin precisely so she can read 汉字 she does not
 * know yet. So the interface itself is reading practice: every Chinese label
 * carries its pinyin, and tapping it says it out loud.
 *
 * UI strings are authored as a hanzi/pinyin pair rather than looked up from
 * a dictionary, because 多音字 make automatic annotation wrong exactly where
 * it matters most (行, 了, 长, 得...). Explicit is safer than clever here.
 */

/*
 * rubyEl('开始', 'kāi shǐ') -> <span class="ruby-line">
 *                                <ruby>开<rt>kāi</rt></ruby>
 *                                <ruby>始<rt>shǐ</rt></ruby>
 *                              </span>
 *
 * Pinyin syllables are separated by spaces and paired with characters in
 * order. A syllable of '' leaves that character unannotated (useful for
 * punctuation). If the counts disagree the text is returned unannotated
 * rather than silently mis-pairing.
 */
function rubyEl(hanzi, pinyin) {
  const span = document.createElement('span');
  span.className = 'ruby-line';

  const chars = Array.from(hanzi);
  const syls  = String(pinyin || '').trim().split(/\s+/).filter(Boolean);

  if (!syls.length || syls.length !== chars.length) {
    span.textContent = hanzi;
    return span;
  }

  chars.forEach((ch, i) => {
    const ruby = document.createElement('ruby');
    ruby.appendChild(document.createTextNode(ch));
    const rt = document.createElement('rt');
    rt.textContent = syls[i];
    ruby.appendChild(rt);
    span.appendChild(ruby);
  });
  return span;
}

/*
 * Attach a label to an element, replacing its contents.
 * Pass an audio src to make the label speak when tapped — the default for
 * anything the child might not be able to read yet.
 */
function setRubyLabel(el, hanzi, pinyin, audioSrc) {
  clearEl(el);
  el.appendChild(rubyEl(hanzi, pinyin));
  if (audioSrc) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => playAudio(audioSrc));
  }
}

/* ── Tone helpers ─────────────────────────────────────────────────────
 * Tone colour is a learning aid used consistently across the whole app,
 * so the tone of a syllable has to be readable from its written form. */

const TONE_MARKS = {
  1: 'āōēīūǖ', 2: 'áóéíúǘ', 3: 'ǎǒěǐǔǚ', 4: 'àòèìùǜ',
};

/* toneOf('bā') -> 1 ; toneOf('ma') -> 0 (轻声) */
function toneOf(pinyin) {
  for (const tone of [1, 2, 3, 4]) {
    for (const ch of TONE_MARKS[tone]) {
      if (pinyin.indexOf(ch) !== -1) return tone;
    }
  }
  return 0;
}

/* The class name that paints a syllable in its tone colour. */
function toneClass(pinyin) {
  return 't' + toneOf(pinyin);
}

/* Shared DOM helper, same as Bonjourly's. */
function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/* Fisher-Yates, unseeded — for presentation shuffling where determinism
 * does not matter. Seeded shuffling lives in lib/selection.js. */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
