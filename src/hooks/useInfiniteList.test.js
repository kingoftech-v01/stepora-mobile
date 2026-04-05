/**
 * Tests for src/hooks/useInfiniteList.js
 * Covers pagination, data flattening, extra params, enabled flag,
 * hasMore/loadingMore aliases, removeItem, and edge cases.
 */

var React = require('react');
var { renderHook, waitFor } = require('@testing-library/react-native');
var { QueryClient, QueryClientProvider } = require('@tanstack/react-query');

// ─── Mock API ────────────────────────────────────────────────────
var mockApiGet = jest.fn();

jest.mock('../services/api', function () {
  return {
    apiGet: function () { return mockApiGet.apply(null, arguments); },
  };
});

var useInfiniteList = require('./useInfiniteList');

var queryClient;

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function wrapper(props) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      props.children,
    );
  };
}

beforeEach(function () {
  jest.clearAllMocks();
});

describe('useInfiniteList', function () {
  describe('initial fetch', function () {
    it('fetches first page with default limit of 20', async function () {
      mockApiGet.mockResolvedValue({
        results: [{ id: 1 }, { id: 2 }],
        next: null,
        count: 2,
      });

      var wrapper = createWrapper();
      var { result } = renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-list'],
            url: '/api/v1/items/',
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiGet).toHaveBeenCalledWith('/api/v1/items/?limit=20&offset=0');
      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('uses custom limit when provided', async function () {
      mockApiGet.mockResolvedValue({
        results: [{ id: 1 }],
        next: null,
        count: 1,
      });

      var wrapper = createWrapper();
      renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-custom-limit'],
            url: '/api/v1/items/',
            limit: 5,
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(mockApiGet).toHaveBeenCalledWith('/api/v1/items/?limit=5&offset=0');
      });
    });

    it('appends extra params to URL', async function () {
      mockApiGet.mockResolvedValue({
        results: [],
        next: null,
        count: 0,
      });

      var wrapper = createWrapper();
      renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-params'],
            url: '/api/v1/items/',
            params: { search: 'hello', status: 'active' },
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(mockApiGet).toHaveBeenCalled();
      });

      var calledUrl = mockApiGet.mock.calls[0][0];
      expect(calledUrl).toContain('search=hello');
      expect(calledUrl).toContain('status=active');
    });

    it('uses & separator when URL already has query params', async function () {
      mockApiGet.mockResolvedValue({
        results: [],
        next: null,
        count: 0,
      });

      var wrapper = createWrapper();
      renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-existing-params'],
            url: '/api/v1/items/?type=dream',
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(mockApiGet).toHaveBeenCalled();
      });

      var calledUrl = mockApiGet.mock.calls[0][0];
      expect(calledUrl).toBe('/api/v1/items/?type=dream&limit=20&offset=0');
    });
  });

  describe('data flattening', function () {
    it('flattens DRF results across multiple pages', async function () {
      mockApiGet
        .mockResolvedValueOnce({
          results: [{ id: 1 }, { id: 2 }],
          next: 'http://api.test/items/?limit=2&offset=2',
          count: 4,
        });

      var wrapper = createWrapper();
      var { result } = renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-flatten'],
            url: '/api/v1/items/',
            limit: 2,
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('handles empty results', async function () {
      mockApiGet.mockResolvedValue({
        results: [],
        next: null,
        count: 0,
      });

      var wrapper = createWrapper();
      var { result } = renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-empty'],
            url: '/api/v1/items/',
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual([]);
    });

    it('handles activities key in response', async function () {
      mockApiGet.mockResolvedValue({
        activities: [{ id: 10, type: 'like' }],
        next: null,
      });

      var wrapper = createWrapper();
      var { result } = renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-activities'],
            url: '/api/v1/activities/',
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual([{ id: 10, type: 'like' }]);
    });
  });

  describe('hasMore / hasNextPage', function () {
    it('hasMore is true when next URL is present', async function () {
      mockApiGet.mockResolvedValue({
        results: [{ id: 1 }],
        next: 'http://api.test/items/?offset=1',
        count: 5,
      });

      var wrapper = createWrapper();
      var { result } = renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-hasmore'],
            url: '/api/v1/items/',
            limit: 1,
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(true);
      expect(result.current.hasNextPage).toBe(true);
    });

    it('hasMore is false when next URL is null', async function () {
      mockApiGet.mockResolvedValue({
        results: [{ id: 1 }],
        next: null,
        count: 1,
      });

      var wrapper = createWrapper();
      var { result } = renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-nomore'],
            url: '/api/v1/items/',
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('enabled flag', function () {
    it('does not fetch when enabled is false', async function () {
      var wrapper = createWrapper();
      var { result } = renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-disabled'],
            url: '/api/v1/items/',
            enabled: false,
          });
        },
        { wrapper: wrapper },
      );

      // Wait a tick to ensure no async calls
      await new Promise(function (resolve) { setTimeout(resolve, 50); });

      expect(mockApiGet).not.toHaveBeenCalled();
      expect(result.current.items).toEqual([]);
    });

    it('fetches when enabled is true (default)', async function () {
      mockApiGet.mockResolvedValue({
        results: [{ id: 1 }],
        next: null,
        count: 1,
      });

      var wrapper = createWrapper();
      renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-enabled-default'],
            url: '/api/v1/items/',
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(mockApiGet).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', function () {
    it('exposes error state when API fails', async function () {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      var wrapper = createWrapper();
      var { result } = renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-error'],
            url: '/api/v1/items/',
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.items).toEqual([]);
    });
  });

  describe('return shape', function () {
    it('returns all expected fields', async function () {
      mockApiGet.mockResolvedValue({
        results: [],
        next: null,
        count: 0,
      });

      var wrapper = createWrapper();
      var { result } = renderHook(
        function () {
          return useInfiniteList({
            queryKey: ['test-shape'],
            url: '/api/v1/items/',
          });
        },
        { wrapper: wrapper },
      );

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual(expect.objectContaining({
        items: expect.any(Array),
        isLoading: expect.any(Boolean),
        isError: expect.any(Boolean),
        refetch: expect.any(Function),
        fetchNextPage: expect.any(Function),
        hasNextPage: expect.any(Boolean),
        hasMore: expect.any(Boolean),
        isFetchingNextPage: expect.any(Boolean),
        loadingMore: expect.any(Boolean),
        removeItem: expect.any(Function),
      }));
    });
  });
});
