(() => {
  const root = document.querySelector('.project-portfolio');
  if (!root) return;
  const form = root.querySelector('.project-filters');
  const area = form.elements.area;
  const sponsor = form.elements.sponsor;
  const search = form.elements.q;
  const count = root.querySelector('.project-count');
  const empty = root.querySelector('.project-empty');
  const projects = [...root.querySelectorAll('.funded-project')];
  // Refresh derived status in the browser too, so a static build can cross New Year.
  const year = new Date().getFullYear();
  projects.forEach(project => {
    const status = Number(project.dataset.endYear) < year ? 'Completed' : 'Active';
    project.dataset.status = status.toLowerCase();
    project.querySelector('.project-state').textContent = status;
  });
  const normalized = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const entries = projects.map(project => ({
    project, areas: project.dataset.areas.split('|'), sponsors: project.dataset.sponsors.split('|'),
    text: normalized(project.dataset.search)
  }));
  function filter(syncURL = true) {
    const status = form.elements.status.value;
    const words = normalized(search.value).trim().split(/\s+/).filter(Boolean);
    let matches = 0;
    entries.forEach(({ project, areas, sponsors, text }) => {
      const visible = (status === 'all' || project.dataset.status === status) &&
        (!area.value || areas.includes(area.value)) && (!sponsor.value || sponsors.includes(sponsor.value)) &&
        words.every(word => text.includes(word));
      project.hidden = !visible;
      if (visible) matches++;
    });
    count.textContent = `${matches} ${matches === 1 ? 'Project' : 'Projects'}`;
    empty.hidden = matches !== 0;
    if (syncURL) {
      const url = new URL(location.href);
      const values = { status: status === 'all' ? '' : status, area: area.value, sponsor: sponsor.value, q: search.value.trim() };
      Object.entries(values).forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
      history.replaceState(null, '', url);
    }
  }
  function restore() {
    const params = new URLSearchParams(location.search);
    form.elements.status.value = ['active', 'completed'].includes(params.get('status')) ? params.get('status') : 'all';
    [area, sponsor].forEach(select => {
      const value = params.get(select.name) || '';
      select.value = [...select.options].some(option => option.value === value) ? value : '';
    });
    search.value = params.get('q') || '';
    filter(false);
  }
  form.hidden = false;
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', () => filter());
  form.addEventListener('change', () => filter());
  form.addEventListener('reset', () => requestAnimationFrame(() => filter()));
  root.querySelector('[data-project-clear]').addEventListener('click', () => { form.reset(); search.focus(); });
  addEventListener('popstate', restore);
  restore();
})();
