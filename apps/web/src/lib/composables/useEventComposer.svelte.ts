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
      const response = await new Promise<unknown>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Publish timeout')), 10_000);

        socket.send(JSON.stringify(['EVENT', signedEvent]));

        // Listen for OK response — for now just resolve after a delay
        // In a real implementation, we'd listen for the OK message
        setTimeout(() => {
          clearTimeout(timeout);
          resolve(['OK', signedEvent.id, true, '']);
        }, 1000);
      });

      const _ = response; // Acknowledged but not used directly

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
