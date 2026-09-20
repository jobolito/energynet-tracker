# EnergyNet Tracker

Public map and registry of projects in the EnergyNet / Energy Protocol lineage, from papers and standards to live deployments. Live at [energynet-tracker.org](https://energynet-tracker.org).

- **Map** of every project, one pin per location, coloured by stage. Theory work is pinned at the lead organisation with a hollow marker.
- **Project pages** with parties, links, cite box and embed code.
- **Organisation pages** listing everything an organisation touches.
- **Newsfeed**: curated links with a one-line editor note. RSS at `/news.xml`.
- **Open data**: `/data/projects.json`, `.geojson`, `.csv`, `/data/organisations.json`. CC BY 4.0.
- **Contribute**: web form → pull request → editor merges.

## How it is built

Static [Astro](https://astro.build) site on GitHub Pages. No database. Everything is a Markdown file with YAML front matter under `src/content/`:

| Folder | One file per |
| --- | --- |
| `src/content/projects/` | project (`<slug>.md`, slug becomes the URL) |
| `src/content/organisations/` | organisation, referenced from projects by slug |
| `src/content/news/` | curated news item |

The schema lives in `src/content.config.ts`; the build fails on invalid data. Taxonomy (stages, types, scales) is in `src/lib/taxonomy.ts`.

Editors can use the CMS at `/admin` (Decap CMS, GitHub login) or edit the files directly. The contribute form and CMS login go through a small Cloudflare Worker in `worker/`; see its README. Without the worker the form falls back to a prefilled GitHub issue.

## Develop

```bash
npm install
npm run dev
```

`npm run build` writes the site to `dist/`, including OG images (`/og/<slug>.png`) and the data exports.

## Adding a project by hand

Copy an existing file in `src/content/projects/`, change the front matter, open a pull request. Every party must exist in `src/content/organisations/`. Set `verified: true` only after checking a primary source.

## Licence

Code MIT. Data (everything under `src/content/`) CC BY 4.0, credit "EnergyNet Tracker".
