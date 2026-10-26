import { test, assert, assertEq, openPage, wait, waitFor } from './harness.js';

const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

test('menu arrows move focus and wrap', async () => {
  const { doc } = await openPage('/?nointro');
  await waitFor(() => doc.documentElement.dataset.ready === '1', 3000);
  const links = [...doc.querySelectorAll('a[data-menu]')];
  links[0].focus();
  key(links[0], 'ArrowRight');
  assertEq(doc.activeElement, links[1]);
  key(links[1], 'ArrowLeft');
  key(links[0], 'ArrowLeft');
  assertEq(doc.activeElement, links[2]);
});

test('header appears after leaving title', async () => {
  const { win, doc } = await openPage('/?nointro', { height: 700 });
  await waitFor(() => doc.documentElement.dataset.ready === '1', 3000);
  const header = doc.querySelector('[data-header]');
  assert(!header.classList.contains('is-visible'), 'visible on title');
  win.scrollTo({ top: win.innerHeight * 2, behavior: 'instant' });
  await waitFor(() => header.classList.contains('is-visible'), 2000);
});

test('scroll-margin keeps section titles below header', async () => {
  const { win, doc } = await openPage('/?nointro#studio', { height: 700 });
  await waitFor(() => doc.documentElement.dataset.ready === '1', 3000);
  await waitFor(() => doc.querySelector('[data-header]').classList.contains('is-visible'), 3000);
  await wait(1200);
  assert(win.scrollY > 0, 'did not jump to #studio');
  const h2 = doc.querySelector('#studio h2').getBoundingClientRect();
  const hdr = doc.querySelector('[data-header]').getBoundingClientRect();
  assert(h2.top >= hdr.bottom, `h2 ${h2.top} under header ${hdr.bottom}`);
  assert(h2.top < win.innerHeight / 2, `h2 ${h2.top} not near top`);
});

test('lightbox opens, closes on backdrop, returns focus', async () => {
  const { doc } = await openPage('/?nointro');
  await waitFor(() => doc.documentElement.dataset.ready === '1', 3000);
  const btn = doc.querySelector('[data-lightbox]');
  const dlg = doc.getElementById('lightbox');
  btn.focus();
  btn.click();
  assert(dlg.open, 'dialog not open');
  assertEq(dlg.querySelector('img').getAttribute('src'), btn.dataset.full);
  assertEq(dlg.querySelector('img').getAttribute('alt'), btn.dataset.alt);
  dlg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  assert(!dlg.open, 'dialog still open');
  await wait(50);
  assertEq(doc.activeElement, btn);
});

test('email copies as plain address', async () => {
  const { doc } = await openPage('/?nointro');
  assertEq(doc.querySelector('#contact a[href^="mailto:"]').textContent.trim(), 'ko@kostudio.org');
});

test('language switch keeps section', async () => {
  const { doc, frame } = await openPage('/?nointro#studio');
  await waitFor(() => doc.documentElement.dataset.ready === '1', 3000);
  doc.querySelector('header a[data-lang="en"]').click();
  await waitFor(() => frame.contentWindow.location.pathname === '/en/', 3000);
  assertEq(frame.contentWindow.location.hash, '#studio');
});
