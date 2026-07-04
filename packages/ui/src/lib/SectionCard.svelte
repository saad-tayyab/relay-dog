<script lang="ts">
import type { Snippet } from "svelte";

let {
	children,
	className = "",
}: {
	children: Snippet;
	className?: string;
} = $props();
</script>

<div class="bg-dark-card border border-dark-border rounded-xl shadow-sm shadow-black/20 p-6 lg:p-8 transition-shadow hover:shadow-md {className}">
  {@render children()}
</div>
