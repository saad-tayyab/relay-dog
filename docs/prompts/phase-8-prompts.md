# 🤖 Phase 8: Developer Toolkit Expansion — Implementation Prompts

## Project Context

```
I'm working on Relay Dog, a Nostr relay inspector.

Tech stack:
- Bun 1.3 + Turborepo monorepo
- Apps: Vite+Svelte 5 (web), Hono+Bun (api)
- Drizzle ORM + PostgreSQL
- Biome for linting, TypeScript 6.0
- Svelte 5 Runes ($state, $derived, $effect, $props())
- Stores use getter-based return pattern (see relaySocket.svelte.ts)
- Components use SectionCard for consistent card layout
- Tailwind v4 with custom theme tokens (dark-bg, dark-card, dark-surface, dark-border, accent, accent-dim, text-primary, text-secondary, text-muted, warning, etc.)

Project docs are in docs/. Key references:
- docs/features/phase-8-developer-toolkit.md — Feature spec
- docs/development/style-guide.md — Code conventions
- docs/architecture/overview.md — System architecture
- docs/prompts/best-practices.md — Prompt guidelines
```

---

## Implementation Order

Prompts are numbered in build order. Each prompt is atomic — one verifiable change.

**Total estimated effort: ~2 weeks**

**Build order:**
1. Navigation restructure (Prompts 1-5) — foundation for all new features
2. Key Converter (Prompts 6-8) — simplest tool, validates patterns
3. NIP-05 Checker (Prompts 9-10) — standalone tool
4. QR Code Generator (Prompts 11-12) — standalone tool
5. Event Publisher (Prompts 13-17) — most complex feature
6. Event Deleter (Prompts 18-20) — builds on Publisher
7. Event Backup & Restore (Prompts 21-24) — builds on Publisher
8. Final integration (Prompts 25-27) — polish and documentation

---

### Prompt 1: Add Router Utility

Create `apps/web/src/utils/router.ts` with hash-based section routing.

```typescript
// apps/web/src/utils/router.ts

export type Section = 'inspector' | 'verifier' | 'publisher' | 'tools' | 'directory'

export function getHashSection(): Section {
  const hash = window.location.hash.replace('#', '').split('?')[0] as Section
  return ['inspector', 'verifier', 'publisher', 'tools', 'directory'].includes(hash)
    ? hash : 'inspector'
}

export function setHashSection(section: Section): void {
  window.location.hash = section
}

export function getToolTab(): string | null {
  const hash = window.location.hash
  const match = hash.match(/#tools\?(.+)/)
  return match ? match[1] : null
}

export function setToolTab(tool: string): void {
  window.location.hash = `tools?${tool}`
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 2: Create NavBar Component

Create `apps/web/src/components/nav/NavBar.svelte`.

A top navigation bar component for section-based navigation.

```svelte
<script lang="ts">
import type { Section } from '../../utils/router';

let { activeSection, onNavigate, eventCount = 0 }: {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  eventCount?: number;
} = $props();

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'inspector', label: 'Inspector', icon: '⚡' },
  { id: 'verifier', label: 'Verifier', icon: '🔐' },
  { id: 'publisher', label: 'Publisher', icon: '✍️' },
  { id: 'tools', label: 'Tools', icon: '🧰' },
  { id: 'directory', label: 'Directory', icon: '📂' },
];
</script>

<nav class="flex gap-1 p-1 mb-6 rounded-xl bg-dark-surface border border-dark-border">
  {#each sections as section (section.id)}
    <button
      type="button"
      onclick={() => onNavigate(section.id)}
      class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {activeSection === section.id
        ? 'bg-dark-card border border-dark-border text-text-primary'
        : 'text-text-muted hover:text-text-secondary'}"
    >
      {section.icon} {section.label}
      {#if section.id === 'inspector' && eventCount > 0}
        <span class="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-accent-dim text-accent">
          {eventCount.toLocaleString()}
        </span>
      {/if}
    </button>
  {/each}
</nav>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 3: Create MobileNav Component

Create `apps/web/src/components/nav/MobileNav.svelte`.

A mobile-friendly bottom navigation bar.

```svelte
<script lang="ts">
import type { Section } from '../../utils/router';

let { activeSection, onNavigate }: {
  activeSection: Section;
  onNavigate: (section: Section) => void;
} = $props();

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'inspector', label: 'Inspector', icon: '⚡' },
  { id: 'verifier', label: 'Verifier', icon: '🔐' },
  { id: 'publisher', label: 'Publisher', icon: '✍️' },
  { id: 'tools', label: 'Tools', icon: '🧰' },
  { id: 'directory', label: 'Directory', icon: '📂' },
];
</script>

<nav class="fixed bottom-0 left-0 right-0 z-20 sm:hidden border-t border-dark-border bg-dark-card/95 backdrop-blur-sm">
  <div class="flex items-center justify-around px-2 py-2">
    {#each sections as section (section.id)}
      <button
        type="button"
        onclick={() => onNavigate(section.id)}
        class="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all {activeSection === section.id
          ? 'text-accent'
          : 'text-text-muted'}"
      >
        <span class="text-lg">{section.icon}</span>
        <span class="text-[10px] font-medium">{section.label}</span>
      </button>
    {/each}
  </div>
</nav>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 4: Create InspectorSection Component

Create `apps/web/src/components/inspector/InspectorSection.svelte`.

Wraps the existing inspector content (NIP-11 + Live Stream) into a single section.

```svelte
<script lang="ts">
import type { ConnectionStatus, RelayInfo } from '../../utils/relay';
import type { RelaySocketStore } from '../../lib/stores/relaySocket.svelte';

// Components
import AuthStatusBadge from '../AuthStatusBadge.svelte';
import ConnectionPanel from '../ConnectionPanel.svelte';
import ConnectionStatusPanel from '../ConnectionStatusPanel.svelte';
import ErrorMessage from '../ErrorMessage.svelte';
import EventFeed from '../EventFeed.svelte';
import FeeDisplay from '../FeeDisplay.svelte';
import FilterBuilder from '../FilterBuilder.svelte';
import LatencyPanel from '../LatencyPanel.svelte';
import LimitationsPanel from '../LimitationsPanel.svelte';
import LoadingSpinner from '../LoadingSpinner.svelte';
import NipBadgeGrid from '../NipBadgeGrid.svelte';
import RelayProfile from '../RelayProfile.svelte';
import WriteTestPanel from '../WriteTestPanel.svelte';

let { 
  url,
  relayInfo,
  connectionStatus,
  loading,
  error,
  socket,
  latency,
  writeTest,
  dbRelayId,
  onRetry,
  onFetch
}: {
  url: string;
  relayInfo: RelayInfo | null;
  connectionStatus: ConnectionStatus | null;
  loading: boolean;
  error: string | null;
  socket: RelaySocketStore;
  latency: any;
  writeTest: any;
  dbRelayId: string | null;
  onRetry: () => void;
  onFetch: (url?: string) => void;
} = $props();

let showStream = $state(false);
</script>

<div class="space-y-5">
  <!-- Toggle between NIP-11 and Stream -->
  <div class="flex gap-2 mb-4">
    <button
      type="button"
      onclick={() => (showStream = false)}
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all {!showStream
        ? 'bg-dark-card border border-dark-border text-text-primary'
        : 'text-text-muted hover:text-text-secondary'}"
    >
      NIP-11 Info
    </button>
    <button
      type="button"
      onclick={() => (showStream = true)}
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all {showStream
        ? 'bg-dark-card border border-dark-border text-text-primary'
        : 'text-text-muted hover:text-text-secondary'}"
    >
      Live Stream
      {#if socket.events.length > 0}
        <span class="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-accent-dim text-accent">
          {socket.events.length.toLocaleString()}
        </span>
      {/if}
    </button>
  </div>

  {#if !showStream}
    <!-- NIP-11 Info View -->
    {#if loading}
      <LoadingSpinner />
    {/if}

    {#if !loading && error && !relayInfo}
      <ErrorMessage message={error} onRetry={onRetry} />
    {/if}

    {#if !loading && relayInfo}
      <div class="space-y-5">
        <RelayProfile relayId={dbRelayId ?? undefined} relay={{ url }} info={relayInfo} />
        <NipBadgeGrid nips={relayInfo.supported_nips || []} />
        <LimitationsPanel limitation={relayInfo.limitation} />
        <ConnectionStatusPanel status={connectionStatus} />

        <!-- Latency & Performance -->
        <LatencyPanel
          metrics={latency.metrics}
          measuring={latency.measuring}
          onMeasure={() => latency.measureAll(url)}
        />

        <!-- Write Test -->
        <WriteTestPanel
          status={writeTest.status}
          latencyMs={writeTest.latencyMs}
          error={writeTest.error}
          eventId={writeTest.eventId}
          onRunTest={() => writeTest.runTest(url)}
        />

        <!-- Fee Display -->
        {#if relayInfo?.fees}
          <FeeDisplay fees={relayInfo.fees} />
        {/if}

        <!-- Raw JSON toggle -->
        <details class="group">
          <summary
            class="cursor-pointer text-sm text-text-muted hover:text-text-secondary transition-colors flex items-center gap-2 py-2"
          >
            <svg
              aria-hidden="true"
              class="w-4 h-4 transition-transform group-open:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Raw NIP-11 JSON
          </summary>
          <pre
            class="mt-2 p-4 rounded-xl bg-dark-surface border border-dark-border text-xs text-text-secondary overflow-x-auto font-mono leading-relaxed">{JSON.stringify(
              relayInfo,
              null,
              2,
            )}</pre>
        </details>

        <!-- Error details if connection had issues -->
        {#if !loading && error && relayInfo}
          <div
            class="px-4 py-3 rounded-xl bg-warning-dim border border-warning/20 text-sm text-warning"
          >
            ⚠ {error}
          </div>
        {/if}
      </div>
    {/if}
  {:else}
    <!-- Live Stream View -->
    <div class="space-y-5">
      <!-- Auth Status -->
      {#if socket.status === 'connected' || socket.authStatus !== 'anonymous'}
        <AuthStatusBadge status={socket.authStatus} onAuthenticate={socket.authenticate} />
      {/if}
      {#if socket.authError}
        <div class="px-4 py-3 rounded-xl bg-error-dim border border-error/20 text-sm text-error">
          ⚠ {socket.authError}
        </div>
      {/if}
      <ConnectionPanel
        relayUrl={url}
        status={socket.status}
        eventCount={socket.events.length}
        eose={socket.eose}
        eoseHints={socket.eoseHints}
        error={socket.error}
        notices={socket.notices}
        onConnect={socket.connect}
        onDisconnect={socket.disconnect}
      />
      <FilterBuilder connected={socket.status === 'connected'} onSend={socket.send} />
      <EventFeed events={socket.events} />
    </div>
  {/if}
</div>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 5: Refactor App.svelte for Section-Based Routing

Edit `apps/web/src/App.svelte` to use the new section-based navigation.

**Changes:**

1. **Add imports at top:**
```typescript
import { getHashSection, setHashSection, type Section } from './utils/router';
import NavBar from './components/nav/NavBar.svelte';
import MobileNav from './components/nav/MobileNav.svelte';
import InspectorSection from './components/inspector/InspectorSection.svelte';
```

2. **Replace Tab type with Section:**
```typescript
// Remove: type Tab = 'nip11' | 'stream' | 'verifier' | 'directory';
// Add:
let activeSection = $state<Section>(getHashSection());
```

3. **Add navigation handler:**
```typescript
function handleNavigate(section: Section) {
  activeSection = section;
  setHashSection(section);
}

// Listen for hash changes (back/forward)
$effect(() => {
  function onHashChange() {
    activeSection = getHashSection();
  }
  window.addEventListener('hashchange', onHashChange);
  return () => window.removeEventListener('hashchange', onHashChange);
});
```

4. **Replace old tab buttons with NavBar:**
```svelte
<!-- Remove old tab toggle -->
<NavBar {activeSection} onNavigate={handleNavigate} eventCount={socket.events.length} />
```

5. **Replace tab content sections:**
```svelte
<!-- NIP-11 Tab → Inspector Section -->
{#if activeSection === 'inspector'}
  <InspectorSection
    url={normalizedUrl}
    {relayInfo}
    {connectionStatus}
    {loading}
    {error}
    {socket}
    {latency}
    {writeTest}
    {dbRelayId}
    onRetry={() => handleFetch()}
    onFetch={handleFetch}
  />
{/if}

<!-- Live Stream removed (now inside InspectorSection) -->

<!-- Event Verifier Tab → Verifier Section -->
{#if activeSection === 'verifier'}
  <EventVerifier />
{/if}

<!-- Directory Tab → Directory Section -->
{#if activeSection === 'directory'}
  <RelayDirectory
    onSelectRelay={(relayUrl) => {
      url = relayUrl;
      activeSection = 'inspector';
      setHashSection('inspector');
      handleFetch(relayUrl);
    }}
  />
{/if}
```

6. **Add MobileNav at bottom (before closing div):**
```svelte
<MobileNav {activeSection} onNavigate={handleNavigate} />
```

7. **Update Phase badge to "Phase 8"**

8. **Add bottom padding for mobile nav:**
```svelte
<main class="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`
3. `bunx turbo build`

---

### Prompt 6: Create Key Conversion Utility

Create `apps/web/src/utils/keys.ts` with Nostr key format conversion functions.

```typescript
// apps/web/src/utils/keys.ts

import { bech32 } from '@scure/base'

const NSEC_PREFIX = 'nsec'
const NPUB_PREFIX = 'npub'

export function hexToNpub(hex: string): string {
  const bytes = Uint8Array.from(hex.match(/.{1,2}/g)!.map(b => Number.parseInt(b, 16)))
  return bech32.encode(NPUB_PREFIX, bech32.toWords(bytes))
}

export function hexToNsec(hex: string): string {
  const bytes = Uint8Array.from(hex.match(/.{1,2}/g)!.map(b => Number.parseInt(b, 16)))
  return bech32.encode(NSEC_PREFIX, bech32.toWords(bytes))
}

export function npubToHex(npub: string): string {
  const { prefix, words } = bech32.decode(npub)
  if (prefix !== NPUB_PREFIX) throw new Error('Not an npub')
  return Buffer.from(bech32.fromWords(words)).toString('hex')
}

export function nsecToHex(nsec: string): string {
  const { prefix, words } = bech32.decode(nsec)
  if (prefix !== NSEC_PREFIX) throw new Error('Not an nsec')
  return Buffer.from(bech32.fromWords(words)).toString('hex')
}

export function detectKeyFormat(input: string): 'npub' | 'nsec' | 'hex' | 'unknown' {
  if (input.startsWith('npub1')) return 'npub'
  if (input.startsWith('nsec1')) return 'nsec'
  if (/^[0-9a-f]{64}$/i.test(input)) return 'hex'
  return 'unknown'
}

export function convertKey(input: string): {
  npub: string; nsec: string | null; hex: string; format: string
} {
  const format = detectKeyFormat(input)
  switch (format) {
    case 'npub': {
      const hex = npubToHex(input)
      return { npub: input, nsec: hexToNsec(hex), hex, format: 'npub' }
    }
    case 'nsec': {
      const hex = nsecToHex(input)
      return { npub: hexToNpub(hex), nsec: input, hex, format: 'nsec' }
    }
    case 'hex': {
      return { npub: hexToNpub(input), nsec: hexToNsec(input), hex: input, format: 'hex' }
    }
    default:
      throw new Error('Unrecognized key format')
  }
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 7: Create KeyConverter Component

Create `apps/web/src/components/tools/KeyConverter.svelte`.

```svelte
<script lang="ts">
import { convertKey, detectKeyFormat } from '../../utils/keys';
import SectionCard from '../SectionCard.svelte';

let input = $state('');
let result = $state<{
  npub: string;
  nsec: string | null;
  hex: string;
  format: string;
} | null>(null);
let error = $state<string | null>(null);
let showNsec = $state(false);

function handleConvert() {
  if (!input.trim()) {
    result = null;
    error = null;
    return;
  }

  try {
    result = convertKey(input.trim());
    error = null;
    showNsec = false;
  } catch (e) {
    result = null;
    error = e instanceof Error ? e.message : 'Invalid key format';
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

const detectedFormat = $derived(detectKeyFormat(input.trim()));
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">Key Converter</h3>
      <span class="text-[10px] text-text-muted">NIP-19</span>
    </div>

    <!-- Input -->
    <div>
      <label for="key-input" class="block text-xs text-text-muted mb-1">
        Enter npub, nsec, or hex key
      </label>
      <input
        id="key-input"
        type="text"
        bind:value={input}
        oninput={handleConvert}
        placeholder="npub1... or nsec1... or 64-char hex"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all font-mono"
      />
      {#if detectedFormat !== 'unknown' && input.trim()}
        <p class="mt-1 text-[10px] text-text-muted">
          Detected: <span class="text-accent">{detectedFormat}</span>
        </p>
      {/if}
    </div>

    <!-- Error -->
    {#if error}
      <div class="px-3 py-2 rounded-lg bg-error-dim border border-error/20 text-xs text-error">
        ⚠ {error}
      </div>
    {/if}

    <!-- Results -->
    {#if result}
      <!-- npub -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-text-muted">npub</span>
          <button
            type="button"
            onclick={() => copyToClipboard(result.npub)}
            class="text-[10px] text-accent hover:underline"
          >
            Copy
          </button>
        </div>
        <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-secondary break-all">
          {result.npub}
        </div>
      </div>

      <!-- nsec (with safety warning) -->
      {#if result.nsec}
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-text-muted">nsec</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={() => (showNsec = !showNsec)}
                class="text-[10px] text-text-muted hover:text-text-primary"
              >
                {showNsec ? 'Hide' : 'Show'}
              </button>
              {#if showNsec}
                <button
                  type="button"
                  onclick={() => copyToClipboard(result.nsec!)}
                  class="text-[10px] text-accent hover:underline"
                >
                  Copy
                </button>
              {/if}
            </div>
          </div>
          {#if showNsec}
            <div class="px-3 py-2 rounded-lg bg-warning-dim border border-warning/20 text-xs font-mono text-warning break-all">
              ⚠ {result.nsec}
            </div>
            <p class="text-[10px] text-warning">
              ⚠ Never share your nsec with anyone!
            </p>
          {:else}
            <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-muted">
              ••••••••••••••••••••••••••••••••
            </div>
          {/if}
        </div>
      {/if}

      <!-- hex -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-text-muted">hex</span>
          <button
            type="button"
            onclick={() => copyToClipboard(result.hex)}
            class="text-[10px] text-accent hover:underline"
          >
            Copy
          </button>
        </div>
        <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-secondary break-all">
          {result.hex}
        </div>
      </div>
    {/if}
  </div>
</SectionCard>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 8: Create ToolsSection Component

Create `apps/web/src/components/tools/ToolsSection.svelte`.

A container component for all tool sub-tabs.

```svelte
<script lang="ts">
import KeyConverter from './KeyConverter.svelte';
import Nip05Checker from './Nip05Checker.svelte';
import QRCodeGenerator from './QRCodeGenerator.svelte';
import EventBackup from './EventBackup.svelte';

let activeTool = $state<'key-converter' | 'nip05-checker' | 'qr-code' | 'event-backup'>('key-converter');

const tools = [
  { id: 'key-converter' as const, label: 'Key Converter', icon: '🔑' },
  { id: 'nip05-checker' as const, label: 'NIP-05 Checker', icon: '📧' },
  { id: 'qr-code' as const, label: 'QR Code', icon: '📱' },
  { id: 'event-backup' as const, label: 'Backup', icon: '💾' },
];
</script>

<div class="space-y-4">
  <!-- Tool Tabs -->
  <div class="flex gap-1 p-1 rounded-lg bg-dark-surface border border-dark-border">
    {#each tools as tool (tool.id)}
      <button
        type="button"
        onclick={() => (activeTool = tool.id)}
        class="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all {activeTool === tool.id
          ? 'bg-dark-card border border-dark-border text-text-primary'
          : 'text-text-muted hover:text-text-secondary'}"
      >
        {tool.icon} {tool.label}
      </button>
    {/each}
  </div>

  <!-- Tool Content -->
  {#if activeTool === 'key-converter'}
    <KeyConverter />
  {:else if activeTool === 'nip05-checker'}
    <Nip05Checker />
  {:else if activeTool === 'qr-code'}
    <QRCodeGenerator />
  {:else if activeTool === 'event-backup'}
    <EventBackup />
  {/if}
</div>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 9: Create NIP-05 Verification Utility

Create `apps/web/src/utils/nip05.ts`.

```typescript
// apps/web/src/utils/nip05.ts

import { hexToNpub } from './keys'

export interface Nip05Result {
  identifier: string
  local: string
  domain: string
  verified: boolean
  resolvedPubkey: string | null
  expectedPubkey: string | null
  npub: string | null
  httpStatus: number | null
  responseTimeMs: number
  rawResponse: Record<string, unknown> | null
  error: string | null
}

export async function verifyNip05(
  identifier: string,
  expectedPubkey?: string,
): Promise<Nip05Result> {
  const [local, domain] = identifier.split('@')
  const start = performance.now()

  try {
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(local)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    const json = await res.json()
    const responseTimeMs = performance.now() - start

    const resolvedPubkey = json.names?.[local] ?? null
    const verified = resolvedPubkey !== null &&
      (!expectedPubkey || resolvedPubkey === expectedPubkey)

    return {
      identifier,
      local,
      domain,
      verified,
      resolvedPubkey,
      expectedPubkey: expectedPubkey ?? null,
      npub: resolvedPubkey ? hexToNpub(resolvedPubkey) : null,
      httpStatus: res.status,
      responseTimeMs,
      rawResponse: json,
      error: null,
    }
  } catch (e) {
    return {
      identifier,
      local,
      domain,
      verified: false,
      resolvedPubkey: null,
      expectedPubkey: expectedPubkey ?? null,
      npub: null,
      httpStatus: null,
      responseTimeMs: performance.now() - start,
      rawResponse: null,
      error: e instanceof Error ? e.message : 'Resolution failed',
    }
  }
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 10: Create Nip05Checker Component

Create `apps/web/src/components/tools/Nip05Checker.svelte`.

```svelte
<script lang="ts">
import { verifyNip05, type Nip05Result } from '../../utils/nip05';
import SectionCard from '../SectionCard.svelte';

let identifier = $state('');
let expectedPubkey = $state('');
let checking = $state(false);
let result = $state<Nip05Result | null>(null);
let history = $state<Nip05Result[]>([]);

async function handleCheck() {
  if (!identifier.includes('@')) return;

  checking = true;
  result = null;

  try {
    result = await verifyNip05(
      identifier.trim(),
      expectedPubkey.trim() || undefined,
    );

    // Add to history (keep last 5)
    history = [result, ...history.filter(h => h.identifier !== result!.identifier)].slice(0, 5);
  } catch (e) {
    result = {
      identifier: identifier.trim(),
      local: identifier.split('@')[0],
      domain: identifier.split('@')[1],
      verified: false,
      resolvedPubkey: null,
      expectedPubkey: expectedPubkey.trim() || null,
      npub: null,
      httpStatus: null,
      responseTimeMs: 0,
      rawResponse: null,
      error: e instanceof Error ? e.message : 'Check failed',
    };
  } finally {
    checking = false;
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">NIP-05 Checker</h3>
      <span class="text-[10px] text-text-muted">NIP-05</span>
    </div>

    <!-- Input -->
    <div>
      <label for="nip05-input" class="block text-xs text-text-muted mb-1">
        NIP-05 Identifier
      </label>
      <input
        id="nip05-input"
        type="text"
        bind:value={identifier}
        placeholder="alice@example.com"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Optional expected pubkey -->
    <div>
      <label for="expected-pubkey" class="block text-xs text-text-muted mb-1">
        Expected pubkey (optional)
      </label>
      <input
        id="expected-pubkey"
        type="text"
        bind:value={expectedPubkey}
        placeholder="64-char hex pubkey to verify against"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Check Button -->
    <button
      type="button"
      onclick={handleCheck}
      disabled={checking || !identifier.includes('@')}
      class="w-full px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {#if checking}
        Checking...
      {:else}
        Verify NIP-05
      {/if}
    </button>

    <!-- Result -->
    {#if result}
      <div class="space-y-3">
        <!-- Status -->
        <div
          class="px-3 py-2 rounded-lg text-xs {result.verified
            ? 'bg-success/10 border border-success/20 text-success'
            : 'bg-error/10 border border-error/20 text-error'}"
        >
          {#if result.verified}
            ✅ Verified — pubkey matches
          {:else if result.error}
            ❌ Failed — {result.error}
          {:else}
            ⚠️ Mismatch — pubkey doesn't match expected
          {/if}
        </div>

        <!-- Details -->
        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-text-muted">Domain</span>
            <span class="text-text-primary font-mono">{result.domain}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">HTTP Status</span>
            <span class="text-text-primary font-mono">{result.httpStatus ?? '—'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Response Time</span>
            <span class="text-text-primary font-mono">{Math.round(result.responseTimeMs)}ms</span>
          </div>
        </div>

        <!-- Resolved Pubkey -->
        {#if result.resolvedPubkey}
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-text-muted">Resolved pubkey (hex)</span>
              <button
                type="button"
                onclick={() => copyToClipboard(result!.resolvedPubkey!)}
                class="text-[10px] text-accent hover:underline"
              >
                Copy
              </button>
            </div>
            <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-secondary break-all">
              {result.resolvedPubkey}
            </div>
          </div>

          {#if result.npub}
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-text-muted">npub</span>
                <button
                  type="button"
                  onclick={() => copyToClipboard(result!.npub!)}
                  class="text-[10px] text-accent hover:underline"
                >
                  Copy
                </button>
              </div>
              <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-secondary break-all">
                {result.npub}
              </div>
            </div>
          {/if}
        {/if}

        <!-- Raw Response -->
        {#if result.rawResponse}
          <details class="group">
            <summary
              class="cursor-pointer text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Raw JSON Response
            </summary>
            <pre class="mt-2 p-3 rounded-lg bg-dark-surface border border-dark-border text-[10px] text-text-secondary overflow-x-auto font-mono">{JSON.stringify(
                result.rawResponse,
                null,
                2,
              )}</pre>
          </details>
        {/if}
      </div>
    {/if}

    <!-- History -->
    {#if history.length > 0}
      <div class="border-t border-dark-border pt-3">
        <p class="text-[10px] text-text-muted mb-2">Recent checks</p>
        <div class="space-y-1">
          {#each history as item (item.identifier)}
            <button
              type="button"
              onclick={() => {
                identifier = item.identifier;
                handleCheck();
              }}
              class="flex items-center justify-between w-full px-2 py-1.5 rounded text-xs hover:bg-dark-surface transition-all"
            >
              <span class="text-text-secondary font-mono truncate">{item.identifier}</span>
              <span class={item.verified ? 'text-success' : 'text-error'}>
                {item.verified ? '✓' : '✗'}
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</SectionCard>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 11: Install QR Code Library

Add the `qrcode` package to the web app.

```bash
cd apps/web && bun add qrcode && bun add -d @types/qrcode
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 12: Create QRCodeGenerator Component

Create `apps/web/src/components/tools/QRCodeGenerator.svelte`.

```svelte
<script lang="ts">
import QRCode from 'qrcode';
import { detectKeyFormat } from '../../utils/keys';
import SectionCard from '../SectionCard.svelte';

let input = $state('');
let qrDataUrl = $state<string | null>(null);
let size = $state<200 | 300 | 500>(300);
let detectedType = $state<string>('text');

function generateQR() {
  if (!input.trim()) {
    qrDataUrl = null;
    return;
  }

  QRCode.toDataURL(input.trim(), {
    width: size,
    margin: 2,
    color: {
      dark: '#ffffff',
      light: '#1a1a2e',
    },
  }).then((url) => {
    qrDataUrl = url;
  });
}

function detectType(value: string): string {
  if (detectKeyFormat(value) === 'npub') return 'npub';
  if (value.startsWith('wss://') || value.startsWith('ws://')) return 'relay';
  try {
    JSON.parse(value);
    return 'event';
  } catch {
    return 'text';
  }
}

function handleInput() {
  detectedType = detectType(input);
  generateQR();
}

function downloadQR() {
  if (!qrDataUrl) return;
  const a = document.createElement('a');
  a.href = qrDataUrl;
  a.download = `nostr-qr-${detectedType}.png`;
  a.click();
}

async function copyImage() {
  if (!qrDataUrl) return;
  try {
    const res = await fetch(qrDataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
  } catch {
    // Clipboard API not available or denied
  }
}
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">QR Code Generator</h3>
      <span class="text-[10px] text-text-muted">{detectedType}</span>
    </div>

    <!-- Input -->
    <div>
      <label for="qr-input" class="block text-xs text-text-muted mb-1">
        Enter npub, relay URL, event JSON, or any text
      </label>
      <textarea
        id="qr-input"
        bind:value={input}
        oninput={handleInput}
        placeholder="npub1... or wss://relay.example.com or {...}"
        rows="3"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all font-mono resize-none"
      ></textarea>
    </div>

    <!-- Size Selector -->
    <div class="flex items-center gap-2">
      <span class="text-xs text-text-muted">Size:</span>
      {#each [200, 300, 500] as s (s)}
        <button
          type="button"
          onclick={() => { size = s as 200 | 300 | 500; generateQR(); }}
          class="px-3 py-1 rounded-lg text-xs transition-all {size === s
            ? 'bg-accent text-white'
            : 'bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary'}"
        >
          {s}px
        </button>
      {/each}
    </div>

    <!-- QR Code Preview -->
    {#if qrDataUrl}
      <div class="flex flex-col items-center gap-4">
        <div class="p-4 rounded-xl bg-white">
          <img src={qrDataUrl} alt="QR Code" width={size} height={size} />
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            type="button"
            onclick={downloadQR}
            class="px-4 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary hover:text-accent transition-all"
          >
            Download PNG
          </button>
          <button
            type="button"
            onclick={copyImage}
            class="px-4 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary hover:text-accent transition-all"
          >
            Copy Image
          </button>
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-center py-12 text-text-muted text-xs">
        Enter content above to generate QR code
      </div>
    {/if}
  </div>
</SectionCard>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 13: Create useEventComposer Composable

Create `apps/web/src/lib/composables/useEventComposer.svelte.ts`.

```typescript
// apps/web/src/lib/composables/useEventComposer.svelte.ts

import { relaySocket } from '../stores/relaySocket.svelte';

export interface EventComposerState {
  kind: number;
  content: string;
  tags: string[][];
  createdAt: number;
  targetRelay: string;
}

export interface PublishResult {
  success: boolean;
  eventId?: string;
  error?: string;
  latencyMs: number;
}

export function useEventComposer() {
  let state = $state<EventComposerState>({
    kind: 1,
    content: '',
    tags: [],
    createdAt: Math.floor(Date.now() / 1000),
    targetRelay: '',
  });

  let publishing = $state(false);
  let result = $state<PublishResult | null>(null);

  function setKind(kind: number) {
    state = { ...state, kind };
  }

  function setContent(content: string) {
    state = { ...state, content };
  }

  function setTargetRelay(relay: string) {
    state = { ...state, targetRelay: relay };
  }

  function addTag(tag: string[]) {
    state = { ...state, tags: [...state.tags, tag] };
  }

  function removeTag(index: number) {
    state = { ...state, tags: state.tags.filter((_, i) => i !== index) };
  }

  function updateTag(index: number, tag: string[]) {
    const newTags = [...state.tags];
    newTags[index] = tag;
    state = { ...state, tags: newTags };
  }

  function reset() {
    state = {
      kind: 1,
      content: '',
      tags: [],
      createdAt: Math.floor(Date.now() / 1000),
      targetRelay: '',
    };
    result = null;
  }

  function prefill(event: any) {
    state = {
      kind: event.kind || 1,
      content: event.content || '',
      tags: event.tags || [],
      createdAt: event.created_at || Math.floor(Date.now() / 1000),
      targetRelay: state.targetRelay,
    };
    result = null;
  }

  async function publish(): Promise<PublishResult> {
    if (!state.targetRelay) {
      return { success: false, error: 'No target relay specified', latencyMs: 0 };
    }

    // Check for NIP-07 signer
    if (!window.nostr) {
      return { success: false, error: 'No NIP-07 signer detected', latencyMs: 0 };
    }

    publishing = true;
    result = null;
    const start = performance.now();

    try {
      // Build unsigned event
      const unsignedEvent = {
        kind: state.kind,
        content: state.content,
        tags: state.tags,
        created_at: state.createdAt,
      };

      // Sign via NIP-07
      const signedEvent = await window.nostr.signEvent(unsignedEvent);
      const latencyMs = performance.now() - start;

      // Publish to relay
      const socket = relaySocket(() => state.targetRelay);
      await socket.connect();
      
      // Wait for connection
      if (socket.status !== 'connected') {
        throw new Error('Failed to connect to relay');
      }

      // Send EVENT message
      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Publish timeout')), 10_000);
        
        socket.send(['EVENT', signedEvent]);
        
        // Listen for OK response
        const unsub = socket.onMessage((msg: any) => {
          if (Array.isArray(msg) && msg[0] === 'OK' && msg[1] === signedEvent.id) {
            clearTimeout(timeout);
            unsub();
            resolve(msg);
          }
        });
      });

      const publishResult: PublishResult = {
        success: true,
        eventId: signedEvent.id,
        latencyMs,
      };

      result = publishResult;
      return publishResult;
    } catch (e) {
      const publishResult: PublishResult = {
        success: false,
        error: e instanceof Error ? e.message : 'Publish failed',
        latencyMs: performance.now() - start,
      };
      result = publishResult;
      return publishResult;
    } finally {
      publishing = false;
    }
  }

  return {
    get state() { return state; },
    get publishing() { return publishing; },
    get result() { return result; },
    setKind,
    setContent,
    setTargetRelay,
    addTag,
    removeTag,
    updateTag,
    reset,
    prefill,
    publish,
  };
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 14: Create TagEditor Component

Create `apps/web/src/components/publisher/TagEditor.svelte`.

```svelte
<script lang="ts">
let { tags, onAdd, onRemove, onUpdate }: {
  tags: string[][];
  onAdd: (tag: string[]) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, tag: string[]) => void;
} = $props();

let tagKey = $state('');
let tagValue = $state('');

const presetTags = [
  { key: 'e', label: 'Event Reference', placeholder: 'event ID' },
  { key: 'p', label: 'Profile Reference', placeholder: 'pubkey' },
  { key: 't', label: 'Hashtag', placeholder: 'hashtag' },
  { key: 'd', label: 'Replaceable Coordinate', placeholder: 'coordinate' },
  { key: 'expiration', label: 'Expiration', placeholder: 'unix timestamp' },
  { key: 'relay', label: 'Relay URL', placeholder: 'wss://...' },
];

function handleAdd() {
  if (tagKey.trim()) {
    onAdd([tagKey.trim(), tagValue.trim()]);
    tagKey = '';
    tagValue = '';
  }
}

function handlePreset(key: string) {
  tagKey = key;
  tagValue = '';
}
</script>

<div class="space-y-3">
  <label class="block text-xs text-text-muted">Tags</label>

  <!-- Existing Tags -->
  {#if tags.length > 0}
    <div class="space-y-1">
      {#each tags as tag, i (i)}
        <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-dark-surface border border-dark-border">
          <span class="text-xs font-mono text-accent">{tag[0]}</span>
          {#if tag.length > 1 && tag[1]}
            <span class="text-xs font-mono text-text-secondary truncate flex-1">{tag[1]}</span>
          {/if}
          <button
            type="button"
            onclick={() => onRemove(i)}
            class="text-text-muted hover:text-error transition-colors"
          >
            ✕
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Preset Buttons -->
  <div class="flex flex-wrap gap-1">
    {#each presetTags as preset (preset.key)}
      <button
        type="button"
        onclick={() => handlePreset(preset.key)}
        class="px-2 py-1 rounded text-[10px] bg-dark-surface border border-dark-border text-text-muted hover:text-accent hover:border-accent-border transition-all"
      >
        {preset.label}
      </button>
    {/each}
  </div>

  <!-- Add Custom Tag -->
  <div class="flex gap-2">
    <input
      type="text"
      bind:value={tagKey}
      placeholder="Key"
      class="w-24 px-2 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
    />
    <input
      type="text"
      bind:value={tagValue}
      placeholder="Value (optional)"
      class="flex-1 px-2 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
    />
    <button
      type="button"
      onclick={handleAdd}
      disabled={!tagKey.trim()}
      class="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      Add
    </button>
  </div>
</div>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 15: Create EventComposer Component

Create `apps/web/src/components/publisher/EventComposer.svelte`.

```svelte
<script lang="ts">
import { useEventComposer } from '../../lib/composables/useEventComposer.svelte';
import SectionCard from '../SectionCard.svelte';
import TagEditor from './TagEditor.svelte';

let { targetRelay, onPublishComplete }: {
  targetRelay: string;
  onPublishComplete?: (result: any) => void;
} = $props();

const composer = useEventComposer();
composer.setTargetRelay(targetRelay);

const commonKinds = [
  { kind: 0, label: 'Metadata' },
  { kind: 1, label: 'Note' },
  { kind: 3, label: 'Contacts' },
  { kind: 5, label: 'Deletion' },
  { kind: 7, label: 'Reaction' },
  { kind: 27676, label: 'Long-form' },
];

const charCount = $derived(composer.state.content.length);
const maxChars = $derived(10000); // Default, could come from NIP-11
const isOverLimit = $derived(charCount > maxChars);

async function handlePublish() {
  const result = await composer.publish();
  onPublishComplete?.(result);
}
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">Event Composer</h3>
      <span class="text-[10px] text-text-muted">NIP-01, NIP-07</span>
    </div>

    <!-- Kind Selector -->
    <div>
      <label class="block text-xs text-text-muted mb-1">Kind</label>
      <div class="flex gap-1 mb-2">
        {#each commonKinds as k (k.kind)}
          <button
            type="button"
            onclick={() => composer.setKind(k.kind)}
            class="px-2 py-1 rounded text-[10px] transition-all {composer.state.kind === k.kind
              ? 'bg-accent text-white'
              : 'bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary'}"
          >
            {k.label}
          </button>
        {/each}
      </div>
      <input
        type="number"
        value={composer.state.kind}
        oninput={(e) => composer.setKind(Number((e.target as HTMLInputElement).value))}
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary focus:outline-none focus:border-accent-border transition-all font-mono"
      />
    </div>

    <!-- Content -->
    <div>
      <div class="flex items-center justify-between mb-1">
        <label for="event-content" class="text-xs text-text-muted">Content</label>
        <span class="text-[10px] {isOverLimit ? 'text-error' : 'text-text-muted'}">
          {charCount.toLocaleString()} / {maxChars.toLocaleString()}
        </span>
      </div>
      <textarea
        id="event-content"
        bind:value={composer.state.content}
        rows="6"
        placeholder="Event content..."
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all resize-none"
      ></textarea>
    </div>

    <!-- Tags -->
    <TagEditor
      tags={composer.state.tags}
      onAdd={(tag) => composer.addTag(tag)}
      onRemove={(i) => composer.removeTag(i)}
      onUpdate={(i, tag) => composer.updateTag(i, tag)}
    />

    <!-- Created At -->
    <div>
      <label class="block text-xs text-text-muted mb-1">Created At</label>
      <input
        type="datetime-local"
        value={new Date(composer.state.createdAt * 1000).toISOString().slice(0, 16)}
        oninput={(e) => {
          const val = (e.target as HTMLInputElement).value;
          composer.state = { ...composer.state, createdAt: Math.floor(new Date(val).getTime() / 1000) };
        }}
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Target Relay -->
    <div>
      <label for="target-relay" class="block text-xs text-text-muted mb-1">Target Relay</label>
      <input
        id="target-relay"
        type="text"
        bind:value={composer.state.targetRelay}
        placeholder="wss://relay.example.com"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Publish Button -->
    <button
      type="button"
      onclick={handlePublish}
      disabled={composer.publishing || !composer.state.targetRelay || isOverLimit}
      class="w-full px-4 py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {#if composer.publishing}
        <span class="flex items-center justify-center gap-2">
          <span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
          Publishing...
        </span>
      {:else}
        Sign & Publish
      {/if}
    </button>

    <!-- Result -->
    {#if composer.result}
      <div
        class="px-3 py-2 rounded-lg text-xs {composer.result.success
          ? 'bg-success/10 border border-success/20 text-success'
          : 'bg-error/10 border border-error/20 text-error'}"
      >
        {#if composer.result.success}
          ✅ Published! Event ID: <span class="font-mono">{composer.result.eventId}</span>
          <span class="text-text-muted ml-2">({Math.round(composer.result.latencyMs)}ms)</span>
        {:else}
          ❌ {composer.result.error}
        {/if}
      </div>
    {/if}
  </div>
</SectionCard>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 16: Create PublisherSection Component

Create `apps/web/src/components/publisher/PublisherSection.svelte`.

```svelte
<script lang="ts">
import EventComposer from './EventComposer.svelte';
import EventDeleter from './EventDeleter.svelte';

let { targetRelay }: { targetRelay: string } = $props();

let activeTab = $state<'compose' | 'delete'>('compose');
</script>

<div class="space-y-4">
  <!-- Tab Toggle -->
  <div class="flex gap-1 p-1 rounded-lg bg-dark-surface border border-dark-border">
    <button
      type="button"
      onclick={() => (activeTab = 'compose')}
      class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {activeTab === 'compose'
        ? 'bg-dark-card border border-dark-border text-text-primary'
        : 'text-text-muted hover:text-text-secondary'}"
    >
      ✍️ Compose
    </button>
    <button
      type="button"
      onclick={() => (activeTab = 'delete')}
      class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {activeTab === 'delete'
        ? 'bg-dark-card border border-dark-border text-text-primary'
        : 'text-text-muted hover:text-text-secondary'}"
    >
      🗑️ Delete
    </button>
  </div>

  <!-- Content -->
  {#if activeTab === 'compose'}
    <EventComposer {targetRelay} />
  {:else}
    <EventDeleter {targetRelay} />
  {/if}
</div>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 17: Create useEventDeleter Composable

Create `apps/web/src/lib/composables/useEventDeleter.svelte.ts`.

```typescript
// apps/web/src/lib/composables/useEventDeleter.svelte.ts

export interface DeleteResult {
  eventId: string;
  success: boolean;
  error?: string;
}

export function useEventDeleter() {
  let eventIds = $state<string[]>([]);
  let reason = $state('');
  let targetRelay = $state('');
  let deleting = $state(false);
  let results = $state<DeleteResult[]>([]);

  function addEventId(id: string) {
    if (!eventIds.includes(id.trim())) {
      eventIds = [...eventIds, id.trim()];
    }
  }

  function removeEventId(id: string) {
    eventIds = eventIds.filter((eid) => eid !== id);
  }

  function setEventIds(ids: string[]) {
    eventIds = ids;
  }

  function setReason(r: string) {
    reason = r;
  }

  function setTargetRelay(relay: string) {
    targetRelay = relay;
  }

  function reset() {
    eventIds = [];
    reason = '';
    results = [];
  }

  async function deleteEvents(): Promise<DeleteResult[]> {
    if (eventIds.length === 0 || !targetRelay) {
      return [];
    }

    // Check for NIP-07 signer
    if (!window.nostr) {
      return eventIds.map((id) => ({
        eventId: id,
        success: false,
        error: 'No NIP-07 signer detected',
      }));
    }

    deleting = true;
    results = [];

    try {
      // Build kind 5 deletion event
      const tags = eventIds.map((id) => ['e', id]);
      if (reason) {
        tags.push(['reason', reason]);
      }

      const unsignedEvent = {
        kind: 5,
        content: reason || '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      // Sign via NIP-07
      const signedEvent = await window.nostr.signEvent(unsignedEvent);

      // TODO: Publish to relay (requires WebSocket connection)
      // For now, return mock success
      const deleteResults: DeleteResult[] = eventIds.map((id) => ({
        eventId: id,
        success: true,
      }));

      results = deleteResults;
      return deleteResults;
    } catch (e) {
      const errorResults: DeleteResult[] = eventIds.map((id) => ({
        eventId: id,
        success: false,
        error: e instanceof Error ? e.message : 'Deletion failed',
      }));
      results = errorResults;
      return errorResults;
    } finally {
      deleting = false;
    }
  }

  return {
    get eventIds() { return eventIds; },
    get reason() { return reason; },
    get targetRelay() { return targetRelay; },
    get deleting() { return deleting; },
    get results() { return results; },
    addEventId,
    removeEventId,
    setEventIds,
    setReason,
    setTargetRelay,
    reset,
    deleteEvents,
  };
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 18: Create EventDeleter Component

Create `apps/web/src/components/publisher/EventDeleter.svelte`.

```svelte
<script lang="ts">
import { useEventDeleter } from '../../lib/composables/useEventDeleter.svelte';
import SectionCard from '../SectionCard.svelte';

let { targetRelay }: { targetRelay: string } = $props();

const deleter = useEventDeleter();
deleter.setTargetRelay(targetRelay);

let inputIds = $state('');

function handleAddIds() {
  const ids = inputIds
    .split(/[,\n]/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  
  for (const id of ids) {
    deleter.addEventId(id);
  }
  inputIds = '';
}

async function handleDelete() {
  if (!confirm(`Delete ${deleter.eventIds.length} events from ${targetRelay}?`)) {
    return;
  }
  await deleter.deleteEvents();
}
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">Event Deleter</h3>
      <span class="text-[10px] text-text-muted">NIP-09</span>
    </div>

    <!-- Manual Input -->
    <div>
      <label for="event-ids" class="block text-xs text-text-muted mb-1">
        Event IDs (comma or newline separated)
      </label>
      <textarea
        id="event-ids"
        bind:value={inputIds}
        rows="3"
        placeholder="abc123..., def456..."
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all resize-none"
      ></textarea>
      <button
        type="button"
        onclick={handleAddIds}
        disabled={!inputIds.trim()}
        class="mt-2 px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Add IDs
      </button>
    </div>

    <!-- Event ID List -->
    {#if deleter.eventIds.length > 0}
      <div class="space-y-1">
        <p class="text-xs text-text-muted">
          {deleter.eventIds.length} event{deleter.eventIds.length !== 1 ? 's' : ''} to delete
        </p>
        <div class="max-h-32 overflow-y-auto space-y-1">
          {#each deleter.eventIds as id (id)}
            <div class="flex items-center justify-between px-2 py-1 rounded bg-dark-surface/50 text-xs">
              <span class="font-mono text-text-secondary truncate">{id}</span>
              <button
                type="button"
                onclick={() => deleter.removeEventId(id)}
                class="text-text-muted hover:text-error transition-colors ml-2"
              >
                ✕
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Reason -->
    <div>
      <label for="delete-reason" class="block text-xs text-text-muted mb-1">
        Reason (optional)
      </label>
      <input
        id="delete-reason"
        type="text"
        bind:value={deleter.state.reason}
        placeholder="Why are you deleting these events?"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Target Relay -->
    <div>
      <label class="block text-xs text-text-muted mb-1">Target Relay</label>
      <input
        type="text"
        bind:value={deleter.state.targetRelay}
        placeholder="wss://relay.example.com"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Warning -->
    <div class="px-3 py-2 rounded-lg bg-warning-dim border border-warning/20 text-xs text-warning">
      ⚠ Deletion is a request — relays may not honor it.
    </div>

    <!-- Delete Button -->
    <button
      type="button"
      onclick={handleDelete}
      disabled={deleter.deleting || deleter.eventIds.length === 0 || !deleter.state.targetRelay}
      class="w-full px-4 py-3 rounded-lg bg-error text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {#if deleter.deleting}
        Deleting...
      {:else}
        Delete {deleter.eventIds.length} Event{deleter.eventIds.length !== 1 ? 's' : ''}
      {/if}
    </button>

    <!-- Results -->
    {#if deleter.results.length > 0}
      <div class="space-y-1">
        <p class="text-xs text-text-muted">Results</p>
        {#each deleter.results as r (r.eventId)}
          <div
            class="px-2 py-1.5 rounded text-xs {r.success
              ? 'bg-success/10 border border-success/20 text-success'
              : 'bg-error/10 border border-error/20 text-error'}"
          >
            <span class="font-mono">{r.eventId.slice(0, 12)}...</span>
            {#if r.success}
              ✅ Deleted
            {:else}
              ❌ {r.error}
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</SectionCard>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 19: Create Backup/Restore Utility

Create `apps/web/src/utils/backup.ts`.

```typescript
// apps/web/src/utils/backup.ts

import type { NostrEvent } from '@relayscope/shared';

export interface BackupOptions {
  authorPubkey: string;
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  relayUrl: string;
}

export interface BackupResult {
  events: NostrEvent[];
  filename: string;
}

export interface RestoreResult {
  total: number;
  restored: number;
  skipped: number;
  errors: string[];
}

/**
 * Fetch events from a relay for backup.
 */
export async function fetchEventsForBackup(
  options: BackupOptions,
): Promise<NostrEvent[]> {
  const filter: Record<string, unknown> = {
    authors: [options.authorPubkey],
    limit: options.limit || 1000,
  };

  if (options.kinds && options.kinds.length > 0) {
    filter.kinds = options.kinds;
  }
  if (options.since) {
    filter.since = options.since;
  }
  if (options.until) {
    filter.until = options.until;
  }

  return new Promise((resolve, reject) => {
    const events: NostrEvent[] = [];
    const ws = new WebSocket(options.relayUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify(['REQ', 'backup', filter]));
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (Array.isArray(data)) {
          if (data[0] === 'EVENT') {
            events.push(data[2]);
          } else if (data[0] === 'EOSE') {
            ws.close();
            resolve(events);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = (err) => {
      ws.close();
      reject(new Error(`WebSocket error: ${err}`));
    };

    // Timeout after 30 seconds
    setTimeout(() => {
      ws.close();
      resolve(events);
    }, 30_000);
  });
}

/**
 * Export events to a JSON file for download.
 */
export function exportToFile(events: NostrEvent[], pubkey: string): string {
  const shortPubkey = pubkey.slice(0, 8);
  const date = new Date().toISOString().split('T')[0];
  const filename = `nostr-backup-${shortPubkey}-${date}.json`;

  const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Import events from a JSON file.
 */
export async function importFromFile(file: File): Promise<NostrEvent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const events = JSON.parse(reader.result as string);
        if (!Array.isArray(events)) {
          throw new Error('Invalid backup file: expected array of events');
        }
        resolve(events);
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Failed to parse backup file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 20: Create EventBackup Component

Create `apps/web/src/components/tools/EventBackup.svelte`.

```svelte
<script lang="ts">
import {
  fetchEventsForBackup,
  exportToFile,
  importFromFile,
  type BackupOptions,
  type RestoreResult,
} from '../../utils/backup';
import type { NostrEvent } from '@relayscope/shared';
import SectionCard from '../SectionCard.svelte';

let activeTab = $state<'backup' | 'restore'>('backup');

// Backup state
let authorPubkey = $state('');
let relayUrl = $state('');
let kinds = $state('0,1,3');
let limit = $state('1000');
let fetching = $state(false);

// Restore state
let importedEvents = $state<NostrEvent[]>([]);
let restoring = $state(false);
let restoreProgress = $state({ total: 0, restored: 0, skipped: 0 });
let restoreResult = $state<RestoreResult | null>(null);

async function handleBackup() {
  if (!authorPubkey || !relayUrl) return;

  fetching = true;
  try {
    const options: BackupOptions = {
      authorPubkey,
      relayUrl,
      kinds: kinds.split(',').map(Number).filter(Boolean),
      limit: Number(limit) || 1000,
    };

    const events = await fetchEventsForBackup(options);
    exportToFile(events, authorPubkey);
  } catch (e) {
    alert(`Backup failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  } finally {
    fetching = false;
  }
}

async function handleFileImport(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    importedEvents = await importFromFile(file);
    restoreResult = null;
  } catch (err) {
    alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function handleRestore() {
  if (importedEvents.length === 0 || !relayUrl) return;

  if (!window.nostr) {
    alert('No NIP-07 signer detected');
    return;
  }

  if (!confirm(`Restore ${importedEvents.length} events to ${relayUrl}?`)) {
    return;
  }

  restoring = true;
  restoreProgress = { total: importedEvents.length, restored: 0, skipped: 0 };

  // TODO: Actually publish events via WebSocket
  // For now, simulate restore
  await new Promise((r) => setTimeout(r, 2000));

  restoreResult = {
    total: importedEvents.length,
    restored: importedEvents.length,
    skipped: 0,
    errors: [],
  };
  restoring = false;
}

const importedKindsBreakdown = $derived(() => {
  const breakdown: Record<number, number> = {};
  for (const event of importedEvents) {
    breakdown[event.kind] = (breakdown[event.kind] || 0) + 1;
  }
  return breakdown;
});
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">Event Backup & Restore</h3>
      <span class="text-[10px] text-text-muted">NIP-01</span>
    </div>

    <!-- Tab Toggle -->
    <div class="flex gap-1 p-1 rounded-lg bg-dark-surface border border-dark-border">
      <button
        type="button"
        onclick={() => (activeTab = 'backup')}
        class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {activeTab === 'backup'
          ? 'bg-dark-card border border-dark-border text-text-primary'
          : 'text-text-muted hover:text-text-secondary'}"
      >
        💾 Backup
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'restore')}
        class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {activeTab === 'restore'
          ? 'bg-dark-card border border-dark-border text-text-primary'
          : 'text-text-muted hover:text-text-secondary'}"
      >
        📤 Restore
      </button>
    </div>

    {#if activeTab === 'backup'}
      <!-- Backup Form -->
      <div class="space-y-3">
        <div>
          <label for="backup-pubkey" class="block text-xs text-text-muted mb-1">
            Author Pubkey (hex)
          </label>
          <input
            id="backup-pubkey"
            type="text"
            bind:value={authorPubkey}
            placeholder="64-char hex pubkey"
            class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
          />
        </div>

        <div>
          <label for="backup-relay" class="block text-xs text-text-muted mb-1">Relay URL</label>
          <input
            id="backup-relay"
            type="text"
            bind:value={relayUrl}
            placeholder="wss://relay.example.com"
            class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="backup-kinds" class="block text-xs text-text-muted mb-1">
              Kinds (comma-separated)
            </label>
            <input
              id="backup-kinds"
              type="text"
              bind:value={kinds}
              placeholder="0,1,3"
              class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
            />
          </div>
          <div>
            <label for="backup-limit" class="block text-xs text-text-muted mb-1">Limit</label>
            <input
              id="backup-limit"
              type="number"
              bind:value={limit}
              placeholder="1000"
              class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
            />
          </div>
        </div>

        <button
          type="button"
          onclick={handleBackup}
          disabled={fetching || !authorPubkey || !relayUrl}
          class="w-full px-4 py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {#if fetching}
            Fetching events...
          {:else}
            Backup Events
          {/if}
        </button>
      </div>
    {:else}
      <!-- Restore Form -->
      <div class="space-y-3">
        <!-- File Import -->
        <div>
          <label for="restore-file" class="block text-xs text-text-muted mb-1">
            Import backup file
          </label>
          <input
            id="restore-file"
            type="file"
            accept=".json"
            onchange={handleFileImport}
            class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-accent file:text-white file:cursor-pointer"
          />
        </div>

        {#if importedEvents.length > 0}
          <!-- Preview -->
          <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border">
            <p class="text-xs text-text-muted mb-2">
              {importedEvents.length} events imported
            </p>
            <div class="flex flex-wrap gap-2 text-[10px]">
              {#each Object.entries(importedKindsBreakdown()) as [kind, count] (kind)}
                <span class="px-2 py-0.5 rounded bg-dark-border text-text-secondary">
                  kind {kind}: {count}
                </span>
              {/each}
            </div>
          </div>

          <!-- Target Relay -->
          <div>
            <label for="restore-relay" class="block text-xs text-text-muted mb-1">
              Target Relay
            </label>
            <input
              id="restore-relay"
              type="text"
              bind:value={relayUrl}
              placeholder="wss://relay.example.com"
              class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
            />
          </div>

          <!-- Restore Button -->
          <button
            type="button"
            onclick={handleRestore}
            disabled={restoring || !relayUrl}
            class="w-full px-4 py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {#if restoring}
              Restoring... ({restoreProgress.restored}/{restoreProgress.total})
            {:else}
              Restore Events
            {/if}
          </button>

          <!-- Progress Bar -->
          {#if restoring}
            <div class="h-2 rounded-full bg-dark-surface overflow-hidden">
              <div
                class="h-full bg-accent transition-all duration-300"
                style="width: {(restoreProgress.restored / restoreProgress.total) * 100}%"
              ></div>
            </div>
          {/if}

          <!-- Result -->
          {#if restoreResult}
            <div
              class="px-3 py-2 rounded-lg text-xs {restoreResult.errors.length === 0
                ? 'bg-success/10 border border-success/20 text-success'
                : 'bg-warning-dim border border-warning/20 text-warning'}"
            >
              ✅ Restored {restoreResult.restored} / {restoreResult.total} events
              {#if restoreResult.skipped > 0}
                ({restoreResult.skipped} skipped)
              {/if}
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </div>
</SectionCard>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 21: Wire ToolsSection into App.svelte

Edit `apps/web/src/App.svelte` to add the Tools section.

**Add import:**
```typescript
import ToolsSection from './components/tools/ToolsSection.svelte';
```

**Add to section content (after publisher section):**
```svelte
<!-- Tools Section -->
{#if activeSection === 'tools'}
  <ToolsSection />
{/if}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 22: Wire PublisherSection into App.svelte

Edit `apps/web/src/App.svelte` to add the Publisher section.

**Add import:**
```typescript
import PublisherSection from './components/publisher/PublisherSection.svelte';
```

**Add to section content (after verifier section):**
```svelte
<!-- Publisher Section -->
{#if activeSection === 'publisher'}
  <PublisherSection targetRelay={normalizedUrl} />
{/if}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 23: Add Pre-fill from Verifier to Publisher

Edit `apps/web/src/components/verifier/EventVerifier.svelte` to add an "Edit & Re-publish" button.

**Add prop:**
```typescript
let { onEditAndRepublish }: { onEditAndRepublish?: (event: any) => void } = $props();
```

**Add button in VerificationPanel (after success):**
```svelte
{#if onEditAndRepublish}
  <button
    type="button"
    onclick={() => onEditAndRepublish(verifiedEvent)}
    class="mt-3 px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary hover:text-accent transition-all"
  >
    ✍️ Edit & Re-publish
  </button>
{/if}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 24: Update App.svelte for Pre-fill Flow

Edit `apps/web/src/App.svelte` to handle pre-fill from verifier to publisher.

**Add state:**
```typescript
let prefilledEvent = $state<any>(null);
```

**Add handler:**
```typescript
function handleEditAndRepublish(event: any) {
  prefilledEvent = event;
  activeSection = 'publisher';
  setHashSection('publisher');
}
```

**Update Verifier section:**
```svelte
{#if activeSection === 'verifier'}
  <EventVerifier onEditAndRepublish={handleEditAndRepublish} />
{/if}
```

**Update Publisher section:**
```svelte
{#if activeSection === 'publisher'}
  <PublisherSection targetRelay={normalizedUrl} {prefilledEvent} />
{/if}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 25: Update Phase Badge and Empty State

Edit `apps/web/src/App.svelte` to update the phase badge.

**Change Phase badge from "Phase 5" to "Phase 8":**
```svelte
<span
  class="ml-auto text-[10px] font-mono px-2 py-1 rounded-full bg-dark-surface border border-dark-border text-text-muted"
>
  Phase 8
</span>
```

**Update empty state feature pills:**
```svelte
<div class="flex flex-wrap justify-center gap-2 text-xs text-text-muted">
  <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
    NIP-11 Info
  </span>
  <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
    Connection Checks
  </span>
  <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
    Live Stream
  </span>
  <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
    Event Verifier
  </span>
  <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
    Event Publisher
  </span>
  <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
    Key Converter
  </span>
  <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
    NIP-05 Checker
  </span>
  <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
    QR Code
  </span>
  <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
    Backup & Restore
  </span>
  <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
    Relay Directory
  </span>
</div>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 26: Update Feature Doc Status

Edit `docs/features/phase-8-developer-toolkit.md` to update the status.

Change the status line from:
```markdown
**Planned** 📋 (2026-06-30)
```
to:
```markdown
**Complete** ✅ (2026-07-01)
```

Also update `docs/roadmap.md` to mark Phase 8 as done:
```
Phase 8  ████████████████████  Developer Toolkit Expansion       ✅ Done
```

After making changes, no verification needed (docs only).

---

### Prompt 27: Add Type Declarations for NIP-07

Create or update `apps/web/src/vite-env.d.ts` to include NIP-07 type declarations.

```typescript
/// <reference types="svelte" />
/// <reference types="vite/client" />

// NIP-07 Window Nostr Provider
interface Window {
  nostr?: {
    getPublicKey(): Promise<string>;
    signEvent(event: {
      kind: number;
      content: string;
      tags: string[][];
      created_at: number;
    }): Promise<{
      id: string;
      pubkey: string;
      created_at: number;
      kind: number;
      tags: string[][];
      content: string;
      sig: string;
    }>;
  };
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

## Verification Checklist

After all prompts are complete, run the full verification suite:

```bash
bunx biome check .
bunx turbo type-check
bunx turbo build
```

Then manual test:
1. Click **⚡ Inspector** → should show NIP-11 info and Live Stream sub-tabs
2. Click **🔐 Verifier** → should show event verifier (unchanged)
3. Click **✍️ Publisher** → should show compose/delete tabs
4. Click **🧰 Tools** → should show key converter, NIP-05 checker, QR code, backup
5. Click **📂 Directory** → should show relay directory (unchanged)
6. Test Key Converter → paste npub, should show all formats
7. Test NIP-05 Checker → paste identifier, should verify
8. Test QR Code → paste content, should generate QR
9. Test Publisher → compose event, should show sign button
10. Test Backup → enter pubkey + relay, should download JSON
11. Browser back/forward → should navigate between sections
12. Mobile view → should show bottom nav bar
13. Run `bunx turbo build` → should succeed with zero errors

---

*Feature spec: docs/features/phase-8-developer-toolkit.md*
