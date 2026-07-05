<script lang="ts">
import * as Card from "$lib/components/ui/card";

let { limitation }: { limitation?: Record<string, unknown> } = $props();

const LABELS: Record<string, string> = {
	max_message_length: "Max Message Size",
	max_subscriptions: "Max Subscriptions",
	max_filters: "Max Filters",
	max_limit: "Max Query Limit",
	max_subid_length: "Max Subscription ID Length",
	max_event_tags: "Max Event Tags",
	max_content_length: "Max Content Length",
	min_pow_difficulty: "Min PoW Difficulty",
	auth_required: "Auth Required",
	payment_required: "Payment Required",
	restricted_writes: "Restricted Writes",
	created_at_lower_limit: "Created At Lower Limit",
	created_at_upper_limit: "Created At Upper Limit",
};

const BOOLEAN_KEYS = ["auth_required", "payment_required", "restricted_writes"];

const items = $derived(
	limitation
		? Object.entries(limitation).filter(
				([, v]) => v !== undefined && v !== null,
			)
		: [],
);
</script>

{#if limitation && items.length > 0}
  <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md animate-fade-in"><Card.Content class="p-5 lg:p-6">
    <h3 class="text-sm font-semibold text-text-primary mb-4">
      Limitations & Policies
    </h3>
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each items as [key, val] (key)}
        {@const isBool = BOOLEAN_KEYS.includes(key)}
        {@const isTrue = val === true}
        <div
          class="flex items-center justify-between px-4 py-3 rounded-lg bg-dark-surface border border-dark-border"
        >
          <dt class="text-sm text-text-secondary">
            {LABELS[key] ||
              key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </dt>
          {#if isBool}
            <dd>
              <span
                class="text-xs font-semibold px-2.5 py-1 rounded-full {isTrue
                  ? 'bg-error-dim text-error'
                  : 'bg-success-dim text-success'}"
              >
                {isTrue ? 'Yes' : 'No'}
              </span>
            </dd>
          {:else}
            <dd class="text-sm font-mono font-medium text-text-primary">
              {typeof val === 'number' ? val.toLocaleString() : String(val)}
            </dd>
          {/if}
        </div>
      {/each}
    </dl>
  </Card.Content></Card.Root>
{/if}
