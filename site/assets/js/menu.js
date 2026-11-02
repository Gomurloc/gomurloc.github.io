// Left/right arrows move focus between the title menu links (wrapping at the ends).
// A slanted selection band follows whatever link is pointed at or focused, and rests on
// the focused link (or the first one) when the pointer leaves.
export function initMenu(nav) {
  const links = [...nav.querySelectorAll('a[data-menu]')];
  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = links.indexOf(e.target);
    if (i < 0) return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : -1;
    links[(i + step + links.length) % links.length].focus();
  });

  const place = (a) => {
    nav.style.setProperty('--band-x', `${a.offsetLeft}px`);
    nav.style.setProperty('--band-w', `${a.offsetWidth}px`);
  };
  const rest = () => place(links.includes(document.activeElement) ? document.activeElement : links[0]);
  nav.addEventListener('pointerover', (e) => {
    const a = e.target.closest('a[data-menu]');
    if (a) place(a);
  });
  nav.addEventListener('pointerleave', rest);
  nav.addEventListener('focusin', (e) => { if (links.includes(e.target)) place(e.target); });
  nav.addEventListener('focusout', () => requestAnimationFrame(rest));
  new ResizeObserver(rest).observe(nav);  // web fonts change the link widths
  rest();
  nav.classList.add('has-band');
}
