import type { AuthState } from '@relayscope/shared';

// NIP-07 window.nostr type
interface NostrProvider {
  signEvent(event: {
    kind: number;
    content: string;
    tags: string[][];
    created_at: number;
  }): Promise<{
    id: string;
    sig: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
  }>;
  getPublicKey(): Promise<string>;
}

declare global {
  interface Window {
    nostr?: NostrProvider;
  }
}

export function useNip42Auth() {
  let state = $state<AuthState>({
    status: 'anonymous',
    challenge: null,
    error: null,
    pubkey: null,
  });

  let pendingChallenge = $state<string | null>(null);

  /**
   * Check if a raw WebSocket message is an AUTH challenge.
   * Returns true if handled (AUTH message detected).
   * Call this from your ws.onmessage handler BEFORE parsing EVENT/EOSE.
   */
  function handleRawMessage(data: string): boolean {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return false;
    }

    if (!Array.isArray(parsed) || parsed.length < 2) return false;

    const type = parsed[0] as string;
    if (type !== 'AUTH') return false;

    const challenge = parsed[1] as string;
    if (
      typeof challenge !== 'string' ||
      challenge.length === 0 ||
      challenge.length > 256 ||
      !/^[\x20-\x7E]+$/.test(challenge)
    ) {
      return false;
    }

    pendingChallenge = challenge;
    state = { ...state, status: 'auth_required', challenge };
    return true;
  }

  /**
   * Trigger the NIP-07 signing flow.
   * Requires window.nostr to be available.
   * Returns the signed AUTH event to send back to the relay.
   */
  async function authenticate(relayUrl: string): Promise<string | null> {
    // Capture challenge BEFORE any async operations to prevent race condition
    const challenge = pendingChallenge;
    if (!challenge) {
      state = { ...state, error: 'No pending challenge', status: 'auth_failed' };
      return null;
    }

    if (!window.nostr) {
      state = {
        ...state,
        status: 'auth_failed',
        error:
          'No NIP-07 extension detected. Install a Nostr browser extension (e.g., Alby, nos2x).',
      };
      return null;
    }

    state = { ...state, status: 'authenticating', error: null };

    try {
      let normalizedRelayUrl: string;
      try {
        normalizedRelayUrl = new URL(relayUrl).href;
      } catch {
        state = { ...state, status: 'auth_failed', error: 'Invalid relay URL' };
        return null;
      }

      const pubkey = await window.nostr.getPublicKey();
      const now = Math.floor(Date.now() / 1000);

      const signedEvent = await window.nostr.signEvent({
        kind: 22242,
        content: '',
        tags: [
          ['relay', normalizedRelayUrl],
          ['challenge', challenge],
        ],
        created_at: now,
      });

      state = {
        status: 'authenticated',
        challenge,
        error: null,
        pubkey,
      };

      pendingChallenge = null;
      return JSON.stringify(['AUTH', signedEvent]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Signing failed';
      state = {
        ...state,
        status: 'auth_failed',
        error: message,
      };
      return null;
    }
  }

  /** Reset state (e.g., on disconnect or URL change) */
  function reset() {
    state = { status: 'anonymous', challenge: null, error: null, pubkey: null };
    pendingChallenge = null;
  }

  /**
   * Verify AUTH event structure per NIP-42 spec.
   */
  function verifyAuthEvent(
    event: { kind: number; tags: string[][]; created_at: number },
    challenge: string,
    relayUrl: string,
  ): boolean {
    if (event.kind !== 22242) return false;

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(event.created_at - now) > 600) return false;

    const challengeTag = event.tags.find(([k]) => k === 'challenge');
    if (!challengeTag || challengeTag[1] !== challenge) return false;

    const relayTag = event.tags.find(([k]) => k === 'relay');
    if (!relayTag) return false;

    try {
      const eventDomain = new URL(relayTag[1]).hostname;
      const expectedDomain = new URL(relayUrl).hostname;
      if (eventDomain !== expectedDomain) return false;
    } catch {
      return false;
    }

    return true;
  }

  return {
    get status() {
      return state.status;
    },
    get challenge() {
      return state.challenge;
    },
    get error() {
      return state.error;
    },
    get pubkey() {
      return state.pubkey;
    },
    handleRawMessage,
    authenticate,
    reset,
    verifyAuthEvent,
  };
}
