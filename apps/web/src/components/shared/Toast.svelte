<script lang="ts">
let {
	message,
	type = "success",
	duration = 5000,
	undoLabel,
	onUndo,
	onDismiss,
}: {
	message: string;
	type?: "success" | "error" | "info";
	duration?: number;
	undoLabel?: string;
	onUndo?: () => void;
	onDismiss?: () => void;
} = $props();

let visible = $state(false);
let exiting = $state(false);

$effect(() => {
	requestAnimationFrame(() => {
		visible = true;
	});
});

$effect(() => {
	const timer = setTimeout(() => {
		dismiss();
	}, duration);

	return () => clearTimeout(timer);
});

function dismiss() {
	if (exiting) return;
	exiting = true;
	setTimeout(() => {
		onDismiss?.();
	}, 250);
}

function handleUndo() {
	onUndo?.();
	dismiss();
}

const typeStyles = {
	success: "border-success/30 bg-success-dim",
	error: "border-error/30 bg-error-dim",
	info: "border-accent-border bg-accent-dim",
} as const;

const dotColors = {
	success: "bg-success",
	error: "bg-error",
	info: "bg-accent",
} as const;
</script>

<div
  role="status"
  aria-live="polite"
  class="pointer-events-none fixed bottom-6 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4"
>
  <div
    class="pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm transition-all duration-250 ease-out
      {typeStyles[type]}
      {visible && !exiting ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}"
  >
    <span
      aria-hidden="true"
      class="h-2 w-2 shrink-0 rounded-full {dotColors[type]}"
    ></span>
    <span class="flex-1 text-text-primary">{message}</span>
    {#if undoLabel && onUndo}
      <button
        type="button"
        onclick={handleUndo}
        class="min-h-[44px] min-w-[44px] shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent-dim"
      >
        {undoLabel}
      </button>
    {/if}
    <button
      type="button"
      onclick={dismiss}
      class="min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-text-muted transition-colors hover:text-text-primary"
      aria-label="Dismiss"
    >
      <svg
        aria-hidden="true"
        class="h-4 w-4"
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
