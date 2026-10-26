// Tiny in-browser test runner. Open /__tests__/<suite>.html; the title becomes PASS or FAIL.
const tests = [];

export function test(name, fn, { timeout = 5000 } = {}) {
  tests.push({ name, fn, timeout });
}

export function assert(cond, msg = 'assertion failed') {
  if (!cond) throw new Error(msg);
}

export function assertEq(actual, expected, msg = '') {
  if (actual !== expected) throw new Error(`${msg} expected ${fmt(expected)}, got ${fmt(actual)}`.trim());
}

export function assertClose(a, b, eps, msg = '') {
  if (!(Math.abs(a - b) <= eps)) throw new Error(`${msg} expected ${b}±${eps}, got ${a}`.trim());
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function waitFor(predicate, timeout = 2000) {
  const end = performance.now() + timeout;
  for (;;) {
    let value;
    try { value = predicate(); } catch { value = false; }
    if (value) return value;
    if (performance.now() > end) throw new Error(`waitFor timed out after ${timeout}ms`);
    await wait(25);
  }
}

function frameBox() {
  let box = document.getElementById('frames');
  if (!box) {
    box = Object.assign(document.createElement('div'), { id: 'frames' });
    document.body.append(box);
  }
  return box;
}

function load(setup, { width = 1280, height = 800 } = {}) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:${height}px;border:0;display:block`;
  return new Promise((resolve) => {
    frame.addEventListener('load', () => resolve({
      frame, win: frame.contentWindow, doc: frame.contentDocument, close: () => frame.remove(),
    }), { once: true });
    setup(frame);
    frameBox().append(frame);
  });
}

export const openPage = (url, size) => load((f) => { f.src = url; }, size);
export const openHtml = (html, size) => load((f) => { f.srcdoc = html; }, size);

export async function run() {
  const out = document.getElementById('results') || document.body.appendChild(Object.assign(document.createElement('pre'), { id: 'results' }));
  let passed = 0;
  for (const t of tests) {
    let timer;
    try {
      await Promise.race([
        Promise.resolve().then(t.fn),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`timed out after ${t.timeout}ms`)), t.timeout); }),
      ]);
      passed++;
      out.textContent += `PASS ${t.name}\n`;
    } catch (e) {
      out.textContent += `FAIL ${t.name}: ${e?.message ?? e}\n`;
    } finally {
      clearTimeout(timer);
      document.querySelectorAll('#frames iframe').forEach((f) => f.remove());
    }
  }
  const ok = passed === tests.length;
  out.textContent += `RESULT: ${ok ? 'PASS' : 'FAIL'} ${ok ? passed : tests.length - passed}/${tests.length}\n`;
  document.title = ok ? 'PASS' : 'FAIL';
}

function fmt(v) {
  if (v instanceof Element) return `<${v.tagName.toLowerCase()}${v.id ? '#' + v.id : ''}>`;
  try { return JSON.stringify(v); } catch { return String(v); }
}
