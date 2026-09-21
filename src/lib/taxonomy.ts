export const STAGES = {
  concept: { label: 'Concept', color: '#9aa5b1', order: 0 },
  research: { label: 'Research', color: '#7c5cff', order: 1 },
  specification: { label: 'Specification', color: '#2f80ed', order: 2 },
  pilot: { label: 'Pilot', color: '#f2a93b', order: 3 },
  operational: { label: 'Operational', color: '#1fa971', order: 4 },
  discontinued: { label: 'Discontinued', color: '#6b7280', order: 5 },
} as const;

export const TYPES = {
  paper: 'Paper',
  standard: 'Standard / protocol',
  software: 'Software',
  hardware: 'Hardware',
  deployment: 'Deployment',
  policy: 'Policy',
} as const;

export const SCALES = {
  device: 'Device',
  building: 'Building',
  neighbourhood: 'Neighbourhood',
  city: 'City',
  region: 'Region',
  national: 'National',
  global: 'Global',
} as const;

export const ORG_KINDS = {
  'housing-company': 'Housing company',
  municipality: 'Municipality',
  university: 'University',
  'technology-provider': 'Technology provider',
  dso: 'Grid operator (DSO)',
  developer: 'Property developer',
  investor: 'Investor',
  'research-institute': 'Research institute',
  other: 'Other',
} as const;

/** Types that are "theory" work: pinned at the lead org HQ when no site is given. */
export const THEORY_TYPES = new Set(['paper', 'standard', 'policy']);

/** Pin colour on the map says what kind of work a project is, not how far along it is. */
export const KINDS = {
  built: { label: 'Built environment', color: '#1d6fe0' },
  concept: { label: 'Prestudy / concept', color: '#8ec5ff' },
  research: { label: 'Academic / research', color: '#f5c400' },
  software: { label: 'Software / hardware', color: '#ef5da8' },
  discontinued: { label: 'Discontinued', color: '#9aa5b1' },
} as const;
export type Kind = keyof typeof KINDS;
export function kindOf(type: string, stage: string): Kind {
  if (stage === 'discontinued') return 'discontinued';
  if (type === 'software' || type === 'hardware') return 'software';
  if (THEORY_TYPES.has(type) || stage === 'research') return 'research';
  return stage === 'concept' ? 'concept' : 'built';
}

export type Stage = keyof typeof STAGES;
export type ProjectType = keyof typeof TYPES;
export type Scale = keyof typeof SCALES;
export type OrgKind = keyof typeof ORG_KINDS;
