<script lang="ts">
import type { ExpirationInfo } from "@relayscope/shared";

let { expirationInfo }: { expirationInfo: ExpirationInfo | null } = $props();

function formatRemaining(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d`;
	if (hours > 0) return `${hours}h`;
	if (minutes > 0) return `${minutes}m`;
	return `${seconds}s`;
}
</script>

{#if expirationInfo?.isExpired}
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-error/10 border border-error/20 text-error"
  >
    <span>⚠</span>
    <span>Expired</span>
  </span>
{:else if expirationInfo?.expiresAt}
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-warning/10 border border-warning/20 text-warning"
  >
    <span>⏰</span>
    <span>Expires in {formatRemaining(expirationInfo.remainingMs ?? 0)}</span>
  </span>
{/if}
