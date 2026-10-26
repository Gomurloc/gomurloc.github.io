// Screenshot buttons open a modal <dialog>; focus returns to the button on close.
export function initLightbox(root, dialog) {
  const img = dialog.querySelector('img');
  let opener = null;

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lightbox]');
    if (!btn) return;
    opener = btn;
    img.src = btn.dataset.full;
    img.alt = btn.dataset.alt || '';
    dialog.showModal();
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
  });

  dialog.addEventListener('close', () => {
    opener?.focus();
    opener = null;
  });
}
