import { test, assert, assertEq, assertClose, wait } from './harness.js';
import { T_LOGO, playIntro, renderFrame } from '/assets/js/intro/intro.js';

const mount = document.getElementById('mount');

test('T_LOGO matches splash poster frame', () => assertClose(T_LOGO, 10.27, 0.01));

test('abort before ready leaves nothing', async () => {
  const ac = new AbortController();
  const c = playIntro({ mount, signal: ac.signal });
  ac.abort();
  let err;
  try { await c.ready; } catch (e) { err = e; }
  assertEq(err?.name, 'AbortError');
  assertEq(mount.querySelector('canvas'), null);
});

test('clock runs without audio', async () => {
  const c = playIntro({ mount });
  await c.ready;
  await wait(1000);
  assert(c.getTime() > 0.8, `t=${c.getTime()}`);
  c.destroy();
}, { timeout: 15000 });

test('skip resolves done and keeps last frame', async () => {
  const c = playIntro({ mount });
  await c.ready;
  c.skip();
  assertEq((await c.done).skipped, true);
  assert(mount.querySelector('canvas'), 'canvas removed too early');
  c.destroy();
  assertEq(mount.querySelector('canvas'), null);
}, { timeout: 15000 });

test('plays through to T_LOGO', async () => {
  const c = playIntro({ mount });
  await c.ready;
  assertEq((await c.done).skipped, false);
  assertClose(c.getTime(), T_LOGO, 0.05);
  c.destroy();
}, { timeout: 30000 });

test('resize mid-intro updates buffer', async () => {
  const c = playIntro({ mount });
  await c.ready;
  mount.style.width = '390px';
  mount.style.height = '844px';
  await wait(400);
  const cv = mount.querySelector('canvas');
  assert(cv.height > cv.width, `${cv.width}x${cv.height}`);
  mount.style.width = '1280px';
  mount.style.height = '720px';
  c.destroy();
}, { timeout: 15000 });

test('audio interruption does not freeze the intro', async () => {
  const Real = window.AudioContext;
  let state = 'running', freeze = false, frozen = null;
  // A real context that we can "interrupt": its state flips and its clock stops, as on iOS during a call.
  window.AudioContext = class extends Real {
    get state() { return state; }
    get currentTime() {
      if (!freeze) return super.currentTime;
      frozen ??= super.currentTime;
      return frozen;
    }
    resume() { return Promise.resolve(); }
  };
  try {
    const c = playIntro({ mount });
    await c.ready;
    await c.setSound(true);
    await wait(300);
    freeze = true;
    state = 'interrupted';
    await wait(200);
    const t1 = c.getTime();
    await wait(1000);
    assert(c.getTime() - t1 > 0.5, `clock stuck at ${t1}`);
    c.destroy();
  } finally {
    window.AudioContext = Real;
  }
}, { timeout: 15000 });

test('renderFrame draws the logo', async () => {
  const cv = await renderFrame({ width: 640, height: 360 });
  const c2 = Object.assign(document.createElement('canvas'), { width: 640, height: 360 });
  const g = c2.getContext('2d');
  g.drawImage(cv, 0, 0);
  // O ring: centre (1087, 516) and radii 50–84px at 1920x1080 -> centre (362, 172), radius ~22px at 640x360
  const [r] = g.getImageData(362 + 22, 172, 1, 1).data;
  assert(r > 150, `O ring pixel r=${r}`);
}, { timeout: 30000 });
