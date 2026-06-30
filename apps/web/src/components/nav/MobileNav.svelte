<script lang="ts">
import type { Section } from '../../utils/router';

let {
  activeSection,
  onNavigate,
}: {
  activeSection: Section;
  onNavigate: (section: Section) => void;
} = $props();

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'inspector', label: 'Inspector', icon: '⚡' },
  { id: 'verifier', label: 'Verifier', icon: '🔐' },
  { id: 'publisher', label: 'Publisher', icon: '✍️' },
  { id: 'tools', label: 'Tools', icon: '🧰' },
  { id: 'directory', label: 'Directory', icon: '📂' },
];
</script>

<nav aria-label="Section navigation" class="fixed bottom-0 left-0 right-0 z-20 sm:hidden border-t border-dark-border bg-dark-card/95 backdrop-blur-sm">
  <div class="flex items-center justify-around px-2 py-2">
    {#each sections as section (section.id)}
      <button
        type="button"
        onclick={() => onNavigate(section.id)}
        aria-current={activeSection === section.id ? 'page' : undefined}
        class="flex flex-col items-center gap-1 min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg transition-all {activeSection === section.id
          ? 'text-accent'
          : 'text-text-muted'}"
      >
        <span class="text-lg" aria-hidden="true">{section.icon}</span>
        <span class="text-xs font-medium">{section.label}</span>
      </button>
    {/each}
  </div>
</nav>
