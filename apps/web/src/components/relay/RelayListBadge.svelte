<script lang="ts">
let {
  readCount,
  writeCount,
}: {
  readCount: number;
  writeCount: number;
} = $props();
</script>

<div class="flex items-center gap-3 text-[10px] text-text-muted">
  {#if readCount > 0}
    <span class="flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
      {readCount} read{readCount !== 1 ? 's' : ''}
    </span>
  {/if}
  {#if writeCount > 0}
    <span class="flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
      {writeCount} write{writeCount !== 1 ? 's' : ''}
    </span>
  {/if}
  {#if readCount === 0 && writeCount === 0}
    <span class="text-text-muted">Not listed in any relay lists</span>
  {/if}
</div>
