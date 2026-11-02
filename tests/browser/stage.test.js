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
