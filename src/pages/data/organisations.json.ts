import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { loadProjects } from '../../lib/data';
export const GET: APIRoute = async ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');
  const projects = await loadProjects();
  const orgs = (await getCollection('organisations')).map((o) => ({ id: o.id, url: `${base}/organisations/${o.id}`, ...o.data, projects: projects.filter((p) => p.parties.some((x) => x.id === o.id)).map((p) => p.id) }));
  return new Response(JSON.stringify({ generated: new Date().toISOString(), license: 'CC BY 4.0', count: orgs.length, organisations: orgs }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
