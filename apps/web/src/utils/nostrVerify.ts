import type { NostrEvent } from '@relayscope/shared';
import { npubEncode } from 'nostr-tools/nip19';
import { getEventHash, verifyEvent } from 'nostr-tools/pure';

/**
 * Verify the Schnorr signature of a Nostr event (NIP-01).
 */
export function verifySignature(event: NostrEvent): boolean {
  return verifyEvent(event);
}

/**
 * Compute the event ID by hashing the canonical serialization (NIP-01).
 */
export function computeEventId(event: NostrEvent): string {
  return getEventHash(event);
}

/**
 * Compare the computed event ID against the stored id field.
 */
export function eventIdMatches(event: NostrEvent): {
  computed: string;
  matches: boolean;
} {
  const computed = computeEventId(event);
  return { computed, matches: computed === event.id };
}

/**
 * Encode a hex public key to bech32 npub format (NIP-19).
 */
export function toNpub(hexPubkey: string): string {
  return npubEncode(hexPubkey);
}

export interface DecodedTag {
  type: string;
  label: string;
  detail: string;
}

/**
 * Decode a single tag array into a human-readable description.
 */
export function decodeTag(tag: string[]): DecodedTag {
  if (tag.length === 0) {
    return { type: 'unknown', label: 'Unknown', detail: 'Empty tag' };
  }

  const [tagName, ...rest] = tag;
  const value = rest[0] ?? '';

  switch (tagName) {
    case 'e':
      return {
        type: 'e',
        label: 'Event reference',
        detail: `${value.slice(0, 8)}…${value.slice(-8)}`,
      };
    case 'p':
      try {
        const npub = toNpub(value);
        return {
          type: 'p',
          label: 'Profile reference',
          detail: `${npub.slice(0, 12)}…`,
        };
      } catch {
        return {
          type: 'p',
          label: 'Profile reference',
          detail: `${value.slice(0, 8)}…${value.slice(-8)}`,
        };
      }
    case 't':
      return {
        type: 't',
        label: 'Hashtag',
        detail: `#${value}`,
      };
    case 'd':
      return {
        type: 'd',
        label: 'Replaceable coordinate',
        detail: value,
      };
    case 'expiration': {
      const ts = Number.parseInt(value, 10);
      const date = Number.isFinite(ts) ? new Date(ts * 1000) : null;
      return {
        type: 'expiration',
        label: 'Expires at',
        detail: date ? date.toLocaleString() : value,
      };
    }
    case 'relay':
      return {
        type: 'relay',
        label: 'Relay hint',
        detail: value,
      };
    case 'alt':
      return {
        type: 'alt',
        label: 'Content summary',
        detail: value,
      };
    default:
      return {
        type: 'unknown',
        label: 'Unknown',
        detail: JSON.stringify(tag),
      };
  }
}
