import { bech32 } from '@scure/base';

const HEX_CHARS = '0123456789abcdef';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => HEX_CHARS.charAt(b >> 4) + HEX_CHARS.charAt(b & 0x0f))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export function nsecToHex(nsec: string): string {
  const { prefix, words } = bech32.decode(nsec);
  if (prefix !== 'nsec') throw new Error('Invalid nsec prefix. Expected "nsec"');
  const bytes = Uint8Array.from(bech32.fromWords(words));
  return bytesToHex(bytes);
}

export function hexToNsec(hex: string): string {
  const bytes = hexToBytes(hex);
  const words = bech32.toWords(bytes);
  return bech32.encode('nsec', words);
}

export function npubToHex(npub: string): string {
  const { prefix, words } = bech32.decode(npub);
  if (prefix !== 'npub') throw new Error('Invalid npub prefix. Expected "npub"');
  const bytes = Uint8Array.from(bech32.fromWords(words));
  return bytesToHex(bytes);
}

export function hexToNpub(hex: string): string {
  const bytes = hexToBytes(hex);
  const words = bech32.toWords(bytes);
  return bech32.encode('npub', words);
}

export type KeyFormat = 'npub' | 'nsec' | 'hex' | 'unknown';

export function detectKeyFormat(key: string): KeyFormat {
  if (key.startsWith('npub1')) return 'npub';
  if (key.startsWith('nsec1')) return 'nsec';
  if (/^[0-9a-f]{64}$/i.test(key)) return 'hex';
  return 'unknown';
}

export function convertKey(key: string): {
  npub: string;
  nsec: string | null;
  hex: string;
  format: string;
} {
  const format = detectKeyFormat(key);

  switch (format) {
    case 'npub': {
      const hex = npubToHex(key);
      return { npub: key, nsec: null, hex, format: 'npub (public key)' };
    }
    case 'nsec': {
      const hex = nsecToHex(key);
      const npub = hexToNpub(hex);
      return { npub, nsec: key, hex, format: 'nsec (private key)' };
    }
    case 'hex': {
      const npub = hexToNpub(key);
      // Don't auto-generate nsec from hex — we don't know if it's private
      return { npub, nsec: null, hex: key, format: 'hex public key' };
    }
    default:
      throw new Error('Unrecognized key format. Expected npub1..., nsec1..., or 64-char hex.');
  }
}
