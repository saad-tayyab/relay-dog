<script lang="ts">
import type { Section } from '../../utils/router';

let {
  activeSection,
  onNavigate,
  eventCount = 0,
}: {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  eventCount?: number;
} = $props();

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'inspector', label: 'Inspector', icon: '⚡' },
  { id: 'verifier', label: 'Verifier', icon: '🔐' },
  { id: 'publisher', label: 'Publisher', icon: '✍️' },
  { id: 'tools', label: 'Tools', icon: '🧰' },
  { id: 'directory', label: 'Directory', icon: '📂' },
];
</script>

<nav class="flex gap-1 p-1 mb-6 rounded-xl bg-dark-surface border border-dark-border">
  {#each sections as section (section.id)}
    <button
      type="button"
      onclick={() => onNavigate(section.id)}
      class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {activeSection === section.id
        ? 'bg-dark-card border border-dark-border text-text-primary'
        : 'text-text-muted hover:text-text-secondary'}"
    >
      {section.icon} {section.label}
      {#if section.id === 'inspector' && eventCount > 0}
        <span class="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-accent-dim text-accent">
          {eventCount.toLocaleString()}
        </span>
      {/if}
    </button>
  {/each}
</nav>
