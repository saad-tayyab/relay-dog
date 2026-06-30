import type { NostrEvent } from '@relayscope/shared';

export interface BackupOptions {
  authorPubkey: string;
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  relayUrl: string;
}

export interface BackupResult {
  events: NostrEvent[];
  filename: string;
}

export interface RestoreResult {
  total: number;
  restored: number;
  skipped: number;
  errors: string[];
}

/**
 * Fetch events from a relay for backup.
 */
export async function fetchEventsForBackup(options: BackupOptions): Promise<NostrEvent[]> {
  const filter: Record<string, unknown> = {
    authors: [options.authorPubkey],
    limit: options.limit || 1000,
  };

  if (options.kinds && options.kinds.length > 0) {
    filter.kinds = options.kinds;
  }
  if (options.since) {
    filter.since = options.since;
  }
  if (options.until) {
    filter.until = options.until;
  }

  return new Promise((resolve, reject) => {
    const events: NostrEvent[] = [];
    const ws = new WebSocket(options.relayUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify(['REQ', 'backup', filter]));
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (Array.isArray(data)) {
          if (data[0] === 'EVENT') {
            events.push(data[2]);
          } else if (data[0] === 'EOSE') {
            ws.close();
            resolve(events);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = (err) => {
      ws.close();
      reject(new Error(`WebSocket error: ${err}`));
    };

    // Timeout after 30 seconds
    setTimeout(() => {
      ws.close();
      resolve(events);
    }, 30_000);
  });
}

/**
 * Export events to a JSON file for download.
 */
export function exportToFile(events: NostrEvent[], pubkey: string): string {
  const shortPubkey = pubkey.slice(0, 8);
  const date = new Date().toISOString().split('T')[0];
  const filename = `nostr-backup-${shortPubkey}-${date}.json`;

  const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Import events from a JSON file.
 */
export async function importFromFile(file: File): Promise<NostrEvent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result as string);
        if (!Array.isArray(raw)) {
          throw new Error('Invalid backup file: expected array of events');
        }
        // Validate each event has required Nostr fields
        const requiredFields = ['id', 'pubkey', 'sig', 'kind', 'created_at', 'tags', 'content'];
        const events = raw.filter((e: Record<string, unknown>) => {
          if (typeof e !== 'object' || e === null) {
            // Skip invalid event silently
            return false;
          }
          for (const field of requiredFields) {
            if (!(field in e)) {
              // Skip event with missing field silently
              return false;
            }
          }
          return true;
        });
        if (events.length === 0) {
          throw new Error('No valid Nostr events found in backup file');
        }
        resolve(events);
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Failed to parse backup file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
