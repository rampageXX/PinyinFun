/*
 * games/_ui.js — the pieces every minigame shares.
 *
 * Keeping the chrome here means all four games look and behave the same:
 * same header, same speaker, same right/wrong feedback timing. A child
 * should never have to relearn the interface between questions.
 */

/* Title plus a one-line instruction. The instruction says what to DO, not
 * what the game is called. */
function gameHeader(area, title, hint) {
  const head = document.createElement('div');
  head.style.cssText = 'text-align:center; margin-bottom:20px;';

  const h = document.createElement('h3');
  h.style.cssText = 'font-size:1.25rem; margin-bottom:6px;';
  h.textContent = title;

  const p = document.createElement('p');
  p.style.cssText = 'font-size:0.85rem; color:var(--ink-light);';
  p.textContent = hint;

  head.append(h, p);
  area.appendChild(head);
  return head;
}

/* The big round speaker. Auto-plays once on entry, replays on tap — a child
 * who missed it must never be stuck. */
function bigSpeaker(area, srcs, label) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'text-align:center; margin-bottom:26px;';

  const btn = document.createElement('button');
  btn.className = 'speaker';
  btn.textContent = '🔊';
  btn.setAttribute('aria-label', label || '再听一遍');

  const hint = document.createElement('p');
  hint.style.cssText = 'font-size:0.75rem; color:var(--ink-light); margin-top:10px;';
  hint.textContent = '点一下再听';

  const play = () => {
    btn.classList.add('playing');
    setTimeout(() => btn.classList.remove('playing'), 600);
    if (srcs.length > 1) playSequence(srcs); else playAudio(srcs[0]);
  };

  btn.addEventListener('click', play);
  wrap.append(btn, hint);
  area.appendChild(wrap);
  setTimeout(play, 350);
  return { el: btn, play };
}

/* A large tappable answer card showing a pinyin string. */
function optionCard(text, onPick, toneColored) {
  const btn = document.createElement('button');
  btn.className = 'sound-card';
  btn.style.cssText = 'display:flex; align-items:center; justify-content:center; padding:20px 12px;';

  const span = document.createElement('span');
  span.className = 'sound-letter';
  span.style.fontSize = '2.6rem';
  span.style.transform = 'none';
  if (toneColored) span.classList.add(toneClass(text));
  span.textContent = text;

  btn.appendChild(span);
  btn.addEventListener('click', () => onPick(btn));
  return btn;
}

/*
 * Show the verdict, then hand control back.
 * Correct: a green fill and a pop, 700ms — quick, keeps momentum.
 * Wrong: a grey shake, the right answer highlighted, and the sound played
 * again, 1600ms — slow enough to actually learn from. Never red, never a
 * buzzer; being wrong is normal and should not feel like a punishment.
 */
function flashResult(opts) {
  const { picked, correctEl, isCorrect, replaySrc, onDone } = opts;

  if (isCorrect) {
    picked.classList.add('is-correct', 'animate-pop');
    setTimeout(onDone, 700);
    return;
  }

  if (picked) picked.classList.add('is-wrong');
  if (correctEl) correctEl.classList.add('is-correct');
  if (replaySrc) setTimeout(() => playAudio(replaySrc), 400);
  setTimeout(onDone, 1600);
}

/* Disable every answer button so a fast tapper cannot answer twice. */
function lockOptions(container) {
  container.querySelectorAll('button').forEach(b => { b.disabled = true; });
}
