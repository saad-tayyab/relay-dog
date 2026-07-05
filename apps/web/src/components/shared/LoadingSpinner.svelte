<script lang="ts">
// Pure presentational component — no props needed
import { Spinner } from "$lib/components/ui/spinner";
</script>

<div role="status" aria-label="Loading" class="flex items-center justify-center py-16">
  <Spinner class="size-12 text-accent" />
</div>
