import { bech32 } from '@scure/base';

const NSEC_PREFIX = 'nsec';
const NPUB_PREFIX = 'npub';

export function hexToNpub(hex: string): string {
  const match = hex.match(/.{1,2}/g);
  const bytes = Uint8Array.from(match?.map((b) => Number.parseInt(b, 16)) ?? []);
  return bech32.encode(NPUB_PREFIX, bech32.toWords(bytes));
}

export function hexToNsec(hex: string): string {
  const match = hex.match(/.{1,2}/g);
  const bytes = Uint8Array.from(match?.map((b) => Number.parseInt(b, 16)) ?? []);
  return bech32.encode(NSEC_PREFIX, bech32.toWords(bytes));
}

export function npubToHex(npub: string): string {
  const { prefix, words } = bech32.decode(npub);
  if (prefix !== NPUB_PREFIX) throw new Error('Not an npub');
  return Buffer.from(bech32.fromWords(words)).toString('hex');
}

export function nsecToHex(nsec: string): string {
  const { prefix, words } = bech32.decode(nsec);
  if (prefix !== NSEC_PREFIX) throw new Error('Not an nsec');
  return Buffer.from(bech32.fromWords(words)).toString('hex');
}

export function detectKeyFormat(input: string): 'npub' | 'nsec' | 'hex' | 'unknown' {
  if (input.startsWith('npub1')) return 'npub';
  if (input.startsWith('nsec1')) return 'nsec';
  if (/^[0-9a-f]{64}$/i.test(input)) return 'hex';
  return 'unknown';
}

export function convertKey(input: string): {
  npub: string;
  nsec: string | null;
  hex: string;
  format: string;
} {
  const format = detectKeyFormat(input);
  switch (format) {
    case 'npub': {
      const hex = npubToHex(input);
      return { npub: input, nsec: hexToNsec(hex), hex, format: 'npub' };
    }
    case 'nsec': {
      const hex = nsecToHex(input);
      return { npub: hexToNpub(hex), nsec: input, hex, format: 'nsec' };
    }
    case 'hex': {
      return { npub: hexToNpub(input), nsec: hexToNsec(input), hex: input, format: 'hex' };
    }
    default:
      throw new Error('Unrecognized key format');
  }
}
