import { test, assert, assertEq, openPage, openHtml, wait, waitFor } from './harness.js';

const SIZES = [[360, 780], [390, 844], [768, 1024], [844, 390], [1280, 800], [1366, 657], [1536, 730], [1920, 969], [1920, 1080], [2560, 1080]];
const kb = (n) => Math.round(n / 1024);

test('no horizontal overflow at any size', async () => {
  for (const page of ['/?nointro', '/en/?nointro']) {
    for (const [w, h] of SIZES) {
      const { doc, close } = await openPage(page, { width: w, height: h });
      await doc.fonts.ready;
      const over = doc.documentElement.scrollWidth - doc.documentElement.clientWidth;
      assert(over <= 0, `${page} ${w}x${h}: ${over}px horizontal overflow`);
      close();
    }
  }
}, { timeout: 60000 });

test('first visit: same-origin only, no failed requests, budgets', async () => {
  sessionStorage.clear();
  const errors = [];
  const { win, doc } = await openPage('/', { width: 1280, height: 800 });
  win.addEventListener('error', (e) => errors.push(e.message || e.target?.src));
  await waitFor(() => !doc.documentElement.classList.contains('intro'), 16000);
  await wait(500);
  const entries = win.performance.getEntriesByType('resource');
  const nav = win.performance.getEntriesByType('navigation')[0];
  for (const e of entries) {
    assert(e.name.startsWith(win.location.origin), `external request: ${e.name}`);
    if ('responseStatus' in e && e.responseStatus) assert(e.responseStatus < 400, `${e.responseStatus} ${e.name}`);
  }
  const size = (e) => e.encodedBodySize || e.transferSize || 0;
  const isIntro = (n) => /\/intro\/|three-r160/.test(n);
  const first = entries.filter((e) => /\.(css|js)$/.test(new URL(e.name).pathname) && !isIntro(e.name) || /hero-1920\.webp$/.test(e.name));
  const firstBytes = size(nav) + first.reduce((s, e) => s + size(e), 0);
  const fontBytes = entries.filter((e) => e.name.endsWith('.woff2')).reduce((s, e) => s + size(e), 0);
  const introBytes = entries.filter((e) => isIntro(e.name)).reduce((s, e) => s + size(e), 0);
  assert(firstBytes <= 400 * 1024, `first screen ${kb(firstBytes)}KB`);
  assert(introBytes > 0 && introBytes <= 800 * 1024, `intro ${kb(introBytes)}KB (uncompressed)`);
  assert(fontBytes <= 600 * 1024, `fonts for the whole page ${kb(fontBytes)}KB`);
  assertEq(errors.join(' | '), '');
  console.log(`first=${kb(firstBytes)}KB fonts=${kb(fontBytes)}KB intro=${kb(introBytes)}KB`);
}, { timeout: 25000 });

test('Korean names never split across lines (EN page, phone widths)', async () => {
  for (const w of [360, 375, 390, 414]) {
  const { win, doc, close } = await openPage('/en/?nointro', { width: w, height: 780 });
  await doc.fonts.ready;
  for (const p of doc.querySelectorAll('.credit, .game-kr')) {
    assertEq(win.getComputedStyle(p).wordBreak, 'keep-all', `${w}px .${p.className} word-break`);
    for (const name of ['고유준', '이유진', '권유담', '필소굿', '오프 더 레코드']) {
      const walker = doc.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      let node = null;
      while (walker.nextNode()) if (walker.currentNode.data.includes(name)) { node = walker.currentNode; break; }
      if (!node) continue;
      const range = doc.createRange();
      const i = node.data.indexOf(name);
      range.setStart(node, i);
      range.setEnd(node, i + name.length);
      const lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
      assert(lines.size === 1, `${w}px: "${name}" split over ${lines.size} lines`);
    }
  }
  close();
  }
}, { timeout: 15000 });

test('Korean page keeps words whole everywhere', async () => {
  const { win, doc, close } = await openPage('/?nointro', { width: 360, height: 780 });
  for (const sel of ['.site-footer span', '.tile-stage', '.desc', '.studio-text p', '.contact-note']) {
    assertEq(win.getComputedStyle(doc.querySelector(sel)).wordBreak, 'keep-all', sel);
  }
  close();
});

test('JavaScript off: all content visible, no intro layer', async () => {
  for (const page of ['/', '/en/']) {
    const html = (await (await fetch(page)).text()).replace(/<script[\s\S]*?<\/script>/g, '');
    const { win, doc, close } = await openHtml(html, { width: 390, height: 844 });
    assert(!doc.documentElement.classList.contains('intro'), `${page}: intro class without JS`);
    assertEq(win.getComputedStyle(doc.getElementById('intro')).display, 'none');
    for (const id of ['top', 'games', 'game-feelsogut', 'game-otr', 'studio', 'contact']) {
      const el = doc.getElementById(id);
      assert(el && win.getComputedStyle(el).visibility === 'visible' && el.getBoundingClientRect().height > 0, `${page}: #${id} hidden`);
    }
    assert(doc.querySelector('#contact a[href="mailto:ko@kostudio.org"]'), `${page}: mail link missing`);
    close();
  }
}, { timeout: 15000 });
