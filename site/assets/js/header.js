// Shows the slim header once the title screen has left the viewport.
export function initStickyHeader(header, title) {
  new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-visible', !entry.isIntersecting);
  }).observe(title);
}
