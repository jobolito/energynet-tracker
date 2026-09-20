import type { APIRoute } from 'astro';
import { loadProjects } from '../../lib/data';
export const GET: APIRoute = async ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');
  const features = (await loadProjects()).flatMap((p) => p.locations.map((l) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [l.lng, l.lat] },
    properties: { id: p.id, title: p.title, url: base + p.url, summary: p.summary, stage: p.stage, type: p.type, scale: p.scale, theory: p.theory, country: p.country, location: l.name, location_kind: l.kind, tags: p.tags.join(','), parties: p.parties.map((x) => x.name).join('; ') },
  })));
  return new Response(JSON.stringify({ type: 'FeatureCollection', features }, null, 2), { headers: { 'Content-Type': 'application/geo+json; charset=utf-8' } });
};
