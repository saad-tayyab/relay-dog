<script lang="ts">
import type { RelayInfo } from '../utils/relay';
import SectionCard from './SectionCard.svelte';

let { info }: { info: RelayInfo } = $props();

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
}
</script>

<SectionCard className="animate-fade-in">
  <div class="flex items-start gap-5">
    {#if info.icon}
      <img
        src={info.icon}
        alt="Relay icon"
        class="w-16 h-16 rounded-xl border border-dark-border object-cover shrink-0"
        onerror={handleImageError}
      />
    {/if}
    <div class="flex-1 min-w-0">
      <h2 class="text-2xl font-bold text-text-primary mb-1">
        {info.name || 'Unknown Relay'}
      </h2>
      {#if info.description}
        <p class="text-text-secondary leading-relaxed mb-3">{info.description}</p>
      {/if}
      <div class="flex flex-wrap gap-3 text-sm text-text-muted">
        {#if info.software}
          <span class="flex items-center gap-1.5">
            <svg
              aria-hidden="true"
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {info.software}
          </span>
        {/if}
        {#if info.version}
          <span class="flex items-center gap-1.5">
            <svg
              aria-hidden="true"
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            v{info.version}
          </span>
        {/if}
      </div>
    </div>
  </div>
</SectionCard>
