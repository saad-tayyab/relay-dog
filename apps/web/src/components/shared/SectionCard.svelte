<script lang="ts">
import type { Snippet } from "svelte";
import * as Card from "$lib/components/ui/card";

let {
	children,
	className = "",
}: {
	children?: Snippet;
	className?: string;
} = $props();
</script>

<Card.Root class="rounded-xl border-dark-border bg-dark-card shadow-sm shadow-black/20 transition-shadow hover:shadow-md {className}">
  <Card.Content class="p-6 lg:p-8">
    {@render children?.()}
  </Card.Content>
</Card.Root>
