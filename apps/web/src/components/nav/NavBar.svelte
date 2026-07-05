<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { cn } from "$lib/shadcn/utils";
import { hasBackend } from "../../utils/api";
import type { Section } from "../../utils/router";

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
	{ id: "inspector", label: "Inspector", icon: "⚡" },
	{ id: "verifier", label: "Verifier", icon: "🔐" },
	{ id: "publisher", label: "Publisher", icon: "✍️" },
	{ id: "tools", label: "Tools", icon: "🧰" },
	...(hasBackend ? [{ id: "directory" as Section, label: "Directory", icon: "📂" }] : []),
];
</script>

<nav aria-label="Section navigation" class="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
  {#each sections as section (section.id)}
    <Button
      type="button"
      variant="ghost"
      aria-current={activeSection === section.id ? 'page' : undefined}
      onclick={() => onNavigate(section.id)}
      class={cn(
        "min-h-[44px] flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all",
        activeSection === section.id
          ? "border border-primary/30 bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-background hover:text-foreground",
      )}
    >
      <span aria-hidden="true">{section.icon}</span> {section.label}
      {#if section.id === 'inspector' && eventCount > 0}
        <span class="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-xs text-primary">
          {eventCount.toLocaleString()}
        </span>
      {/if}
    </Button>
  {/each}
</nav>
