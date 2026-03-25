/**
 * DreamShareScreen — Shows dreams shared with the current user.
 * FlatList with infinite scroll, progress bars, shared-by info.
 */
var React = require('react');
var {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useSharedDreamsScreen = require('./useSharedDreamsScreen');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');

var DreamShareScreen = function () {
  var h = useSharedDreamsScreen();

  var renderHeader = function () {
    return React.createElement(View, { style: styles.header },
      React.createElement(TouchableOpacity, {
        style: styles.headerBtn,
        onPress: function () { h.navigation.goBack(); },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Go back',
        hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
      },
        React.createElement(Icon, { name: 'arrow-left', size: 20, color: COLORS.text })
      ),
      React.createElement(View, { style: { flex: 1, alignItems: 'center' } },
        React.createElement(Text, { style: styles.headerTitle, accessibilityRole: 'header' }, 'Shared Dreams'),
        !h.sharedInf.isLoading
          ? React.createElement(Text, { style: styles.headerSub }, 'Dreams shared with you')
          : null
      ),
      React.createElement(View, { style: { width: 36 } })
    );
  };

  var renderEmpty = function () {
    return React.createElement(View, { style: styles.emptyWrap },
      React.createElement(View, { style: styles.emptyIcon },
        React.createElement(Icon, { name: 'share-2', size: 28, color: BRAND.purple })
      ),
      React.createElement(Text, { style: styles.emptyTitle }, 'No shared dreams yet'),
      React.createElement(Text, { style: styles.emptyDesc },
        'When someone shares a dream with you, it will appear here.'
      )
    );
  };

  var renderCard = function (info) {
    var dream = info.item;
    var progress = dream.progress || 0;
    var description = dream.description || '';
    if (description.length > 100) description = description.slice(0, 100) + '...';
    var sharedBy =
      (dream.sharedBy && (dream.sharedBy.displayName || dream.sharedBy.display_name)) ||
      (dream.sharedBy && dream.sharedBy.username) ||
      (dream.owner && (dream.owner.displayName || dream.owner.display_name)) ||
      (dream.owner && dream.owner.username) ||
      'Unknown';

    return React.createElement(TouchableOpacity, {
      key: dream.id,
      style: styles.card,
      activeOpacity: 0.7,
      onPress: function () {
        h.navigation.navigate('DreamDetail', { id: dream.id });
      },
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: dream.title + ', shared by ' + sharedBy + ', ' + progress + '% progress',
    },
      // Title row
      React.createElement(View, { style: styles.cardTitleRow },
        React.createElement(Text, { style: styles.cardTitle, numberOfLines: 2 }, dream.title),
        React.createElement(Icon, { name: 'chevron-right', size: 18, color: COLORS.textMuted })
      ),
      // Description
      description
        ? React.createElement(Text, { style: styles.cardDesc, numberOfLines: 3 }, description)
        : null,
      // Meta row
      React.createElement(View, { style: styles.metaRow },
        dream.category
          ? React.createElement(View, { style: styles.catPill },
              React.createElement(Text, { style: styles.catPillText }, dream.category)
            )
          : null,
        dream.targetDate
          ? React.createElement(View, { style: styles.metaItem },
              React.createElement(Icon, { name: 'calendar', size: 12, color: COLORS.textMuted }),
              React.createElement(Text, { style: styles.metaText },
                new Date(dream.targetDate).toLocaleDateString()
              )
            )
          : null,
        React.createElement(View, { style: styles.metaItem },
          React.createElement(Icon, { name: 'share-2', size: 12, color: COLORS.textMuted }),
          React.createElement(Text, { style: styles.metaText }, sharedBy)
        )
      ),
      // Progress
      React.createElement(View, { style: styles.progressWrap },
        React.createElement(View, { style: styles.progressHeader },
          React.createElement(View, { style: styles.metaItem },
            React.createElement(Icon, { name: 'target', size: 12, color: BRAND.purple }),
            React.createElement(Text, { style: styles.progressLabel }, 'Progress')
          ),
          React.createElement(Text, { style: styles.progressPct }, progress + '%')
        ),
        React.createElement(View, { style: styles.progressTrack },
          React.createElement(View, {
            style: [styles.progressBar, { width: progress + '%' }],
          })
        )
      )
    );
  };

  var renderFooter = function () {
    if (h.sharedInf.loadingMore) {
      return React.createElement(View, { style: styles.footerLoader },
        React.createElement(ActivityIndicator, { size: 'small', color: BRAND.purple })
      );
    }
    return null;
  };

  if (h.sharedInf.isLoading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.centerWrap, accessibilityLiveRegion: 'polite' },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent, accessibilityLabel: 'Loading shared dreams' })
      )
    );
  }

  return React.createElement(SafeAreaView, { style: styles.container },
    renderHeader(),
    h.dreams.length === 0
      ? renderEmpty()
      : React.createElement(FlatList, {
          data: h.dreams,
          keyExtractor: function (item) { return String(item.id); },
          renderItem: renderCard,
          contentContainerStyle: styles.list,
          onEndReached: function () {
            if (h.sharedInf.hasNextPage && !h.sharedInf.loadingMore) {
              h.sharedInf.fetchNextPage();
            }
          },
          onEndReachedThreshold: 0.4,
          ListFooterComponent: renderFooter,
        })
  );
};

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, gap: 8,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  headerSub: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  emptyDesc: {
    fontSize: 13, color: COLORS.textMuted, textAlign: 'center',
    marginTop: 8, lineHeight: 20, maxWidth: 260,
  },
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    padding: 18, marginBottom: 14,
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  catPill: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  catPillText: { fontSize: 11, fontWeight: '600', color: COLORS.accent },
  progressWrap: { marginTop: 14 },
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  progressLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  progressPct: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  progressTrack: {
    width: '100%', height: 6, borderRadius: 3,
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  progressBar: {
    height: '100%', borderRadius: 3,
    backgroundColor: BRAND.purple,
  },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
});

module.exports = DreamShareScreen;
