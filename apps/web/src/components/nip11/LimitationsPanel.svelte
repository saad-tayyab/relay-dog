<script lang="ts">
import * as Accordion from "$lib/components/ui/accordion";
import * as Card from "$lib/components/ui/card";

let { limitation }: { limitation?: Record<string, unknown> } = $props();

const LIMITS_KEYS = [
	"max_message_length",
	"max_subscriptions",
	"max_filters",
	"max_limit",
	"max_subid_length",
	"max_event_tags",
	"max_content_length",
	"default_limit",
];

const POLICIES_KEYS = [
	"auth_required",
	"payment_required",
	"restricted_writes",
	"min_pow_difficulty",
	"created_at_lower_limit",
	"created_at_upper_limit",
];

const LABELS: Record<string, string> = {
	max_message_length: "Max Message Size",
	max_subscriptions: "Max Subscriptions",
	max_filters: "Max Filters",
	max_limit: "Max Query Limit",
	max_subid_length: "Max Subscription ID Length",
	max_event_tags: "Max Event Tags",
	max_content_length: "Max Content Length",
	default_limit: "Default Limit",
	min_pow_difficulty: "Min PoW Difficulty",
	auth_required: "Auth Required",
	payment_required: "Payment Required",
	restricted_writes: "Restricted Writes",
	created_at_lower_limit: "Created At Lower Limit",
	created_at_upper_limit: "Created At Upper Limit",
};

const BOOLEAN_KEYS = ["auth_required", "payment_required", "restricted_writes"];

const limitsItems = $derived(
	limitation
		? Object.entries(limitation).filter(
				([k, v]) => LIMITS_KEYS.includes(k) && v !== undefined && v !== null,
			)
		: [],
);

const policiesItems = $derived(
	limitation
		? Object.entries(limitation).filter(
				([k, v]) => POLICIES_KEYS.includes(k) && v !== undefined && v !== null,
			)
		: [],
);

const otherItems = $derived(
	limitation
		? Object.entries(limitation).filter(
				([k, v]) =>
					!LIMITS_KEYS.includes(k) &&
					!POLICIES_KEYS.includes(k) &&
					v !== undefined &&
					v !== null,
			)
		: [],
);
</script>

{#if limitation && (limitsItems.length > 0 || policiesItems.length > 0 || otherItems.length > 0)}
  <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md animate-fade-in"><Card.Content class="p-5 lg:p-6">
    <h3 class="text-sm font-semibold text-foreground mb-4">
      Limitations & Policies
    </h3>
    <Accordion.Root type="multiple" class="space-y-2">
      <!-- Limits -->
      {#if limitsItems.length > 0}
        <Accordion.Item value="limits" class="rounded-lg border border-border">
          <Accordion.Trigger class="px-4 py-3 text-sm font-medium text-foreground hover:no-underline">
            Limits ({limitsItems.length})
          </Accordion.Trigger>
          <Accordion.Content class="px-4 pb-3">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {#each limitsItems as [key, val] (key)}
                <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <dt class="text-xs text-muted-foreground">
                    {LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </dt>
                  <dd class="text-xs font-mono font-medium text-foreground">
                    {typeof val === 'number' ? val.toLocaleString() : String(val)}
                  </dd>
                </div>
              {/each}
            </dl>
          </Accordion.Content>
        </Accordion.Item>
      {/if}

      <!-- Policies -->
      {#if policiesItems.length > 0}
        <Accordion.Item value="policies" class="rounded-lg border border-border">
          <Accordion.Trigger class="px-4 py-3 text-sm font-medium text-foreground hover:no-underline">
            Policies ({policiesItems.length})
          </Accordion.Trigger>
          <Accordion.Content class="px-4 pb-3">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {#each policiesItems as [key, val] (key)}
                {@const isBool = BOOLEAN_KEYS.includes(key)}
                {@const isTrue = val === true}
                <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <dt class="text-xs text-muted-foreground">
                    {LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
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
                    <dd class="text-xs font-mono font-medium text-foreground">
                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                    </dd>
                  {/if}
                </div>
              {/each}
            </dl>
          </Accordion.Content>
        </Accordion.Item>
      {/if}

      <!-- Other -->
      {#if otherItems.length > 0}
        <Accordion.Item value="other" class="rounded-lg border border-border">
          <Accordion.Trigger class="px-4 py-3 text-sm font-medium text-foreground hover:no-underline">
            Other ({otherItems.length})
          </Accordion.Trigger>
          <Accordion.Content class="px-4 pb-3">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {#each otherItems as [key, val] (key)}
                <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <dt class="text-xs text-muted-foreground">
                    {LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </dt>
                  <dd class="text-xs font-mono font-medium text-foreground">
                    {typeof val === 'number' ? val.toLocaleString() : String(val)}
                  </dd>
                </div>
              {/each}
            </dl>
          </Accordion.Content>
        </Accordion.Item>
      {/if}
    </Accordion.Root>
  </Card.Content></Card.Root>
{/if}
