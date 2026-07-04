<script lang="ts">
import type { Snippet } from 'svelte';

type Props = {
  tabs: Array<{ id: string; label: string; icon?: string; badge?: string | null }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  ariaLabel: string;
  children: Snippet;
};

let { tabs, activeTab, onTabChange, ariaLabel, children }: Props = $props();
let tablistEl: HTMLElement | undefined = $state();

function handleKeydown(e: KeyboardEvent) {
  const currentIndex = tabs.findIndex((t) => t.id === activeTab);
  let nextIndex = currentIndex;

  switch (e.key) {
    case 'ArrowRight':
      nextIndex = (currentIndex + 1) % tabs.length;
      break;
    case 'ArrowLeft':
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      break;
    case 'Home':
      nextIndex = 0;
      break;
    case 'End':
      nextIndex = tabs.length - 1;
      break;
    default:
      return;
  }

  e.preventDefault();
  const nextTab = tabs[nextIndex];
  if (!nextTab) return;
  onTabChange(nextTab.id);
  // Move focus to the new tab button after DOM update
  requestAnimationFrame(() => {
    const buttons = tablistEl?.querySelectorAll('[role="tab"]');
    (buttons?.[nextIndex] as HTMLElement)?.focus();
  });
}
</script>

<div>
  <div
    role="tablist"
    tabindex="0"
    aria-label={ariaLabel}
    bind:this={tablistEl}
    onkeydown={handleKeydown}
    class="flex gap-1 border-b border-dark-border"
  >
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        role="tab"
        id="tab-{tab.id}"
        aria-selected={activeTab === tab.id}
        aria-controls="tabpanel-{tab.id}"
        tabindex={activeTab === tab.id ? 0 : -1}
        onclick={() => onTabChange(tab.id)}
        class="min-h-[44px] px-4 py-2.5 text-sm font-medium
               rounded-t-lg transition-colors cursor-pointer
               {activeTab === tab.id
                 ? 'bg-dark-card text-accent border-b-2 border-accent'
                 : 'text-text-muted hover:text-text-secondary hover:bg-dark-surface'}"
      >
        {#if tab.icon}<span aria-hidden="true">{tab.icon}</span>{/if}
        {tab.label}
        {#if tab.badge}
          <span class="ml-2 text-xs font-mono px-1.5 py-0.5 rounded-full bg-accent-dim text-accent">
            {tab.badge}
          </span>
        {/if}
      </button>
    {/each}
  </div>

  <div
    role="tabpanel"
    id="tabpanel-{activeTab}"
    aria-labelledby="tab-{activeTab}"
    tabindex={0}
    class="focus:outline-none"
  >
    {@render children()}
  </div>
</div>
