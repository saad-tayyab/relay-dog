import { SimplePool } from 'nostr-tools/pool';

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

// Maximum event content size per NIP-01 (relays typically enforce 65KB)
const MAX_CONTENT_LENGTH = 65536;

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
    state = { ...state, kind: Math.max(0, Math.floor(kind)) };
  }

  function setContent(content: string) {
    state = { ...state, content };
  }

  function setCreatedAt(createdAt: number) {
    state = { ...state, createdAt };
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

  function prefill(event: {
    kind?: number;
    content?: string;
    tags?: string[][];
    created_at?: number;
  }) {
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
    // Concurrency guard
    if (publishing) {
      return { success: false, error: 'Already publishing', latencyMs: 0 };
    }

    if (!state.targetRelay) {
      return { success: false, error: 'No target relay specified', latencyMs: 0 };
    }

    if (!state.content.trim()) {
      return { success: false, error: 'Content is empty', latencyMs: 0 };
    }

    // Content size validation (NIP-01)
    if (state.content.length > MAX_CONTENT_LENGTH) {
      return {
        success: false,
        error: `Content exceeds maximum length (${state.content.length}/${MAX_CONTENT_LENGTH})`,
        latencyMs: 0,
      };
    }

    // Check for NIP-07 signer
    if (!window.nostr) {
      return { success: false, error: 'No NIP-07 signer detected', latencyMs: 0 };
    }

    publishing = true;
    result = null;
    const start = performance.now();

    try {
      // Sign via NIP-07
      const signedEvent = await window.nostr.signEvent({
        kind: state.kind,
        content: state.content,
        tags: state.tags,
        created_at: state.createdAt,
      });

      // Use nostr-tools SimplePool for proper WebSocket lifecycle
      const pool = new SimplePool();
      try {
        // pool.publish returns promises that resolve on OK from relay
        const pubs = pool.publish([state.targetRelay], signedEvent);
        await Promise.any(pubs); // Wait for any relay to accept

        const latencyMs = performance.now() - start;
        const publishResult: PublishResult = {
          success: true,
          eventId: signedEvent.id,
          latencyMs,
        };
        result = publishResult;
        return publishResult;
      } catch (e) {
        const latencyMs = performance.now() - start;
        const publishResult: PublishResult = {
          success: false,
          error: e instanceof Error ? e.message : 'Relay rejected the event',
          latencyMs,
        };
        result = publishResult;
        return publishResult;
      } finally {
        pool.close([state.targetRelay]);
      }
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
    get state() {
      return state;
    },
    get publishing() {
      return publishing;
    },
    get result() {
      return result;
    },
    setKind,
    setContent,
    setCreatedAt,
    setTargetRelay,
    addTag,
    removeTag,
    updateTag,
    reset,
    prefill,
    publish,
  };
}
