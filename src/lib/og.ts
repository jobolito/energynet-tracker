import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ProjectDTO } from './data';

let fonts: { name: string; data: ArrayBuffer; weight: 400 | 700 }[] | null = null;
async function loadFonts() {
  if (fonts) return fonts;
  const load = async (file: string) => (await readFile(resolve(process.cwd(), 'src/assets/fonts', file))).buffer as ArrayBuffer;
  fonts = [
    { name: 'Inter', data: await load('Inter-Regular.ttf'), weight: 400 },
    { name: 'Inter', data: await load('Inter-Bold.ttf'), weight: 700 },
  ];
  return fonts;
}

/** Equirectangular projection of a lat/lng into a w×h box. Good enough for a thumbnail. */
const proj = (lat: number, lng: number, w: number, h: number) => ({ x: ((lng + 180) / 360) * w, y: ((90 - lat) / 180) * h });

const el = (type: string, props: Record<string, any> = {}, ...children: unknown[]) => {
  const kids = children.filter((c) => c !== null && c !== undefined);
  if (type === 'div') props.style = { display: 'flex', ...(props.style ?? {}) };
  return { type, props: { ...props, children: kids.length === 1 ? kids[0] : kids } };
};

export async function renderOg(p: ProjectDTO | null): Promise<Uint8Array<ArrayBuffer>> {
  const W = 1200, H = 630;
  const title = p?.title ?? 'EnergyNet Tracker';
  const sub = p?.summary ?? 'Projects building on EnergyNet and the Energy Protocol, from theory to deployment.';
  const color = p?.stageColor ?? '#1fa971';
  const dots = (p?.locations ?? []).map((l) => proj(l.lat, l.lng, 560, 280));
  const map = el('div', { style: { position: 'absolute', right: 40, top: 40, width: 560, height: 280, borderRadius: 16, background: '#e9efe9', border: '1px solid #d6dfd6', display: 'flex', overflow: 'hidden' } },
    el('img', { src: 'data:image/svg+xml;utf8,' + encodeURIComponent(WORLD_SVG), width: 560, height: 280, style: { position: 'absolute', left: 0, top: 0, opacity: 0.9 } }),
    ...dots.map((d) => el('div', { style: { position: 'absolute', left: d.x - 9, top: d.y - 9, width: 18, height: 18, borderRadius: 9, background: p?.theory ? 'transparent' : color, border: `4px solid ${p?.theory ? color : '#fff'}`, boxShadow: '0 1px 4px rgba(0,0,0,.35)' } })),
  );
  const tree = el('div', { style: { width: W, height: H, display: 'flex', flexDirection: 'column', background: '#fbfbf9', fontFamily: 'Inter', color: '#1a1d21', padding: 56, position: 'relative' } },
    el('div', { style: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 26, fontWeight: 700, color: '#0d6b46' } }, el('div', { style: { width: 14, height: 14, borderRadius: 7, background: '#1fa971' } }), 'EnergyNet Tracker'),
    p ? map : null,
    el('div', { style: { display: 'flex', flexDirection: 'column', marginTop: 'auto', maxWidth: p ? 1080 : 1000 } },
      p ? el('div', { style: { display: 'flex', gap: 10, marginBottom: 18 } },
        el('div', { style: { padding: '6px 14px', borderRadius: 999, background: color, color: '#fff', fontSize: 22, fontWeight: 700 } }, p.stageLabel),
        el('div', { style: { padding: '6px 14px', borderRadius: 999, border: '2px solid #d6dfd6', fontSize: 22, color: '#5f6b7a' } }, p.typeLabel),
        el('div', { style: { padding: '6px 14px', borderRadius: 999, border: '2px solid #d6dfd6', fontSize: 22, color: '#5f6b7a' } }, p.scaleLabel),
      ) : null,
      el('div', { style: { fontSize: title.length > 40 ? 52 : 64, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1 } }, title),
      el('div', { style: { fontSize: 26, color: '#5f6b7a', marginTop: 16, lineHeight: 1.35 } }, sub.length > 150 ? sub.slice(0, 147) + '…' : sub),
      p ? el('div', { style: { fontSize: 22, color: '#5f6b7a', marginTop: 18 } }, [p.locations[0]?.name, p.parties.slice(0, 3).map((x) => x.name).join(' · ')].filter(Boolean).join('  ·  ')) : null,
    ),
  );
  const svg = await satori(tree as any, { width: W, height: H, fonts: await loadFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng() as Uint8Array<ArrayBuffer>;
}

// Very coarse world outline (equirectangular, 560x280) so the thumbnail reads as a map.
const WORLD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 280"><g fill="#c9d6c9"><path d="M45 60l60-18 55 4 30 20-10 30-25 25-15 40-20 30-15-30 5-40-30-20-25-20z"/><path d="M150 155l35 10 15 30-10 45-20 25-15-35-10-40z"/><path d="M255 55l60-12 40 6 15 25-25 20-30 5-15 25-20-10-15 15-20-20 5-30z"/><path d="M270 120l35 5 20 30-5 45-25 25-20-30-10-40z"/><path d="M345 45l110-10 60 15 25 30-40 20-30 30-40 5-30 20-25-15-30-30-15-30z"/><path d="M430 190l40-5 25 20-15 25-40 5-15-25z"/></g></svg>`;
