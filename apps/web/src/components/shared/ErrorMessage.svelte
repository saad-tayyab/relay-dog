<script lang="ts">
import { Button } from "$lib/components/ui/button";

let {
	message,
	onRetry,
}: {
	message: string;
	onRetry?: () => void;
} = $props();
</script>

<div role="alert" class="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
  <div
    class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-dim"
  >
    <svg
      aria-hidden="true"
      class="h-8 w-8 text-error"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  </div>
  <p class="mb-1 font-medium text-error">Failed to fetch relay info</p>
  <p class="mb-4 max-w-md text-sm text-text-muted">{message}</p>
  {#if onRetry}
    <Button type="button" variant="outline" onclick={onRetry} class="min-h-[44px] border-dark-border bg-dark-surface text-sm text-text-secondary hover:border-accent-border hover:text-text-primary">
      Try again
    </Button>
  {/if}
</div>
