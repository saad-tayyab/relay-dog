<script lang="ts">
import type { AuthStatus } from "@relayscope/shared";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";

let {
	status,
	onAuthenticate,
}: { status: AuthStatus; onAuthenticate?: () => void } = $props();

const displayConfig = $derived.by(() => {
	switch (status) {
		case "authenticated":
			return {
				label: "Authenticated",
				color: "text-success",
				bg: "bg-success-dim",
				border: "border-success/20",
				icon: "✓",
			};
		case "auth_required":
			return {
				label: "Auth Required",
				color: "text-warning",
				bg: "bg-warning-dim",
				border: "border-warning/20",
				icon: "🔑",
			};
		case "authenticating":
			return {
				label: "Authenticating…",
				color: "text-accent",
				bg: "bg-accent-dim",
				border: "border-accent-border",
				icon: "⏳",
			};
		case "auth_failed":
			return {
				label: "Auth Failed",
				color: "text-error",
				bg: "bg-error-dim",
				border: "border-error/20",
				icon: "✗",
			};
		default:
			return {
				label: "Anonymous",
				color: "text-text-muted",
				bg: "bg-dark-surface",
				border: "border-dark-border",
				icon: "○",
			};
	}
});
</script>

<div class="flex items-center gap-2">
  <Badge variant="outline" class="{displayConfig.color} {displayConfig.bg} {displayConfig.border}">
    <span>{displayConfig.icon}</span>
    {displayConfig.label}
  </Badge>

  {#if status === 'auth_required' && onAuthenticate}
    <Button
      variant="default"
      size="sm"
      onclick={onAuthenticate}
      class="bg-accent text-white hover:opacity-90 transition-all"
    >
      Authenticate
    </Button>
  {/if}
</div>
