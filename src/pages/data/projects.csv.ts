import type { APIRoute } from 'astro';
import { loadProjects } from '../../lib/data';
const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export const GET: APIRoute = async ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');
  const head = ['id', 'title', 'url', 'summary', 'stage', 'type', 'scale', 'theory', 'country', 'lat', 'lng', 'locations', 'parties', 'tags', 'started', 'ended', 'added', 'updated', 'verified'];
  const rows = (await loadProjects()).map((p) => [p.id, p.title, base + p.url, p.summary, p.stage, p.type, p.scale, p.theory, p.country, p.locations[0]?.lat, p.locations[0]?.lng, p.locations.map((l) => `${l.name} (${l.lat},${l.lng})`).join('; '), p.parties.map((x) => `${x.name}: ${x.role}`).join('; '), p.tags.join(','), p.started, p.ended, p.added, p.updated, p.verified].map(q).join(','));
  return new Response([head.join(','), ...rows].join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
};
