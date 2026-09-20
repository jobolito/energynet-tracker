import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
export const GET: APIRoute = async ({ site }) => {
  const items = (await getCollection('news')).sort((a, b) => +b.data.date - +a.data.date);
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>EnergyNet Tracker news</title><link>${site}news</link><description>Curated EnergyNet links</description>${items
    .map((n) => `<item><title>${esc(n.data.title)}</title><link>${esc(n.data.url)}</link><guid>${esc(n.data.url)}</guid><pubDate>${n.data.date.toUTCString()}</pubDate><description>${esc((n.body ?? '').trim())} (${esc(n.data.source)})</description></item>`)
    .join('')}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
