/* Lab News only. Article markup and keyboard order remain newest-first. */
(() => {
  const grid = document.querySelector('[data-news-masonry]');
  if (!grid || !window.Masonry) return;
  const items = Array.from(grid.querySelectorAll('.news-entry'));
  if (items.length < 2) return;

  const desktop = window.matchMedia('(min-width: 701px)');
  let masonry;
  let frame = 0;
  const layout = () => {
    frame = 0;
    if (!desktop.matches) {
      if (masonry) masonry.destroy();
      masonry = null;
      grid.classList.remove('is-masonry');
      return;
    }
    if (!masonry) {
      grid.classList.add('is-masonry');
      masonry = new window.Masonry(grid, {
        itemSelector: '.news-entry',
        columnWidth: '.news-entry',
        gutter: 40,
        percentPosition: true,
        transitionDuration: 0,
        resize: false
      });
    } else {
      masonry.layout();
    }
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(layout);
  };

  // Original photos, late-loading fonts and container changes can alter card heights.
  grid.querySelectorAll('img').forEach(image => {
    image.addEventListener('load', schedule);
    image.addEventListener('error', schedule);
  });
  if ('ResizeObserver' in window) {
    let width = grid.getBoundingClientRect().width;
    new ResizeObserver(entries => {
      const nextWidth = entries[0].contentRect.width;
      if (nextWidth !== width) {
        width = nextWidth;
        schedule();
      }
    }).observe(grid);
    const itemObserver = new ResizeObserver(schedule);
    items.forEach(item => itemObserver.observe(item));
  }
  window.addEventListener('resize', schedule, { passive: true });
  desktop.addEventListener('change', schedule);
  if (document.fonts) document.fonts.ready.then(schedule);
  layout();
})();
