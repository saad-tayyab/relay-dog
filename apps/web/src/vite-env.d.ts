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
