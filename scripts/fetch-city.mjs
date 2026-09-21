#!/usr/bin/env node
/**
 * Fetch a city or municipality outline from OpenStreetMap (via Nominatim) into src/data/cities/<slug>.geojson.
 *   node scripts/fetch-city.mjs "Lund, Sweden"                 -> name "Lund"
 *   node scripts/fetch-city.mjs "Gotlands kommun, Sweden" Gotland  -> name "Gotland" (extra args become aliases)
 * The name and aliases must match a comma-separated segment of a project location name for the outline to be used.
 * Nominatim usage policy: one request per second, identify yourself. Data © OpenStreetMap contributors, ODbL.
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const [query, ...aliases] = process.argv.slice(2);
if (!query) { console.error('usage: node scripts/fetch-city.mjs "<City, Country>" [alias ...]'); process.exit(1); }
const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&polygon_geojson=1&polygon_threshold=0.001&limit=5`;
const res = await fetch(url, { headers: { 'User-Agent': 'energynet-tracker (https://energynet-tracker.org)' } });
const hits = await res.json();
const hit = hits.find((h) => h.geojson && (h.geojson.type === 'Polygon' || h.geojson.type === 'MultiPolygon'));
if (!hit) { console.error('No polygon found for', query, '- try the municipality name, e.g. "Örebro kommun, Sweden"'); process.exit(2); }
const name = aliases.length ? aliases[0] : hit.display_name.split(',')[0].trim();
const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const feature = { type: 'Feature', properties: { name, aliases: aliases.slice(1), osm: `${hit.osm_type}/${hit.osm_id}`, display_name: hit.display_name }, geometry: hit.geojson };
mkdirSync('src/data/cities', { recursive: true });
writeFileSync(`src/data/cities/${slug}.geojson`, JSON.stringify(feature));
console.log(`src/data/cities/${slug}.geojson  <- ${hit.display_name} (${hit.addresstype}, ${Math.round(JSON.stringify(hit.geojson).length / 1024)} kB)`);
