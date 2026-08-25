/*
 * games/listenPick.js — 听音选一选
 *
 * Hear a sound, tap the letter. The direct test of 认读: can she connect the
 * shape to the sound? Distractors come from the sound's own confusable set
 * (see lib/selection.js), so every wrong option is one she might genuinely
 * pick — b against d, not b against ang.
 *
 * initListenPick(sound, pool, onComplete) -> onComplete({correct, timeMs})
 */

function initListenPick(sound, pool, onComplete) {
  const area = document.getElementById('game-area');
  clearEl(area);

  const start = Date.now();
  let answered = false;

  gameHeader(area, '听音选一选', '听一听，这是哪一个？');
  bigSpeaker(area, [sound.audio], '播放 ' + sound.text);

  const options = shuffle([sound, ...pickDistractors(sound, 3, pool)]);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:12px;';

  const cards = new Map();
  options.forEach(opt => {
    const card = optionCard(opt.text, btn => handlePick(btn, opt));
    cards.set(opt.id, card);
    grid.appendChild(card);
  });
  area.appendChild(grid);

  function handlePick(btn, chosen) {
    if (answered) return;
    answered = true;
    lockOptions(grid);

    const isCorrect = chosen.id === sound.id;
    flashResult({
      picked: btn,
      correctEl: cards.get(sound.id),
      isCorrect,
      replaySrc: isCorrect ? null : sound.audio,
      onDone: () => onComplete({ correct: isCorrect, timeMs: Date.now() - start }),
    });
  }
}
