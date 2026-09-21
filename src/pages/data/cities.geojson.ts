/**
 * City / municipality outlines for the map's city tint. One file per city in src/data/cities/, fetched with
 * `node scripts/fetch-city.mjs "Lund, Sweden"`. A city is included when one of its names matches a segment of a
 * project location name ("Spjället/Pottungen, Väster, Lund" matches "Lund"). Data © OpenStreetMap contributors, ODbL.
 */
import type { APIRoute } from 'astro';
import { loadProjects } from '../../lib/data';

const files = Object.values(import.meta.glob('../../data/cities/*.geojson', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>).map((s) => JSON.parse(s));

export const GET: APIRoute = async () => {
  const segments = new Set<string>();
  for (const p of await loadProjects()) for (const l of p.locations) for (const s of l.name.split(',')) segments.add(s.trim().toLowerCase());
  const features = files
    .filter((f) => [f.properties.name, ...(f.properties.aliases ?? [])].some((n: string) => segments.has(n.toLowerCase())))
    .map((f) => ({ type: 'Feature', properties: { name: f.properties.name }, geometry: f.geometry }));
  return new Response(JSON.stringify({ type: 'FeatureCollection', features }), { headers: { 'Content-Type': 'application/geo+json; charset=utf-8' } });
};
