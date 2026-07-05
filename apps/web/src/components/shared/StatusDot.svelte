<script lang="ts">
type CheckStatus = "success" | "error" | "checking" | "pending";

let { status }: { status: CheckStatus } = $props();

const COLORS: Record<CheckStatus, string> = {
	success: "bg-success",
	error: "bg-error",
	checking: "bg-warning",
	pending: "bg-text-muted",
};
</script>

<span
  aria-hidden="true"
  class="inline-block h-2.5 w-2.5 rounded-full {COLORS[status] || COLORS.pending} {status === 'checking' ? 'animate-pulse-dot' : ''}"
></span>
