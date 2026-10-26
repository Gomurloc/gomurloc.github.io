import { test, assert, openPage } from './harness.js';

const SIZES = [[360, 780], [390, 844], [844, 390], [1280, 800], [1366, 657], [1536, 730], [1920, 969], [1920, 1080], [2560, 1080]];

test('menu sits below studio label at every size', async () => {
  for (const [w, h] of SIZES) {
    const { doc, close } = await openPage('/?nointro', { width: w, height: h });
    const frameH = Math.max(h, w * 9 / 16), labelBottom = h / 2 + 0.1356 * frameH;
    const m = doc.querySelector('.title-menu').getBoundingClientRect();
    assert(m.top >= labelBottom + 8, `${w}x${h}: menu ${m.top} label ${labelBottom}`);
    assert(m.bottom <= h - 8, `${w}x${h}: menu off screen (${m.bottom})`);
    assert(m.right <= w && m.left >= 0, `${w}x${h}: menu wraps out`);
    close();
  }
}, { timeout: 30000 });

function toPixels(source, w, h, draw) {
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const g = c.getContext('2d');
  draw(g, source);
  return g.getImageData(0, 0, w, h).data;
}
const coverDraw = (w, h) => (g, img) => {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  g.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
};
// Mean luminance difference over the pixels that are lit in either image (letters, dot, label, floor
// under the lamp). The dark background would otherwise hide any mismatch in the logo itself.
function meanAbsDiff(a, b) {
  let sum = 0, n = 0;
  for (let i = 0; i < a.length; i += 4) {
    const la = 0.2126 * a[i] + 0.7152 * a[i + 1] + 0.0722 * a[i + 2];
    const lb = 0.2126 * b[i] + 0.7152 * b[i + 1] + 0.0722 * b[i + 2];
    if (Math.max(la, lb) <= 40) continue;
    sum += Math.abs(la - lb); n++;
  }
  return n ? sum / n : 0;
}

test('live frame matches hero still (landscape and portrait)', async () => {
  const { renderFrame } = await import('/assets/js/intro/intro.js');
  const img = new Image();
  img.src = '/assets/img/hero-1920.webp';
  await img.decode();
  for (const [w, h] of [[640, 360], [390, 844]]) {
    const live = await renderFrame({ width: w, height: h });
    const a = toPixels(live, w, h, (g, c) => g.drawImage(c, 0, 0));
    const b = toPixels(img, w, h, coverDraw(w, h));
    const d = meanAbsDiff(a, b);
    assert(d < 6, `${w}x${h} diff ${d.toFixed(2)}`);
  }
}, { timeout: 60000 });
