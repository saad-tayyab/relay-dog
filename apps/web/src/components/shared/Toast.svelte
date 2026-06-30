<script lang="ts">
type ToastType = 'success' | 'error' | 'warning' | 'info';
type Props = {
  message: string;
  type?: ToastType;
  onclose?: () => void;
  duration?: number;
};

let { message, type = 'info', onclose, duration = 5000 }: Props = $props();

$effect(() => {
  if (duration > 0 && onclose) {
    const timer = setTimeout(() => onclose(), duration);
    return () => clearTimeout(timer);
  }
});

const iconMap: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};
</script>

<div
  role="alert"
  class="flex items-center gap-3 px-4 py-3 rounded-lg border animate-fade-in
         {type === 'success' ? 'bg-success-dim border-success/30 text-success' : ''}
         {type === 'error' ? 'bg-error-dim border-error/30 text-error' : ''}
         {type === 'warning' ? 'bg-warning-dim border-warning/30 text-warning' : ''}
         {type === 'info' ? 'bg-accent-dim border-accent/30 text-accent' : ''}"
>
  <span class="text-lg shrink-0" aria-hidden="true">{iconMap[type]}</span>
  <span class="flex-1 text-sm">{message}</span>
  {#if onclose}
    <button
      onclick={onclose}
      aria-label="Dismiss notification"
      class="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0
             text-text-muted hover:text-text-primary transition-colors cursor-pointer"
    >
      <span aria-hidden="true">✕</span>
    </button>
  {/if}
</div>
