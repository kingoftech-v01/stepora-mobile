/**
 * DreamTemplatesScreen — Browse pre-made dream templates with category filters,
 * preview modal, and "Use This Template" action.
 */
var React = require('react');
var {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useDreamTemplatesScreen = require('./useDreamTemplatesScreen');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');

var { width: SCREEN_WIDTH } = Dimensions.get('window');
var CARD_GAP = 12;
var CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - CARD_GAP) / 2;

var DreamTemplatesScreen = function () {
  var h = useDreamTemplatesScreen();

  // ─── Header ──────────────────────────────────────────────────

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
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(Text, { style: styles.headerTitle, accessibilityRole: 'header' }, 'Dream Templates'),
      React.createElement(View, { style: { width: 36 } })
    );
  };

  // ─── Search ──────────────────────────────────────────────────

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
        placeholder: 'Search templates...',
        placeholderTextColor: COLORS.textMuted,
        accessible: true,
        accessibilityLabel: 'Search templates',
        accessibilityRole: 'search',
      })
    );
  };

  // ─── Category tabs ───────────────────────────────────────────

  var renderCategoryTabs = function () {
    return React.createElement(ScrollView, {
      horizontal: true,
      showsHorizontalScrollIndicator: false,
      style: styles.tabsScroll,
      contentContainerStyle: styles.tabsContent,
    },
      h.CATEGORY_TABS.map(function (tab) {
        var isActive = h.activeCategory === tab.key;
        return React.createElement(TouchableOpacity, {
          key: tab.key,
          style: [styles.tab, isActive && styles.tabActive],
          onPress: function () { h.setActiveCategory(tab.key); },
          activeOpacity: 0.7,
          accessible: true,
          accessibilityRole: 'tab',
          accessibilityLabel: tab.label,
          accessibilityState: { selected: isActive },
        },
          React.createElement(Text, {
            style: [styles.tabText, isActive && styles.tabTextActive],
          }, tab.label)
        );
      })
    );
  };

  // ─── Featured section ────────────────────────────────────────

  var renderFeatured = function () {
    if (!h.featured || h.featured.length === 0) return null;
    return React.createElement(View, { style: styles.featuredSection },
      React.createElement(Text, { style: styles.sectionTitle }, 'Featured'),
      React.createElement(ScrollView, {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: { gap: 12 },
      },
        h.featured.map(function (tmpl) {
          var color = h.catSolid(tmpl.category);
          var emoji = h.CAT_EMOJIS[tmpl.category] || '\u2B50';
          return React.createElement(TouchableOpacity, {
            key: tmpl.id,
            style: [styles.featuredCard, { borderColor: color + '30' }],
            onPress: function () { h.openPreview(tmpl); },
            activeOpacity: 0.7,
            accessible: true, accessibilityRole: 'button', accessibilityLabel: tmpl.title + ', ' + (tmpl.categoryLabel || tmpl.category || 'General') + ', featured template', accessibilityHint: 'Double tap to preview',
          },
            React.createElement(View, { style: [styles.featuredStrip, { backgroundColor: color }] }),
            React.createElement(Text, { style: styles.featuredEmoji }, emoji),
            React.createElement(Text, { style: styles.featuredTitle, numberOfLines: 2 }, tmpl.title),
            React.createElement(Text, { style: [styles.featuredCat, { color: color }] },
              tmpl.categoryLabel || tmpl.category || ''
            )
          );
        })
      )
    );
  };

  // ─── Template card ───────────────────────────────────────────

  var renderTemplateCard = function (info) {
    var tmpl = info.item;
    var color = h.catSolid(tmpl.category);
    var emoji = h.CAT_EMOJIS[tmpl.category] || '\u2B50';
    var duration = tmpl.estimatedDuration || tmpl.estimatedMonths;
    var durationLabel = duration ? duration + (duration === 1 ? ' month' : ' months') : '';

    return React.createElement(TouchableOpacity, {
      style: styles.templateCard,
      onPress: function () { h.openPreview(tmpl); },
      activeOpacity: 0.7,
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: tmpl.title + ', ' + (tmpl.categoryLabel || tmpl.category || 'General') + (durationLabel ? ', ' + durationLabel : ''),
    },
      // Top color accent
      React.createElement(View, { style: [styles.cardAccent, { backgroundColor: color }] }),
      // Emoji
      React.createElement(View, { style: [styles.cardEmojiWrap, { backgroundColor: color + '15', borderColor: color + '30' }] },
        React.createElement(Text, { style: styles.cardEmoji }, emoji)
      ),
      // Title
      React.createElement(Text, { style: styles.cardTitle, numberOfLines: 2 }, tmpl.title),
      // Description
      React.createElement(Text, { style: styles.cardDesc, numberOfLines: 3 },
        tmpl.description || 'No description'
      ),
      // Footer meta
      React.createElement(View, { style: styles.cardFooter },
        React.createElement(View, { style: [styles.catBadge, { backgroundColor: color + '18', borderColor: color + '30' }] },
          React.createElement(Text, { style: [styles.catBadgeText, { color: color }] },
            tmpl.categoryLabel || tmpl.category || 'General'
          )
        ),
        durationLabel
          ? React.createElement(View, { style: styles.durationWrap },
              React.createElement(Icon, { name: 'clock', size: 10, color: COLORS.textMuted }),
              React.createElement(Text, { style: styles.durationText }, durationLabel)
            )
          : null
      )
    );
  };

  // ─── Preview Modal ───────────────────────────────────────────

  var renderPreviewModal = function () {
    if (!h.selectedTemplate) return null;
    var tmpl = h.selectedTemplate;
    var color = h.catSolid(tmpl.category);
    var emoji = h.CAT_EMOJIS[tmpl.category] || '\u2B50';
    var duration = tmpl.estimatedDuration || tmpl.estimatedMonths;
    var goals = tmpl.goals || tmpl.goalsCount || 0;
    var tasks = tmpl.tasks || tmpl.tasksCount || 0;

    return React.createElement(Modal, {
      visible: true,
      animationType: 'slide',
      transparent: true,
      onRequestClose: h.closePreview,
    },
      React.createElement(View, { style: styles.modalOverlay },
        React.createElement(View, { style: styles.modalContent, accessibilityViewIsModal: true },
          // Close button
          React.createElement(TouchableOpacity, {
            style: styles.modalClose,
            onPress: h.closePreview,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Close preview',
          },
            React.createElement(Icon, { name: 'x', size: 22, color: COLORS.text })
          ),
          React.createElement(ScrollView, {
            showsVerticalScrollIndicator: false,
            contentContainerStyle: { paddingBottom: 20 },
          },
            // Emoji + title
            React.createElement(View, { style: styles.modalHeader },
              React.createElement(View, {
                style: [styles.modalEmojiWrap, { backgroundColor: color + '15', borderColor: color + '30' }],
              },
                React.createElement(Text, { style: { fontSize: 36 } }, emoji)
              ),
              React.createElement(Text, { style: styles.modalTitle, accessibilityRole: 'header' }, tmpl.title),
              React.createElement(View, { style: [styles.catBadge, { backgroundColor: color + '18', borderColor: color + '30' }] },
                React.createElement(Text, { style: [styles.catBadgeText, { color: color }] },
                  tmpl.categoryLabel || tmpl.category || 'General'
                )
              )
            ),
            // Description
            React.createElement(Text, { style: styles.modalDesc },
              tmpl.description || 'A curated dream template to get you started quickly.'
            ),
            // Stats row
            React.createElement(View, { style: styles.statsRow },
              duration ? React.createElement(View, { style: styles.statItem },
                React.createElement(Icon, { name: 'calendar', size: 16, color: color }),
                React.createElement(Text, { style: styles.statValue },
                  duration + (duration === 1 ? ' month' : ' months')
                ),
                React.createElement(Text, { style: styles.statLabel }, 'Duration')
              ) : null,
              goals ? React.createElement(View, { style: styles.statItem },
                React.createElement(Icon, { name: 'target', size: 16, color: color }),
                React.createElement(Text, { style: styles.statValue }, String(goals)),
                React.createElement(Text, { style: styles.statLabel }, 'Goals')
              ) : null,
              tasks ? React.createElement(View, { style: styles.statItem },
                React.createElement(Icon, { name: 'check-square', size: 16, color: color }),
                React.createElement(Text, { style: styles.statValue }, String(tasks)),
                React.createElement(Text, { style: styles.statLabel }, 'Tasks')
              ) : null
            ),
            // Template goals list (if available)
            tmpl.goalsList && tmpl.goalsList.length > 0
              ? React.createElement(View, { style: styles.goalsListSection },
                  React.createElement(Text, { style: styles.goalsListTitle }, 'Included Goals'),
                  tmpl.goalsList.map(function (goal, idx) {
                    return React.createElement(View, { key: idx, style: styles.goalRow },
                      React.createElement(View, { style: [styles.goalDot, { backgroundColor: color }] }),
                      React.createElement(Text, { style: styles.goalText }, goal.title || goal)
                    );
                  })
                )
              : null
          ),
          // Use template button
          React.createElement(TouchableOpacity, {
            style: [styles.useBtn, { backgroundColor: color }, h.useTemplateMut.isPending && { opacity: 0.5 }],
            onPress: function () { h.handleUseTemplate(tmpl.id); },
            activeOpacity: 0.8,
            disabled: h.useTemplateMut.isPending,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Use This Template',
            accessibilityState: { disabled: h.useTemplateMut.isPending },
          },
            h.useTemplateMut.isPending
              ? React.createElement(ActivityIndicator, { color: '#fff', size: 'small' })
              : React.createElement(View, { style: styles.useBtnContent },
                  React.createElement(Icon, { name: 'copy', size: 18, color: '#fff' }),
                  React.createElement(Text, { style: styles.useBtnText }, 'Use This Template')
                )
          ),
          h.useTemplateMut.isError
            ? React.createElement(Text, { style: styles.mutError, accessibilityLiveRegion: 'assertive', accessibilityRole: 'alert' },
                h.useTemplateMut.error && h.useTemplateMut.error.userMessage
                  ? h.useTemplateMut.error.userMessage
                  : 'Failed to use template'
              )
            : null
        )
      )
    );
  };

  // ─── Empty state ─────────────────────────────────────────────

  var renderEmpty = function () {
    return React.createElement(View, { style: styles.emptyWrap },
      React.createElement(Icon, { name: 'layout', size: 32, color: COLORS.textMuted, style: { opacity: 0.5 } }),
      React.createElement(Text, { style: styles.emptyText },
        h.searchQuery ? 'No templates match your search.' : 'No templates available in this category.'
      )
    );
  };

  // ─── Loading / Error ─────────────────────────────────────────

  if (h.templatesQuery.isLoading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent })
      )
    );
  }

  if (h.templatesQuery.isError) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(Text, { style: { color: COLORS.red, fontSize: 14, marginBottom: 12 } },
          'Failed to load templates'
        ),
        React.createElement(TouchableOpacity, {
          style: styles.retryBtn,
          onPress: h.templatesQuery.refetch,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Retry loading templates',
        },
          React.createElement(Text, { style: styles.retryText }, 'Retry')
        )
      )
    );
  }

  // ─── Main render ─────────────────────────────────────────────

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(FlatList, {
      data: h.templates,
      keyExtractor: function (item) { return String(item.id); },
      numColumns: 2,
      columnWrapperStyle: styles.gridRow,
      renderItem: renderTemplateCard,
      ListHeaderComponent: React.createElement(View, null,
        renderHeader(),
        renderSearch(),
        renderCategoryTabs(),
        renderFeatured(),
        h.templates.length > 0
          ? React.createElement(Text, { style: styles.sectionTitle },
              h.activeCategory === 'all' ? 'All Templates' : h.CATEGORY_TABS.find(function (t) { return t.key === h.activeCategory; }).label
            )
          : null
      ),
      ListEmptyComponent: renderEmpty,
      contentContainerStyle: styles.listContent,
      showsVerticalScrollIndicator: false,
    }),
    renderPreviewModal()
  );
};

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  gridRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },

  // Search
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

  // Tabs
  tabsScroll: {
    marginBottom: SPACING.lg,
  },
  tabsContent: {
    gap: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tabActive: {
    backgroundColor: BRAND.purple,
    borderColor: BRAND.purple,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#fff',
  },

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },

  // Featured
  featuredSection: {
    marginBottom: 20,
  },
  featuredCard: {
    width: 160,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 14,
    overflow: 'hidden',
  },
  featuredStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  featuredEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  featuredCat: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Template card
  templateCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 14,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardEmoji: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  catBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  durationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bodyBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalEmojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },

  // Goals list
  goalsListSection: {
    marginBottom: 20,
  },
  goalsListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  goalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  goalText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Use button
  useBtn: {
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  useBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  useBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  mutError: {
    fontSize: 12,
    color: COLORS.red,
    textAlign: 'center',
    marginTop: 8,
  },

  // Empty
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

  // Center
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Retry
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

module.exports = DreamTemplatesScreen;
