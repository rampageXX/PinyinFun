/*
 * games/dailyMission.js — 今天的任务
 *
 * Ten questions, about five minutes, mixing the current lesson with review.
 * Same shape as Bonjourly's dailyDuel.js: build a schedule up front, run it
 * one question at a time, update strength after each answer.
 *
 * Graceful degradation matters here. Lessons 1, 2 and 9 introduce no
 * blendable syllables at all — 单韵母 have nothing to blend with yet, and
 * y/w head 整体认读音节 — so 拼一拼 and 声调小火车 have nothing to work with.
 * buildSchedule fills those slots with the games that only need sounds
 * rather than shipping an empty question.
 *
 * runDailyMission(lesson, onDone) -> onDone({score, correct, total})
 */

const MISSION_LENGTH = 10;

function runDailyMission(lesson, onDone) {
  const items = pickTodaysItems(getTodayString(), lesson);
  const schedule = buildSchedule(items, getTodayString() + lesson.id);
  const pool = availableSounds(lesson.order);   // never show an unmet letter

  let idx = 0, score = 0, correct = 0, sessionStreak = 0;
  const answers = [];

  updateProgress();
  runNext();

  function runNext() {
    if (idx >= schedule.length) {
      finish();
      return;
    }
    const q = schedule[idx];
    announce(q.type);

    if (q.type === 'listenPick') {
      initListenPick(q.item, pool, r => handle(r, q));
    } else if (q.type === 'toneTrain') {
      initToneTrain(q.item, r => handle(r, q));
    } else if (q.type === 'blendBuilder') {
      initBlendBuilder(q.item, pool, r => handle(r, q));
    } else {
      initSharpEyes(q.item, pool, r => handle(r, q));
    }
  }

  function handle(result, q) {
    const sc = calculateScore({
      correct: result.correct, timeMs: result.timeMs, sessionStreak,
    });
    sessionStreak = result.correct ? sessionStreak + 1 : 0;
    score += sc.total;
    if (result.correct) correct++;

    updateStrength(q.item.id, result.correct);
    answers.push({ id: q.item.id, type: q.type, correct: result.correct });

    idx++;
    updateProgress();
    setTimeout(runNext, 350);
  }

  function finish() {
    addPoints(score);
    recordPlayed();
    setLocal('last_mission', { date: getTodayString(), lesson: lesson.id, score, correct });
    onDone({ score, correct, total: schedule.length, answers, lesson });
  }

  function updateProgress() {
    const fill = document.getElementById('mission-progress-fill');
    const label = document.getElementById('mission-progress-label');
    const live = document.getElementById('mission-score');
    if (fill)  fill.style.width = (idx / schedule.length * 100) + '%';
    if (label) label.textContent = Math.min(idx + 1, schedule.length) + ' / ' + schedule.length;
    if (live)  live.textContent = score + ' 分';
  }

  function announce(type) {
    const label = document.getElementById('mission-progress-label');
    if (!label) return;
    const names = {
      listenPick: '听音选一选', toneTrain: '声调小火车',
      blendBuilder: '拼一拼', sharpEyes: '火眼金睛',
    };
    label.textContent = names[type] || '';
    setTimeout(updateProgress, 900);
  }
}

/*
 * The order of game types is fixed, not shuffled. A run of four identical
 * questions is exactly where a child's attention goes, so the sequence below
 * is a deliberate interleaving and randomising it would only undo that.
 * What does vary day to day are the items, which come from the seeded
 * selection in lib/selection.js.
 */
function buildSchedule(items, seed) {
  const sounds = items.sounds.filter(Boolean);
  const syllables = items.syllables.filter(Boolean);

  // 拼一拼 puts a 声母 next to a 韵母, so it needs a syllable that has one.
  // 课1's syllables are bare 韵母 (e, ē/é) — drillable for tone, but there is
  // nothing to blend, so they are kept out of the blend pool.
  const blendPool = syllables.filter(s => s.shengmu);

  // Sounds with a confusable set are the only ones worth a 火眼金睛 round.
  const sharpPool = sounds.filter(s => (s.confusable || []).length);

  const wanted = blendPool.length
    ? ['listenPick', 'blendBuilder', 'toneTrain', 'listenPick', 'blendBuilder',
       'sharpEyes', 'listenPick', 'toneTrain', 'blendBuilder', 'listenPick']
    : syllables.length
      ? ['listenPick', 'toneTrain', 'sharpEyes', 'listenPick', 'toneTrain',
         'listenPick', 'sharpEyes', 'listenPick', 'toneTrain', 'listenPick']
      : ['listenPick', 'sharpEyes', 'listenPick', 'listenPick', 'sharpEyes',
         'listenPick', 'listenPick', 'sharpEyes', 'listenPick', 'listenPick'];

  let si = 0, yi = 0, pi = 0, bi = 0;
  const schedule = [];

  wanted.forEach(type => {
    if (type === 'blendBuilder') {
      if (!blendPool.length) type = 'listenPick';
      else {
        schedule.push({ type, item: blendPool[bi++ % blendPool.length] });
        return;
      }
    }
    if (type === 'toneTrain') {
      if (!syllables.length) type = 'listenPick';
      else {
        schedule.push({ type, item: syllables[yi++ % syllables.length] });
        return;
      }
    }
    if (type === 'sharpEyes') {
      if (!sharpPool.length) type = 'listenPick';
      else {
        schedule.push({ type, item: sharpPool[pi++ % sharpPool.length] });
        return;
      }
    }
    if (!sounds.length) return;              // nothing to ask at all
    schedule.push({ type: 'listenPick', item: sounds[si++ % sounds.length] });
  });

  return schedule.slice(0, MISSION_LENGTH);
}

/* Has today's mission already been done? */
function missionDoneToday() {
  const last = getLocal('last_mission');
  return !!last && last.date === getTodayString();
}
