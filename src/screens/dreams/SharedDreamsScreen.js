/**
 * SharedDreamsScreen — Dreams shared with the current user, with filtering.
 * Complements DreamShareScreen by adding All/Friends/Circles filter.
 * Features: FlatList with infinite scroll, category + sharer info,
 * progress bars, filter tabs, tap to view dream detail (read-only).
 */
var React = require('react');
var { useState, useCallback } = React;
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery } = require('@tanstack/react-query');
var { apiGet } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');
var { BRAND, CATEGORIES } = require('../../styles/colors');
var { dark: theme } = require('../../styles/theme');
var { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS } = require('../../styles/tokens');
var GlassCard = require('../../components/GlassCard');
var PillTabs = require('../../components/PillTabs');
var { ScreenHeader, BackButton } = require('../../components/ScreenHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, CONTACT_COLORS } = require('../../theme/tokens');
var useInfiniteList = require('../../hooks/useInfiniteList');

var FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'friends', label: 'Friends' },
  { key: 'circles', label: 'Circles' },
];

var getAvatarColor = function (name) {
  if (!name) return CONTACT_COLORS[0];
  var hash = 0;
  for (var i = 0; i < name.length; i++) hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  return CONTACT_COLORS[Math.abs(hash) % CONTACT_COLORS.length];
};

var getCategoryColor = function (key) {
  var cat = CATEGORIES[key];
  return cat ? cat.solid : BRAND.purple;
};

var getCategoryLabel = function (key) {
  var cat = CATEGORIES[key];
  return cat ? cat.label : (key || 'General');
};

// ─── Screen ─────────────────────────────────────────────────────

var SharedDreamsScreen = function () {
  var navigation = useNavigation();
  var [filter, setFilter] = useState('all');
  var [refreshing, setRefreshing] = useState(false);

  // ─── Query ──────────────────────────────────────────────────

  var filterParam = filter !== 'all' ? ('&source=' + filter) : '';
  var sharedInf = useInfiniteList({
    queryKey: ['shared-dreams', filter],
    url: DREAMS.SHARED_WITH_ME + '?ordering=-shared_at' + filterParam,
    limit: 20,
  });

  var onRefresh = useCallback(function () {
    setRefreshing(true);
    sharedInf.refetch().finally(function () {
      setRefreshing(false);
    });
  }, []);

  // ─── Render card ────────────────────────────────────────────

  var renderCard = function (info) {
    var dream = info.item;
    var progress = dream.progress || 0;
    var title = dream.title || 'Untitled Dream';
    var category = dream.category || '';
    var catColor = getCategoryColor(category);
    var catLabel = getCategoryLabel(category);
    var description = dream.description || '';
    if (description.length > 120) description = description.slice(0, 120) + '...';

    // Sharer info
    var sharer = dream.sharedBy || dream.owner || {};
    var sharerName = typeof sharer === 'object'
      ? (sharer.displayName || sharer.display_name || sharer.username || 'Someone')
      : (sharer || 'Someone');
    var sharerAvatar = typeof sharer === 'object' ? (sharer.avatar || sharer.avatarUrl || null) : null;

    // Source indicator
    var source = dream.source || dream.sharedVia || '';

    return React.createElement(
      TouchableOpacity,
      {
        style: styles.card,
        activeOpacity: 0.7,
        onPress: function () {
          navigation.navigate('DreamDetail', { id: dream.id, readOnly: true });
        },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: title + ', shared by ' + sharerName + ', ' + Math.round(progress) + '% progress, view only',
      },
      // Header: sharer info
      React.createElement(
        View,
        { style: styles.cardSharerRow },
        React.createElement(Avatar, {
          name: sharerName,
          src: sharerAvatar,
          size: 28,
          color: getAvatarColor(sharerName),
        }),
        React.createElement(
          View,
          { style: { flex: 1, marginLeft: 10 } },
          React.createElement(
            Text,
            { style: styles.sharerName, numberOfLines: 1 },
            sharerName,
          ),
          dream.sharedAt
            ? React.createElement(
                Text,
                { style: styles.sharedDate },
                'Shared ' + new Date(dream.sharedAt).toLocaleDateString(),
              )
            : null,
        ),
        source
          ? React.createElement(
              View,
              { style: styles.sourceBadge },
              React.createElement(Icon, {
                name: source === 'circles' ? 'users' : 'user',
                size: 10,
                color: COLORS.textMuted,
              }),
              React.createElement(
                Text,
                { style: styles.sourceText },
                source === 'circles' ? 'Circle' : 'Friend',
              ),
            )
          : null,
      ),

      // Title
      React.createElement(
        Text,
        { style: styles.cardTitle, numberOfLines: 2 },
        title,
      ),

      // Description
      description
        ? React.createElement(
            Text,
            { style: styles.cardDesc, numberOfLines: 3 },
            description,
          )
        : null,

      // Meta row: category + target date
      React.createElement(
        View,
        { style: styles.metaRow },
        category
          ? React.createElement(
              View,
              {
                style: [
                  styles.catPill,
                  { backgroundColor: catColor + '15', borderColor: catColor + '30' },
                ],
              },
              React.createElement(
                Text,
                { style: [styles.catPillText, { color: catColor }] },
                catLabel,
              ),
            )
          : null,
        dream.targetDate
          ? React.createElement(
              View,
              { style: styles.metaItem },
              React.createElement(Icon, { name: 'calendar', size: 12, color: COLORS.textMuted }),
              React.createElement(
                Text,
                { style: styles.metaText },
                new Date(dream.targetDate).toLocaleDateString(),
              ),
            )
          : null,
      ),

      // Progress bar
      React.createElement(
        View,
        { style: styles.progressWrap },
        React.createElement(
          View,
          { style: styles.progressHeader },
          React.createElement(
            View,
            { style: styles.metaItem },
            React.createElement(Icon, { name: 'target', size: 12, color: BRAND.purple }),
            React.createElement(Text, { style: styles.progressLabel }, 'Progress'),
          ),
          React.createElement(
            Text,
            { style: styles.progressPct },
            Math.round(progress) + '%',
          ),
        ),
        React.createElement(
          View,
          { style: styles.progressTrack },
          React.createElement(View, {
            style: [styles.progressBar, { width: Math.min(progress, 100) + '%' }],
          }),
        ),
      ),

      // Read-only indicator
      React.createElement(
        View,
        { style: styles.readOnlyRow },
        React.createElement(Icon, { name: 'eye', size: 12, color: COLORS.textMuted }),
        React.createElement(
          Text,
          { style: styles.readOnlyText },
          'View only',
        ),
        React.createElement(View, { style: { flex: 1 } }),
        React.createElement(Icon, { name: 'chevron-right', size: 16, color: COLORS.textMuted }),
      ),
    );
  };

  // ─── Footer ─────────────────────────────────────────────────

  var renderFooter = function () {
    if (sharedInf.loadingMore) {
      return React.createElement(
        View,
        { style: styles.footerLoader },
        React.createElement(ActivityIndicator, { size: 'small', color: BRAND.purple }),
      );
    }
    return null;
  };

  // ─── Empty state ────────────────────────────────────────────

  var renderEmpty = function () {
    return React.createElement(
      View,
      { style: styles.emptyWrap },
      React.createElement(
        View,
        { style: styles.emptyIconCircle },
        React.createElement(Icon, { name: 'share-2', size: 28, color: BRAND.purple }),
      ),
      React.createElement(
        Text,
        { style: styles.emptyTitle },
        filter === 'friends'
          ? 'No dreams shared by friends'
          : filter === 'circles'
            ? 'No dreams shared from circles'
            : 'No shared dreams yet',
      ),
      React.createElement(
        Text,
        { style: styles.emptyDesc },
        'When someone shares a dream with you, it will appear here.',
      ),
    );
  };

  // ─── Render ─────────────────────────────────────────────────

  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(ScreenHeader, {
      title: 'Shared Dreams',
      left: React.createElement(BackButton, {
        onPress: function () { navigation.goBack(); },
      }),
      right: sharedInf.items.length > 0
        ? React.createElement(
            View,
            { style: styles.countBadge },
            React.createElement(
              Text,
              { style: styles.countBadgeText },
              String(sharedInf.items.length),
            ),
          )
        : null,
    }),

    // Filter tabs
    React.createElement(
      View,
      { style: styles.filterRow },
      React.createElement(PillTabs, {
        tabs: FILTER_TABS,
        active: filter,
        onChange: setFilter,
        scrollable: false,
      }),
    ),

    // Content
    sharedInf.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
          React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple, accessibilityLabel: 'Loading shared dreams' }),
        )
      : sharedInf.items.length === 0
        ? renderEmpty()
        : React.createElement(FlatList, {
            data: sharedInf.items,
            renderItem: renderCard,
            keyExtractor: function (item) { return String(item.id); },
            contentContainerStyle: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
            showsVerticalScrollIndicator: false,
            ListFooterComponent: renderFooter,
            onEndReached: function () {
              if (sharedInf.hasNextPage && !sharedInf.loadingMore) {
                sharedInf.fetchNextPage();
              }
            },
            onEndReachedThreshold: 0.4,
            refreshControl: React.createElement(RefreshControl, {
              refreshing: refreshing,
              onRefresh: onRefresh,
              tintColor: BRAND.purple,
            }),
          }),
  );
};

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  filterRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },

  countBadge: {
    backgroundColor: 'rgba(139,92,246,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.semibold,
    color: BRAND.purple,
  },

  // Card
  card: {
    backgroundColor: theme.glassBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    padding: 16,
    marginBottom: 14,
  },
  cardSharerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  sharerName: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
  },
  sharedDate: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 1,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.text,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: theme.textSecondary },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 50,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Progress
  progressWrap: { marginBottom: 10 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, fontWeight: FONT_WEIGHTS.semibold, color: theme.textSecondary },
  progressPct: { fontSize: 12, fontWeight: FONT_WEIGHTS.semibold, color: BRAND.purple },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: BRAND.purple,
  },

  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
  },
  readOnlyText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },

  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

module.exports = SharedDreamsScreen;
