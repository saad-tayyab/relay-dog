/**
 * Composable for adding a relay to the directory.
 * Extracts API logic from AddToDirectory component.
 *
 * Usage:
 *   const addRelay = useAddRelay();
 *   await addRelay.add(url, name);
 *   addRelay.reset();
 */

import { apiUrl } from '../../utils/api';

export function useAddRelay() {
  let submitting = $state(false);
  let error = $state<string | null>(null);
  let success = $state(false);
  let addedRelayId = $state<string | null>(null);

  async function add(url: string, name?: string): Promise<{ id: string } | null> {
    if (submitting) return null;

    submitting = true;
    error = null;
    success = false;
    addedRelayId = null;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Attach API key if saved
      const savedKey = localStorage.getItem('relayscope_api_key');
      if (savedKey) {
        headers.Authorization = `Bearer ${savedKey}`;
      }

      const res = await fetch(apiUrl('/api/relays'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url,
          name: name || undefined,
          isPublic: true,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      const json = await res.json();

      if (json.success) {
        success = true;
        addedRelayId = json.data.id;
        // Persist API key for future use
        if (headers.Authorization) {
          localStorage.setItem('relayscope_api_key', headers.Authorization.replace('Bearer ', ''));
        }
        return { id: json.data.id };
      }

      if (res.status === 409) {
        // Already exists — not an error, just mark as success
        success = true;
        return null;
      }

      if (res.status === 401) {
        error = 'Unauthorized — check your API key';
        return null;
      }

      error = json.error || 'Failed to add relay';
      return null;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to add relay';
      return null;
    } finally {
      submitting = false;
    }
  }

  function dismissError() {
    error = null;
  }

  function dismissSuccess() {
    success = false;
  }

  function reset() {
    submitting = false;
    error = null;
    success = false;
    addedRelayId = null;
  }

  return {
    get submitting() {
      return submitting;
    },
    get error() {
      return error;
    },
    get success() {
      return success;
    },
    get addedRelayId() {
      return addedRelayId;
    },
    add,
    dismissError,
    dismissSuccess,
    reset,
  };
}
