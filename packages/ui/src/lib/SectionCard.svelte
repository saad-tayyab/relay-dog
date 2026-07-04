<script lang="ts">
import type { Snippet } from 'svelte';

let {
  children,
  className = '',
}: {
  children: Snippet;
  className?: string;
} = $props();
</script>

<div class="bg-dark-card border border-dark-border rounded-xl p-6 {className}">
  {@render children()}
</div>
