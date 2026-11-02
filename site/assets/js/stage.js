// Lights up each game's room when its title card comes into view (so the card's line-by-line
// entrance plays where it can be seen), and pushes each key-art plate in when it arrives.
// Arriving inside a room below its card (a restored scroll position, scrolling back up from
// the next room) lights it at once. Without IntersectionObserver, or with reduced motion,
// everything starts lit.
export function initStage(root) {
  const rooms = [...root.querySelectorAll('.game')];
  const plates = [...root.querySelectorAll('[data-drift]')];
  const reduce = window.__koIntro?.rm || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    [...rooms, ...plates].forEach((el) => el.classList.add('is-lit'));
    return;
  }
  const light = (room) => {
    room.classList.add('is-lit');
    io.unobserve(room);
    io.unobserve(room.querySelector('.title-card'));
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      if (el.matches('.title-card')) light(el.closest('.game'));
      else if (el.matches('.game')) {
        // The room's edge is in view: light it only if its card is already in view or above it.
        const bottom = e.rootBounds ? e.rootBounds.bottom : innerHeight;
        if (el.querySelector('.title-card').getBoundingClientRect().top < bottom) light(el);
      } else {
        el.classList.add('is-lit');
        io.unobserve(el);
      }
    }
  }, { rootMargin: '0px 0px -12% 0px' });
  for (const room of rooms) {
    io.observe(room.querySelector('.title-card'));
    io.observe(room);
  }
  plates.forEach((el) => io.observe(el));
}
