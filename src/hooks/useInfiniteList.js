/**
 * useInfiniteList — Paginated list fetcher for React Native.
 * Mirrors the web app's useInfiniteList hook using @tanstack/react-query.
 */
var { useInfiniteQuery } = require('@tanstack/react-query');
var { apiGet } = require('../services/api');

var useInfiniteList = function (opts) {
  var queryKey = opts.queryKey;
  var url = opts.url;
  var limit = opts.limit || 50;

  var query = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: function (ctx) {
      var pageParam = ctx.pageParam || 1;
      var separator = url.indexOf('?') !== -1 ? '&' : '?';
      var paginatedUrl = url + separator + 'page=' + pageParam + '&page_size=' + limit;
      return apiGet(paginatedUrl);
    },
    getNextPageParam: function (lastPage, allPages) {
      if (!lastPage) return undefined;
      // DRF pagination: { results, next, count }
      if (lastPage.next) return allPages.length + 1;
      // If results array is full, assume there's a next page
      var results = lastPage.results || lastPage;
      if (Array.isArray(results) && results.length >= limit) return allPages.length + 1;
      return undefined;
    },
    initialPageParam: 1,
  });

  // Flatten all pages into a single items array
  var items = [];
  if (query.data && query.data.pages) {
    query.data.pages.forEach(function (page) {
      var results = (page && page.results) || page || [];
      if (Array.isArray(results)) {
        items = items.concat(results);
      }
    });
  }

  return {
    items: items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    loadingMore: query.isFetchingNextPage,
  };
};

module.exports = useInfiniteList;
