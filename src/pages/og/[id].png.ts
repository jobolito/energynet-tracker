import type { APIRoute } from 'astro';
import { loadProjects } from '../../lib/data';
import { renderOg } from '../../lib/og';
export async function getStaticPaths() {
  const projects = await loadProjects();
  return projects.map((p) => ({ params: { id: p.id }, props: { p } }));
}
export const GET: APIRoute = async ({ props }) => new Response(await renderOg(props.p), { headers: { 'Content-Type': 'image/png' } });
