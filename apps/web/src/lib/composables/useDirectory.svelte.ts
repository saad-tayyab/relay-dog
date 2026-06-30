import type { DirectoryFilters, DirectoryRelay, DirectoryResponse } from '@relayscope/shared';

const API_BASE = '/api/directory';

export function useDirectory() {
  let relays = $state<DirectoryRelay[]>([]);
  let total = $state(0);
  let page = $state(1);
  let totalPages = $state(0);
  let loading = $state(false);
  let error = $state<string | null>(null);

  // Filter state
  let filters = $state<DirectoryFilters>({
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: 20,
  });

  async function fetchRelays(): Promise<void> {
    loading = true;
    error = null;

    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.nips && filters.nips.length > 0) {
        params.set('nips', filters.nips.join(','));
      }
      if (filters.authRequired) params.set('authRequired', 'true');
      if (filters.paymentRequired) params.set('paymentRequired', 'true');
      if (filters.country) params.set('country', filters.country);
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);
      params.set('page', String(filters.page));
      params.set('limit', String(filters.limit));

      const res = await fetch(`${API_BASE}?${params.toString()}`, {
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch directory');
      }

      const data: DirectoryResponse = json.data;
      relays = data.relays;
      total = data.total;
      page = data.page;
      totalPages = data.totalPages;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to fetch directory';
    } finally {
      loading = false;
    }
  }

  function setSearch(search: string) {
    filters = { ...filters, search, page: 1 };
    fetchRelays();
  }

  function setNips(nips: number[]) {
    filters = { ...filters, nips, page: 1 };
    fetchRelays();
  }

  function setCountry(country: string | null) {
    filters = { ...filters, country: country || undefined, page: 1 };
    fetchRelays();
  }

  function setSort(sortBy: DirectoryFilters['sortBy'], sortOrder: DirectoryFilters['sortOrder']) {
    filters = { ...filters, sortBy, sortOrder, page: 1 };
    fetchRelays();
  }

  function setPage(newPage: number) {
    filters = { ...filters, page: newPage };
    fetchRelays();
  }

  function reset() {
    relays = [];
    total = 0;
    page = 1;
    totalPages = 0;
    loading = false;
    error = null;
    filters = { sortBy: 'name', sortOrder: 'asc', page: 1, limit: 20 };
  }

  return {
    get relays() {
      return relays;
    },
    get total() {
      return total;
    },
    get page() {
      return page;
    },
    get totalPages() {
      return totalPages;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get filters() {
      return filters;
    },
    fetchRelays,
    setSearch,
    setNips,
    setCountry,
    setSort,
    setPage,
    reset,
  };
}
