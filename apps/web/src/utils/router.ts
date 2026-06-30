export type Section = 'inspector' | 'verifier' | 'publisher' | 'tools' | 'directory';

export function getHashSection(): Section {
  const hash = window.location.hash.replace('#', '').split('?')[0] as Section;
  return ['inspector', 'verifier', 'publisher', 'tools', 'directory'].includes(hash)
    ? hash
    : 'inspector';
}

export function setHashSection(section: Section): void {
  window.location.hash = section;
}

export function getToolTab(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/#tools\?(.+)/);
  return match ? match[1] : null;
}

export function setToolTab(tool: string): void {
  window.location.hash = `tools?${tool}`;
}
