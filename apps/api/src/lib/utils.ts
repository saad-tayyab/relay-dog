import { assertSafeUrl, assertSafeUrlResolved } from './ssrf';

const MAX_PAGE_LIMIT = 100;

export function parsePageLimit(
  rawPage: string | undefined,
  rawLimit: string | undefined,
): { page: number; limit: number } {
  const page = Math.max(1, parseInt(rawPage || '1', 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(rawLimit || '20', 10) || 20), MAX_PAGE_LIMIT);
  return { page, limit };
}

export function normalizeRelayUrl(raw: string): string {
  let url = raw.trim();
  if (
    !url.startsWith('wss://') &&
    !url.startsWith('ws://') &&
    !url.startsWith('https://') &&
    !url.startsWith('http://')
  ) {
    url = `wss://${url}`;
  }
  assertSafeUrl(url);
  return url;
}

export async function toHttpUrl(url: string): Promise<string> {
  const httpUrl = url
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://')
    .replace(/\/$/, '');
  await assertSafeUrlResolved(httpUrl);
  return httpUrl;
}

export function toWsUrl(url: string): string {
  const wsUrl = url.startsWith('http')
    ? url.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
    : url;
  assertSafeUrl(wsUrl);
  return wsUrl;
}
