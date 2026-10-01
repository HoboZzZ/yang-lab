(() => {
  const dialog = document.querySelector('.news-lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  // Markdown photos use the same viewer as cover and gallery photos.
  document.querySelectorAll('.news-post .post__body img').forEach(image => {
    if (image.closest('a')) return;
    const link = document.createElement('a');
    link.href = image.currentSrc || image.src;
    link.className = 'news-photo-link';
    link.dataset.alt = image.alt;
    link.dataset.caption = image.title || '';
    link.setAttribute('aria-label', `Enlarge photo: ${image.alt || 'News photo'}`);
    image.replaceWith(link);
    link.append(image);
  });

  const links = [...document.querySelectorAll('.news-post .news-photo-link')];
  if (!links.length) return;
  const image = dialog.querySelector('img');
  const count = dialog.querySelector('.news-lightbox-count');
  const caption = dialog.querySelector('.news-lightbox-caption');
  const previous = dialog.querySelector('.news-lightbox-prev');
  const next = dialog.querySelector('.news-lightbox-next');
  const zoom = dialog.querySelector('.news-lightbox-zoom');
  const stage = dialog.querySelector('.news-lightbox-stage');
  let current = 0;
  let opener;
  let bodyOverflow;
  let touchStart;

  function setZoom(enabled) {
    dialog.classList.toggle('is-zoomed', enabled);
    zoom.setAttribute('aria-pressed', String(enabled));
    zoom.setAttribute('aria-label', enabled ? 'Fit photo to screen' : 'Zoom to original size');
    stage.scrollTop = stage.scrollLeft = 0;
  }

  function show(index) {
    setZoom(false);
    current = (index + links.length) % links.length;
    const link = links[current];
    const thumbnail = link.querySelector('img');
    image.width = thumbnail?.naturalWidth || Number(thumbnail?.getAttribute('width')) || 1600;
    image.height = thumbnail?.naturalHeight || Number(thumbnail?.getAttribute('height')) || 1200;
    image.src = link.href;
    image.alt = link.dataset.alt || thumbnail?.alt || 'News photo';
    count.textContent = `${current + 1} / ${links.length}`;
    caption.textContent = link.dataset.caption || '';
    caption.hidden = !caption.textContent;
    previous.hidden = next.hidden = links.length < 2;
  }

  links.forEach((link, index) => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      bodyOverflow = document.body.style.overflow;
      show(index);
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
  });

  dialog.querySelector('.news-lightbox-close').addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  zoom.addEventListener('click', () => setZoom(!dialog.classList.contains('is-zoomed')));
  image.addEventListener('dblclick', () => setZoom(!dialog.classList.contains('is-zoomed')));
  stage.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touchStart || dialog.classList.contains('is-zoomed') || links.length < 2) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - touchStart.x;
    const dy = end.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
  dialog.addEventListener('keydown', event => {
    if (links.length < 2) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = bodyOverflow;
    opener?.focus({ preventScroll: true });
    image.removeAttribute('src');
  });
})();
