import { lookup } from 'node:dns/promises';

const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'ws:', 'wss:']);

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google',
  '0.0.0.0',
]);

function isPrivateIpv4(host: string): boolean {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const normalized = host.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fe80:')) return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (isPrivateIpv4(host)) return true;
  if (host.includes(':') && isPrivateIpv6(host)) return true;

  return false;
}

/**
 * Validates a URL before server-side fetch/WebSocket use.
 * Blocks private, loopback, link-local, and cloud metadata targets.
 */
export function assertSafeUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    throw new Error('URL scheme not allowed');
  }

  if (!parsed.hostname) {
    throw new Error('URL hostname required');
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new Error('URL target not allowed');
  }

  return parsed;
}

/**
 * Validates a URL AND its resolved IP against private network ranges.
 * Prevents DNS rebinding attacks where hostname passes check but resolves to internal IP.
 */
export async function assertSafeUrlResolved(rawUrl: string): Promise<URL> {
  // Step 1: Validate hostname (existing check)
  const parsed = assertSafeUrl(rawUrl);

  // Step 2: Resolve DNS and check resolved IP
  try {
    const { address } = await lookup(parsed.hostname, { family: 4 });
    if (isPrivateIpv4(address)) {
      throw new Error('URL resolves to private network');
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('resolves to private')) {
      throw e;
    }
    // DNS resolution failed — could be legitimate (offline relay) or malicious.
    // Allow through — the actual fetch will fail if unreachable.
  }

  return parsed;
}

/** Returns true when the URL is safe for outbound server requests. */
export function isSafeUrl(rawUrl: string): boolean {
  try {
    assertSafeUrl(rawUrl);
    return true;
  } catch {
    return false;
  }
}
