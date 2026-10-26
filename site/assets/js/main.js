import { initMenu } from './menu.js';
import { initStickyHeader } from './header.js';
import { initLightbox } from './lightbox.js';

const doc = document;

initMenu(doc.querySelector('.title-menu'));
initStickyHeader(doc.querySelector('[data-header]'), doc.getElementById('top'));
initLightbox(doc, doc.getElementById('lightbox'));

// Language links carry the current section over to the other page.
doc.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-lang]');
  if (link && location.hash) link.href = link.getAttribute('href') + location.hash;
});

// Web fonts swap in after the browser's initial hash jump and push the target down.
// Re-align once they're ready, unless the visitor has already started scrolling.
const target = location.hash && doc.getElementById(decodeURIComponent(location.hash.slice(1)));
if (target) {
  let moved = false;
  const stop = () => { moved = true; };
  for (const type of ['wheel', 'touchmove', 'keydown', 'pointerdown']) addEventListener(type, stop, { once: true, passive: true });
  doc.fonts.ready.then(() => { if (!moved) target.scrollIntoView({ behavior: 'instant' }); });
}

doc.documentElement.dataset.ready = '1';
