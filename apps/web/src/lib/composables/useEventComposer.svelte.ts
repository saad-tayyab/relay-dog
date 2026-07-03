import { signAndPublish } from '../utils/nostr';

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
  // $state creates deeply reactive Proxies — mutate properties directly,
  // no need to spread-recreate the entire object on each change.
  let state = $state<EventComposerState>({
    kind: 1,
    content: '',
    tags: [],
    createdAt: Math.floor(Date.now() / 1000),
    targetRelay: '',
  });

  let publishing = $state(false);
  let result = $state<PublishResult | null>(null);

  // ─── Direct mutation setters (Proxy handles reactivity) ───

  function setKind(kind: number) {
    state.kind = Math.max(0, Math.floor(kind));
  }

  function setContent(content: string) {
    state.content = content;
  }

  function setCreatedAt(createdAt: number) {
    state.createdAt = createdAt;
  }

  function setTargetRelay(relay: string) {
    state.targetRelay = relay;
  }

  function addTag(tag: string[]) {
    state.tags.push(tag);
  }

  function removeTag(index: number) {
    state.tags.splice(index, 1);
  }

  function updateTag(index: number, tag: string[]) {
    state.tags[index] = tag;
  }

  // ─── Full reassignment (reset replaces entire state) ───

  function reset() {
    state.kind = 1;
    state.content = '';
    state.tags.length = 0;
    state.createdAt = Math.floor(Date.now() / 1000);
    state.targetRelay = '';
    result = null;
  }

  function prefill(event: {
    kind?: number;
    content?: string;
    tags?: string[][];
    created_at?: number;
  }) {
    state.kind = event.kind || 1;
    state.content = event.content || '';
    state.tags.length = 0;
    if (event.tags) state.tags.push(...event.tags);
    state.createdAt = event.created_at ?? Math.floor(Date.now() / 1000);
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

    publishing = true;
    result = null;

    try {
      const { signedEvent, latencyMs } = await signAndPublish(state.targetRelay, {
        kind: state.kind,
        content: state.content,
        tags: state.tags,
        created_at: state.createdAt,
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
        latencyMs: 0,
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
