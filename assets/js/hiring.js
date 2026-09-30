(() => {
  const chapters = [...document.querySelectorAll('details.hiring-chapter')];
  if (!chapters.length) return;
  function openChapter(hash) {
    const chapter = chapters.find(item => `#${item.id}` === hash);
    if (chapter) chapter.open = true;
  }
  openChapter(location.hash);
  addEventListener('hashchange', () => openChapter(location.hash));
  document.querySelectorAll('.hiring-section a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => openChapter(link.getAttribute('href')));
  });
  addEventListener('beforeprint', () => {
    chapters.forEach(chapter => {
      chapter.dataset.wasOpen = String(chapter.open);
      chapter.open = true;
    });
  });
  addEventListener('afterprint', () => {
    chapters.forEach(chapter => { chapter.open = chapter.dataset.wasOpen === 'true'; });
  });
})();
