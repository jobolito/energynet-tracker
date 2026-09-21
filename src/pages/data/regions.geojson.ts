/**
 * Countries and, for the US, states that hold at least one project, for the map's region tint.
 * Derived at build time by point-in-polygon from the pin coordinates, so nothing needs to be maintained by hand.
 * Boundaries: Natural Earth via world-atlas (50m) and us-atlas (10m), public domain.
 */
import type { APIRoute } from 'astro';
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { feature } from 'topojson-client';
import countriesTopo from 'world-atlas/countries-50m.json';
import statesTopo from 'us-atlas/states-10m.json';
import { loadProjects } from '../../lib/data';
import { featureAt, nearestFeature } from '../../lib/geo';

const US = '840';
type FC = FeatureCollection<Polygon | MultiPolygon>;

export const GET: APIRoute = async () => {
  const countries = feature(countriesTopo as any, (countriesTopo as any).objects.countries) as unknown as FC;
  const states = feature(statesTopo as any, (statesTopo as any).objects.states) as unknown as FC;
  const picked = new Map<string, any>();
  for (const p of await loadProjects()) {
    for (const l of p.locations) {
      const pt: [number, number] = [l.lng, l.lat];
      // US states first (10m, precise), then countries (50m), then the nearest coastline for pins just offshore.
      const state = featureAt(states, pt);
      const f = state ?? featureAt(countries, pt) ?? nearestFeature(countries, pt);
      if (!f || (!state && String(f.id) === US)) continue;
      const level = state ? 'state' : 'country';
      picked.set(`${level}:${f.id}`, { type: 'Feature', id: f.id, properties: { name: (f.properties as any)?.name, level }, geometry: f.geometry });
    }
  }
  return new Response(JSON.stringify({ type: 'FeatureCollection', features: [...picked.values()] }), { headers: { 'Content-Type': 'application/geo+json; charset=utf-8' } });
};
