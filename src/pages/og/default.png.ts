import type { APIRoute } from 'astro';
import { renderOg } from '../../lib/og';
export const GET: APIRoute = async () => new Response(await renderOg(null), { headers: { 'Content-Type': 'image/png' } });
