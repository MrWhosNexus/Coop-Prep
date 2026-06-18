import { MODULES } from './curriculum.js';

const moduleEntries = MODULES.map((mod, index) => ({
  id: mod.id,
  kind: 'module',
  pillarId: 'head',
  order: index,
  label: mod.title,
}));

const toolEntries = [
  { id: 'coverLetter', kind: 'tool', pillarId: 'hustle', order: 1, label: 'Cover Letter Builder' },
];

export const REGISTRY = [...moduleEntries, ...toolEntries];

export function getByPillar(pillarId) {
  return REGISTRY.filter(x => x.pillarId === pillarId).sort((a, b) => a.order - b.order);
}
