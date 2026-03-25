/**
 * VisionBoardScreen — Visual goal board with grid of dream images.
 * Users can add images from camera/gallery, view by dream, and delete.
 */
var React = require('react');
var {
  View,
  Text,
  Image,
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
var useVisionBoardScreen = require('./useVisionBoardScreen');
var SubscriptionGate = require('../../components/SubscriptionGate');
var OnboardingTooltip = require('../../components/OnboardingTooltip');
var { getTooltipConfig } = require('../../config/onboardingTooltips');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');

var { width: SCREEN_WIDTH } = Dimensions.get('window');
var GRID_GAP = 4;
var NUM_COLS = 3;
var TILE_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - GRID_GAP * (NUM_COLS - 1)) / NUM_COLS;

var VisionBoardScreen = function () {
  var h = useVisionBoardScreen();
  var [viewingImage, setViewingImage] = React.useState(null);
  var addBtnRef = React.useRef(null);
  var tooltipCfg = getTooltipConfig('VisionBoardScreen');

  // ─── Header ──────────────────────────────────────────────────

  var renderHeader = function () {
    return React.createElement(View, { style: styles.header },
      React.createElement(TouchableOpacity, {
        style: styles.headerBtn,
        onPress: function () { h.navigation.goBack(); },
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back', hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
      },
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(Text, { style: styles.headerTitle, accessibilityRole: 'header' }, 'Vision Board'),
      React.createElement(View, { style: styles.headerActions },
        React.createElement(TouchableOpacity, {
          ref: addBtnRef,
          style: styles.addBtnSmall,
          onPress: function () { h.handleAddImage(); },
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Add image to vision board',
        },
          React.createElement(Icon, { name: 'plus', size: 18, color: '#fff' })
        )
      )
    );
  };

  // ─── Dream filter tabs ───────────────────────────────────────

  var renderDreamTabs = function () {
    return React.createElement(ScrollView, {
      horizontal: true,
      showsHorizontalScrollIndicator: false,
      style: styles.tabsScroll,
      contentContainerStyle: styles.tabsContent,
    },
      React.createElement(TouchableOpacity, {
        style: [styles.tab, h.selectedDreamId === 'all' && styles.tabActive],
        onPress: function () { h.setSelectedDreamId('all'); },
        activeOpacity: 0.7,
        accessible: true, accessibilityRole: 'tab', accessibilityLabel: 'All Dreams', accessibilityState: { selected: h.selectedDreamId === 'all' },
      },
        React.createElement(Text, {
          style: [styles.tabText, h.selectedDreamId === 'all' && styles.tabTextActive],
        }, 'All Dreams')
      ),
      h.dreams.map(function (dream) {
        var isActive = h.selectedDreamId === dream.id;
        var color = h.catSolid(dream.category);
        return React.createElement(TouchableOpacity, {
          key: dream.id,
          style: [styles.tab, isActive && { backgroundColor: color, borderColor: color }],
          onPress: function () { h.setSelectedDreamId(dream.id); },
          activeOpacity: 0.7,
          accessible: true, accessibilityRole: 'tab', accessibilityLabel: dream.title, accessibilityState: { selected: isActive },
        },
          React.createElement(Text, {
            style: [styles.tabText, isActive && styles.tabTextActive],
            numberOfLines: 1,
          }, dream.title)
        );
      })
    );
  };

  // ─── Image tile ──────────────────────────────────────────────

  var renderImageTile = function (info) {
    var item = info.item;
    var imageUrl = item.image || item.imageUrl || item.url;
    return React.createElement(TouchableOpacity, {
      style: styles.tile,
      onPress: function () { setViewingImage(item); },
      onLongPress: function () { h.handleDeleteImage(item.dreamId, item.id); },
      activeOpacity: 0.85,
      accessible: true, accessibilityRole: 'image', accessibilityLabel: (item.dreamTitle || 'Vision board image') + (item.caption ? ', ' + item.caption : ''), accessibilityHint: 'Double tap to view, long press to delete',
    },
      imageUrl
        ? React.createElement(Image, {
            source: { uri: imageUrl },
            style: styles.tileImage,
            resizeMode: 'cover',
          })
        : React.createElement(View, { style: styles.tilePlaceholder },
            React.createElement(Icon, { name: 'image', size: 24, color: COLORS.textMuted })
          ),
      // Dream title overlay
      item.dreamTitle
        ? React.createElement(View, { style: styles.tileOverlay },
            React.createElement(Text, { style: styles.tileLabel, numberOfLines: 1 }, item.dreamTitle)
          )
        : null
    );
  };

  // ─── Add image tile ──────────────────────────────────────────

  var renderAddTile = function () {
    return React.createElement(TouchableOpacity, {
      style: styles.addTile,
      onPress: function () { h.handleAddImage(); },
      activeOpacity: 0.7,
      accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Add image',
    },
      React.createElement(View, { style: styles.addTileInner },
        React.createElement(Icon, { name: 'plus', size: 28, color: BRAND.purple }),
        React.createElement(Text, { style: styles.addTileText }, 'Add')
      )
    );
  };

  // ─── Image viewer modal ─────────────────────────────────────

  var renderImageViewer = function () {
    if (!viewingImage) return null;
    var imageUrl = viewingImage.image || viewingImage.imageUrl || viewingImage.url;
    return React.createElement(Modal, {
      visible: true,
      animationType: 'fade',
      transparent: true,
      onRequestClose: function () { setViewingImage(null); },
    },
      React.createElement(View, { style: styles.viewerOverlay },
        React.createElement(TouchableOpacity, {
          style: styles.viewerClose,
          onPress: function () { setViewingImage(null); },
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Close image viewer',
        },
          React.createElement(Icon, { name: 'x', size: 24, color: '#fff' })
        ),
        imageUrl
          ? React.createElement(Image, {
              source: { uri: imageUrl },
              style: styles.viewerImage,
              resizeMode: 'contain',
            })
          : null,
        React.createElement(View, { style: styles.viewerInfo },
          viewingImage.dreamTitle
            ? React.createElement(Text, { style: styles.viewerTitle }, viewingImage.dreamTitle)
            : null,
          viewingImage.caption
            ? React.createElement(Text, { style: styles.viewerCaption }, viewingImage.caption)
            : null
        ),
        React.createElement(View, { style: styles.viewerActions },
          React.createElement(TouchableOpacity, {
            style: styles.viewerDeleteBtn,
            onPress: function () {
              setViewingImage(null);
              h.handleDeleteImage(viewingImage.dreamId, viewingImage.id);
            },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Remove image from vision board',
          },
            React.createElement(Icon, { name: 'trash-2', size: 18, color: BRAND.redSolid }),
            React.createElement(Text, { style: styles.viewerDeleteText }, 'Remove')
          )
        )
      )
    );
  };

  // ─── Dream picker modal (when adding image with "all" selected) ─

  var renderDreamPicker = function () {
    if (!h.addingImage) return null;
    return React.createElement(Modal, {
      visible: true,
      animationType: 'slide',
      transparent: true,
      onRequestClose: function () { h.setAddingImage(false); },
    },
      React.createElement(View, { style: styles.pickerOverlay },
        React.createElement(View, { style: styles.pickerContent },
          React.createElement(Text, { style: styles.pickerTitle }, 'Add to which dream?'),
          React.createElement(ScrollView, {
            showsVerticalScrollIndicator: false,
            style: { maxHeight: 300 },
          },
            h.dreams.map(function (dream) {
              var color = h.catSolid(dream.category);
              return React.createElement(TouchableOpacity, {
                key: dream.id,
                style: styles.pickerItem,
                onPress: function () { h.confirmAddToDream(dream.id); },
                activeOpacity: 0.7,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Add image to ' + dream.title,
              },
                React.createElement(View, {
                  style: [styles.pickerDot, { backgroundColor: color }],
                }),
                React.createElement(Text, { style: styles.pickerItemText, numberOfLines: 1 },
                  dream.title
                ),
                React.createElement(Icon, { name: 'chevron-right', size: 16, color: COLORS.textMuted })
              );
            })
          ),
          React.createElement(TouchableOpacity, {
            style: styles.pickerCancel,
            onPress: function () { h.setAddingImage(false); },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel dream selection',
          },
            React.createElement(Text, { style: styles.pickerCancelText }, 'Cancel')
          )
        )
      )
    );
  };

  // ─── Empty state ─────────────────────────────────────────────

  var renderEmpty = function () {
    return React.createElement(View, { style: styles.emptyWrap },
      React.createElement(View, { style: styles.emptyIcon },
        React.createElement(Icon, { name: 'image', size: 40, color: COLORS.textMuted })
      ),
      React.createElement(Text, { style: styles.emptyTitle }, 'Your Vision Board is Empty'),
      React.createElement(Text, { style: styles.emptyDesc },
        'Add inspiring images to visualize your dreams. Tap the + button to get started.'
      ),
      React.createElement(TouchableOpacity, {
        style: styles.emptyAddBtn,
        onPress: function () { h.handleAddImage(); },
        activeOpacity: 0.8,
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Add first image to vision board',
      },
        React.createElement(Icon, { name: 'plus', size: 18, color: '#fff' }),
        React.createElement(Text, { style: styles.emptyAddText }, 'Add First Image')
      )
    );
  };

  // ─── Loading / Error ─────────────────────────────────────────

  if (h.dreamsQuery.isLoading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent })
      )
    );
  }

  // ─── Main render ─────────────────────────────────────────────

  // Combine vision images with a trailing "add" sentinel
  var gridData = h.visionImages.slice();

  return React.createElement(SafeAreaView, { style: styles.container },
    renderHeader(),
    React.createElement(SubscriptionGate, { requiredPlan: 'premium', featureName: 'Vision Board' },
    renderDreamTabs(),
    // Stats row
    React.createElement(View, { style: styles.statsBar },
      React.createElement(Text, { style: styles.statsText },
        h.visionImages.length + ' image' + (h.visionImages.length !== 1 ? 's' : '') +
        ' \u00B7 ' + h.dreams.length + ' dream' + (h.dreams.length !== 1 ? 's' : '')
      )
    ),
    h.visionQuery.isLoading
      ? React.createElement(View, { style: styles.centerWrap },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent })
        )
      : gridData.length === 0
        ? renderEmpty()
        : React.createElement(FlatList, {
            data: gridData,
            keyExtractor: function (item, idx) { return String(item.id || idx); },
            numColumns: NUM_COLS,
            renderItem: renderImageTile,
            ListFooterComponent: React.createElement(View, { style: styles.footerWrap },
              renderAddTile()
            ),
            columnWrapperStyle: styles.gridRow,
            contentContainerStyle: styles.gridContent,
            showsVerticalScrollIndicator: false,
          }),
    ), // close SubscriptionGate
    renderImageViewer(),
    renderDreamPicker(),
    // FAB
    gridData.length > 0
      ? React.createElement(TouchableOpacity, {
          style: styles.fab,
          onPress: function () { h.handleAddImage(); },
          activeOpacity: 0.8,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Add image to vision board',
        },
          React.createElement(Icon, { name: 'plus', size: 24, color: '#fff' })
        )
      : null,
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

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: BRAND.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabsScroll: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  tabsContent: {
    gap: 8,
    paddingVertical: 4,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    maxWidth: 140,
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

  // Stats bar
  statsBar: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  statsText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Grid
  gridContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  // Tile
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.glassBg,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tilePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
  },
  tileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },

  // Add tile
  addTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTileInner: {
    alignItems: 'center',
    gap: 4,
  },
  addTileText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // Image viewer
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
    borderRadius: RADIUS.lg,
  },
  viewerInfo: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  viewerCaption: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  viewerActions: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    gap: 16,
  },
  viewerDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  viewerDeleteText: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND.redSolid,
  },

  // Dream picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pickerContent: {
    backgroundColor: COLORS.bodyBg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  pickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pickerItemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  pickerCancel: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  pickerCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.purple,
  },
  emptyAddText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  // Center
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerWrap: {
    paddingTop: GRID_GAP,
  },
});

module.exports = VisionBoardScreen;
