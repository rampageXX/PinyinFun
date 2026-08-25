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
    counts = page.evaluate("""() => ({
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
    leaks = page.evaluate("""() => {
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
    bad = page.evaluate("""() => {
        const order = {};
        SOUNDS.forEach(s => { if (!(s.text in order)) order[s.text] = lessonOrderOf(s); });
        return SYLLABLES.filter(sy => {
            const n = parseInt(sy.lesson.slice(-2), 10);
            return order[sy.shengmu] > n || order[sy.yunmu] > n;
        }).map(sy => sy.id);
    }""")
    assert bad == [], f"syllables taught before their parts: {bad}"


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
            const btns = [...area.querySelectorAll('button')]
                .filter(b => !b.disabled && !b.classList.contains('speaker'));
            if (btns.length) btns[0].click();
        }""")
        page.wait_for_timeout(250)
    return False


def test_mission_completes_and_records_progress(page):
    page.click("#start-screen .btn-primary")
    assert run_mission(page), "mission never reached the result screen"

    state = page.evaluate("""() => {
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


def test_mastering_a_lesson_unlocks_the_next_and_awards_a_sticker(page):
    page.click("#start-screen .btn-primary")
    # Answer lesson 1's sounds correctly enough times to pass the mastery gate.
    page.evaluate("""() => {
        const lesson = getLessonById('lesson-01');
        lesson.sounds.forEach(id => {
            for (let i = 0; i < 3; i++) updateStrength(id, true);
        });
        checkProgress();
        awardStickers();
    }""")
    after = page.evaluate("""() => ({
        mastered: getLessonState().masteredLessons,
        current: getLessonState().currentLessonId,
        unlocked: LESSONS.filter(isLessonUnlocked).map(l => l.id),
        stickers: getEarnedStickers(),
    })""")
    assert "lesson-01" in after["mastered"]
    assert after["current"] == "lesson-02"
    assert "lesson-02" in after["unlocked"]
    assert "st-01" in after["stickers"], "finishing a lesson should award its sticker"


# ── audio ────────────────────────────────────────────────────────────

def test_every_sound_has_an_audio_file(page):
    missing = page.evaluate("""async () => {
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
    cases = page.evaluate("""() => ({
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
        # Without these the test would also pass on Chromium's own HTTP cache,
        # which is evicted at will and would strand the child mid-flight.
        assert state["controlled"], "the reload must be served by the service worker"
        assert state["fromCache"], "audio must come from the Cache API"
        assert len(state["cacheNames"]) == 1, f"one versioned cache, got {state['cacheNames']}"
        assert state["cached"] > 600, f"expected the whole app precached, got {state['cached']}"

        browser.close()
