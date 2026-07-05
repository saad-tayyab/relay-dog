<script lang="ts">
import type { Snippet } from "svelte";
import * as Tabs from "$lib/components/ui/tabs";

type Props = {
	tabs: Array<{
		id: string;
		label: string;
		icon?: string;
		badge?: string | null;
	}>;
	activeTab: string;
	onTabChange: (tabId: string) => void;
	ariaLabel: string;
	children?: Snippet;
};

let { tabs, activeTab, onTabChange, ariaLabel, children }: Props = $props();
</script>

<Tabs.Root value={activeTab} onValueChange={onTabChange} aria-label={ariaLabel}>
  <Tabs.List variant="line" class="flex w-full gap-1 border-b border-dark-border p-0">
    {#each tabs as tab (tab.id)}
      <Tabs.Trigger value={tab.id} class="min-h-[44px] rounded-t-lg px-4 py-2.5 text-sm font-medium text-text-muted data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:bg-dark-card data-[state=active]:text-accent">
        {#if tab.icon}<span aria-hidden="true">{tab.icon}</span>{/if}
        {tab.label}
        {#if tab.badge}
          <span class="ml-2 rounded-full bg-accent-dim px-1.5 py-0.5 font-mono text-xs text-accent">
            {tab.badge}
          </span>
        {/if}
      </Tabs.Trigger>
    {/each}
  </Tabs.List>

  <Tabs.Content value={activeTab} class="pt-5 focus:outline-none">
    {@render children?.()}
  </Tabs.Content>
</Tabs.Root>
