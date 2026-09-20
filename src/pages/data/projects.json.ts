import type { APIRoute } from 'astro';
import { loadProjects } from '../../lib/data';
export const GET: APIRoute = async ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');
  const projects = (await loadProjects()).map((p) => ({ ...p, url: base + p.url, parties: p.parties.map((x) => ({ ...x, url: base + x.url })) }));
  return new Response(JSON.stringify({ generated: new Date().toISOString(), license: 'CC BY 4.0', source: base, count: projects.length, projects }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
