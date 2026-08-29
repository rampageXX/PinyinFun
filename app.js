/*
 * app.js — screen navigation and rendering.
 * Screen machinery follows Bonjourly's pattern: every screen is a section in
 * index.html, toggled with .hidden. No router, no framework.
 */

let currentScreen = 'start-screen';
let viewingLessonId = null;      // which lesson the detail screen is showing

/* ── Navigation ───────────────────────────────────────────────────── */

const RENDERERS = {
  'home-screen':        renderHome,
  'map-screen':         renderMap,
  'lesson-screen':      renderLesson,
  'story-list-screen':  renderStoryList,
  'story-screen':       renderStory,
  'sticker-screen':     renderStickers,
  'parent-screen':      renderParent,
  'audio-check-screen': renderAudioCheck,
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  window.scrollTo(0, 0);
  currentScreen = id;
}

function navTo(screenId, btn) {
  stopAudio();
  showScreen(screenId);
  if (RENDERERS[screenId]) RENDERERS[screenId]();

  const target = btn || document.querySelector(`.nav-btn[data-screen="${screenId}"]`);
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (target) target.classList.add('active');
}

/* ── Start ────────────────────────────────────────────────────────── */

function handleStart() {
  unlockAudio();                       // the only reliable moment on iOS
  const name = document.getElementById('name-input').value.trim();
  if (name) setLocal('name', name);
  setLocal('started', true);
  enterApp();
}

function enterApp() {
  document.getElementById('bottom-nav').classList.remove('hidden');
  applyDailyDecay();
  const broke = checkStreakBreak();
  navTo('home-screen');
  if (broke.frozen) showToast('昨天没练，用掉了这个月的一次免死金牌 ❄️', 3200);
  else if (broke.broken) showToast('连续天数重新开始，没关系，今天继续 💪', 3200);
}

/* ── 首页 ─────────────────────────────────────────────────────────── */

function renderHome() {
  const lesson = currentLesson();
  const streak = getStreak();

  document.getElementById('home-name').textContent = getLocal('name') || '小朋友';
  document.getElementById('home-date').textContent = formatDate(getTodayString());
  document.getElementById('home-streak-n').textContent = streak.current;
  document.getElementById('home-points').textContent = getPoints();
  document.getElementById('home-lesson-title').textContent = lesson.title;
  document.getElementById('home-lesson-sub').textContent =
    '第 ' + lesson.order + ' 课 · ' + lesson.subtitle;

  const done = missionDoneToday();
  document.getElementById('home-done-msg').classList.toggle('hidden', !done);
  document.getElementById('home-play-btn').textContent = done ? '↻ 再练一次' : '▶ 开始，5 分钟';

  const grid = document.getElementById('home-lesson-sounds');
  clearEl(grid);
  lessonSounds(lesson).forEach(s => grid.appendChild(buildSoundCard(s, true)));

  renderWeek();
}

/* Seven days, most recent last. A filled dot is a day she practised. */
function renderWeek() {
  const wrap = document.getElementById('home-week');
  clearEl(wrap);

  const history = getLocal('history') || {};
  const names = ['日', '一', '二', '三', '四', '五', '六'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateString(d);
    const played = !!history[key];

    const col = document.createElement('div');
    col.style.cssText = 'flex:1; text-align:center;';

    const dot = document.createElement('div');
    dot.style.cssText =
      `width:34px; height:34px; margin:0 auto 5px; border-radius:50%;
       display:flex; align-items:center; justify-content:center; font-size:0.9rem;
       background:${played ? 'var(--sun)' : 'var(--paper-warm)'};
       border:2px solid ${played ? '#D9A21E' : 'var(--paper-edge)'};`;
    dot.textContent = played ? '★' : '';

    const label = document.createElement('div');
    label.style.cssText = 'font-size:0.68rem; color:var(--ink-light);';
    label.textContent = names[d.getDay()];

    col.append(dot, label);
    wrap.appendChild(col);
  }
}

/* ── Sound card, shared by 首页 / 课程 ─────────────────────────────── */

function buildSoundCard(sound, compact) {
  const card = document.createElement('button');
  card.className = 'sound-card';
  card.setAttribute('aria-label', '播放 ' + sound.text);

  const stave = document.createElement('div');
  stave.className = 'sound-stave stave stave-4';
  if (compact) stave.style.height = '62px';

  const letter = document.createElement('span');
  letter.className = 'sound-letter';
  if (compact) letter.style.fontSize = '2.3rem';
  letter.textContent = sound.text;
  stave.appendChild(letter);
  card.appendChild(stave);

  if (!compact) {
    const pic = document.createElement('div');
    pic.className = 'sound-pic';
    pic.textContent = sound.pic || '';
    card.appendChild(pic);

    if (sound.mnemonic) {
      const hint = document.createElement('div');
      hint.className = 'sound-label';
      hint.textContent = sound.mnemonic;

      // The 顺口溜 says itself: the phrase, then the letter three times, the
      // way it is chanted in class. The letter comes from its own recording
      // rather than the synthesiser, which would read a bare "b" as "bee" —
      // so 「右下半圆 b b b」 is one phrase clip plus b.mp3 played three times.
      if (sound.mnemonicVoice && sound.mnemonicVoice.audio) {
        hint.setAttribute('role', 'button');
        hint.setAttribute('tabindex', '0');
        hint.setAttribute('aria-label', '读一读：' + sound.mnemonic);
        // A 7-year-old's finger needs 64px. Smaller than that and she misses,
        // hits the card behind it, and hears the bare letter instead of the
        // chant — a near-miss that just looks broken.
        hint.style.cssText +=
          ';display:flex; align-items:center; justify-content:center; gap:5px;' +
          'min-height:64px; padding:8px 6px; cursor:pointer; border-radius:12px;' +
          'background:var(--paper-warm);';
        clearEl(hint);
        const horn = document.createElement('span');
        horn.textContent = '🔊';
        horn.style.cssText = 'font-size:1.15rem; flex:none;';
        const line = document.createElement('span');
        line.textContent = sound.mnemonic;
        hint.append(horn, line);

        const chant = event => {
          // The card itself plays the bare letter; without this, tapping the
          // 顺口溜 would fire both and the letter would cut the phrase off.
          event.stopPropagation();
          hint.classList.add('animate-pop');
          setTimeout(() => hint.classList.remove('animate-pop'), 340);
          playSequence(
            [sound.mnemonicVoice.audio, sound.audio, sound.audio, sound.audio],
            null, 180);
        };
        hint.addEventListener('click', chant);
        hint.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') chant(e);
        });
      }
      card.appendChild(hint);
    }
  }

  // A thin strength bar turns the card into its own progress indicator.
  const strength = getStrength(sound.id);
  if (strength !== null) {
    const bar = document.createElement('div');
    bar.style.cssText =
      'height:4px; border-radius:999px; background:var(--paper-edge); margin-top:6px; overflow:hidden;';
    const fill = document.createElement('div');
    fill.style.cssText =
      `height:100%; width:${strength}%; border-radius:999px; background:${strengthLabel(strength).color};`;
    bar.appendChild(fill);
    card.appendChild(bar);
  }

  card.addEventListener('click', () => {
    card.classList.add('animate-pop');
    setTimeout(() => card.classList.remove('animate-pop'), 340);
    playAudio(sound.audio);
  });
  return card;
}

/* ── 拼音王国 ─────────────────────────────────────────────────────── */

function renderMap() {
  const root = document.getElementById('map-content');
  clearEl(root);

  const state = getLessonState();
  const mastered = state.masteredLessons || [];
  document.getElementById('map-done').textContent = mastered.length;

  let unit = null;
  LESSONS.forEach(lesson => {
    if (lesson.unit !== unit) {
      unit = lesson.unit;
      const label = document.createElement('div');
      label.className = 'section-label';
      label.style.marginTop = '20px';
      label.textContent = '第' + ['', '一', '二', '三', '四'][unit] + '单元';
      root.appendChild(label);
    }
    root.appendChild(buildIslandRow(lesson, mastered, state));
  });
}

function buildIslandRow(lesson, mastered, state) {
  const isDone    = mastered.indexOf(lesson.id) !== -1;
  const isCurrent = state.currentLessonId === lesson.id;
  const unlocked  = isLessonUnlocked(lesson);

  const row = document.createElement('button');
  row.className = 'card';
  row.style.cssText =
    `display:flex; align-items:center; gap:14px; width:100%; text-align:left;
     margin-bottom:10px; padding:14px 16px; cursor:${unlocked ? 'pointer' : 'default'};
     opacity:${unlocked ? 1 : 0.5}; border-color:${isCurrent ? 'var(--sea)' : 'var(--paper-edge)'};`;

  const icon = document.createElement('div');
  icon.style.cssText = 'font-size:2rem; width:48px; text-align:center;';
  icon.textContent = unlocked ? lesson.island : '🔒';

  const mid = document.createElement('div');
  mid.style.flex = '1';

  const title = document.createElement('div');
  title.style.cssText = 'font-family:var(--font-pinyin); font-size:1.35rem; font-weight:600;';
  title.textContent = lesson.title;

  const sub = document.createElement('div');
  sub.style.cssText = 'font-size:0.78rem; color:var(--ink-light); margin-top:2px;';
  sub.textContent = '第 ' + lesson.order + ' 课 · ' + lesson.subtitle;

  mid.append(title, sub);

  if (unlocked) {
    const pct = lessonProgressPct(lesson);
    const bar = document.createElement('div');
    bar.style.cssText =
      'height:6px; border-radius:999px; background:var(--paper-edge); margin-top:8px; overflow:hidden;';
    const fill = document.createElement('div');
    fill.style.cssText =
      `height:100%; width:${pct}%; border-radius:999px; background:var(--sea);`;
    bar.appendChild(fill);
    mid.appendChild(bar);
  }

  const badge = document.createElement('div');
  badge.style.cssText = 'font-size:1.3rem; width:32px; text-align:center;';
  badge.textContent = isDone ? '✓' : (isCurrent ? '◉' : '');
  badge.style.color = isDone ? 'var(--yes)' : 'var(--sea)';

  row.append(icon, mid, badge);
  if (unlocked) {
    row.addEventListener('click', () => openLesson(lesson.id));
  } else {
    row.addEventListener('click', () => showToast('先学完前面那一课 🔒'));
  }
  return row;
}

/* ── 一课的详情 ───────────────────────────────────────────────────── */

function openLesson(lessonId) {
  viewingLessonId = lessonId;
  navTo('lesson-screen');
}

function renderLesson() {
  const lesson = getLessonById(viewingLessonId) || currentLesson();
  viewingLessonId = lesson.id;

  document.getElementById('lesson-header-title').textContent =
    '第 ' + lesson.order + ' 课 · ' + lesson.title;

  const root = document.getElementById('lesson-content');
  clearEl(root);

  // Intro
  // The first thing on the screen and the longest — and until now the only
  // thing here she had no way into. It reads aloud like everything else.
  const intro = document.createElement(lesson.introVoice ? 'button' : 'div');
  intro.className = 'card';
  intro.style.cssText =
    'display:flex; align-items:center; gap:10px; width:100%; text-align:left;' +
    'font-size:0.92rem; line-height:1.8; color:var(--ink-mid);';

  if (lesson.introVoice && lesson.introVoice.audio) {
    intro.style.cssText += 'cursor:pointer; min-height:64px;';
    intro.setAttribute('aria-label', '读一读介绍：' + lesson.intro);
    const horn = document.createElement('span');
    horn.textContent = '🔊';
    horn.style.cssText = 'font-size:1.35rem; flex:none;';
    const body = document.createElement('span');
    body.textContent = lesson.intro;
    intro.append(horn, body);
    intro.addEventListener('click', () => {
      intro.classList.add('animate-pop');
      setTimeout(() => intro.classList.remove('animate-pop'), 340);
      playAudio(lesson.introVoice.audio);
    });
  } else {
    intro.textContent = lesson.intro;
  }
  root.appendChild(intro);

  // ① 认一认
  root.appendChild(sectionLabel('① 认一认'));
  const grid = document.createElement('div');
  grid.className = 'sounds-grid';
  lessonSounds(lesson).forEach(s => grid.appendChild(buildSoundCard(s)));
  root.appendChild(grid);

  // ② the rule this lesson turns on
  if (lesson.rule) root.appendChild(buildRuleCard(lesson.rule));

  // ③ 词语
  if (lesson.words && lesson.words.length) {
    root.appendChild(sectionLabel('② 读一读'));
    const words = document.createElement('div');
    words.className = 'card';
    words.style.cssText = 'display:flex; flex-wrap:wrap; gap:10px; justify-content:center;';
    lesson.words.forEach(w => words.appendChild(buildWordChip(w)));
    root.appendChild(words);
  }

  // ④ 儿歌
  if (lesson.chant) {
    root.appendChild(sectionLabel('③ 唱一唱'));
    root.appendChild(buildChantCard(lesson.chant));
  }

  // Practise
  const play = document.createElement('button');
  play.className = 'btn btn-primary btn-full';
  play.style.marginTop = '20px';
  play.textContent = '▶ 练一练';
  play.addEventListener('click', () => {
    setCurrentLesson(lesson.id);
    startMission();
  });
  root.appendChild(play);

  preloadSrcs(lessonSounds(lesson).map(s => s.audio));
}

function sectionLabel(text) {
  const el = document.createElement('div');
  el.className = 'section-label';
  el.style.marginTop = '22px';
  el.textContent = text;
  return el;
}

function buildRuleCard(rule) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.cssText =
    'background:var(--sea-pale); border-color:var(--sea); margin-top:22px;';

  const label = document.createElement('div');
  label.className = 'section-label';
  label.style.color = 'var(--sea-deep)';
  label.textContent = '记住这个规则 · ' + rule.title;

  // The 口诀 reads aloud on tap. It is the one thing on this card she cannot
  // decode for herself — it is written for a reader, and she is not one yet.
  const text = document.createElement('button');
  text.style.cssText =
    'display:flex; align-items:center; gap:10px; width:100%; text-align:left;' +
    'border:none; background:none; padding:10px 4px; cursor:pointer; min-height:64px;' +
    'font-size:1.02rem; line-height:1.8; font-weight:600; color:var(--ink);';

  const speaker = document.createElement('span');
  speaker.textContent = '🔊';
  speaker.style.cssText = 'font-size:1.35rem; flex:none;';

  const words = document.createElement('span');
  words.textContent = rule.text;
  text.append(speaker, words);

  if (rule.audio) {
    text.setAttribute('aria-label', '读一读规则：' + rule.title);
    text.addEventListener('click', () => {
      text.classList.add('animate-pop');
      setTimeout(() => text.classList.remove('animate-pop'), 340);
      playAudio(rule.audio);
    });
  } else {
    speaker.style.opacity = '0.25';
  }

  card.append(label, text);

  // 四声, and each one has to be hearable. The tone mark alone teaches nothing
  // — 「一声平，二声扬」 is a description of a sound she has never heard. Each
  // card pairs the mark with a real word in that tone and plays it on tap.
  //
  // The example is 八 拔 把 爸 rather than the letter itself: ǎ and á have no
  // character in common use, so bare vowels in four tones cannot be voiced at
  // all. One syllable across four tones is how tones are taught anyway — the
  // point is the contour, and 爸 is a word she already owns.
  if (rule.tones) {
    const names = ['一声', '二声', '三声', '四声'];
    const demo = rule.toneDemo;
    const row = document.createElement('div');
    row.style.cssText =
      'display:flex; gap:8px; justify-content:center; margin-top:14px; flex-wrap:wrap;';

    rule.tones.forEach((t, i) => {
      const item = demo && demo.items[i];
      const chip = document.createElement(item ? 'button' : 'span');
      chip.style.cssText =
        'display:flex; flex-direction:column; align-items:center; gap:2px;' +
        'min-width:64px; min-height:64px; padding:8px 10px; border-radius:14px;' +
        (item ? 'cursor:pointer; border:2px solid var(--paper-edge);' +
                'background:var(--paper);' : 'border:none; background:none;');

      const mark = document.createElement('span');
      mark.className = 'sound-letter t' + (i + 1);
      mark.style.cssText = 'font-size:2rem; transform:none; line-height:1.1;';
      mark.textContent = t;
      chip.appendChild(mark);

      if (item) {
        const name = document.createElement('span');
        name.style.cssText = 'font-size:0.62rem; color:var(--ink-light);';
        name.textContent = names[i];
        const word = document.createElement('span');
        word.style.cssText = 'font-size:0.9rem; margin-top:2px;';
        word.textContent = item.pic + ' ' + item.hanzi;
        chip.append(name, word);
        chip.setAttribute('aria-label', names[i] + '：' + item.pinyin + ' ' + item.hanzi);
        chip.addEventListener('click', () => {
          chip.classList.add('animate-pop');
          setTimeout(() => chip.classList.remove('animate-pop'), 340);
          playAudio(item.audio);
        });
      }
      row.appendChild(chip);
    });
    card.appendChild(row);

    // And all four in a row, which is what makes the contour audible: the
    // difference between them only shows up in comparison.
    if (demo) {
      const all = document.createElement('button');
      all.className = 'btn btn-secondary btn-full';
      all.style.cssText += 'margin-top:12px; min-height:64px;';
      all.textContent = '▶ 听一听 四个声调';
      all.addEventListener('click', () => {
        playSequence(demo.items.map(x => x.audio), null, 420);
      });
      card.appendChild(all);
    }
  }

  // A worked blend: b + ā = bā, tappable to hear it.
  if (rule.demo) {
    const row = document.createElement('button');
    row.style.cssText =
      'display:flex; align-items:center; justify-content:center; gap:8px; margin-top:14px;' +
      'width:100%; border:none; background:none; cursor:pointer;' +
      'font-family:var(--font-pinyin); font-size:1.9rem; color:var(--ink);';

    rule.demo.parts.forEach((p, i) => {
      if (i) row.appendChild(sep('—'));
      const el = document.createElement('span');
      el.textContent = p;
      row.appendChild(el);
    });
    row.appendChild(sep('='));

    const res = document.createElement('span');
    res.className = toneClass(rule.demo.result);
    res.style.fontWeight = '700';
    res.textContent = rule.demo.result;
    row.appendChild(res);

    if (rule.demo.hanzi) {
      const han = document.createElement('span');
      han.style.cssText = 'font-family:var(--font-han); font-size:1.5rem; margin-left:6px;';
      han.textContent = rule.demo.hanzi;
      row.appendChild(han);
    }

    row.addEventListener('click', () => {
      const srcs = rule.demo.parts
        .map(p => { const s = getSoundByText(stripTone(p)); return s && s.audio; })
        .filter(Boolean);
      playSequence(srcs);
    });
    card.appendChild(row);

    if (rule.demo.note) {
      const note = document.createElement('div');
      note.style.cssText = 'text-align:center; font-size:0.78rem; color:var(--ink-light); margin-top:6px;';
      note.textContent = rule.demo.note;
      card.appendChild(note);
    }
  }

  return card;
}

function sep(text) {
  const el = document.createElement('span');
  el.style.color = 'var(--ink-light)';
  el.textContent = text;
  return el;
}

function buildWordChip(word) {
  const chip = document.createElement('button');
  chip.style.cssText =
    'border:2px solid var(--paper-edge); border-radius:16px; background:var(--paper);' +
    'padding:10px 14px; cursor:pointer; text-align:center; min-width:96px;' +
    'font-size:1.2rem;';

  const pic = document.createElement('div');
  pic.style.fontSize = '1.6rem';
  pic.textContent = word.pic || '';

  chip.appendChild(pic);
  chip.appendChild(rubyEl(word.hanzi, word.pinyin));
  chip.addEventListener('click', () => playAudio(word.audio));
  return chip;
}

function buildChantCard(chant) {
  const card = document.createElement('div');
  card.className = 'card';

  const title = document.createElement('div');
  title.style.cssText = 'font-weight:700; margin-bottom:12px; text-align:center;';
  title.textContent = chant.title;
  card.appendChild(title);

  chant.lines.forEach(line => {
    const row = document.createElement('button');
    row.style.cssText =
      'display:block; width:100%; border:none; background:none; cursor:pointer;' +
      'padding:6px 0; font-size:1.2rem; text-align:center;';
    row.appendChild(rubyEl(line.hanzi, line.pinyin));
    row.addEventListener('click', () => {
      row.classList.add('animate-pop');
      setTimeout(() => row.classList.remove('animate-pop'), 340);
      playAudio(line.audio);
    });
    card.appendChild(row);
  });

  const all = document.createElement('button');
  all.className = 'btn btn-secondary btn-full';
  all.style.marginTop = '10px';
  all.textContent = '🔊 从头听一遍';
  all.addEventListener('click', () => playSequence(chant.lines.map(l => l.audio), null, 180));
  card.appendChild(all);

  return card;
}

/* ── 做任务 ───────────────────────────────────────────────────────── */

function startMission() {
  unlockAudio();
  const lesson = currentLesson();
  showScreen('game-screen');
  document.getElementById('bottom-nav').classList.add('hidden');
  runDailyMission(lesson, showResult);
}

function quitMission() {
  stopAudio();
  document.getElementById('bottom-nav').classList.remove('hidden');
  navTo('home-screen');
}

function showResult(result) {
  document.getElementById('bottom-nav').classList.remove('hidden');

  const history = getLocal('history') || {};
  history[getTodayString()] = { score: result.score, correct: result.correct };
  setLocal('history', history);

  const progress = checkProgress(result);
  const fresh = awardStickers();

  document.getElementById('result-score').textContent = result.score;
  document.getElementById('result-correct').textContent =
    '答对 ' + result.correct + ' / ' + result.total;

  const ratio = result.correct / result.total;
  document.getElementById('result-emoji').textContent =
    ratio >= 0.9 ? '🏆' : ratio >= 0.6 ? '🎉' : '💪';

  const streak = getStreak();
  document.getElementById('result-streak').textContent =
    streak.current > 1 ? '🔥 连续 ' + streak.current + ' 天' : '';

  // Newly earned stickers
  const stickerWrap = document.getElementById('result-stickers');
  clearEl(stickerWrap);
  fresh.forEach((s, i) => {
    const el = document.createElement('div');
    el.style.cssText =
      'display:inline-block; margin:8px 6px 0; padding:12px 16px; border-radius:18px;' +
      'background:var(--paper-warm); border:2px solid var(--sun);';
    const emoji = document.createElement('div');
    emoji.style.fontSize = '2rem';
    emoji.textContent = s.emoji;
    const name = document.createElement('div');
    name.style.cssText = 'font-size:0.78rem; margin-top:2px;';
    name.textContent = '新贴纸 · ' + s.name;
    el.append(emoji, name);
    stickerWrap.appendChild(el);
    setTimeout(() => { el.classList.add('animate-pop'); sfxUnlock(); }, 220 * (i + 1));
  });

  // Lesson unlocked
  const unlockEl = document.getElementById('result-unlock');
  clearEl(unlockEl);
  if (progress && progress.cleared) {
    unlockEl.classList.remove('hidden');
    const t = document.createElement('div');
    t.style.cssText = 'font-weight:700; margin-bottom:4px;';
    t.textContent = '第 ' + progress.cleared.order + ' 课过关啦！⭐';
    const n = document.createElement('div');
    n.style.cssText = 'font-size:0.88rem; color:var(--ink-mid);';
    n.textContent = progress.unlocked
      ? '解锁第 ' + progress.unlocked.order + ' 课 · ' + progress.unlocked.title
      : (progress.next ? '第 ' + progress.next.order + ' 课已经开啦' : '十四课全部学完啦！');
    unlockEl.append(t, n);
  } else if (progress && !progress.alreadyCleared) {
    unlockEl.classList.remove('hidden');
    const t = document.createElement('div');
    t.style.cssText = 'font-weight:700; margin-bottom:4px;';
    const n = document.createElement('div');
    n.style.cssText = 'font-size:0.88rem; color:var(--ink-mid);';

    const waiting = (progress.untested || [])
      .map(id => (getSound(id) || {}).text).filter(Boolean);

    if (progress.scored && waiting.length) {
      // She answered well enough; the lesson simply has more letters than one
      // mission can ask. Name them, so the next round has an obvious point.
      t.textContent = '答得真好！⭐';
      n.textContent = '还有 ' + waiting.join(' ') + ' 没练到，再来一次就过关';
    } else {
      t.textContent = '再来一次就更棒了 💪';
      const need = Math.ceil(result.total * CLEAR_RATIO);
      n.textContent = '答对 ' + need + ' 题，就能打开第 ' +
        ((progress.next && progress.next.order) || progress.lesson.order) + ' 课';
    }
    unlockEl.append(t, n);
  } else {
    unlockEl.classList.add('hidden');
  }

  showScreen('result-screen');
}

/* ── 故事 ─────────────────────────────────────────────────────────── */

let viewingStoryId = null;

function renderStoryList() {
  const root = document.getElementById('story-list-content');
  clearEl(root);

  const rows = storiesWithState();
  document.getElementById('story-total').textContent = rows.length;
  document.getElementById('story-read-count').textContent =
    rows.filter(r => r.read).length;

  rows.forEach(row => {
    const card = document.createElement('button');
    card.className = 'card';
    card.style.cssText =
      `display:flex; align-items:center; gap:14px; width:100%; text-align:left;
       margin-bottom:10px; padding:14px 16px;
       cursor:${row.unlocked ? 'pointer' : 'default'};
       opacity:${row.unlocked ? 1 : 0.5};`;

    const icon = document.createElement('div');
    icon.style.cssText = 'font-size:2rem; width:48px; text-align:center;';
    icon.textContent = row.unlocked ? (row.read ? '📖' : '📕') : '🔒';

    const mid = document.createElement('div');
    mid.style.flex = '1';
    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700;';
    if (row.unlocked) title.appendChild(rubyEl(row.story.title.hanzi, row.story.title.pinyin));
    else title.textContent = '？？';
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:0.8rem; color:var(--ink-light); margin-top:2px;';
    sub.textContent = row.unlocked
      ? row.story.source
      : '学完' + (getLessonById(row.story.unlockAfter) || {}).title + ' 就能读';
    mid.append(title, sub);

    card.append(icon, mid);
    if (row.unlocked) {
      card.addEventListener('click', () => {
        viewingStoryId = row.story.id;
        navTo('story-screen');
      });
    }
    root.appendChild(card);
  });
}

function renderStory() {
  const story = getStory(viewingStoryId) || STORIES[0];
  const root = document.getElementById('story-content');
  clearEl(root);

  const head = document.getElementById('story-title');
  clearEl(head);
  head.appendChild(rubyEl(story.title.hanzi, story.title.pinyin));

  // The picture. Drawn rather than photographed, so it belongs to the app and
  // costs a few kilobytes instead of a few hundred.
  const art = document.createElement('img');
  art.src = story.art;
  art.alt = story.title.hanzi;
  art.style.cssText =
    'display:block; width:100%; max-width:420px; margin:0 auto 4px; border-radius:18px;';
  art.addEventListener('error', () => art.remove());
  root.appendChild(art);

  const source = document.createElement('div');
  source.style.cssText =
    'text-align:center; font-size:0.8rem; color:var(--ink-light); margin-bottom:16px;';
  source.textContent = story.source;
  root.appendChild(source);

  // Lines. Tap one to hear it; ▶ 全部 reads the whole poem, highlighting as
  // it goes so she can follow along with a finger.
  const lines = document.createElement('div');
  lines.className = 'card';
  lines.style.cssText = 'text-align:center; padding:20px 14px;';

  const rows = story.lines.map(line => {
    const row = document.createElement('button');
    row.className = 'story-line';
    row.style.cssText =
      `display:block; width:100%; padding:10px 6px; margin:0; border:none;
       background:transparent; font-size:1.35rem; border-radius:12px; cursor:pointer;`;
    row.appendChild(rubyEl(line.hanzi, line.pinyin));
    row.addEventListener('click', () => {
      highlight(row);
      playAudio(line.audio, () => highlight(null));
    });
    lines.appendChild(row);
    return row;
  });
  root.appendChild(lines);

  function highlight(el) {
    rows.forEach(r => { r.style.background = 'transparent'; });
    if (el) el.style.background = 'var(--paper-warm)';
  }

  const playAll = document.createElement('button');
  playAll.className = 'btn btn-primary btn-full';
  playAll.style.marginTop = '14px';
  playAll.textContent = '▶ 全部读一遍';
  playAll.addEventListener('click', () => {
    let i = 0;
    (function next() {
      if (i >= story.lines.length) {
        highlight(null);
        if (markStoryRead(story.id)) {
          showToast('读完《' + story.title.hanzi + '》啦！📖', 2600);
          sfxUnlock();
        }
        return;
      }
      const idx = i++;
      highlight(rows[idx]);
      playAudio(story.lines[idx].audio, () => setTimeout(next, 260));
    })();
  });
  root.appendChild(playAll);

  // 生词 from the poem, same chips as a lesson uses.
  if (story.words && story.words.length) {
    const label = document.createElement('div');
    label.className = 'section-label';
    label.style.marginTop = '22px';
    label.textContent = '生词';
    root.appendChild(label);

    const words = document.createElement('div');
    words.className = 'card';
    words.style.cssText = 'display:flex; flex-wrap:wrap; gap:10px; justify-content:center;';
    story.words.forEach(w => words.appendChild(buildWordChip(w)));
    root.appendChild(words);
  }
}

/* ── 贴纸册 ───────────────────────────────────────────────────────── */

function renderStickers() {
  const root = document.getElementById('sticker-content');
  clearEl(root);

  const earned = getEarnedStickers();
  document.getElementById('sticker-count').textContent = earned.length;

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fill,minmax(88px,1fr)); gap:10px;';

  STICKERS.forEach(sticker => {
    const has = earned.indexOf(sticker.id) !== -1;
    const cell = document.createElement('div');
    cell.style.cssText =
      `border:2px ${has ? 'solid var(--sun)' : 'dashed var(--paper-edge)'}; border-radius:18px;
       background:${has ? 'var(--paper-warm)' : 'transparent'};
       padding:12px 6px; text-align:center; min-height:96px;
       display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;`;

    const emoji = document.createElement('div');
    emoji.style.cssText = 'font-size:1.9rem;' + (has ? '' : 'filter:grayscale(1); opacity:0.25;');
    emoji.textContent = has ? sticker.emoji : '❔';

    const label = document.createElement('div');
    label.style.cssText = 'font-size:0.68rem; color:var(--ink-light); line-height:1.4;';
    label.textContent = has ? sticker.name : stickerHint(sticker);

    cell.append(emoji, label);
    if (has) {
      cell.appendChild(rubyMini(sticker));
      cell.style.cursor = 'pointer';
    }
    grid.appendChild(cell);
  });

  root.appendChild(grid);
}

function rubyMini(sticker) {
  const el = document.createElement('div');
  el.style.cssText = 'font-size:0.62rem; color:var(--ink-light); font-family:var(--font-pinyin);';
  el.textContent = sticker.pinyin;
  return el;
}

/* ── 家长 ─────────────────────────────────────────────────────────── */

function renderParent() {
  const root = document.getElementById('parent-content');
  clearEl(root);

  const strengths = getStrengths();
  const streak = getStreak();
  const state = getLessonState();

  root.appendChild(statCard([
    ['学会的字母', masteredSoundCount() + ' / 63'],
    ['学完的课',   (state.masteredLessons || []).length + ' / 14'],
    ['连续天数',   streak.current + ' 天'],
    ['最长连续',   streak.longest + ' 天'],
    ['总分',       getPoints() + ' 分'],
  ]));

  // Weakest sounds first — the actionable part for a parent.
  const seen = SOUNDS.filter(s => strengths[s.id]);
  const weak = seen
    .sort((a, b) => (strengths[a.id].strength || 0) - (strengths[b.id].strength || 0))
    .slice(0, 12);

  const card = document.createElement('div');
  card.className = 'card';
  const label = document.createElement('div');
  label.className = 'section-label';
  label.textContent = weak.length ? '最需要练的' : '还没有练习记录';
  card.appendChild(label);

  if (weak.length) {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fill,minmax(64px,1fr)); gap:8px;';
    weak.forEach(s => {
      const st = strengths[s.id].strength || 0;
      const cell = document.createElement('button');
      cell.style.cssText =
        `border:2px solid ${strengthLabel(st).color}; border-radius:12px; background:var(--paper);
         padding:8px 4px; cursor:pointer; font-family:var(--font-pinyin); font-size:1.3rem;`;
      cell.textContent = s.text;
      const pct = document.createElement('div');
      pct.style.cssText = 'font-family:var(--font-han); font-size:0.62rem; color:var(--ink-light); margin-top:2px;';
      pct.textContent = strengthLabel(st).text;
      cell.appendChild(pct);
      cell.addEventListener('click', () => playAudio(s.audio));
      grid.appendChild(cell);
    });
    card.appendChild(grid);
  }
  root.appendChild(card);

  root.appendChild(actionCard(
    '音频检查',
    '所有字母的读音都是提前合成好的。请先听一遍，特别是 eng 和 ong —— ' +
    '这两个音没有合适的汉字可以合成，很可能不准。',
    '去检查 →', () => navTo('audio-check-screen')));

  root.appendChild(toggleCard(
    '提示音',
    '答对答错的小提示音。字母的读音不受影响，只关掉提示音。',
    getLocal('sfx') !== false,
    on => { setSfxEnabled(on); if (on) sfxCorrect(); }));

  root.appendChild(buildVersionCard());

  root.appendChild(actionCard(
    '数据',
    '所有进度都存在这台设备上，没有账号，也不上传。',
    '清空全部进度', resetAll));
}

/*
 * Which copy is this iPad actually running?
 *
 * The whole app is cached for offline use, so after a change the device keeps
 * serving what it already has until the worker swaps it. That is the point of
 * it, and it also means there is no way to tell by looking whether a fix has
 * landed. This says so plainly, and gives a button rather than requiring the
 * home-screen icon to be deleted and re-added.
 */
function buildVersionCard() {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginTop = '14px';

  const label = document.createElement('div');
  label.className = 'section-label';
  label.textContent = '版本';

  const line = document.createElement('div');
  line.style.cssText = 'font-size:0.86rem; color:var(--ink-mid); line-height:1.7;';
  line.textContent = '正在检查…';

  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary btn-full';
  btn.style.cssText += 'margin-top:12px; min-height:64px;';
  btn.textContent = '检查更新';

  function show(text) { line.textContent = text; }

  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) {
    show('这个副本直接从文件打开，没有离线缓存。');
    btn.disabled = true;
    btn.style.opacity = '0.5';
  } else {
    caches.keys().then(keys => {
      const mine = keys.filter(k => k.indexOf('pinyin-') === 0);
      show(mine.length
        ? '离线版本 ' + mine[0].replace('pinyin-', '') + '，已经可以断网使用。'
        : '还没有离线缓存，联网打开一次就会存下来。');
    }).catch(() => show('无法读取缓存状态。'));

    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.textContent = '正在检查…';
      navigator.serviceWorker.getRegistration()
        .then(reg => reg && reg.update())
        .then(() => {
          // A new worker installs, then takes over, and the controllerchange
          // handler in index.html reloads the page. If nothing arrives within
          // a few seconds there was nothing new.
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = '检查更新';
            show('已经是最新的了。');
          }, 6000);
        })
        .catch(() => {
          btn.disabled = false;
          btn.textContent = '检查更新';
          show('检查失败，可能没有联网。');
        });
    });
  }

  card.append(label, line, btn);
  return card;
}

function statCard(rows) {
  const card = document.createElement('div');
  card.className = 'card';
  rows.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.style.cssText =
      'display:flex; justify-content:space-between; padding:9px 0;' +
      'border-bottom:1px solid var(--paper-edge); font-size:0.92rem;';
    const l = document.createElement('span');
    l.style.color = 'var(--ink-light)';
    l.textContent = label;
    const v = document.createElement('strong');
    v.textContent = value;
    row.append(l, v);
    card.appendChild(row);
  });
  card.lastChild.style.borderBottom = 'none';
  return card;
}

function toggleCard(title, body, initial, onChange) {
  const card = document.createElement('div');
  card.className = 'card';

  const label = document.createElement('div');
  label.className = 'section-label';
  label.textContent = title;

  const p = document.createElement('p');
  p.style.cssText = 'color:var(--ink-mid); font-size:0.88rem; line-height:1.7; margin-bottom:16px;';
  p.textContent = body;

  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary btn-full';
  let on = initial;
  const paint = () => { btn.textContent = on ? '🔔 开着' : '🔕 关着'; };
  paint();
  btn.addEventListener('click', () => { on = !on; paint(); onChange(on); });

  card.append(label, p, btn);
  return card;
}

function actionCard(title, body, buttonText, onClick) {
  const card = document.createElement('div');
  card.className = 'card';

  const label = document.createElement('div');
  label.className = 'section-label';
  label.textContent = title;

  const p = document.createElement('p');
  p.style.cssText = 'color:var(--ink-mid); font-size:0.88rem; line-height:1.7; margin-bottom:16px;';
  p.textContent = body;

  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary btn-full';
  btn.textContent = buttonText;
  btn.addEventListener('click', onClick);

  card.append(label, p, btn);
  return card;
}

/* ── 音频检查 ─────────────────────────────────────────────────────────
 * Generated speech is the one part of this app that can be wrong in a way
 * no test catches, so a parent listens once and marks failures. The two
 * sounds with no correct character to synthesise from float to the top. */

function renderAudioCheck() {
  const root = document.getElementById('check-list');
  clearEl(root);

  const marks = getLocal('audio_check') || {};
  const ordered = [...SOUNDS].sort((a, b) => (b.needsRecording ? 1 : 0) - (a.needsRecording ? 1 : 0));

  ordered.forEach(sound => {
    const row = document.createElement('div');
    row.className = 'check-row' + (sound.needsRecording ? ' flagged' : '');

    const letter = document.createElement('div');
    letter.className = 'check-letter';
    letter.textContent = sound.text;

    const meta = document.createElement('div');
    meta.className = 'check-meta';
    meta.textContent = sound.needsRecording
      ? sound.hanzi + ' · ' + (sound.recordNote || '需要自己录音')
      : '合成自「' + sound.hanzi + '」';

    const play = document.createElement('button');
    play.className = 'check-play';
    play.textContent = '▶';
    play.setAttribute('aria-label', '播放 ' + sound.text);
    play.addEventListener('click', () => playAudio(sound.audio));

    const ok = document.createElement('button');
    ok.className = 'check-mark' + (marks[sound.id] === 'ok' ? ' ok' : '');
    ok.textContent = '✓';
    ok.setAttribute('aria-label', sound.text + ' 读得对');
    ok.addEventListener('click', () => markAudio(sound.id, 'ok'));

    const bad = document.createElement('button');
    bad.className = 'check-mark' + (marks[sound.id] === 'bad' ? ' bad' : '');
    bad.textContent = '✗';
    bad.setAttribute('aria-label', sound.text + ' 读得不对');
    bad.addEventListener('click', () => markAudio(sound.id, 'bad'));

    row.append(letter, meta, play, ok, bad);
    root.appendChild(row);
  });

  renderCheckSummary();
}

function markAudio(soundId, verdict) {
  const marks = getLocal('audio_check') || {};
  if (marks[soundId] === verdict) delete marks[soundId];
  else marks[soundId] = verdict;
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
  label.textContent = '需要重录 · ' + badIds.length + ' 个';
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
  ['started', 'name', 'strengths', 'lessons_state', 'streak', 'audio_check',
   'stickers', 'points', 'history', 'last_mission', 'last_decay'].forEach(removeLocal);
  showToast('已清空');
  setTimeout(() => location.reload(), 800);
}

function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return parseInt(m, 10) + ' 月 ' + parseInt(d, 10) + ' 日';
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
  initSfx();
  document.addEventListener('pointerdown', unlockAudio, { once: true });

  if (getLocal('started')) enterApp();
  else showScreen('start-screen');
});
