import { test, assert, assertEq, openPage, openHtml, wait, waitFor } from './harness.js';

const fresh = () => sessionStorage.clear();
const intro = (doc) => doc.documentElement.classList.contains('intro');
const readyToSkip = (doc) => waitFor(() => doc.activeElement?.matches('[data-skip]'), 4000);

test('first visit plays, menu focused after skip', async () => {
  fresh();
  const { win, doc } = await openPage('/', { width: 1280, height: 720 });
  assert(intro(doc), 'intro not started');
  assertEq(win.getComputedStyle(doc.querySelector('main')).visibility, 'hidden');
  await readyToSkip(doc);
  doc.querySelector('[data-skip]').click();
  await waitFor(() => !intro(doc), 2000);
  assertEq(doc.activeElement, doc.querySelector('a[data-menu]'));
}, { timeout: 10000 });

test('reload does not replay; ?intro does', async () => {
  fresh();
  let p = await openPage('/');
  p.close();
  p = await openPage('/');
  assert(!intro(p.doc), 'replayed on reload');
  p.close();
  p = await openPage('/?intro');
  assert(intro(p.doc), '?intro did not replay');
}, { timeout: 10000 });

test('ko then en in same session does not replay', async () => {
  fresh();
  let p = await openPage('/');
  p.close();
  p = await openPage('/en/');
  assert(!intro(p.doc), 'replayed on /en/');
});

test('hash, nowebgl, reducemotion skip intro', async () => {
  for (const u of ['/#contact', '/?nowebgl', '/?reducemotion']) {
    fresh();
    const p = await openPage(u);
    assert(!intro(p.doc), u);
    p.close();
  }
  fresh();
  const p = await openPage('/?reducemotion&intro');
  assert(!intro(p.doc), 'reduced motion overridden');
  assertEq(p.win.getComputedStyle(p.doc.querySelector('.replay-intro')).display, 'none');
}, { timeout: 10000 });

test('sound button by keyboard does not skip', async () => {
  fresh();
  const { doc } = await openPage('/');
  await readyToSkip(doc);
  const b = doc.querySelector('[data-sound]');
  b.focus();
  b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  b.click();
  await wait(400);
  assert(intro(doc), 'intro skipped');
  assertEq(b.getAttribute('aria-pressed'), 'true');
  assertEq(b.textContent, '소리 끄기');
}, { timeout: 10000 });

test('wheel and any key skip', async () => {
  for (const make of [() => new WheelEvent('wheel', { bubbles: true }), () => new KeyboardEvent('keydown', { key: 'a', bubbles: true })]) {
    fresh();
    const { doc, close } = await openPage('/');
    await readyToSkip(doc);
    doc.dispatchEvent(make());
    await waitFor(() => !intro(doc), 2000);
    close();
  }
}, { timeout: 15000 });

test('failsafe frees page when main.js never runs', async () => {
  fresh();
  const html = (await (await fetch('/')).text()).replace(/<script type="module"[^>]*><\/script>/, '');
  const { doc } = await openHtml(html);
  assert(intro(doc), 'intro class not set');
  await waitFor(() => !intro(doc), 5000);
}, { timeout: 7000 });

test('bfcache restore mid-intro shows hero', async () => {
  fresh();
  const { doc, win } = await openPage('/');
  await readyToSkip(doc);
  win.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  await waitFor(() => !intro(doc), 1000);
}, { timeout: 8000 });

test('plays to the end and hands off', async () => {
  fresh();
  const { doc, win } = await openPage('/', { width: 390, height: 844 });
  let frames = 0;
  const errors = [];
  win.addEventListener('error', (e) => errors.push(e.message));
  win.addEventListener('unhandledrejection', (e) => errors.push(String(e.reason?.stack || e.reason)));
  win.document.addEventListener('webglcontextlost', () => errors.push('contextlost'), true);
  const tick = () => { frames++; win.requestAnimationFrame(tick); };
  win.requestAnimationFrame(tick);
  try {
    await waitFor(() => !intro(doc), 15000);
  } catch (e) {
    throw new Error(`${e.message}; class="${doc.documentElement.className}" canvas=${!!doc.querySelector('.intro-stage canvas')} frames=${frames} focus=${doc.activeElement?.tagName} errors=${errors.join(' | ')}`);
  }
  assertEq(doc.querySelector('.intro-stage canvas'), null);
}, { timeout: 16000 });
