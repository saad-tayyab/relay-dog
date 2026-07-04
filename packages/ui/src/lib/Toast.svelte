<script lang="ts">
let {
  message,
  type = 'success',
  duration = 5000,
  undoLabel,
  onUndo,
  onDismiss,
}: {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  undoLabel?: string;
  onUndo?: () => void;
  onDismiss?: () => void;
} = $props();

let visible = $state(false);
let exiting = $state(false);

// Slide in after mount
$effect(() => {
  requestAnimationFrame(() => {
    visible = true;
  });
});

// Auto-dismiss after duration
$effect(() => {
  const timer = setTimeout(() => {
    dismiss();
  }, duration);

  return () => clearTimeout(timer);
});

function dismiss() {
  if (exiting) return;
  exiting = true;
  // Wait for exit animation
  setTimeout(() => {
    onDismiss?.();
  }, 250);
}

function handleUndo() {
  onUndo?.();
  dismiss();
}

const typeStyles = {
  success: 'border-success/30 bg-success-dim',
  error: 'border-error/30 bg-error-dim',
  info: 'border-accent-border bg-accent-dim',
} as const;

const dotColors = {
  success: 'bg-success',
  error: 'bg-error',
  info: 'bg-accent',
} as const;
</script>

<div
  role="status"
  aria-live="polite"
  class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-full max-w-sm px-4 pointer-events-none"
>
  <div
    class="pointer-events-auto px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg flex items-center gap-3 text-sm transition-all duration-250 ease-out
      {typeStyles[type]}
      {visible && !exiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}"
  >
    <span
      aria-hidden="true"
      class="w-2 h-2 rounded-full shrink-0 {dotColors[type]}"
    ></span>
    <span class="flex-1 text-text-primary">{message}</span>
    {#if undoLabel && onUndo}
      <button
        type="button"
        onclick={handleUndo}
        class="min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg font-semibold text-accent hover:bg-accent-dim transition-colors text-xs shrink-0"
      >
        {undoLabel}
      </button>
    {/if}
    <button
      type="button"
      onclick={dismiss}
      class="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors shrink-0"
      aria-label="Dismiss"
    >
      <svg
        aria-hidden="true"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</div>
