import { hasBackend } from './api';

export type Section = 'inspector' | 'verifier' | 'publisher' | 'tools' | 'directory';

export function getHashSection(): Section {
  const hash = window.location.hash.replace('#', '').split('?')[0] as Section;
  if (['inspector', 'verifier', 'publisher', 'tools'].includes(hash)) return hash;
  if (hash === 'directory' && hasBackend) return 'directory';
  return 'inspector';
}

export function setHashSection(section: Section): void {
  window.location.hash = section;
}

export function getToolTab(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/#tools\?(.+)/);
  return match?.[1] ?? null;
}

export function setToolTab(tool: string): void {
  window.location.hash = `tools?${tool}`;
}
