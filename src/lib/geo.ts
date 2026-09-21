/** Small geometry helpers for build-time region lookups. No runtime dependency. */
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';

function inRing(pt: Position, ring: Position[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inPolygon(pt: Position, poly: Position[][]) {
  return inRing(pt, poly[0]) && !poly.slice(1).some((hole) => inRing(pt, hole));
}
export function contains(f: Feature<Polygon | MultiPolygon>, pt: Position) {
  const g = f.geometry;
  return g.type === 'Polygon' ? inPolygon(pt, g.coordinates) : g.coordinates.some((p) => inPolygon(pt, p));
}
export function featureAt(fc: FeatureCollection<Polygon | MultiPolygon>, pt: Position) {
  return fc.features.find((f) => contains(f, pt));
}
/** Fallback for points that fall just off a coarse coastline: the feature with the closest vertex. */
export function nearestFeature(fc: FeatureCollection<Polygon | MultiPolygon>, pt: Position) {
  let best: Feature<Polygon | MultiPolygon> | undefined, bestD = Infinity;
  for (const f of fc.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) for (const [x, y] of poly[0]) { const d = (x - pt[0]) ** 2 + (y - pt[1]) ** 2; if (d < bestD) { bestD = d; best = f; } }
  }
  return best;
}
