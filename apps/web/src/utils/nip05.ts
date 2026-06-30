import { hexToNpub } from './keys';

export interface Nip05Result {
  identifier: string;
  local: string;
  domain: string;
  verified: boolean;
  resolvedPubkey: string | null;
  expectedPubkey: string | null;
  npub: string | null;
  httpStatus: number | null;
  responseTimeMs: number;
  rawResponse: Record<string, unknown> | null;
  error: string | null;
}

export async function verifyNip05(
  identifier: string,
  expectedPubkey?: string,
): Promise<Nip05Result> {
  if (!identifier.includes('@') || !identifier.trim()) {
    throw new Error('NIP-05 identifier must be in the format user@domain.com');
  }
  const [local, domain] = identifier.split('@');
  const start = performance.now();

  try {
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(local)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const json = await res.json();
    const responseTimeMs = performance.now() - start;

    const resolvedPubkey = json.names?.[local] ?? null;
    const verified =
      resolvedPubkey !== null && (!expectedPubkey || resolvedPubkey === expectedPubkey);

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
    };
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
    };
  }
}
