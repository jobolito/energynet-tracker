import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { STAGES, TYPES, SCALES, ORG_KINDS } from './lib/taxonomy';

const keys = <T extends object>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

const location = z.object({
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  kind: z.enum(['site', 'hq']).default('site'),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(280),
    stage: z.enum(keys(STAGES)),
    type: z.enum(keys(TYPES)),
    scale: z.enum(keys(SCALES)),
    tags: z.array(z.string()).default([]),
    country: z.string().length(2),
    locations: z.array(location).default([]),
    parties: z
      .array(z.object({ org: reference('organisations'), role: z.string() }))
      .default([]),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    started: z.string().optional(),
    ended: z.string().optional(),
    added: z.coerce.date(),
    updated: z.coerce.date().optional(),
    verified: z.boolean().default(false),
    /** Secretive project: only the city is known or may be shown. No parties, no exact site. */
    confidential: z.boolean().default(false),
  }).refine((p) => p.locations.length > 0 || p.parties.length > 0, { message: 'A project needs at least one location or one party (theory work is pinned at party HQs).' }),
});

const organisations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/organisations' }),
  schema: z.object({
    name: z.string(),
    kind: z.enum(keys(ORG_KINDS)),
    website: z.string().url().optional(),
    country: z.string().length(2),
    city: z.string(),
    lat: z.number(),
    lng: z.number(),
    logo: z.string().optional(),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    source: z.string(),
    date: z.coerce.date(),
    projects: z.array(reference('projects')).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { projects, organisations, news };
