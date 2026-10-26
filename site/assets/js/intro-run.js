// Runs the first-visit intro when the head script has set html.intro, then hands off to the title screen.
const MODIFIERS = new Set(['Tab', 'Shift', 'Control', 'Alt', 'Meta']);
const HANDOFF_MS = 400;
const BUDGET_MS = 3000; // from navigation start until the intro is ready

export function runIntro(doc) {
  const html = doc.documentElement, win = doc.defaultView;
  if (!html.classList.contains('intro')) return Promise.resolve('none');

  const layer = doc.getElementById('intro');
  const mount = layer.querySelector('.intro-stage');
  const skipBtn = layer.querySelector('[data-skip]');
  const soundBtn = layer.querySelector('[data-sound]');
  const labels = html.lang === 'en' ? ['Sound on', 'Sound off'] : ['소리 켜기', '소리 끄기'];
  const ac = new AbortController();
  let controller = null, ready = false, wantSound = false, settled = false, resolve;
  const outcome = new Promise((r) => { resolve = r; });

  const onInput = (e) => {
    if (e.type === 'keydown' && MODIFIERS.has(e.key)) return;
    if (e.target?.closest?.('[data-sound]')) return;
    skip();
  };
  const onSound = () => {
    const on = soundBtn.getAttribute('aria-pressed') !== 'true';
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.textContent = labels[on ? 1 : 0];
    if (ready) controller.setSound(on);
    else wantSound = on;
  };
  const onPageShow = (e) => { if (e.persisted && html.classList.contains('intro')) fallback(); };
  const types = ['pointerdown', 'wheel', 'touchmove', 'keydown'];
  types.forEach((t) => win.addEventListener(t, onInput, { passive: t !== 'keydown' }));
  skipBtn.addEventListener('click', skip);
  soundBtn.addEventListener('click', onSound);
  win.addEventListener('pageshow', onPageShow);
  const budget = win.setTimeout(() => ac.abort(), Math.max(0, BUDGET_MS - win.performance.now()));

  function cleanup() {
    types.forEach((t) => win.removeEventListener(t, onInput));
    skipBtn.removeEventListener('click', skip);
    soundBtn.removeEventListener('click', onSound);
    win.removeEventListener('pageshow', onPageShow);
    win.clearTimeout(budget);
  }
  function skip() {
    if (settled) return;
    if (!ready) fallback();
    else controller.skip();
  }
  function fallback() {
    if (settled) return;
    settled = true;
    ac.abort();
    cleanup();
    controller?.destroy();
    html.classList.remove('intro', 'intro-handoff');
    resolve('fallback');
  }
  function handoff(skipped) {
    if (settled) return;
    settled = true;
    cleanup();
    const hadFocus = layer.contains(doc.activeElement);
    html.classList.add('intro-handoff');
    win.setTimeout(() => {
      html.classList.remove('intro', 'intro-handoff');
      win.scrollTo(0, 0);
      if (hadFocus) doc.querySelector('a[data-menu]')?.focus();
      controller.destroy();
      resolve(skipped ? 'skipped' : 'played');
    }, HANDOFF_MS);
  }

  (async () => {
    try {
      const { playIntro } = await import('./intro/intro.js');
      if (settled || ac.signal.aborted) return fallback();
      controller = playIntro({ mount, signal: ac.signal });
      await controller.ready;
    } catch {
      return fallback();
    }
    if (settled) return;
    ready = true;
    win.clearTimeout(win.__koIntroFailsafe);
    win.clearTimeout(budget);
    skipBtn.focus();
    if (wantSound) controller.setSound(true);
    controller.done.then(({ skipped }) => handoff(skipped));
  })();

  return outcome;
}
