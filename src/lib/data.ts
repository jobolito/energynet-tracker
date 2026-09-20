import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { STAGES, TYPES, SCALES, THEORY_TYPES } from './taxonomy';

export type Project = CollectionEntry<'projects'>;
export type Organisation = CollectionEntry<'organisations'>;

/** Flat, serialisable representation used by the map, exports and OG images. */
export interface ProjectDTO {
  id: string;
  url: string;
  title: string;
  summary: string;
  stage: string; stageLabel: string; stageColor: string;
  type: string; typeLabel: string;
  scale: string; scaleLabel: string;
  theory: boolean;
  tags: string[];
  country: string;
  locations: { name: string; lat: number; lng: number; kind: 'site' | 'hq' }[];
  parties: { id: string; name: string; role: string; url: string }[];
  links: { label: string; url: string }[];
  started?: string; ended?: string;
  added: string; updated?: string; verified: boolean;
  confidential: boolean;
}

export async function loadProjects(): Promise<ProjectDTO[]> {
  const projects = await getCollection('projects');
  const orgs = await getCollection('organisations');
  const orgById = new Map(orgs.map((o) => [o.id, o]));
  return projects
    .map((p) => {
      const d = p.data;
      const theory = THEORY_TYPES.has(d.type);
      const parties = d.parties.map((pt) => {
        const o = orgById.get(pt.org.id);
        return { id: pt.org.id, name: o?.data.name ?? pt.org.id, role: pt.role, url: `/organisations/${pt.org.id}` };
      });
      // Theory work with no explicit site gets pinned at each party's HQ.
      let locations = d.locations.map((l) => ({ ...l }));
      if (theory && locations.length === 0) {
        locations = parties.map((pt) => {
          const o = orgById.get(pt.id)!;
          return { name: `${o.data.name}, ${o.data.city}`, lat: o.data.lat, lng: o.data.lng, kind: 'hq' as const };
        });
      }
      return {
        id: p.id,
        url: `/projects/${p.id}`,
        title: d.title,
        summary: d.summary,
        stage: d.stage, stageLabel: STAGES[d.stage].label, stageColor: STAGES[d.stage].color,
        type: d.type, typeLabel: TYPES[d.type],
        scale: d.scale, scaleLabel: SCALES[d.scale],
        theory,
        tags: d.tags,
        country: d.country,
        locations,
        parties,
        links: d.links,
        started: d.started, ended: d.ended,
        added: d.added.toISOString().slice(0, 10),
        updated: d.updated?.toISOString().slice(0, 10),
        verified: d.verified,
        confidential: d.confidential,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function projectsForOrg(orgId: string) {
  const all = await loadProjects();
  return all.filter((p) => p.parties.some((pt) => pt.id === orgId));
}

export { getEntry };
