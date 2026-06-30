export function usePermalink() {
  let currentRelayUrl = $state<string | null>(null);
  let compareIds = $state<[string, string] | null>(null);

  /**
   * Parse the current URL path for relay or compare routes.
   * Call once on mount.
   */
  function parseUrl(): { type: 'relay' | 'compare' | null; param?: string } {
    const path = window.location.pathname;

    // /relay/relay.damus.io
    const relayMatch = path.match(/^\/relay\/(.+)$/);
    if (relayMatch) {
      const url = `wss://${decodeURIComponent(relayMatch[1])}`;
      currentRelayUrl = url;
      return { type: 'relay', param: url };
    }

    // /compare/:id1/:id2
    const compareMatch = path.match(/^\/compare\/([^/]+)\/([^/]+)$/);
    if (compareMatch) {
      compareIds = [compareMatch[1], compareMatch[2]];
      return { type: 'compare', param: `${compareMatch[1]}/${compareMatch[2]}` };
    }

    return { type: null };
  }

  /**
   * Update the URL without triggering a page reload.
   */
  function pushRelay(url: string) {
    const slug = url.replace('wss://', '').replace('ws://', '');
    window.history.pushState({}, '', `/relay/${slug}`);
    currentRelayUrl = url;
  }

  function pushCompare(id1: string, id2: string) {
    window.history.pushState({}, '', `/compare/${id1}/${id2}`);
    compareIds = [id1, id2];
  }

  function clear() {
    window.history.pushState({}, '', '/');
    currentRelayUrl = null;
    compareIds = null;
  }

  function copyShareLink(): string | null {
    if (currentRelayUrl) {
      const slug = currentRelayUrl.replace('wss://', '').replace('ws://', '');
      const link = `${window.location.origin}/relay/${slug}`;
      navigator.clipboard.writeText(link);
      return link;
    }
    if (compareIds) {
      const link = `${window.location.origin}/compare/${compareIds[0]}/${compareIds[1]}`;
      navigator.clipboard.writeText(link);
      return link;
    }
    return null;
  }

  return {
    get currentRelayUrl() {
      return currentRelayUrl;
    },
    get compareIds() {
      return compareIds;
    },
    parseUrl,
    pushRelay,
    pushCompare,
    clear,
    copyShareLink,
  };
}
