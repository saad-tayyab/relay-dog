<script lang="ts">
import type { ExpirationInfo } from "@relayscope/shared";
import { Badge } from "$lib/components/ui/badge";

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
  <Badge variant="destructive" class="bg-error-dim border-error/20 text-error">
    <span>⚠</span>
    <span>Expired</span>
  </Badge>
{:else if expirationInfo?.expiresAt}
  <Badge variant="outline" class="bg-warning-dim border-warning/20 text-warning">
    <span>⏰</span>
    <span>Expires in {formatRemaining(expirationInfo.remainingMs ?? 0)}</span>
  </Badge>
{/if}
