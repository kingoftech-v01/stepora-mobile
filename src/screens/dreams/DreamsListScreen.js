/**
 * DreamsListScreen — Shows all user dreams with search, filter, and infinite scroll.
 */
var React = require('react');
var {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useDreamsListScreen = require('./useDreamsListScreen');
var SubscriptionBanner = require('../../components/SubscriptionBanner');
var OnboardingTooltip = require('../../components/OnboardingTooltip');
var { getTooltipConfig } = require('../../config/onboardingTooltips');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { OfflineDataBanner } = require('../../components/shared/OfflineBanner');

var DreamsListScreen = function () {
  var h = useDreamsListScreen();
  var addBtnRef = React.useRef(null);
  var tooltipCfg = getTooltipConfig('DreamsListScreen');

  var renderHeader = function () {
    return React.createElement(View, { style: styles.header },
      React.createElement(TouchableOpacity, {
        style: styles.backBtn,
        onPress: function () { h.navigation.goBack(); },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Go back',
      },
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(Text, { style: styles.title, accessibilityRole: 'header' }, 'My Dreams'),
      React.createElement(TouchableOpacity, {
        ref: addBtnRef,
        style: styles.addBtn,
        onPress: function () { h.navigation.navigate('DreamCreate'); },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Create new dream',
        hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
      },
        React.createElement(Icon, { name: 'plus', size: 20, color: '#fff' })
      )
    );
  };

  var renderSearch = function () {
    return React.createElement(View, { style: styles.searchWrap },
      React.createElement(Icon, {
        name: 'search',
        size: 14,
        color: COLORS.textMuted,
        style: styles.searchIcon,
      }),
      React.createElement(TextInput, {
        style: styles.searchInput,
        value: h.searchQuery,
        onChangeText: h.setSearchQuery,
        placeholder: 'Search dreams...',
        placeholderTextColor: COLORS.textMuted,
        accessible: true,
        accessibilityLabel: 'Search dreams',
        accessibilityRole: 'search',
      })
    );
  };

  var renderFilters = function () {
    return React.createElement(View, { style: styles.filterRow },
      h.filters.map(function (f) {
        var isActive = h.activeFilter === f.key;
        return React.createElement(TouchableOpacity, {
          key: f.key,
          style: [styles.filterPill, isActive && styles.filterPillActive],
          onPress: function () { h.setActiveFilter(f.key); },
          accessible: true,
          accessibilityRole: 'tab',
          accessibilityLabel: f.label,
          accessibilityState: { selected: isActive },
        },
          React.createElement(Text, {
            style: [styles.filterText, isActive && styles.filterTextActive],
          }, f.label)
        );
      })
    );
  };

  var renderDreamCard = function (info) {
    var dream = info.item;
    var solidColor = h.catSolid(dream.category);
    var progress = dream.progressPercentage || 0;
    var emoji = dream.emoji || '';
    var iconName = h.CAT_ICONS[dream.category] || 'star';
    var statusCfg = h.STATUS_CFG[dream.status] || h.STATUS_CFG.active;
    var daysLeft = dream.daysLeft ||
      (dream.targetDate
        ? Math.max(0, Math.ceil((new Date(dream.targetDate) - new Date()) / 86400000))
        : null);

    var cardEl = React.createElement(TouchableOpacity, {
      style: styles.dreamCard,
      activeOpacity: 0.7,
      onPress: function () { h.navigation.navigate('DreamDetail', { id: dream.id }); },
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: (dream.title || 'Dream') + ', ' + progress + '% complete, ' + (dream.completedGoalsCount || 0) + ' of ' + (dream.goalsCount || 0) + ' goals',
      accessibilityHint: 'Opens dream details',
    },
      // Color strip
      React.createElement(View, { style: [styles.colorStrip, { backgroundColor: solidColor }] }),
      React.createElement(View, { style: styles.cardContent },
        // Icon/emoji
        React.createElement(View, {
          style: [styles.catIcon, { backgroundColor: solidColor + '15', borderColor: solidColor + '25' }],
        },
          emoji
            ? React.createElement(Text, { style: styles.emoji }, emoji)
            : React.createElement(Icon, { name: iconName, size: 20, color: solidColor })
        ),
        // Info
        React.createElement(View, { style: styles.cardInfo },
          // Title + category badge
          React.createElement(View, { style: styles.titleRow },
            React.createElement(Text, { style: styles.dreamTitle, numberOfLines: 1 }, dream.title),
            React.createElement(View, {
              style: [styles.catBadge, { backgroundColor: solidColor + '18', borderColor: solidColor + '30' }],
            },
              React.createElement(Text, { style: [styles.catBadgeText, { color: solidColor }] },
                (dream.categoryLabel || (h.CATEGORIES[dream.category] && h.CATEGORIES[dream.category].label) || dream.category)
              )
            )
          ),
          // Progress bar
          React.createElement(View, { style: styles.progressRow },
            React.createElement(View, { style: styles.progressTrack },
              React.createElement(View, {
                style: [styles.progressFill, { width: progress + '%', backgroundColor: solidColor }],
              })
            ),
            React.createElement(Text, { style: [styles.progressText, { color: solidColor }] }, progress + '%')
          ),
          // Meta row
          React.createElement(View, { style: styles.metaRow },
            React.createElement(View, { style: styles.metaItem },
              React.createElement(Icon, { name: statusCfg.icon, size: 10, color: statusCfg.color }),
              React.createElement(Text, { style: [styles.metaText, { color: statusCfg.color }] },
                dream.status ? dream.status.charAt(0).toUpperCase() + dream.status.slice(1) : 'Active'
              )
            ),
            React.createElement(Text, { style: styles.metaText },
              (dream.completedGoalsCount || 0) + '/' + (dream.goalsCount || 0) + ' goals'
            ),
            daysLeft !== null && React.createElement(View, { style: styles.metaItem },
              React.createElement(Icon, { name: 'clock', size: 9, color: COLORS.textMuted }),
              React.createElement(Text, { style: styles.metaText }, daysLeft + 'd left')
            ),
            React.createElement(Text, { style: [styles.xpText, { color: solidColor }] },
              '+' + (dream.xpEarned || 0) + ' XP'
            )
          )
        ),
        React.createElement(Icon, { name: 'chevron-right', size: 16, color: COLORS.textMuted })
      )
    );

    return cardEl;
  };

  var renderEmpty = function () {
    return React.createElement(View, { style: styles.emptyWrap },
      React.createElement(Icon, { name: 'target', size: 32, color: COLORS.textMuted, style: { opacity: 0.5 } }),
      React.createElement(Text, { style: styles.emptyText },
        h.activeFilter === 'all' ? 'No dreams yet. Create your first dream!' : 'No dreams with this status.'
      )
    );
  };

  var renderFooter = function () {
    if (h.dreamsInf.loadingMore) {
      return React.createElement(View, { style: styles.loadingMore },
        React.createElement(ActivityIndicator, { size: 'small', color: COLORS.accent })
      );
    }
    return null;
  };

  if (h.dreamsInf.isLoading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.loadingWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent })
      )
    );
  }

  var hasCache = h.dreamsInf.isError && h.filtered && h.filtered.length > 0;
  if (h.dreamsInf.isError && !hasCache) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.errorWrap },
        React.createElement(Text, { style: styles.errorText, accessibilityRole: 'alert' }, 'Failed to load dreams'),
        React.createElement(TouchableOpacity, {
          style: styles.retryBtn,
          onPress: h.dreamsInf.refetch,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Retry loading dreams',
        },
          React.createElement(Text, { style: styles.retryText }, 'Retry')
        )
      )
    );
  }

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(FlatList, {
      data: h.filtered,
      keyExtractor: function (item) { return String(item.id); },
      renderItem: renderDreamCard,
      ListHeaderComponent: React.createElement(View, null,
        renderHeader(),
        hasCache ? React.createElement(OfflineDataBanner, null) : null,
        React.createElement(SubscriptionBanner, null),
        renderSearch(),
        renderFilters()
      ),
      ListEmptyComponent: renderEmpty,
      ListFooterComponent: renderFooter,
      onEndReached: function () {
        if (h.dreamsInf.hasNextPage && !h.dreamsInf.loadingMore) {
          h.dreamsInf.fetchNextPage();
        }
      },
      onEndReachedThreshold: 0.3,
      contentContainerStyle: styles.listContent,
      showsVerticalScrollIndicator: false,
    }),
    tooltipCfg
      ? React.createElement(OnboardingTooltip, {
          id: tooltipCfg.id,
          message: tooltipCfg.message,
          position: tooltipCfg.position,
          targetRef: addBtnRef,
        })
      : null
  );
};

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 13,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    paddingVertical: 9,
    paddingLeft: 34,
    paddingRight: 12,
    fontSize: 13,
    color: COLORS.text,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterPill: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 99,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  filterPillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    fontWeight: '700',
    color: '#fff',
  },
  dreamCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 10,
    overflow: 'hidden',
  },
  colorStrip: {
    height: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dreamTitle: {
    flex: 1,
    fontWeight: '700',
    fontSize: 13.5,
    color: COLORS.text,
  },
  catBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 99,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 8.5,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.glassBorder,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  xpText: {
    fontSize: 10.5,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.red,
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

module.exports = DreamsListScreen;
