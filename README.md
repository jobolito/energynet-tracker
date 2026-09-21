# EnergyNet Tracker

Public map and registry of projects in the EnergyNet / Energy Protocol lineage, from papers and standards to live deployments. Live at [energynet-tracker.org](https://energynet-tracker.org).

- **Map-first home page**: full-height MapLibre map on the OpenFreeMap Positron basemap, one pin per location coloured by stage, filters floating over the map, and a left pane listing the projects in the current view plus the latest news. Pins open a drawer; the view, filters and open project are all in the URL. Theory work is pinned at the lead organisation with a hollow marker.
- **Project pages** with parties, links, cite box and embed code.
- **Organisation pages** listing everything an organisation touches.
- **Newsfeed**: curated links with a one-line editor note. RSS at `/news.xml`.
- **Open data**: `/data/projects.json`, `.geojson`, `.csv`. CC BY 4.0.
- **Contribute**: web form → pull request → editor merges.

## How it is built

Static [Astro](https://astro.build) site on GitHub Pages, MapLibre GL 4 for the map (WebGL1-compatible, no API key). No database. Everything is a Markdown file with YAML front matter under `src/content/`:

| Folder | One file per |
| --- | --- |
| `src/content/projects/` | project (`<slug>.md`, slug becomes the URL) |
| `src/content/organisations/` | organisation, referenced from projects by slug |
| `src/content/news/` | curated news item |

The schema lives in `src/content.config.ts`; the build fails on invalid data. Taxonomy (stages, types, scales, and the pin colour "kinds") is in `src/lib/taxonomy.ts`.

The map tints countries, US states and cities that hold a project. Countries and states are derived at build time from the pin coordinates (Natural Earth via `world-atlas` / `us-atlas`). City outlines come from OpenStreetMap and live in `src/data/cities/`, one file per city; when a project lands in a new city, run `node scripts/fetch-city.mjs "<City, Country>"` once and commit the file. Outlines are matched to projects by city name, so the file's `name` (or an alias) must appear as a comma-separated segment of the project's location name.

Editors can use the CMS at `/admin` (Decap CMS, GitHub login) or edit the files directly. The contribute form and CMS login go through a small Cloudflare Worker in `worker/`; see its README. Without the worker the form falls back to a prefilled GitHub issue.

## Develop

```bash
npm install
npm run dev
```

`npm run build` writes the site to `dist/`, including OG images (`/og/<slug>.png`) and the data exports.

## Adding a project by hand

Copy an existing file in `src/content/projects/`, change the front matter, open a pull request. Every party must exist in `src/content/organisations/`. Set `verified: true` only after checking a primary source. For a project whose parties must not be published, set `confidential: true`, give a city-level location, and leave `parties` empty.

## Licence

Code MIT. Data (everything under `src/content/`) CC BY 4.0, credit "EnergyNet Tracker".

## Analytics

PostHog in cookieless mode (enabled both in the client config and in the PostHog project settings): nothing in cookies or local storage, no person profiles, no session recording, honours Do Not Track. Off unless `PUBLIC_POSTHOG_KEY` is set at build time. Events: `$pageview`, `$pageleave`, `pin_open`, `filter`, `copy`, `cite_open`, `contribute_submit`, `outbound_click`.
