import { test, assert, assertEq, assertClose, openPage, openHtml, wait, waitFor } from './harness.js';

const SIZES = [[360, 780], [390, 844], [768, 1024], [844, 390], [1280, 800], [1920, 1080], [2560, 1080]];
const ROOM = { feelsogut: 'rgb(13, 14, 56)', otr: 'rgb(11, 16, 25)' };

// Computed colours come back as rgb(), or as color(srgb r g b) for color-mix().
function rgb(str) {
  const m = str.match(/^rgba?\(([^)]+)\)/);
  if (m) return m[1].split(/[ ,]+/).slice(0, 3).map(Number);
  const c = str.match(/^color\(srgb ([^)]+)\)/);
  if (c) return c[1].split(' ').slice(0, 3).map((v) => Number(v) * 255);
  throw new Error(`unparsed colour ${str}`);
}

function contrast(a, b) {
  const lum = (c) => {
    const [r, g, bl] = c.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('figures step out of the plate in register, clear of the logline', async () => {
  for (const page of ['/?nointro&reducemotion', '/en/?nointro&reducemotion']) {
    for (const [w, h] of SIZES) {
      const { win, doc, close } = await openPage(page, { width: w, height: h });
      await doc.fonts.ready;
      const room = doc.getElementById('game-feelsogut');
      const popEl = room.querySelector('.plate-pop');
      await waitFor(() => win.getComputedStyle(popEl).transform === 'none', 3000);
      const frame = room.querySelector('.plate-frame').getBoundingClientRect();
      const pop = popEl.getBoundingClientRect();
      const fig = popEl.querySelector('img').getBoundingClientRect();
      const logline = room.querySelector('.logline').getBoundingClientRect();
      const at = `${page} ${w}x${h}`;
      assertClose(pop.left, frame.left, 1, `${at} left`);
      assertClose(pop.right, frame.right, 1, `${at} right`);
      assertClose(pop.bottom, frame.bottom, 1, `${at} bottom`);
      assertClose(pop.height, pop.width * 9 / 16, 1, `${at} 16:9`);
      assert(fig.top < frame.top, `${at}: the figures stay inside the frame`);
      assert(fig.top - logline.bottom >= 21, `${at}: figures ${Math.round(fig.top - logline.bottom)}px from the logline`);
      close();
    }
  }
}, { timeout: 90000 });

test('Hangul labels carry no tracking; tracked Latin labels stay centred', async () => {
  const ko = await openPage('/?nointro', { width: 1280, height: 800 });
  for (const el of ko.doc.querySelectorAll('.tile-stage, .next-label')) {
    const cs = ko.win.getComputedStyle(el);
    assert(['normal', '0px'].includes(cs.letterSpacing), `ko .${el.className} tracking ${cs.letterSpacing}`);
    assertEq(cs.marginRight, '0px', `ko .${el.className} margin-right`);
  }
  ko.close();
  const en = await openPage('/en/?nointro', { width: 1280, height: 800 });
  for (const el of en.doc.querySelectorAll('.tile-stage, .next-label')) {
    const cs = en.win.getComputedStyle(el);
    assertEq(cs.letterSpacing, '2.88px', `en .${el.className} tracking`);
    assertEq(cs.marginRight, '-2.88px', `en .${el.className} margin-right`);
  }
  en.close();
});

test('status tags read at 4.5:1 or better in the lit rooms', async () => {
  const { win, doc, close } = await openPage('/?nointro&reducemotion', { width: 1280, height: 800 });
  for (const [game, bg] of Object.entries(ROOM)) {
    const room = doc.querySelector(`.game[data-game="${game}"]`);
    await waitFor(() => win.getComputedStyle(room).backgroundColor === bg, 3000);
    const ratio = contrast(rgb(win.getComputedStyle(room.querySelector('.tags .stage')).color), rgb(bg));
    assert(ratio >= 4.5, `${game} stage tag ${ratio.toFixed(2)}:1`);
  }
  close();
}, { timeout: 8000 });

test('loading the page starts no lighting transitions', async () => {
  const { doc, close } = await openPage('/?nointro', { width: 1280, height: 800 });
  const running = doc.getAnimations().filter((a) => a.effect?.target?.closest?.('.game'));
  assertEq(running.length, 0, 'room transitions running at load');
  close();
});

test('a room lights when its title card arrives, only that room, and stays lit', async () => {
  const { win, doc, close } = await openPage('/?nointro', { width: 1280, height: 800 });
  const fsg = doc.getElementById('game-feelsogut');
  const otr = doc.getElementById('game-otr');
  for (const room of [fsg, otr]) {
    assert(!room.classList.contains('is-lit'), `#${room.id} lit before arriving`);
    assertEq(win.getComputedStyle(room).backgroundColor, 'rgb(11, 11, 12)', `#${room.id} starts dark`);
  }
  // The room's top edge is in view but its card is still below the fold: not yet.
  win.scrollTo({ top: fsg.offsetTop - win.innerHeight * 0.88 + 60, behavior: 'instant' });
  await wait(300);
  assert(!fsg.classList.contains('is-lit'), 'lit before the card arrived');
  fsg.querySelector('.title-card').scrollIntoView({ block: 'center', behavior: 'instant' });
  await waitFor(() => fsg.classList.contains('is-lit'), 2000);
  assert(!otr.classList.contains('is-lit'), 'the next room lit early');
  await waitFor(() => win.getComputedStyle(fsg).backgroundColor === ROOM.feelsogut, 3500);
  win.scrollTo({ top: 0, behavior: 'instant' });
  await wait(300);
  assert(fsg.classList.contains('is-lit'), 'the room went dark again');
  close();
}, { timeout: 10000 });

test('landing inside a room below its title card lights it', async () => {
  const { doc, close } = await openPage('/?nointro', { width: 1280, height: 800 });
  doc.querySelector('#game-otr .next').scrollIntoView({ block: 'center', behavior: 'instant' });
  await waitFor(() => doc.getElementById('game-otr').classList.contains('is-lit'), 2000);
  close();
}, { timeout: 6000 });

test('a jump past the title card lights the room, wherever near its edge it starts', async () => {
  // Steps smaller than the room's top padding: one of them starts with the room's edge in view
  // and its card still below the fold, wherever the fold falls in this test frame.
  for (const y of [100, 200, 300, 400, 500, 600, 700]) {
    const { win, doc, close } = await openPage('/?nointro', { width: 1280, height: 800 });
    const fsg = doc.getElementById('game-feelsogut');
    win.scrollTo({ top: fsg.offsetTop - y, behavior: 'instant' });
    await wait(200);
    fsg.querySelector('.game-body').scrollIntoView({ block: 'start', behavior: 'instant' });
    await waitFor(() => fsg.classList.contains('is-lit'), 1500).catch(() => assert(false, `room dark after a jump from y=${y}`));
    close();
  }
}, { timeout: 30000 });

test('reduced motion, or no IntersectionObserver: every room and plate lit at load', async () => {
  const a = await openPage('/?nointro&reducemotion', { width: 1280, height: 800 });
  for (const el of a.doc.querySelectorAll('.game, [data-drift]')) assert(el.classList.contains('is-lit'), `reducemotion: ${el.id || el.className}`);
  a.close();
  // header.js throws without IntersectionObserver, so main.js stops there; the rooms must be lit anyway.
  const html = (await (await fetch('/')).text())
    .replace('<head>', "<head><script>sessionStorage.setItem('ko:intro','1');delete window.IntersectionObserver;</script>");
  const b = await openHtml(html, { width: 1280, height: 800 });
  assert(b.doc.documentElement.classList.contains('js'), 'main.js did not run');
  for (const el of b.doc.querySelectorAll('.game, [data-drift]')) assert(el.classList.contains('is-lit'), `no IO: ${el.id || el.className}`);
  b.close();
}, { timeout: 8000 });

test('title card lines arrive one after another', async () => {
  const { win, doc, close } = await openPage('/?nointro&reducemotion', { width: 1280, height: 800 });
  const delays = (id) => JSON.stringify([...doc.querySelectorAll(`#${id} .title-card > *`)].map((el) => parseFloat(win.getComputedStyle(el).transitionDelay)));
  assertEq(delays('game-feelsogut'), '[0,0.12,0.24,0.36]');
  assertEq(delays('game-otr'), '[0,0.12,0.24,0.36,0.48]');
  close();
});

test('a deep link lights the room it lands in', async () => {
  const { doc, close } = await openPage('/#game-otr', { width: 1280, height: 800 });
  await waitFor(() => doc.getElementById('game-otr').classList.contains('is-lit'), 3000);
  close();
}, { timeout: 6000 });

test('plates sit pushed in until they arrive', async () => {
  const { win, doc, close } = await openPage('/?nointro', { width: 1280, height: 800 });
  const plate = doc.querySelector('#game-otr .plate');
  assert(!plate.classList.contains('is-lit'), 'plate lit early');
  assertEq(win.getComputedStyle(plate.querySelector('.plate-img')).transform, 'matrix(1.045, 0, 0, 1.045, 0, 0)', 'plate not pushed in');
  plate.scrollIntoView({ block: 'center', behavior: 'instant' });
  await waitFor(() => plate.classList.contains('is-lit'), 2000);
  close();
}, { timeout: 6000 });

test('selection band rests on GAMES, follows focus, pointer and width changes, and comes back', async () => {
  const { win, doc, close } = await openPage('/?nointro', { width: 1280, height: 800 });
  await doc.fonts.ready;
  win.focus();
  const nav = doc.querySelector('.title-menu');
  const [games, studio, contact] = nav.querySelectorAll('a[data-menu]');
  const band = () => `${nav.style.getPropertyValue('--band-x')} ${nav.style.getPropertyValue('--band-w')}`;
  const on = (a) => `${a.offsetLeft}px ${a.offsetWidth}px`;
  assert(nav.classList.contains('has-band'), 'band not switched on');
  await waitFor(() => win.getComputedStyle(nav, '::after').opacity === '1', 1000);
  await waitFor(() => band() === on(games), 500);
  const before = on(games);
  games.style.letterSpacing = '.5em';  // stands in for a web font arriving late
  assert(on(games) !== before, 'link width did not change');
  await waitFor(() => band() === on(games), 500);
  games.style.letterSpacing = '';
  await waitFor(() => band() === on(games), 500);
  studio.focus();
  assertEq(band(), on(studio), 'focus');
  studio.blur();
  await waitFor(() => band() === on(games), 500);
  contact.dispatchEvent(new win.PointerEvent('pointerover', { bubbles: true }));
  assertEq(band(), on(contact), 'pointer');
  nav.dispatchEvent(new win.PointerEvent('pointerleave'));
  assertEq(band(), on(games), 'pointer left');
  close();
});
