<script lang="ts">
import { Badge } from "$lib/components/ui/badge";

let { kind }: { kind: number } = $props();

// Theme-token-based colors that adapt to light/dark mode (matches EventCard pattern)
const KIND_COLORS: Record<number, string> = {
	0: "bg-kind-metadata-dim text-kind-metadata border-kind-metadata/30",
	1: "bg-kind-note-dim text-kind-note border-kind-note/30",
	4: "bg-kind-dm-dim text-kind-dm border-kind-dm/30",
	6: "bg-kind-unknown-dim text-kind-unknown border-kind-unknown/30",
	7: "bg-kind-note-dim text-kind-note border-kind-note/30",
	9734: "bg-kind-metadata-dim text-kind-metadata border-kind-metadata/30",
};

const KIND_LABELS: Record<number, string> = {
	0: "Metadata",
	1: "Note",
	4: "Direct Message",
	6: "Repost",
	7: "Reaction",
	9734: "Zap",
};

const DEFAULT_COLOR = "bg-kind-unknown-dim text-kind-unknown border-kind-unknown/30";

const colorClass = $derived(KIND_COLORS[kind] ?? DEFAULT_COLOR);
const label = $derived(KIND_LABELS[kind] ?? `Kind ${kind}`);
</script>

<Badge variant="outline" class={colorClass}>
  {label}
  <span class="opacity-60 ml-0.5">({kind})</span>
</Badge>
