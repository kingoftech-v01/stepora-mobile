/**
 * useInfiniteList — Paginated list fetcher for React Native.
 * Mirrors the web app's useInfiniteList hook using @tanstack/react-query.
 *
 * Uses LimitOffsetPagination: ?limit=N&offset=M (matches backend default).
 *
 * @param {Object} opts
 * @param {Array}  opts.queryKey   — React Query cache key
 * @param {string} opts.url        — API endpoint (may already contain query params)
 * @param {number} [opts.limit=20] — Items per page
 * @param {boolean} [opts.enabled=true]
 * @param {Object} [opts.params={}] — Extra query params
 * @returns {{ items, isLoading, isError, error, hasMore, loadingMore, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, removeItem }}
 */
var { useState, useCallback } = require('react');
var { useInfiniteQuery } = require('@tanstack/react-query');
var { apiGet } = require('../services/api');

var useInfiniteList = function (opts) {
  var queryKey = opts.queryKey;
  var url = opts.url;
  var limit = opts.limit || 20;
  var enabled = opts.enabled !== false;
  var params = opts.params || {};

  // Build extra query string from params
  var extraParams = Object.keys(params)
    .map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    })
    .join('&');

  var query = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: function (ctx) {
      var offset = ctx.pageParam || 0;
      var separator = url.indexOf('?') !== -1 ? '&' : '?';
      var paginatedUrl = url + separator + 'limit=' + limit + '&offset=' + offset +
        (extraParams ? '&' + extraParams : '');
      return apiGet(paginatedUrl);
    },
    getNextPageParam: function (lastPage, allPages) {
      if (!lastPage) return undefined;
      // DRF LimitOffsetPagination: { results, next, count }
      if (lastPage.next) {
        // Calculate total items fetched so far
        var totalFetched = 0;
        allPages.forEach(function (page) {
          var results = (page && page.results) || page || [];
          if (Array.isArray(results)) totalFetched += results.length;
        });
        return totalFetched;
      }
      return undefined;
    },
    initialPageParam: 0,
    enabled: enabled,
  });

  // Flatten all pages into a single items array
  var items = [];
  if (query.data && query.data.pages) {
    query.data.pages.forEach(function (page) {
      var results = (page && page.results) || (page && page.activities) || page || [];
      if (Array.isArray(results)) {
        items = items.concat(results);
      }
    });
  }

  // Remove a single item by ID without refetching
  var removeItem = useCallback(function (id) {
    // Note: with useInfiniteQuery, we can't easily mutate cache pages
    // so we trigger a refetch instead
    query.refetch();
  }, [query.refetch]);

  return {
    items: items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: !!query.hasNextPage,
    hasMore: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    loadingMore: query.isFetchingNextPage,
    removeItem: removeItem,
  };
};

module.exports = useInfiniteList;
