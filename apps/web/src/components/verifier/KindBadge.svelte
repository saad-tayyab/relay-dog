<script lang="ts">
let { kind }: { kind: number } = $props();

const KIND_COLORS: Record<number, string> = {
  0: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  1: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  4: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  6: 'bg-red-500/15 text-red-400 border-red-500/30',
  7: 'bg-green-500/15 text-green-400 border-green-500/30',
  9734: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

const KIND_LABELS: Record<number, string> = {
  0: 'Metadata',
  1: 'Note',
  4: 'Direct Message',
  6: 'Repost',
  7: 'Reaction',
  9734: 'Zap',
};

const DEFAULT_COLOR = 'bg-gray-500/15 text-gray-400 border-gray-500/30';

const colorClass = $derived(KIND_COLORS[kind] ?? DEFAULT_COLOR);
const label = $derived(KIND_LABELS[kind] ?? `Kind ${kind}`);
</script>

<span
  class="text-xs font-medium px-2 py-0.5 rounded border {colorClass}"
>
  {label}
  <span class="opacity-60 ml-0.5">({kind})</span>
</span>
