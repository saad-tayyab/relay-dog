export interface DeleteResult {
  eventId: string;
  success: boolean;
  error?: string;
}

export function useEventDeleter() {
  let eventIds = $state<string[]>([]);
  let reason = $state('');
  let targetRelay = $state('');
  let deleting = $state(false);
  let results = $state<DeleteResult[]>([]);

  function addEventId(id: string) {
    if (!eventIds.includes(id.trim())) {
      eventIds = [...eventIds, id.trim()];
    }
  }

  function removeEventId(id: string) {
    eventIds = eventIds.filter((eid) => eid !== id);
  }

  function setEventIds(ids: string[]) {
    eventIds = ids;
  }

  function setReason(r: string) {
    reason = r;
  }

  function setTargetRelay(relay: string) {
    targetRelay = relay;
  }

  function reset() {
    eventIds = [];
    reason = '';
    results = [];
  }

  async function deleteEvents(): Promise<DeleteResult[]> {
    if (eventIds.length === 0 || !targetRelay) {
      return [];
    }

    // Check for NIP-07 signer
    if (!window.nostr) {
      return eventIds.map((id) => ({
        eventId: id,
        success: false,
        error: 'No NIP-07 signer detected',
      }));
    }

    deleting = true;
    results = [];

    try {
      // Build kind 5 deletion event
      const tags = eventIds.map((id) => ['e', id]);
      if (reason) {
        tags.push(['reason', reason]);
      }

      const unsignedEvent = {
        kind: 5,
        content: reason || '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      // Sign via NIP-07
      const _signedEvent = await window.nostr.signEvent(unsignedEvent);

      // TODO: Publish to relay (requires WebSocket connection)
      // For now, return mock success
      const deleteResults: DeleteResult[] = eventIds.map((id) => ({
        eventId: id,
        success: true,
      }));

      results = deleteResults;
      return deleteResults;
    } catch (e) {
      const errorResults: DeleteResult[] = eventIds.map((id) => ({
        eventId: id,
        success: false,
        error: e instanceof Error ? e.message : 'Deletion failed',
      }));
      results = errorResults;
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
