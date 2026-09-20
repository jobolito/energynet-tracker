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

/** Types that are "theory" work: pinned at the lead org HQ with a hollow marker. */
export const THEORY_TYPES = new Set(['paper', 'standard', 'policy']);

export type Stage = keyof typeof STAGES;
export type ProjectType = keyof typeof TYPES;
export type Scale = keyof typeof SCALES;
export type OrgKind = keyof typeof ORG_KINDS;
