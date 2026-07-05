<script lang="ts">
import * as Card from "$lib/components/ui/card";
import * as Popover from "$lib/components/ui/popover";
import { NIP_INFO } from "../../utils/nip-constants";

let { nips }: { nips: number[] } = $props();

const nipLink = (n: number) =>
	`https://github.com/nostr-protocol/nips/blob/master/${String(n).padStart(2, "0")}.md`;

const sortedNips = $derived([...nips].sort((a, b) => a - b));
</script>

{#if nips && nips.length > 0}
  <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md animate-fade-in"><Card.Content class="p-5 lg:p-6">
    <h3 class="text-sm font-semibold text-foreground mb-4">
      Supported NIPs ({nips.length})
    </h3>
    <ul class="flex flex-wrap gap-2">
      {#each sortedNips as n (n)}
        {@const info = NIP_INFO[n]}
        <li>
          <Popover.Root>
            <Popover.Trigger class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:brightness-110 hover:shadow-sm cursor-pointer"
              style="background-color: {info?.color || '#60a5fa'}20; color: {info?.color || '#60a5fa'}; border: 1px solid {info?.color || '#60a5fa'}40"
            >
              <span class="font-bold">NIP-{n}</span>
              {#if info?.desc}
                <span class="hidden sm:inline opacity-70">· {info.desc}</span>
              {/if}
            </Popover.Trigger>
            <Popover.Content class="w-72 p-4" align="start">
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-semibold text-foreground">
                    {info?.name || `NIP-${n}`}
                  </h4>
                  <a
                    href={nipLink(n)}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-primary hover:underline"
                  >
                    Spec ↗
                  </a>
                </div>
                {#if info?.desc}
                  <p class="text-xs text-muted-foreground">{info.desc}</p>
                {:else}
                  <p class="text-xs text-muted-foreground">No description available.</p>
                {/if}
                <p class="text-[10px] text-muted-foreground font-mono">NIP-{n}</p>
              </div>
            </Popover.Content>
          </Popover.Root>
        </li>
      {/each}
    </ul>
  </Card.Content></Card.Root>
{/if}
