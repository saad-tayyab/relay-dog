<script lang="ts">
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
    class="w-16 h-16 rounded-full bg-error-dim flex items-center justify-center mb-4"
  >
    <svg
      aria-hidden="true"
      class="w-8 h-8 text-error"
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
  <p class="text-error font-medium mb-1">Failed to fetch relay info</p>
  <p class="text-text-muted text-sm max-w-md mb-4">{message}</p>
  {#if onRetry}
    <button
      type="button"
      onclick={onRetry}
      class="min-h-[44px] px-4 py-2.5 rounded-lg bg-dark-surface border border-dark-border text-text-secondary hover:text-text-primary hover:border-accent-border transition-all text-sm"
    >
      Try again
    </button>
  {/if}
</div>
