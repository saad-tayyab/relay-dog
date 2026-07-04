<script lang="ts">
let { message }: { message: string } = $props();

const parsed = $derived(() => {
	if (message.startsWith("OK")) {
		const content = message.slice(2).trim();
		return { type: "ok" as const, content };
	}
	if (message.startsWith("CLOSED")) {
		const content = message.slice(6).trim();
		return { type: "closed" as const, content };
	}
	if (message.startsWith("auth-required:")) {
		const content = message.slice(14).trim();
		return { type: "auth-required" as const, content };
	}
	if (message.startsWith("restricted:")) {
		const content = message.slice(10).trim();
		return { type: "restricted" as const, content };
	}
	return { type: "other" as const, content: message };
});
</script>

<span class="text-xs">
  {#if parsed().type === 'ok'}
    <span class="text-success">OK</span> {parsed().content}
  {:else if parsed().type === 'closed'}
    <span class="text-error">CLOSED</span> {parsed().content}
  {:else if parsed().type === 'auth-required'}
    <span class="text-warning">auth-required:</span> {parsed().content}
  {:else if parsed().type === 'restricted'}
    <span class="text-error">restricted:</span> {parsed().content}
  {:else}
    {message}
  {/if}
</span>
