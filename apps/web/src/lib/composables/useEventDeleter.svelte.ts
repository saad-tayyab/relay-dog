import { signAndPublish } from '../utils/nostr';

export interface DeleteResult {
  eventId: string;
  success: boolean;
  error?: string;
}

export function useEventDeleter() {
  // $state creates deeply reactive Proxies — mutate properties directly
  let eventIds = $state<string[]>([]);
  let reason = $state('');
  let targetRelay = $state('');
  let deleting = $state(false);
  let results = $state<DeleteResult[]>([]);

  function addEventId(id: string) {
    const trimmed = id.trim();
    if (!eventIds.includes(trimmed)) {
      eventIds.push(trimmed);
    }
  }

  function removeEventId(id: string) {
    const idx = eventIds.indexOf(id);
    if (idx !== -1) eventIds.splice(idx, 1);
  }

  function setEventIds(ids: string[]) {
    eventIds.length = 0;
    eventIds.push(...ids);
  }

  function setReason(r: string) {
    reason = r;
  }

  function setTargetRelay(relay: string) {
    targetRelay = relay;
  }

  function reset() {
    eventIds.length = 0;
    reason = '';
    results.length = 0;
    deleting = false;
  }

  async function deleteEvents(): Promise<DeleteResult[]> {
    // Concurrency guard
    if (deleting) return [];

    if (eventIds.length === 0 || !targetRelay) {
      return [];
    }

    deleting = true;
    results.length = 0;

    try {
      // Build kind 5 deletion event per NIP-09
      const tags = eventIds.map((id) => ['e', id]);
      if (reason) {
        tags.push(['reason', reason]);
      }

      await signAndPublish(targetRelay, {
        kind: 5,
        content: reason || '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      const deleteResults: DeleteResult[] = eventIds.map((id) => ({
        eventId: id,
        success: true,
      }));
      results.length = 0;
      results.push(...deleteResults);
      return deleteResults;
    } catch (e) {
      const errorResults: DeleteResult[] = eventIds.map((id) => ({
        eventId: id,
        success: false,
        error: e instanceof Error ? e.message : 'Deletion failed',
      }));
      results.length = 0;
      results.push(...errorResults);
      return errorResults;
    } finally {
      deleting = false;
    }
  }

  return {
    get eventIds() {
      return eventIds;
    },
    get reason() {
      return reason;
    },
    get targetRelay() {
      return targetRelay;
    },
    get deleting() {
      return deleting;
    },
    get results() {
      return results;
    },
    addEventId,
    removeEventId,
    setEventIds,
    setReason,
    setTargetRelay,
    reset,
    deleteEvents,
  };
}
