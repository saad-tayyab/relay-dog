<script lang="ts">
import type { NostrEvent } from '@relayscope/shared';

let { onEvent }: { onEvent: (event: NostrEvent) => void } = $props();

let rawInput = $state('');
let error = $state<string | null>(null);
let isValid = $state(false);
let textarea = $state<HTMLTextAreaElement | null>(null);

const REQUIRED_FIELDS: (keyof NostrEvent)[] = [
  'id',
  'pubkey',
  'sig',
  'kind',
  'created_at',
  'tags',
  'content',
];

const EXAMPLE_EVENT: NostrEvent = {
  kind: 1,
  created_at: 1782799753,
  tags: [
    ['t', 'nostr'],
    [
      'e',
      'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      'wss://relay.damus.io',
    ],
    ['p', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'],
  ],
  content: 'Hello from Relay Dog! This is a sample Nostr event for testing the Event Verifier.',
  pubkey: '99cb2d2067ffa3fa6f20e84af42984ef013bec9efc47a69b733c09436d39619f',
  id: '8731dc3adb4f9f98d5e89b7fdcae323520753deb37fe2dfa7cb76f80568a91b2',
  sig: '009bbbd1fb51bcd1fcc6309f80558e84a959203a080d3659b38413d61b504840e96c6c07340bc8d10f425b5866ef2684bb06915078c07cfdb9b3abf2ba1a8f92',
};

function validateAndParse(input: string): void {
  if (!input.trim()) {
    error = null;
    isValid = false;
    return;
  }

  try {
    const parsed: unknown = JSON.parse(input);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      error = 'Input must be a JSON object';
      isValid = false;
      return;
    }

    const obj = parsed as Record<string, unknown>;

    for (const field of REQUIRED_FIELDS) {
      if (!(field in obj)) {
        error = `Missing required field: "${field}"`;
        isValid = false;
        return;
      }
    }

    if (typeof obj.id !== 'string') {
      error = 'Field "id" must be a string';
      isValid = false;
      return;
    }

    if (typeof obj.pubkey !== 'string') {
      error = 'Field "pubkey" must be a string';
      isValid = false;
      return;
    }

    if (typeof obj.sig !== 'string') {
      error = 'Field "sig" must be a string';
      isValid = false;
      return;
    }

    if (typeof obj.kind !== 'number') {
      error = 'Field "kind" must be a number';
      isValid = false;
      return;
    }

    if (typeof obj.created_at !== 'number') {
      error = 'Field "created_at" must be a number';
      isValid = false;
      return;
    }

    if (!Array.isArray(obj.tags)) {
      error = 'Field "tags" must be an array';
      isValid = false;
      return;
    }

    if (typeof obj.content !== 'string') {
      error = 'Field "content" must be a string';
      isValid = false;
      return;
    }

    error = null;
    isValid = true;
    onEvent(obj as unknown as NostrEvent);
  } catch {
    error = 'Invalid JSON — check syntax and try again';
    isValid = false;
  }
}

function handleInput(): void {
  validateAndParse(rawInput);
}

function loadExample(): void {
  rawInput = JSON.stringify(EXAMPLE_EVENT, null, 2);
  validateAndParse(rawInput);
  if (textarea) {
    autoResize();
  }
}

function autoResize(): void {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

$effect(() => {
  autoResize();
});
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <label for="event-json-input" class="text-sm font-medium text-text-secondary">
      Event JSON
    </label>
    <button
      type="button"
      onclick={loadExample}
      class="text-xs text-accent hover:text-accent/80 transition-colors"
    >
      Load Example
    </button>
  </div>

  <textarea
    id="event-json-input"
    bind:this={textarea}
    bind:value={rawInput}
    oninput={handleInput}
    placeholder="Paste Nostr event JSON here..."
    rows={8}
    class="w-full px-4 py-3 rounded-xl bg-dark-surface border text-sm text-text-primary placeholder:text-text-muted font-mono leading-relaxed resize-none focus:outline-none transition-colors {error
      ? 'border-error/50 focus:border-error'
      : isValid
        ? 'border-success/50 focus:border-success'
        : 'border-dark-border focus:border-accent-border'}"
  ></textarea>

  {#if error}
    <p class="text-xs text-error flex items-center gap-1.5">
      <svg
        aria-hidden="true"
        class="w-3.5 h-3.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" />
      </svg>
      {error}
    </p>
  {:else if isValid}
    <p class="text-xs text-success flex items-center gap-1.5">
      <svg
        aria-hidden="true"
        class="w-3.5 h-3.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Valid event JSON
    </p>
  {/if}
</div>
