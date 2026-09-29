(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector(".theme-toggle");
  const themeMedia = matchMedia("(prefers-color-scheme: dark)");
  const themeKey = "yang-lab-theme";
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#161210" : "#F7F6F2");
    if (!themeButton) return;
    const dark = theme === "dark";
    themeButton.setAttribute("aria-pressed", String(dark));
    themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  };
  applyTheme(root.dataset.theme || (themeMedia.matches ? "dark" : "light"));
  themeButton?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(themeKey, next); } catch (e) {}
  });
  themeMedia.addEventListener("change", (event) => {
    let stored = null;
    try { stored = localStorage.getItem(themeKey); } catch (e) {}
    if (stored !== "light" && stored !== "dark") applyTheme(event.matches ? "dark" : "light");
  });

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.lab-nav');
  if (toggle && nav) {
    document.documentElement.classList.add('has-menu');
    toggle.hidden = false;
    const close = () => { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); };
    toggle.addEventListener('click', () => {
      const opened = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(opened)); nav.classList.toggle('is-open', opened);
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { close(); toggle.focus(); } });
    document.addEventListener('click', e => { if (!e.target.closest('.lab-header')) close(); });
    matchMedia('(min-width: 801px)').addEventListener('change', close);
  }
  const form = document.querySelector('.publication-filters');
  if (!form) return;
  form.hidden = false;
  const search = document.getElementById('paper-search');
  const year = document.getElementById('paper-year');
  const count = document.getElementById('paper-count');
  const groups = [...document.querySelectorAll('.publication-year')];
  function filter() {
    const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtering = words.length > 0 || year.value !== 'all';
    let total = 0;
    for (const group of groups) {
      let n = 0;
      for (const paper of group.querySelectorAll('.publication-record')) {
        const visible = (year.value === 'all' || group.dataset.year === year.value) && words.every(word => paper.dataset.search.includes(word));
        paper.hidden = !visible;
        if (visible) n++;
      }
      group.hidden = !n;
      if (filtering && n) group.open = true;
      group.querySelector('[data-year-count]').textContent = n;
      total += n;
    }
    count.textContent = `${total} publication${total === 1 ? '' : 's'}`;
    document.querySelector('.no-results').hidden = total !== 0;
  }
  form.addEventListener('submit', e => e.preventDefault());
  search.addEventListener('input', filter); year.addEventListener('change', filter);
  form.addEventListener('reset', () => { requestAnimationFrame(filter); });
  addEventListener('beforeprint', () => {
    for (const group of groups) { group.dataset.wasOpen = group.open ? '1' : '0'; group.open = true; }
  });
  addEventListener('afterprint', () => {
    for (const group of groups) { if (group.dataset.wasOpen === '0') group.open = false; }
  });
})();

document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
  dropdown.addEventListener('click', event => { if (event.target.closest('a')) dropdown.open = false; });
  document.addEventListener('click', event => { if (!dropdown.contains(event.target)) dropdown.open = false; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && dropdown.open) { dropdown.open = false; dropdown.querySelector('summary').focus(); } });
});
