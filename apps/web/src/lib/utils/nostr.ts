import { SimplePool } from 'nostr-tools/pool';

// ─── NIP-07 Provider Type ───

export interface NostrProvider {
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

// ─── Helpers ───

/** Throws if no NIP-07 signer is available. Returns the provider for type narrowing. */
export function assertNostrAvailable(): NostrProvider {
  if (!window.nostr) {
    throw new Error(
      'No NIP-07 signer detected. Install a Nostr browser extension (e.g., Alby, nos2x).',
    );
  }
  return window.nostr;
}

export interface SignedEvent {
  id: string;
  sig: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
}

export interface PublishResult {
  signedEvent: SignedEvent;
  latencyMs: number;
}

/**
 * Sign an event via NIP-07 and publish it to a relay via SimplePool.
 * Always cleans up the pool connection.
 */
export async function signAndPublish(
  relayUrl: string,
  event: {
    kind: number;
    content: string;
    tags: string[][];
    created_at: number;
  },
): Promise<PublishResult> {
  const nostr = assertNostrAvailable();

  const start = performance.now();
  const signedEvent = await nostr.signEvent(event);

  const pool = new SimplePool();
  try {
    await Promise.any(pool.publish([relayUrl], signedEvent));
    return { signedEvent, latencyMs: performance.now() - start };
  } finally {
    pool.close([relayUrl]);
  }
}
