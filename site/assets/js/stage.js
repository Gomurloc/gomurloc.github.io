// Lights up each game's room when its title card comes into view (so the card's line-by-line
// entrance plays where it can be seen), and pushes each key-art plate in when it arrives.
// The watched area reaches far above the screen, so a card or plate also counts as arrived once
// it is anywhere above the view: a restored scroll position, or a jump past it, can't leave a
// room dark. Without IntersectionObserver, or with reduced motion, everything starts lit.
export function initStage(root) {
  const cards = [...root.querySelectorAll('.game .title-card')];
  const plates = [...root.querySelectorAll('[data-drift]')];
  const light = (el) => (el.matches('.title-card') ? el.closest('.game') : el).classList.add('is-lit');
  const reduce = window.__koIntro?.rm || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    [...cards, ...plates].forEach(light);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      light(e.target);
      io.unobserve(e.target);
    }
  }, { root: document, rootMargin: '100000px 0px -12% 0px' });
  [...cards, ...plates].forEach((el) => io.observe(el));
}
