# Funded projects maintenance

The project portfolio lives inside the existing `/projects/` page. The page heading, funding summary, partner acknowledgment, and navigation are retained.

## Updating grants

Edit `data/projects.yaml`. Each entry requires a stable unique `id`, `title`, `pi`, `sponsors` (a list even for a single sponsor), `start_year`, `end_year`, numeric `funding_amount`, and `themes` (a list).

Optional fields: `co_pis`, `funding_note`, `funding_label`, `program_share`, `description`, and `sponsor_summary`. Use `program_share` when the total award differs from the Yang program allocation. Use `funding_label: Combined funding` for an aggregate award. More than one sponsor produces an expandable list; `sponsor_summary` supplies a concise visible label.

Titles, descriptions, and theme labels accept Markdown, including scientific names such as `*Helicoverpa armigera*`. Keep equivalent theme/sponsor names consistent. All themes remain searchable/filterable; only the first three appear above a title. Entry order follows the data file.

Status is **derived**, not stored: an end year before the current year is Completed; otherwise Active. The end year is inclusive. Hugo computes the initial status; the browser refreshes it from the same end year to keep an older static build current. With JavaScript disabled, all projects are readable and the nonfunctional filters are hidden; rebuild annually to refresh that fallback.

Filters combine status, exact research area, exact sponsor (including individual sponsors of aggregate projects), and keyword terms. State is stored in URL parameters `status`, `area`, `sponsor`, and `q`. A reset preserves unrelated URL parameters and the page anchor.

## Data to verify

- The rootworm ecology award supplied as **2023–2037** is preserved verbatim. Confirm the end year; do not silently change it to 2027.
- Project dates contain years only. An award ending in 2026 remains Active throughout 2026; exact closeout dates could require a future schema update.
- The combined applied-field entry is displayed as one project with 12 named partners; confirm its reporting scope before treating it as an individual grant.

## Implementation

- `data/projects.yaml`: project records.
- `layouts/partials/lab/project-portfolio.html`: data-driven accessible HTML.
- `assets/css/projects.css`: scoped editorial layout, responsive and dark-theme styles.
- `assets/js/projects.js`: dependency-free filters, derived status, URL state, empty state.
- `layouts/projects.html`: replaces the previous portfolio paragraph with the partial.
- `layouts/partials/head.html` and `layouts/partials/scripts.html`: load assets only on Projects.

The existing theme and all unrelated pages are unchanged by this feature. No separate project detail routes, sponsor logos, JavaScript frameworks, or theme dependencies are added.
