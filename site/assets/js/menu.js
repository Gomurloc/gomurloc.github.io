// Left/right arrows move focus between the title menu links (wrapping at the ends).
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
}
