<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { hasBackend } from "../../utils/api";
import type { Section } from "../../utils/router";

let {
	activeSection,
	onNavigate,
}: {
	activeSection: Section;
	onNavigate: (section: Section) => void;
} = $props();

const sections: { id: Section; label: string; icon: string }[] = [
	{ id: "inspector", label: "Inspector", icon: "⚡" },
	{ id: "verifier", label: "Verifier", icon: "🔐" },
	{ id: "publisher", label: "Publisher", icon: "✍️" },
	{ id: "tools", label: "Tools", icon: "🧰" },
	...(hasBackend ? [{ id: "directory" as Section, label: "Directory", icon: "📂" }] : []),
];
</script>

<nav aria-label="Section navigation" class="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm sm:hidden">
  <div class="flex items-center justify-around px-2 py-2">
    {#each sections as section (section.id)}
      <Button
        type="button"
        variant="ghost"
        onclick={() => onNavigate(section.id)}
        aria-current={activeSection === section.id ? 'page' : undefined}
        class="min-h-[44px] min-w-[44px] rounded-lg px-3 py-1.5 transition-all {activeSection === section.id
          ? 'text-primary'
          : 'text-muted-foreground'}"
      >
        <span class="text-lg" aria-hidden="true">{section.icon}</span>
        <span class="text-xs font-medium">{section.label}</span>
      </Button>
    {/each}
  </div>
</nav>
