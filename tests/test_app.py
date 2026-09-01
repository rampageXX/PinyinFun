"""
tests/test_app.py — end-to-end smoke test.

    pip install playwright pytest
    playwright install chromium
    python -m pytest tests/ -v

Starts a local server, drives a real browser through the app, and asserts the
things that would break silently: that the mission completes, that answers are
recorded, that a lesson unlocks, and — the one a child would notice first —
that no screen ever offers a letter she has not been taught yet.
"""

import contextlib
import http.server
import socket
import socketserver
import threading
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent


def free_port():
    with contextlib.closing(socket.socket()) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture(scope="session")
def base_url():
    port = free_port()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(ROOT), **kw)

        def log_message(self, *a):
            pass

    class Server(socketserver.ThreadingTCPServer):
        daemon_threads = True
        allow_reuse_address = True

    server = Server(("127.0.0.1", port), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{port}"
    server.shutdown()


@pytest.fixture()
def page(base_url):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 820, "height": 1180})
        pg = ctx.new_page()
        pg.goto(f"{base_url}/index.html")
        pg.wait_for_function("() => typeof SOUNDS !== 'undefined'")
        yield pg
        browser.close()


# ── content ──────────────────────────────────────────────────────────

def test_content_loads(page):
    counts = page.evaluate(r"""() => ({
        sounds: SOUNDS.length,
        lessons: LESSONS.length,
        syllables: SYLLABLES.length,
        stickers: STICKERS.length,
    })""")
    assert counts["sounds"] == 63
    assert counts["lessons"] == 14
    assert counts["stickers"] == 40
    assert counts["syllables"] > 200


def test_no_console_errors_on_load(base_url):
    """Only the two override probes for eng/ong may 404 — nothing else."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        pg = browser.new_page()
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{base_url}/index.html")
        pg.wait_for_timeout(1200)
        browser.close()
    assert errors == [], f"JavaScript errors on load: {errors}"


# ── first run ────────────────────────────────────────────────────────

def test_start_leads_to_home(page):
    page.fill("#name-input", "小雨")
    page.click("#start-screen .btn-primary")
    assert page.is_visible("#home-screen")
    assert page.inner_text("#home-name") == "小雨"
    # Lesson 1 is where a new child starts.
    assert "a o e" in page.inner_text("#home-lesson-title")


def test_lesson_one_is_the_only_one_unlocked(page):
    page.click("#start-screen .btn-primary")
    unlocked = page.evaluate("() => LESSONS.filter(isLessonUnlocked).map(l => l.id)")
    assert unlocked == ["lesson-01"]


# ── the rule that matters most ───────────────────────────────────────

def test_never_offers_an_unmet_letter(page):
    """
    A distractor from a future lesson asks the child to rule out a letter she
    has never seen. Check every lesson's pool, not just the first.
    """
    leaks = page.evaluate(r"""() => {
        const bad = [];
        LESSONS.forEach(lesson => {
            const pool = availableSounds(lesson.order);
            pool.forEach(s => {
                if (lessonOrderOf(s) > lesson.order) {
                    bad.push(lesson.id + ' exposes ' + s.text);
                }
            });
            // and the distractors actually generated from that pool
            lessonSounds(lesson).forEach(sound => {
                pickDistractors(sound, 3, pool).forEach(d => {
                    if (lessonOrderOf(d) > lesson.order) {
                        bad.push(lesson.id + ' distractor ' + d.text);
                    }
                });
            });
        });
        return bad;
    }""")
    assert leaks == [], f"letters offered before being taught: {leaks}"


def test_syllables_never_precede_their_parts(page):
    bad = page.evaluate(r"""() => {
        const order = {};
        SOUNDS.forEach(s => { if (!(s.text in order)) order[s.text] = lessonOrderOf(s); });
        return SYLLABLES.filter(sy => {
            const n = parseInt(sy.lesson.slice(-2), 10);
            return order[sy.shengmu] > n || order[sy.yunmu] > n;
        }).map(sy => sy.id);
    }""")
    assert bad == [], f"syllables taught before their parts: {bad}"


def test_todays_items_include_every_letter_the_lesson_teaches(page):
    """A lesson's own letters must all be in the day's pool.

    They used to be capped at 4 and shuffled in with the review items, so a
    letter the lesson exists to teach could go unasked — 课2 cleared at 10/10
    without ü ever appearing, and 课8 teaches 8 letters of which only 4 could
    even enter the pool.
    """
    missing = page.evaluate(r"""() => {
        const bad = [];
        LESSONS.forEach(lesson => {
            const items = pickTodaysItems('2026-08-29', lesson);
            const pool = new Set(items.sounds.map(s => s.id));
            lesson.sounds.forEach(id => {
                if (!pool.has(id)) bad.push(lesson.id + ' omits ' + id);
            });
        });
        return bad;
    }""")
    assert missing == [], f"lesson letters left out of the day's pool: {missing}"


def test_a_small_lesson_asks_all_of_its_letters(page):
    """课1 teaches three letters; one mission must touch all three."""
    page.click("#start-screen .btn-primary")
    assert run_scripted_mission(page, wrong_answers=0)
    untested = page.evaluate(r"""() => {
        const s = JSON.parse(localStorage.getItem('pinyin_strengths') || '{}');
        return getLessonById('lesson-01').sounds.filter(id => !(s[id] && s[id].attempts));
    }""")
    assert untested == [], f"课1 letters never asked: {untested}"


# ── a full session ───────────────────────────────────────────────────

def run_mission(page):
    """Answer every question (first option) until the result screen appears."""
    page.evaluate("() => startMission()")
    page.wait_for_timeout(600)
    for _ in range(400):
        if page.evaluate("() => !document.getElementById('result-screen').classList.contains('hidden')"):
            return True
        page.evaluate("""() => {
            const area = document.getElementById('game-area');
            // 拼一拼 needs one card from each row, not repeated taps on one.
            const rows = [...area.querySelectorAll('div[data-role]')]
                .filter(r => r.querySelector('button'));
            if (rows.length) {
                rows.forEach((r, i) => {
                    const b = [...r.querySelectorAll('button')].filter(x => !x.disabled)[0];
                    if (b) setTimeout(() => b.click(), i * 100);
                });
                return;
            }
            // 我会读 needs a choice and then a 确定; tapping an option only
            // plays it, so a single blind click would never answer.
            const confirm = [...area.querySelectorAll('button')]
                .filter(b => b.textContent === '确定')[0];
            if (confirm) {
                if (confirm.disabled) {
                    const opt = area.querySelector('.sound-card');
                    if (opt) opt.click();
                } else {
                    confirm.click();
                }
                return;
            }
            const btns = [...area.querySelectorAll('button')]
                .filter(b => !b.disabled && !b.classList.contains('speaker'));
            if (btns.length) btns[0].click();
        }""")
        page.wait_for_timeout(250)
    return False


def test_mission_completes_and_records_progress(page):
    page.click("#start-screen .btn-primary")
    assert run_mission(page), "mission never reached the result screen"

    state = page.evaluate(r"""() => {
        const s = JSON.parse(localStorage.getItem('pinyin_strengths') || '{}');
        return {
            items: Object.keys(s).length,
            ids: Object.keys(s).sort(),
            attempts: Object.values(s).reduce((n, e) => n + e.attempts, 0),
            history: Object.keys(JSON.parse(localStorage.getItem('pinyin_history') || '{}')).length,
            streak: (JSON.parse(localStorage.getItem('pinyin_streak') || '{}')).current,
            done: missionDoneToday(),
        };
    }""")
    # Lesson 1 is a o e plus the bare 韵母 e as a toned syllable — 课1's rule is
    # 四声, so 声调小火车 has to have something to drill there. Nothing else is
    # unlocked yet, so those four ids are exactly what a session can touch.
    assert state["attempts"] == 10, "each question should record one attempt"
    assert state["ids"] == ["sy-e", "yu-a", "yu-e", "yu-o"],         "lesson 1 drills a/o/e and the toned syllable e, and nothing else"
    assert state["history"] == 1
    assert state["streak"] == 1
    assert state["done"] is True


def run_scripted_mission(page, wrong_answers=0):
    """Drive a mission with a known score, bypassing each game's own UI."""
    page.evaluate("""(wrong) => {
        window.__wrongLeft = wrong;
        ['initListenPick', 'initToneTrain', 'initBlendBuilder', 'initSharpEyes',
         'initReadPick']
          .forEach(n => {
            window[n] = function (...a) {
                const cb = a[a.length - 1];
                let ok = true;
                if (window.__wrongLeft > 0) { window.__wrongLeft--; ok = false; }
                setTimeout(() => cb({ correct: ok, timeMs: 3000 }), 0);
            };
        });
        startMission();
    }""", wrong_answers)
    for _ in range(300):
        if page.evaluate(
            "() => !document.getElementById('result-screen').classList.contains('hidden')"
        ):
            return True
        page.wait_for_timeout(50)
    return False


def test_clearing_a_lesson_opens_the_next_one_immediately(page):
    """It is a game: clear the level, the next one is there."""
    page.click("#start-screen .btn-primary")
    assert run_scripted_mission(page, wrong_answers=1)   # 9/10 clears

    after = page.evaluate(r"""() => ({
        cleared: getLessonState().clearedOn,
        mastered: getLessonState().masteredLessons,
        current: getLessonState().currentLessonId,
        unlocked: LESSONS.filter(isLessonUnlocked).map(l => l.id),
        stickers: getEarnedStickers(),
        unlockText: document.getElementById('result-unlock').innerText.replace(/\s+/g, ' ').trim(),
    })""")
    assert "lesson-01" in after["cleared"]
    assert "lesson-01" in after["mastered"]
    assert "st-01" in after["stickers"], "clearing a lesson should award its sticker"
    assert after["current"] == "lesson-02", "she should move straight on"
    assert after["unlocked"] == ["lesson-01", "lesson-02"]
    assert "解锁第 2 课" in after["unlockText"], after["unlockText"]


def test_nine_out_of_ten_clears_but_eight_does_not(page):
    """The bar sits at 9/10: one slip is forgiven, two is not."""
    page.click("#start-screen .btn-primary")

    assert run_scripted_mission(page, wrong_answers=2)   # 8/10
    after = page.evaluate(r"""() => ({
        cleared: getLessonState().clearedOn || {},
        current: getLessonState().currentLessonId,
        unlocked: LESSONS.filter(isLessonUnlocked).map(l => l.id),
    })""")
    assert after["cleared"] == {}, "8/10 must not clear the lesson"
    assert after["current"] == "lesson-01"
    assert after["unlocked"] == ["lesson-01"], "the next island stays shut"

    # Same child, same lesson, one better: that should be enough.
    assert run_scripted_mission(page, wrong_answers=1)   # 9/10
    after = page.evaluate(r"""() => ({
        cleared: getLessonState().clearedOn || {},
        current: getLessonState().currentLessonId,
    })""")
    assert "lesson-01" in after["cleared"], "9/10 should clear the lesson"
    assert after["current"] == "lesson-02"


def test_several_lessons_can_be_cleared_in_one_sitting(page):
    """No calendar anywhere: keep clearing and she keeps advancing."""
    page.click("#start-screen .btn-primary")
    reached = []
    for _ in range(3):
        assert run_scripted_mission(page, wrong_answers=0)
        reached.append(page.evaluate("() => getLessonState().currentLessonId"))
        page.evaluate("() => navTo('home-screen')")

    assert reached == ["lesson-02", "lesson-03", "lesson-04"], reached
    unlocked = page.evaluate("() => LESSONS.filter(isLessonUnlocked).map(l => l.order)")
    assert unlocked == [1, 2, 3, 4], unlocked


def test_replaying_a_cleared_lesson_does_not_drag_her_back(page):
    """Practising 课1 again must not reset her to 课2."""
    page.click("#start-screen .btn-primary")
    assert run_scripted_mission(page, wrong_answers=0)          # clears 课1 -> 课2
    assert page.evaluate("() => getLessonState().currentLessonId") == "lesson-02"

    page.evaluate("() => setCurrentLesson('lesson-01')")        # go back to practise
    assert run_scripted_mission(page, wrong_answers=0)          # ace it again

    after = page.evaluate(r"""() => ({
        current: getLessonState().currentLessonId,
        unlocked: LESSONS.filter(isLessonUnlocked).map(l => l.order),
    })""")
    assert after["current"] == "lesson-02", "a replay should not move her backwards"
    assert after["unlocked"] == [1, 2]


def test_untested_letters_are_drawn_first(page):
    """Ordering, not just inclusion — otherwise a big lesson can never clear.

    The draw is seeded by date, so a second sitting on the same day would ask
    the identical letters. Putting the never-asked ones at the front is what
    lets the remaining letters be reached at all.
    """
    page.click("#start-screen .btn-primary")
    ok = page.evaluate(r"""() => {
        const lesson = getLessonById('lesson-08');       // teaches 8 letters
        const strengths = {};
        lesson.sounds.slice(0, 3).forEach(id => { strengths[id] = { attempts: 2, strength: 80 }; });
        localStorage.setItem('pinyin_strengths', JSON.stringify(strengths));
        const pool = pickTodaysItems(getTodayString(), lesson).sounds.map(s => s.id);
        const own = pool.filter(id => lesson.sounds.indexOf(id) !== -1);
        const fresh = lesson.sounds.slice(3);
        // every never-asked letter must come before every already-asked one
        return fresh.every(id => own.indexOf(id) < Math.min(
            ...lesson.sounds.slice(0, 3).map(seen => own.indexOf(seen))));
    }""")
    assert ok, "letters she has never been asked must be drawn first"


def test_a_big_lesson_takes_more_than_one_sitting(page):
    """课8 teaches 8 letters; clearing waits until every one has been asked."""
    page.click("#start-screen .btn-primary")
    page.evaluate("""() => {
        const st = getLessonState();
        st.clearedOn = {};
        st.masteredLessons = [];
        LESSONS.filter(l => l.order < 8).forEach(l => {
            st.clearedOn[l.id] = getTodayString();
            st.masteredLessons.push(l.id);
        });
        st.currentLessonId = 'lesson-08';
        saveLessonState(st);
    }""")

    assert run_scripted_mission(page, wrong_answers=0)
    first = page.evaluate(r"""() => ({
        cleared: !!(getLessonState().clearedOn || {})['lesson-08'],
        untested: untestedSounds(getLessonById('lesson-08'), getStrengths()).length,
        msg: document.getElementById('result-unlock').innerText.replace(/\s+/g, ' ').trim(),
    })""")
    assert not first["cleared"], "one mission cannot ask all eight letters"
    assert first["untested"] > 0
    assert "没练到" in first["msg"], f"she should be told what is left: {first['msg']}"

    # Further sittings must reach the remaining letters and finish the lesson.
    for _ in range(3):
        if page.evaluate("() => !!(getLessonState().clearedOn || {})['lesson-08']"):
            break
        page.evaluate("() => navTo('home-screen')")
        assert run_scripted_mission(page, wrong_answers=0)

    after = page.evaluate(r"""() => ({
        cleared: !!(getLessonState().clearedOn || {})['lesson-08'],
        untested: untestedSounds(getLessonById('lesson-08'), getStrengths()).length,
        current: getLessonState().currentLessonId,
    })""")
    assert after["untested"] == 0, "repeat sittings must reach every letter"
    assert after["cleared"], "课8 should clear once all eight have been asked"
    assert after["current"] == "lesson-09"


def test_every_rule_can_be_read_aloud(page):
    """The 口诀 is the one thing on a lesson screen she cannot decode herself.

    It is written for a reader — 「前音轻短后音重，两音相连猛一碰。」 — so it
    needs a voice, and where it prints letters it needs a `say` in 呼读音
    characters, or the voice says the English letter names.
    """
    state = page.evaluate(r"""() => {
        const silent = [], unsayable = [];
        LESSONS.forEach(l => {
            if (!l.rule) return;
            if (!l.rule.audio) silent.push(l.id);
            if (/(?:^|[^一-鿿])[a-zü]/.test(l.rule.text) && !l.rule.say) {
                unsayable.push(l.id);
            }
        });
        return { silent, unsayable, rules: LESSONS.filter(l => l.rule).length };
    }""")
    assert state["rules"] == 14
    assert state["silent"] == [], f"rules with no audio: {state['silent']}"
    assert state["unsayable"] == [], f"rules printing letters with no say: {state['unsayable']}"


def test_tapping_the_rule_plays_it(page):
    page.click("#start-screen .btn-primary")
    played = page.evaluate(r"""async () => {
        viewingLessonId = 'lesson-03';
        navTo('lesson-screen');
        const played = [];
        const orig = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            played.push((this.src || '').split('/').slice(-2).join('/'));
            return Promise.resolve();
        };
        const btn = [...document.querySelectorAll('#lesson-content button')]
            .find(b => (b.getAttribute('aria-label') || '').indexOf('读一读规则') === 0);
        if (btn) btn.click();
        await new Promise(r => setTimeout(r, 60));
        HTMLMediaElement.prototype.play = orig;
        return played;
    }""")
    assert played == ["rule/lesson-03.mp3"], played


def test_every_mnemonic_can_be_chanted(page):
    """A 顺口溜 printed without a voice is decoration, not a memory aid."""
    state = page.evaluate(r"""() => {
        const silent = [], leaky = [];
        SOUNDS.forEach(s => {
            if (!s.mnemonic) return;                 // 整体认读 carry a note instead
            if (!s.mnemonicVoice || !s.mnemonicVoice.audio) { silent.push(s.id); return; }
            if (/(?:^|[^一-鿿])[a-zü]/.test(s.mnemonicVoice.say)) leaky.push(s.id);
        });
        return { silent, leaky, withMnemonic: SOUNDS.filter(s => s.mnemonic).length };
    }""")
    assert state["withMnemonic"] == 47
    assert state["silent"] == [], f"mnemonics with no voice: {state['silent']}"
    assert state["leaky"] == [], (
        f"a spoken phrase still holding letters would be read as English: {state['leaky']}")


def test_the_mnemonic_chants_the_phrase_then_the_letter(page):
    """「右下半圆 b b b」 = one phrase clip, then b.mp3 three times.

    The letters come from their own recordings rather than the synthesiser,
    which reads a bare "b" as "bee".
    """
    page.click("#start-screen .btn-primary")
    result = page.evaluate(r"""async () => {
        viewingLessonId = 'lesson-03';
        navTo('lesson-screen');
        const played = [];
        const orig = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            played.push((this.src || '').split('/').slice(-2).join('/'));
            return Promise.resolve();
        };
        const tick = ms => new Promise(r => setTimeout(r, ms || 60));
        const hint = [...document.querySelectorAll('#lesson-content .sound-label')]
            .find(e => e.textContent.indexOf('右下半圆') !== -1);
        hint.click();
        await tick(); getAudioEl('audio/mnemonic/sh-b.mp3').dispatchEvent(new Event('ended'));
        for (let i = 0; i < 3; i++) {
            await tick(240);
            getAudioEl('audio/sheng/b.mp3').dispatchEvent(new Event('ended'));
        }
        await tick(150);
        const chant = played.slice();

        // tapping the card itself must still play only the letter
        played.length = 0;
        document.querySelector('#lesson-content .sound-card').click();
        await tick();
        HTMLMediaElement.prototype.play = orig;
        return { chant, card: played };
    }""")
    assert result["chant"] == ["mnemonic/sh-b.mp3", "sheng/b.mp3", "sheng/b.mp3", "sheng/b.mp3"],         result["chant"]
    assert result["card"] == ["sheng/b.mp3"],         f"the card should still play just the letter, played {result['card']}"


def test_nothing_on_a_lesson_screen_is_silent(page):
    """She cannot read. Every block of text has to have a way in.

    The intro is the first thing on the screen and the longest, and was the
    last thing here with no voice.
    """
    state = page.evaluate(r"""() => {
        const silent = [], leaky = [];
        LESSONS.forEach(l => {
            if (!l.introVoice || !l.introVoice.audio) silent.push(l.id + ':intro');
            else if (/(?:^|[^一-鿿])[a-zü]/.test(l.introVoice.say)) {
                leaky.push(l.id + ':intro');
            }
            if (l.rule && !l.rule.audio) silent.push(l.id + ':rule');
        });
        return { silent, leaky };
    }""")
    assert state["silent"] == [], f"still silent: {state['silent']}"
    assert state["leaky"] == [], f"spoken text still holding letters: {state['leaky']}"


def test_tapping_the_intro_reads_it(page):
    page.click("#start-screen .btn-primary")
    result = page.evaluate(r"""async () => {
        viewingLessonId = 'lesson-01';
        navTo('lesson-screen');
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const played = [];
        const orig = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            played.push((this.src || '').split('/').slice(-2).join('/'));
            return Promise.resolve();
        };
        const intro = document.querySelector('#lesson-content .card');
        const height = Math.round(intro.getBoundingClientRect().height);
        intro.click();
        await new Promise(r => setTimeout(r, 60));
        HTMLMediaElement.prototype.play = orig;
        return { played, height };
    }""")
    assert result["played"] == ["intro/lesson-01.mp3"], result["played"]
    assert result["height"] >= 64, f"touch target only {result['height']}px"


def test_the_first_story_is_open_before_anything_is_cleared(page):
    """A new tab full of padlocks is a dead room, and she taps the new icon first."""
    page.click("#start-screen .btn-primary")
    state = page.evaluate(r"""() => ({
        cleared: Object.keys(getLessonState().clearedOn || {}).length,
        open: storiesWithState().filter(r => r.unlocked).map(r => r.story.id),
    })""")
    assert state["cleared"] == 0, "fresh save"
    assert state["open"] == ["story-yonge"], (
        f"咏鹅 should be readable from the start, open: {state['open']}")


def test_the_new_controls_are_big_enough_to_hit(page):
    """64px, or she misses and hits the card behind it."""
    page.click("#start-screen .btn-primary")
    sizes = page.evaluate(r"""async () => {
        viewingLessonId = 'lesson-01';
        navTo('lesson-screen');
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const h = el => Math.round(el.getBoundingClientRect().height);
        const rule = [...document.querySelectorAll('#lesson-content button')]
            .find(b => (b.getAttribute('aria-label') || '').indexOf('读一读规则') === 0);
        return {
            mnemonics: [...document.querySelectorAll('#lesson-content .sound-label')].map(h),
            rule: h(rule),
        };
    }""")
    assert all(x >= 64 for x in sizes["mnemonics"]), sizes["mnemonics"]
    assert sizes["rule"] >= 64, sizes["rule"]


def test_each_tone_mark_has_a_sound_behind_it(page):
    """「一声平，二声扬」 describes a sound. She has to be able to hear one."""
    state = page.evaluate(r"""() => {
        const bad = [];
        LESSONS.forEach(l => {
            if (!l.rule || !l.rule.tones) return;
            const d = l.rule.toneDemo;
            if (!d || d.items.length !== l.rule.tones.length) { bad.push(l.id); return; }
            d.items.forEach((it, n) => {
                if (it.tone !== n + 1 || !it.audio || !it.hanzi) bad.push(l.id + ':' + it.pinyin);
            });
        });
        return { bad, withTones: LESSONS.filter(l => l.rule && l.rule.tones).length };
    }""")
    assert state["withTones"] >= 1
    assert state["bad"] == [], f"tone marks with no example: {state['bad']}"


def test_tapping_a_tone_plays_that_tone_and_all_four_play_in_order(page):
    page.click("#start-screen .btn-primary")
    result = page.evaluate(r"""async () => {
        viewingLessonId = 'lesson-01';
        navTo('lesson-screen');
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const played = [];
        const orig = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            played.push((this.src || '').split('/').pop());
            return Promise.resolve();
        };
        const tick = ms => new Promise(r => setTimeout(r, ms || 60));
        const chips = [...document.querySelectorAll('#lesson-content button')]
            .filter(b => /^[一二三四]声：/.test(b.getAttribute('aria-label') || ''));

        chips[2].click();                      // 三声
        await tick();
        const single = played.slice();
        const heights = chips.map(c => Math.round(c.getBoundingClientRect().height));

        played.length = 0;
        [...document.querySelectorAll('#lesson-content button')]
            .find(b => b.textContent.indexOf('▶ 听一听') === 0).click();
        for (const t of ['ma1', 'ma2', 'ma3', 'ma4']) {
            await tick();
            getAudioEl('audio/syl/' + t + '.mp3').dispatchEvent(new Event('ended'));
            await tick(460);
        }
        HTMLMediaElement.prototype.play = orig;
        return { count: chips.length, single, all: played, heights,
                 labels: chips.map(c => c.getAttribute('aria-label')) };
    }""")
    assert result["count"] == 4, result["count"]
    assert result["single"] == ["ma3.mp3"], f"三声 should play mǎ 马, played {result['single']}"
    assert result["all"] == ["ma1.mp3", "ma2.mp3", "ma3.mp3", "ma4.mp3"], result["all"]
    assert all(h >= 64 for h in result["heights"]), result["heights"]


# ── 词语 ──────────────────────────────────────────────────

def test_word_themes_open_one_per_lesson(page):
    """The tab has to visibly grow, which is the whole point of it."""
    page.click("#start-screen .btn-primary")
    fresh = page.evaluate("() => wordThemesWithState().filter(r => r.unlocked).length")
    assert fresh == 0, "nothing is open before a lesson is cleared"

    opened = page.evaluate(r"""() => {
        const st = getLessonState();
        st.clearedOn = {};
        [1, 2, 3].forEach(n => { st.clearedOn['lesson-0' + n] = getTodayString(); });
        saveLessonState(st);
        return wordThemesWithState().filter(r => r.unlocked).map(r => r.theme.name);
    }""")
    assert opened == ["基础", "数字", "身体"], opened

    shape = page.evaluate(r"""() => ({
        themes: WORD_THEMES.length,
        words: WORDS.length,
        everyThemeMapsToALesson: WORD_THEMES.every(t => !!getLessonById(t.unlockAfter)),
        everyWordHasAudioAndExamples: WORDS.every(
            w => w.audio && w.examples && w.examples.length >= 1),
    })""")
    assert shape["themes"] == 14
    assert shape["words"] > 100
    assert shape["everyThemeMapsToALesson"]
    assert shape["everyWordHasAudioAndExamples"]


def test_a_word_opens_to_examples_with_pinyin_above_them(page):
    """A character alone is a shape; the examples are why the tab exists."""
    page.click("#start-screen .btn-primary")
    result = page.evaluate(r"""async () => {
        const st = getLessonState();
        st.clearedOn = { 'lesson-03': getTodayString() };
        saveLessonState(st);
        viewingThemeId = 'wt-body';
        navTo('word-theme-screen');

        const played = [];
        const orig = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            played.push(decodeURIComponent(this.src || '').split('/').pop());
            return Promise.resolve();
        };
        const tick = () => new Promise(r => setTimeout(r, 70));
        const root = document.getElementById('word-theme-content');
        const head = [...root.querySelectorAll('button[aria-label^="打开"]')]
            .filter(h => h.getAttribute('aria-label') === '打开 手')[0];

        const before = studiedWordCount();
        head.click();
        await tick();
        const card = head.parentElement;
        const openPlayed = played.slice();

        const exs = [...card.querySelectorAll('button[aria-label^="读一读"]')];
        played.length = 0;
        exs[1].click();
        await tick();

        HTMLMediaElement.prototype.play = orig;
        return {
            openPlayed, exPlayed: played.slice(),
            labels: exs.map(b => b.getAttribute('aria-label')),
            heights: exs.map(b => Math.round(b.getBoundingClientRect().height)),
            rubyCount: card.querySelectorAll('ruby').length,
            before, after: studiedWordCount(),
        };
    }""")
    assert result["openPlayed"] == ["手.mp3"], result["openPlayed"]
    assert result["exPlayed"] and result["exPlayed"][0].endswith(".mp3"), result["exPlayed"]
    assert len(result["labels"]) >= 3, result["labels"]
    assert all(h >= 64 for h in result["heights"]), result["heights"]
    assert result["rubyCount"] >= 4, "every word and example carries pinyin above it"
    assert result["after"] == result["before"] + 1, "opening a word counts it as studied"


# ── 故事 ─# ── 故事 ─# ── 故事 ─# ── 故事 ─# ── 故事 ─# ── 故事 ───────────────────────────────────────────────────

def test_stories_load_with_art_and_audio(page):
    counts = page.evaluate(r"""() => ({
        stories: STORIES.length,
        lines: STORIES.reduce((n, s) => n + s.lines.length, 0),
        withArt: STORIES.filter(s => s.art).length,
        everyLineHasAudio: STORIES.every(s => s.lines.every(l => !!l.audio)),
        everyStoryHasWords: STORIES.every(s => s.words && s.words.length >= 3),
    })""")
    assert counts["stories"] == 5
    assert counts["lines"] == 20
    assert counts["withArt"] == 5
    assert counts["everyLineHasAudio"]
    assert counts["everyStoryHasWords"]


def test_a_story_is_locked_until_its_lesson_is_cleared(page):
    """Reading arrives as a reward for finishing a lesson, not before it."""
    page.click("#start-screen .btn-primary")
    # 咏鹅 is free — a new tab must not open as a wall of padlocks. Everything
    # after it is still earned.
    open_now = page.evaluate(
        "() => storiesWithState().filter(r => r.unlocked).map(r => r.story.id)")
    assert open_now == ["story-yonge"], open_now

    page.evaluate("""() => {
        const st = getLessonState();
        st.clearedOn = { 'lesson-04': getTodayString() };
        saveLessonState(st);
    }""")
    after = page.evaluate(r"""() => ({
        open: storiesWithState().filter(r => r.unlocked).map(r => r.story.id),
        first: STORIES[0].id,
    })""")
    assert after["open"] == ["story-yonge", "story-minnong"], after["open"]
    assert after["first"] == "story-yonge", "咏鹅 opens first — it is the poem she already sings in 课1"


def test_reading_a_story_to_the_end_marks_it_read(page):
    page.click("#start-screen .btn-primary")
    page.evaluate("""() => {
        const st = getLessonState();
        st.clearedOn = { 'lesson-04': getTodayString() };
        saveLessonState(st);
        viewingStoryId = 'story-yonge';
        navTo('story-screen');
    }""")

    lines = page.evaluate("() => document.querySelectorAll('#story-content .story-line').length")
    assert lines == 4, f"咏鹅 has four lines, rendered {lines}"

    played = page.evaluate(r"""async () => {
        const played = [];
        const orig = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            played.push((this.src || '').split('/').pop());
            return Promise.resolve();
        };
        const story = getStory('story-yonge');
        [...document.querySelectorAll('#story-content button')]
            .find(b => b.textContent.indexOf('全部') !== -1).click();
        for (const line of story.lines) {
            await new Promise(r => setTimeout(r, 40));
            getAudioEl(line.audio).dispatchEvent(new Event('ended'));
            await new Promise(r => setTimeout(r, 320));
        }
        await new Promise(r => setTimeout(r, 200));
        HTMLMediaElement.prototype.play = orig;
        return played;
    }""")
    assert played == [f"yonge-{i}.mp3" for i in range(1, 5)], played
    assert page.evaluate("() => isStoryRead('story-yonge')"), "finishing should mark it read"


# ── 我会读 ────────────────────────────────────────────────

def test_read_pick_asks_her_to_read_the_tone_mark(page):
    """Distractors are the same syllable in other tones.

    That is the point of the game: bǎ against bā against bà cannot be told
    apart from the letters, only by reading the mark. A distractor from a
    different syllable would let her answer on the consonant alone.
    """
    page.click("#start-screen .btn-primary")
    result = page.evaluate(r"""async () => {
        navTo('game-screen');
        const syl = SYLLABLES.filter(s => s.base === 'ba')[0];   // four tones
        initReadPick(syl, syllablesUpToLesson(3), () => {});
        const area = document.getElementById('game-area');

        const played = [];
        const orig = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            played.push((this.src || '').split('/').pop());
            return Promise.resolve();
        };
        const cards = [...area.querySelectorAll('.sound-card')];
        const clips = [];
        for (const c of cards) {
            played.length = 0;
            c.click();
            await new Promise(r => setTimeout(r, 40));
            clips.push(played[0]);
        }
        HTMLMediaElement.prototype.play = orig;
        return {
            shown: area.querySelector('.card').innerText.replace(/\s+/g, ' ').trim(),
            clips: clips,
            options: cards.length,
        };
    }""")
    assert result["options"] == 3, result["options"]
    # every clip is a reading of the same syllable — she must read the mark
    assert all(c and c.startswith("ba") for c in result["clips"]), result["clips"]
    assert len(set(result["clips"])) == 3, f"clips must differ: {result['clips']}"


def test_read_pick_needs_a_choice_then_a_confirm(page):
    """Listening to all of them before deciding is the activity.

    So tapping an option must not answer the question — otherwise the first
    thing she taps to hear is the answer she gave.
    """
    page.click("#start-screen .btn-primary")
    result = page.evaluate(r"""async () => {
        navTo('game-screen');
        let done = null;
        initReadPick(SYLLABLES.filter(s => s.base === 'ba')[0],
                     syllablesUpToLesson(3), r => { done = r; });
        const area = document.getElementById('game-area');
        const confirm = [...area.querySelectorAll('button')]
            .filter(b => b.textContent === '确定')[0];
        const before = confirm.disabled;

        const cards = [...area.querySelectorAll('.sound-card')];
        cards[0].click();
        await new Promise(r => setTimeout(r, 40));
        const afterListening = { confirmEnabled: !confirm.disabled, answered: done };

        cards[1].click();                     // changing her mind is free
        await new Promise(r => setTimeout(r, 40));
        const afterChanging = done;

        confirm.click();
        await new Promise(r => setTimeout(r, 1800));
        return { before, afterListening, afterChanging, done };
    }""")
    assert result["before"] is True, "确定 starts disabled"
    assert result["afterListening"]["confirmEnabled"] is True
    assert result["afterListening"]["answered"] is None, "listening must not answer"
    assert result["afterChanging"] is None, "changing choice must not answer"
    assert result["done"] is not None and "correct" in result["done"], result["done"]


def test_every_lesson_gets_reading_practice(page):
    counts = page.evaluate(r"""() => LESSONS.map(l => {
        const items = pickTodaysItems('2026-08-29', l);
        const sched = buildSchedule(items, 'x' + l.id);
        return {
            order: l.order,
            len: sched.length,
            read: sched.filter(q => q.type === 'readPick').length,
            ok: sched.filter(q => q.type === 'readPick')
                     .every(q => q.item && q.item.tones && q.item.tones.length),
        };
    })""")
    assert all(c["len"] == 10 for c in counts), [c for c in counts if c["len"] != 10]
    assert all(c["read"] >= 1 for c in counts), [c for c in counts if c["read"] < 1]
    assert all(c["ok"] for c in counts), [c for c in counts if not c["ok"]]


# ── audio ─# ── audio ────────────────────────────────────────────────────────────

def test_audio_does_not_leak_between_lessons(page):
    """A 拼读 sequence cut short must not resume inside a later lesson.

    Audio elements are cached one per file, and 课3's bā blend is
    [b, ā, bā] — so it shares audio/yun/a.mp3 with 课1's letter a. If an
    interrupted sequence leaves its 'ended' handler on that shared element,
    tapping a in 课1 later replays the rest of 课3's sequence, and the child
    hears bā in a lesson that has no 声母 in it at all.
    """
    page.click("#start-screen .btn-primary")
    played = page.evaluate(r"""async () => {
        const played = [];
        const orig = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            played.push((this.src || '').split('/').slice(-3).join('/'));
            return Promise.resolve();
        };
        const tick = () => new Promise(r => setTimeout(r, 30));

        // 课3: start the blend, let "b" finish, then walk away mid-sequence.
        playSequence(['audio/sheng/b.mp3', 'audio/yun/a.mp3', 'audio/syl/ba1.mp3'], null, 0);
        await tick();
        getAudioEl('audio/sheng/b.mp3').dispatchEvent(new Event('ended'));
        await tick();
        stopAudio();
        await tick();

        // 课1: she taps the letter a.
        played.length = 0;
        playAudio('audio/yun/a.mp3');
        await tick();
        getAudioEl('audio/yun/a.mp3').dispatchEvent(new Event('ended'));
        await tick();

        HTMLMediaElement.prototype.play = orig;
        return played;
    }""")
    assert played == ["audio/yun/a.mp3"], (
        f"tapping a in 课1 should play only a, but played {played}")


def test_finishing_a_mission_silences_whatever_was_playing(page):
    """The result screen used to appear over a clip that kept playing.

    stopAudio lived in navTo, but finishing a mission calls showScreen directly,
    so nothing silenced the last question — audio with nothing on screen to
    explain it.
    """
    page.click("#start-screen .btn-primary")
    log = page.evaluate(r"""async () => {
        const log = [];
        const play = HTMLMediaElement.prototype.play;
        const pause = HTMLMediaElement.prototype.pause;
        HTMLMediaElement.prototype.play = function () {
            log.push('play ' + (this.src || '').split('/').pop());
            return Promise.resolve();
        };
        HTMLMediaElement.prototype.pause = function () {
            log.push('pause ' + (this.src || '').split('/').pop());
            return pause.call(this);
        };
        const tick = ms => new Promise(r => setTimeout(r, ms || 80));

        // a clip is playing when the mission ends
        playAudio('audio/rule/lesson-01.mp3');
        await tick();
        showResult({ score: 900, correct: 9, total: 10, answers: [],
                     lesson: getLessonById('lesson-01') });
        await tick();

        // and a 拼读 sequence caught mid-flight must not carry on either
        const mark = log.length;
        playSequence(['audio/sheng/b.mp3', 'audio/yun/a.mp3', 'audio/syl/ba1.mp3'], null, 0);
        await tick(60);
        getAudioEl('audio/sheng/b.mp3').dispatchEvent(new Event('ended'));
        await tick(60);
        showResult({ score: 900, correct: 9, total: 10, answers: [],
                     lesson: getLessonById('lesson-01') });
        await tick(500);

        HTMLMediaElement.prototype.play = play;
        HTMLMediaElement.prototype.pause = pause;
        return { all: log, afterMark: log.slice(mark) };
    }""")
    assert "pause lesson-01.mp3" in log["all"], log["all"]
    assert not any("ba1" in e for e in log["afterMark"]), (
        f"the sequence carried on past the result screen: {log['afterMark']}")


def test_stopping_audio_cancels_a_pending_sequence(page):
    """stopAudio() must kill the gap timer too, not just the current clip."""
    page.click("#start-screen .btn-primary")
    played = page.evaluate(r"""async () => {
        const played = [];
        const orig = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            played.push((this.src || '').split('/').slice(-3).join('/'));
            return Promise.resolve();
        };
        playSequence(['audio/sheng/b.mp3', 'audio/yun/a.mp3', 'audio/syl/ba1.mp3'], null, 40);
        await new Promise(r => setTimeout(r, 20));
        getAudioEl('audio/sheng/b.mp3').dispatchEvent(new Event('ended'));
        stopAudio();                       // during the gap, before "ā" starts
        await new Promise(r => setTimeout(r, 200));
        HTMLMediaElement.prototype.play = orig;
        return played;
    }""")
    assert played == ["audio/sheng/b.mp3"], f"sequence continued after stop: {played}"



def test_finishing_a_mission_silences_the_question(page):
    """Nothing should still be talking over the result screen.

    Finishing calls showScreen directly rather than navTo, so the last
    question's clip — or a 拼读 sequence still mid-flight — used to carry on
    with nothing on screen to explain it.
    """
    page.click("#start-screen .btn-primary")
    log = page.evaluate(r"""async () => {
        const log = [];
        const play = HTMLMediaElement.prototype.play;
        const pause = HTMLMediaElement.prototype.pause;
        HTMLMediaElement.prototype.play = function () {
            log.push('PLAY ' + (this.src || '').split('/').slice(-2).join('/'));
            return Promise.resolve();
        };
        HTMLMediaElement.prototype.pause = function () {
            log.push('PAUSE ' + (this.src || '').split('/').slice(-2).join('/'));
            return pause.call(this);
        };
        const tick = ms => new Promise(r => setTimeout(r, ms || 100));
        const done = () => showResult({ score: 900, correct: 9, total: 10,
                                        answers: [], lesson: getLessonById('lesson-01') });

        playAudio('audio/rule/lesson-01.mp3');
        await tick(80);
        done();
        await tick();
        const single = log.slice();

        // and a blend sequence caught mid-flight
        log.length = 0;
        playSequence(['audio/sheng/b.mp3', 'audio/yun/a.mp3', 'audio/syl/ba1.mp3'], null, 0);
        await tick(60);
        getAudioEl('audio/sheng/b.mp3').dispatchEvent(new Event('ended'));
        await tick(60);
        done();
        await tick(500);          // the third clip would land in here
        const seq = log.slice();

        HTMLMediaElement.prototype.play = play;
        HTMLMediaElement.prototype.pause = pause;
        return { single, seq };
    }""")
    assert "PAUSE rule/lesson-01.mp3" in log["single"], log["single"]
    assert not any("ba1" in e for e in log["seq"]),         f"the rest of the sequence played over the result screen: {log['seq']}"
    assert any(e.startswith("PAUSE") for e in log["seq"]), log["seq"]


def test_every_sound_has_an_audio_file(page):
    missing = page.evaluate(r"""async () => {
        const bad = [];
        for (const s of SOUNDS) {
            const res = await fetch(s.audio, { method: 'HEAD' });
            if (!res.ok) bad.push(s.audio);
        }
        return bad;
    }""")
    assert missing == [], f"missing audio: {missing}"


def test_tone_marks_land_on_the_right_vowel(page):
    """标调规则: 有a不放过，没a找o e，i u 并列标在后."""
    cases = page.evaluate(r"""() => ({
        'gua1': writeTone('gua', 1),
        'hao3': writeTone('hao', 3),
        'liu4': writeTone('liu', 4),
        'gui1': writeTone('gui', 1),
        'xue2': writeTone('xue', 2),
        'zhong1': writeTone('zhong', 1),
    })""")
    assert cases["gua1"] == "guā"      # a wins
    assert cases["hao3"] == "hǎo"      # a wins over o
    assert cases["liu4"] == "liù"      # i u in sequence -> the last one
    assert cases["gui1"] == "guī"      # u i in sequence -> the last one
    assert cases["xue2"] == "xué"      # e when there is no a
    assert cases["zhong1"] == "zhōng"  # o when there is no a


# ── offline ──────────────────────────────────────────────────────────

def test_works_offline_after_one_visit(base_url):
    """The whole point of the service worker: a plane, a car, no wifi.

    Visit once online, then cut the network entirely and reload. The app must
    still boot, still have its data, and still be able to play a sound.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 820, "height": 1180})
        pg = ctx.new_page()
        pg.goto(f"{base_url}/index.html")

        # clients.claim() runs only after the precache loop finishes, so a
        # controller means every file is on the device.
        pg.wait_for_function(
            "() => navigator.serviceWorker && navigator.serviceWorker.controller",
            timeout=180_000,
        )

        ctx.set_offline(True)
        pg.reload()
        pg.wait_for_function("() => typeof SOUNDS !== 'undefined'", timeout=30_000)

        state = pg.evaluate("""async () => {
            const audio = await fetch('audio/syl/e2.mp3');
            const keys = await caches.keys();
            const cache = await caches.open(keys[0]);
            return {
                sounds: SOUNDS.length,
                lessons: LESSONS.length,
                syllables: SYLLABLES.length,
                audioOk: audio.ok,
                audioType: audio.headers.get('content-type'),
                styled: getComputedStyle(document.body).backgroundColor,
                controlled: !!navigator.serviceWorker.controller,
                cacheNames: keys,
                cached: (await cache.keys()).length,
                // proof the bytes came from the cache and not Chromium's
                // HTTP cache: ask the Cache API for them directly.
                fromCache: !!(await caches.match(new URL('audio/syl/e2.mp3', location.href).href)),
            };
        }""")

        assert state["sounds"] == 63, "sound data must survive offline"
        assert state["lessons"] == 14
        assert state["syllables"] > 200
        assert state["audioOk"], "speech has to play with no network"
        assert state["audioType"] == "audio/mpeg"
        assert state["styled"] != "rgba(0, 0, 0, 0)", "stylesheet must be cached too"

        # 家长 must be able to say which copy this device is running. Offline
        # caching means the device keeps serving what it has, so without this
        # there is no way to tell whether a fix has landed.
        version = pg.evaluate(r"""async () => {
            navTo('parent-screen');
            await new Promise(r => setTimeout(r, 300));
            const card = [...document.querySelectorAll('#parent-content .card')]
                .find(c => c.textContent.indexOf('版本') === 0);
            return card ? card.innerText.replace(/\s+/g, ' ').trim() : null;
        }""")
        assert version and "离线版本" in version, version
        keys = pg.evaluate("async () => (await caches.keys())[0]")
        assert keys.replace("pinyin-", "") in version, (version, keys)
        # Without these the test would also pass on Chromium's own HTTP cache,
        # which is evicted at will and would strand the child mid-flight.
        assert state["controlled"], "the reload must be served by the service worker"
        assert state["fromCache"], "audio must come from the Cache API"
        assert len(state["cacheNames"]) == 1, f"one versioned cache, got {state['cacheNames']}"
        assert state["cached"] > 600, f"expected the whole app precached, got {state['cached']}"

        browser.close()
