<script lang="ts">
type CheckStatus = 'success' | 'error' | 'checking' | 'pending';

let { status, class: className }: { status: CheckStatus; class?: string } = $props();

const COLORS: Record<CheckStatus, string> = {
  success: 'bg-success',
  error: 'bg-error',
  checking: 'bg-warning',
  pending: 'bg-muted-foreground',
};
</script>

<span
  data-slot="status-dot"
  aria-hidden="true"
  class="inline-block h-2.5 w-2.5 rounded-full {COLORS[status]} {status === 'checking' ? 'animate-pulse-dot' : ''} {className ?? ''}"
></span>
