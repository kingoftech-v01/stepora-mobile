/**
 * StoreScreen — Virtual items shop for React Native.
 * Converted from StoreMobile.jsx (web app).
 * Features: category filtering, shop/inventory/history tabs,
 * item grid with rarity badges, purchase, equip, wishlist, refund.
 */
var React = require('react');
var { useState, useEffect, useCallback } = React;
var {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated,
  RefreshControl,
  Alert,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient, useInfiniteQuery } = require('@tanstack/react-query');
var { apiGet, apiPost, apiDelete } = require('../../services/api');
var { STORE } = require('../../services/endpoints');
var { BRAND, adaptColor } = require('../../styles/colors');
var { dark: theme } = require('../../styles/theme');
var { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS, SHADOWS } = require('../../styles/tokens');
var GlassCard = require('../../components/GlassCard');
var GlassButton = require('../../components/GlassButton');
var PillTabs = require('../../components/PillTabs');
var { ScreenHeader, BackButton } = require('../../components/ScreenHeader');
var SubscriptionBanner = require('../../components/SubscriptionBanner');
var OnboardingTooltip = require('../../components/OnboardingTooltip');
var { getTooltipConfig } = require('../../config/onboardingTooltips');

// ─── Constants ──────────────────────────────────────────────────

var CATEGORY_KEYS = [
  { id: 'all', key: 'All' },
  { id: 'badge_frame', key: 'Frames' },
  { id: 'theme_skin', key: 'Themes' },
  { id: 'avatar_decoration', key: 'Decor' },
  { id: 'chat_bubble', key: 'Chat' },
  { id: 'streak_shield', key: 'Shields' },
  { id: 'xp_booster', key: 'Boosters' },
];

var RARITY_CONFIG = {
  common: { color: '#9CA3AF', label: 'Common', glow: 'none' },
  rare: { color: '#3B82F6', label: 'Rare' },
  epic: { color: '#8B5CF6', label: 'Epic' },
  legendary: { color: '#FCD34D', label: 'Legendary' },
};

// ─── Screen ─────────────────────────────────────────────────────

var StoreScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var headerRef = React.useRef(null);
  var tooltipCfg = getTooltipConfig('StoreScreen');

  var [activeCategory, setActiveCategory] = useState('all');
  var [activeTab, setActiveTab] = useState('shop');
  var [selectedItem, setSelectedItem] = useState(null);
  var [refundModal, setRefundModal] = useState(null);
  var [refundReason, setRefundReason] = useState('');
  var [refreshing, setRefreshing] = useState(false);

  // ─── Queries ────────────────────────────────────────────────

  var itemsUrl = STORE.ITEMS + (activeCategory !== 'all' ? '?category=' + activeCategory : '');

  var itemsQuery = useInfiniteQuery({
    queryKey: ['store-items', activeCategory],
    queryFn: function (ctx) {
      var page = ctx.pageParam || 1;
      return apiGet(itemsUrl + (itemsUrl.includes('?') ? '&' : '?') + 'page=' + page);
    },
    getNextPageParam: function (lastPage) {
      return lastPage && lastPage.next ? (lastPage.page || 1) + 1 : undefined;
    },
    initialPageParam: 1,
  });

  var inventoryQuery = useInfiniteQuery({
    queryKey: ['store-inventory'],
    queryFn: function (ctx) {
      var page = ctx.pageParam || 1;
      return apiGet(STORE.INVENTORY + '?page=' + page);
    },
    getNextPageParam: function (lastPage) {
      return lastPage && lastPage.next ? (lastPage.page || 1) + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: activeTab === 'inventory',
  });

  var historyQuery = useInfiniteQuery({
    queryKey: ['store-history'],
    queryFn: function (ctx) {
      var page = ctx.pageParam || 1;
      return apiGet(STORE.INVENTORY_HISTORY + '?page=' + page);
    },
    getNextPageParam: function (lastPage) {
      return lastPage && lastPage.next ? (lastPage.page || 1) + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: activeTab === 'history',
  });

  var wishlistQuery = useQuery({
    queryKey: ['store-wishlist'],
    queryFn: function () {
      return apiGet(STORE.WISHLIST);
    },
  });

  // Flatten paginated results
  var flattenPages = function (query) {
    if (!query.data || !query.data.pages) return [];
    var result = [];
    query.data.pages.forEach(function (page) {
      var items = (page && page.results) || (Array.isArray(page) ? page : []);
      result = result.concat(items);
    });
    return result;
  };

  var items = flattenPages(itemsQuery);
  var inventoryItems = flattenPages(inventoryQuery);
  var historyItems = flattenPages(historyQuery);

  var wishlistData = (wishlistQuery.data && wishlistQuery.data.results) || wishlistQuery.data || [];
  var wishlistSet = {};
  (Array.isArray(wishlistData) ? wishlistData : []).forEach(function (w) {
    wishlistSet[w.itemId || w.id] = true;
  });

  var displayItems = activeTab === 'inventory' ? inventoryItems : items;
  var filteredItems = displayItems.filter(function (item) {
    return activeCategory === 'all' || item.type === activeCategory;
  });

  // ─── Mutations ──────────────────────────────────────────────

  var purchaseMut = useMutation({
    mutationFn: function (itemId) {
      return apiPost(STORE.PURCHASE_XP, { item_id: itemId });
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['store-items'] });
      queryClient.invalidateQueries({ queryKey: ['store-inventory'] });
    },
    onError: function (err) {
      Alert.alert('Purchase Failed', err.userMessage || err.message || 'Could not complete purchase.');
    },
  });

  var equipMut = useMutation({
    mutationFn: function (itemId) {
      return apiPost(STORE.EQUIP(itemId), { equip: true });
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['store-items'] });
      queryClient.invalidateQueries({ queryKey: ['store-inventory'] });
    },
  });

  var wishlistAddMut = useMutation({
    mutationFn: function (itemId) {
      return apiPost(STORE.WISHLIST, { item_id: itemId });
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['store-wishlist'] });
    },
  });

  var wishlistRemoveMut = useMutation({
    mutationFn: function (itemId) {
      return apiDelete(STORE.WISHLIST + itemId + '/');
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['store-wishlist'] });
    },
  });

  var refundMut = useMutation({
    mutationFn: function (data) {
      return apiPost(STORE.REFUNDS, data);
    },
    onSuccess: function () {
      setRefundModal(null);
      setRefundReason('');
      queryClient.invalidateQueries({ queryKey: ['store-history'] });
    },
  });

  // ─── Handlers ───────────────────────────────────────────────

  var handleBuy = function (itemId) {
    purchaseMut.mutate(itemId);
  };

  var handleEquip = function (itemId) {
    equipMut.mutate(itemId);
  };

  var toggleWishlist = function (itemId) {
    if (wishlistSet[itemId]) {
      wishlistRemoveMut.mutate(itemId);
    } else {
      wishlistAddMut.mutate(itemId);
    }
  };

  var onRefresh = useCallback(function () {
    setRefreshing(true);
    Promise.all([
      itemsQuery.refetch(),
      inventoryQuery.refetch(),
      historyQuery.refetch(),
    ]).finally(function () {
      setRefreshing(false);
    });
  }, []);

  // ─── Render helpers ─────────────────────────────────────────

  var renderItemCard = function (item, index) {
    var rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;

    return React.createElement(
      TouchableOpacity,
      {
        key: item.id,
        style: styles.itemCard,
        activeOpacity: 0.8,
        onPress: function () {
          setSelectedItem(item);
        },
        accessible: true, accessibilityRole: 'button', accessibilityLabel: item.name + ', ' + ((RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common).label) + (item.owned ? ', owned' : ', ' + item.price + ' XP'), accessibilityHint: 'Tap to view details',
      },
      // Wishlist button
      React.createElement(
        TouchableOpacity,
        {
          style: styles.wishlistBtn,
          onPress: function () {
            toggleWishlist(item.id);
          },
          accessible: true, accessibilityRole: 'button', accessibilityLabel: (wishlistSet[item.id] ? 'Remove ' : 'Add ') + item.name + (wishlistSet[item.id] ? ' from wishlist' : ' to wishlist'), accessibilityState: { selected: !!wishlistSet[item.id] },
        },
        React.createElement(Text, {
          style: {
            fontSize: 14,
            color: wishlistSet[item.id] ? BRAND.pink : theme.textMuted,
          },
        }, wishlistSet[item.id] ? '\u2665' : '\u2661'),
      ),
      // Item image/emoji
      React.createElement(
        Text,
        { style: styles.itemEmoji },
        item.image || '\uD83D\uDCE6',
      ),
      // Name
      React.createElement(
        Text,
        { style: styles.itemName, numberOfLines: 1 },
        item.name,
      ),
      // Rarity badge
      React.createElement(
        View,
        {
          style: [
            styles.rarityBadge,
            { backgroundColor: rarity.color + '15', borderColor: rarity.color + '30' },
          ],
        },
        React.createElement(
          Text,
          { style: [styles.rarityText, { color: rarity.color }] },
          rarity.label,
        ),
      ),
      // Price or owned status
      !item.owned
        ? React.createElement(
            View,
            { style: styles.priceRow },
            React.createElement(Text, { style: styles.priceIcon }, '\u26A1'),
            React.createElement(Text, { style: styles.priceText }, String(item.price)),
          )
        : !item.equipped
          ? React.createElement(
              Text,
              { style: styles.ownedText },
              'Owned',
            )
          : null,
      // Action button
      item.equipped
        ? React.createElement(
            GlassButton,
            {
              variant: 'success',
              size: 'sm',
              fullWidth: true,
              onPress: function () {
                handleEquip(item.id);
              },
            },
            'Equipped',
          )
        : item.owned
          ? React.createElement(
              GlassButton,
              {
                variant: 'secondary',
                size: 'sm',
                fullWidth: true,
                onPress: function () {
                  handleEquip(item.id);
                },
              },
              'Equip',
            )
          : React.createElement(
              GlassButton,
              {
                variant: 'primary',
                size: 'sm',
                fullWidth: true,
                onPress: function () {
                  handleBuy(item.id);
                },
                disabled: purchaseMut.isPending,
              },
              'Buy',
            ),
    );
  };

  var renderHistoryItem = function (item, index) {
    return React.createElement(
      GlassCard,
      { key: item.id || index, padding: 16, mb: 10 },
      React.createElement(
        View,
        { style: styles.historyRow },
        React.createElement(
          View,
          { style: styles.historyIcon },
          React.createElement(
            Text,
            { style: { fontSize: 24 } },
            item.image || item.itemImage || '\uD83D\uDECD\uFE0F',
          ),
        ),
        React.createElement(
          View,
          { style: { flex: 1, marginLeft: 12 } },
          React.createElement(
            Text,
            { style: styles.historyName, numberOfLines: 1 },
            item.name || item.itemName || 'Unknown Item',
          ),
          React.createElement(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 } },
            React.createElement(
              Text,
              { style: styles.historyDate },
              item.purchasedAt
                ? new Date(item.purchasedAt).toLocaleDateString()
                : item.date || '\u2014',
            ),
            React.createElement(
              Text,
              { style: styles.historyPrice },
              '\u26A1 ' + (item.price || item.pricePaid || 0) + ' XP',
            ),
          ),
        ),
        React.createElement(
          GlassButton,
          {
            variant: 'secondary',
            size: 'sm',
            onPress: function () {
              setRefundModal(item);
            },
          },
          'Refund',
        ),
      ),
    );
  };

  // ─── Loading state ──────────────────────────────────────────

  var isLoading =
    activeTab === 'inventory' ? inventoryQuery.isLoading :
    activeTab === 'history' ? historyQuery.isLoading :
    itemsQuery.isLoading;

  // ─── Render ─────────────────────────────────────────────────

  return React.createElement(
    View,
    { style: styles.container },
    // Header
    React.createElement(View, { ref: headerRef },
      React.createElement(ScreenHeader, {
        title: 'Store',
        left: React.createElement(BackButton, {
          onPress: function () {
            navigation.goBack();
          },
        }),
      })
    ),

    React.createElement(
      ScrollView,
      {
        style: styles.scroll,
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
        refreshControl: React.createElement(RefreshControl, {
          refreshing: refreshing,
          onRefresh: onRefresh,
          tintColor: BRAND.purple,
        }),
      },

      // Subscription banner for free users
      React.createElement(SubscriptionBanner, { style: { marginHorizontal: 0, marginBottom: SPACING.md } }),

      // Category tabs
      React.createElement(PillTabs, {
        tabs: CATEGORY_KEYS.map(function (cat) {
          return { key: cat.id, label: cat.key };
        }),
        active: activeCategory,
        onChange: setActiveCategory,
        scrollable: true,
        style: { marginBottom: 12 },
      }),

      // Shop / Inventory / History tabs
      React.createElement(
        GlassCard,
        { padding: 4, mb: 16, style: { borderRadius: 14 } },
        React.createElement(PillTabs, {
          tabs: [
            { key: 'shop', label: 'Shop' },
            { key: 'inventory', label: 'Inventory' },
            { key: 'history', label: 'History' },
          ],
          active: activeTab,
          onChange: setActiveTab,
          scrollable: false,
        }),
      ),

      // Loading
      isLoading
        ? React.createElement(
            View,
            { style: styles.loadingWrap },
            React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple }),
          )
        : null,

      // Item Grid (shop & inventory)
      activeTab !== 'history' && !isLoading
        ? React.createElement(
            View,
            { style: styles.grid },
            filteredItems.map(renderItemCard),
          )
        : null,

      // History list
      activeTab === 'history' && !isLoading
        ? React.createElement(
            View,
            null,
            historyItems.length === 0
              ? React.createElement(
                  View,
                  { style: styles.emptyWrap },
                  React.createElement(Text, { style: styles.emptyIcon }, '\uD83D\uDD70\uFE0F'),
                  React.createElement(Text, { style: styles.emptyTitle }, 'No purchase history'),
                  React.createElement(Text, { style: styles.emptyDesc }, 'Your past purchases will appear here'),
                )
              : historyItems.map(renderHistoryItem),
          )
        : null,

      // Empty state for shop/inventory
      activeTab !== 'history' && !isLoading && filteredItems.length === 0
        ? React.createElement(
            View,
            { style: styles.emptyWrap },
            React.createElement(Text, { style: styles.emptyIcon }, '\uD83D\uDCE6'),
            React.createElement(
              Text,
              { style: styles.emptyTitle },
              activeTab === 'inventory' ? 'No items in inventory' : 'No items available',
            ),
            React.createElement(
              Text,
              { style: styles.emptyDesc },
              activeTab === 'inventory' ? 'Purchase items to see them here' : 'Try a different category',
            ),
          )
        : null,

      React.createElement(View, { style: { height: 40 } }),
    ),

    // ─── Item Detail Modal ──────────────────────────────────

    React.createElement(
      Modal,
      {
        visible: !!selectedItem,
        transparent: true,
        animationType: 'fade',
        onRequestClose: function () {
          setSelectedItem(null);
        },
      },
      React.createElement(
        TouchableOpacity,
        {
          style: styles.modalOverlay,
          activeOpacity: 1,
          onPress: function () {
            setSelectedItem(null);
          },
        },
        React.createElement(
          TouchableOpacity,
          { style: styles.modalContent, activeOpacity: 1 },
          selectedItem
            ? React.createElement(
                View,
                { style: { padding: 28 } },
                // Wishlist
                React.createElement(
                  TouchableOpacity,
                  {
                    style: styles.modalWishlist,
                    onPress: function () {
                      toggleWishlist(selectedItem.id);
                    },
                    accessible: true, accessibilityRole: 'button', accessibilityLabel: (wishlistSet[selectedItem.id] ? 'Remove from' : 'Add to') + ' wishlist', accessibilityState: { selected: !!wishlistSet[selectedItem.id] },
                  },
                  React.createElement(Text, {
                    style: {
                      fontSize: 20,
                      color: wishlistSet[selectedItem.id] ? BRAND.pink : theme.textMuted,
                    },
                  }, wishlistSet[selectedItem.id] ? '\u2665' : '\u2661'),
                ),
                // Image
                React.createElement(
                  Text,
                  { style: styles.modalEmoji },
                  selectedItem.image || '\uD83D\uDCE6',
                ),
                // Name
                React.createElement(
                  Text,
                  { style: styles.modalName },
                  selectedItem.name,
                ),
                // Rarity
                (function () {
                  var rarity = RARITY_CONFIG[selectedItem.rarity] || RARITY_CONFIG.common;
                  return React.createElement(
                    View,
                    { style: styles.modalRarityWrap },
                    React.createElement(
                      View,
                      {
                        style: [
                          styles.rarityBadge,
                          { backgroundColor: rarity.color + '15', borderColor: rarity.color + '30' },
                        ],
                      },
                      React.createElement(
                        Text,
                        { style: [styles.rarityText, { color: rarity.color, fontSize: 11 }] },
                        '\u2B50 ' + rarity.label,
                      ),
                    ),
                  );
                })(),
                // Description
                React.createElement(
                  Text,
                  { style: styles.modalDesc },
                  selectedItem.description,
                ),
                // Price
                !selectedItem.owned
                  ? React.createElement(
                      View,
                      { style: styles.modalPriceRow },
                      React.createElement(Text, { style: styles.modalPriceIcon }, '\u26A1'),
                      React.createElement(
                        Text,
                        { style: styles.modalPriceText },
                        selectedItem.price + ' XP',
                      ),
                    )
                  : null,
                // Action button
                React.createElement(
                  View,
                  { style: { marginTop: 20 } },
                  selectedItem.equipped
                    ? React.createElement(
                        GlassButton,
                        {
                          variant: 'success',
                          size: 'lg',
                          fullWidth: true,
                          onPress: function () {
                            handleEquip(selectedItem.id);
                            setSelectedItem(null);
                          },
                        },
                        'Equipped',
                      )
                    : selectedItem.owned
                      ? React.createElement(
                          GlassButton,
                          {
                            variant: 'secondary',
                            size: 'lg',
                            fullWidth: true,
                            onPress: function () {
                              handleEquip(selectedItem.id);
                              setSelectedItem(null);
                            },
                          },
                          'Equip Item',
                        )
                      : React.createElement(
                          GlassButton,
                          {
                            variant: 'primary',
                            size: 'lg',
                            fullWidth: true,
                            onPress: function () {
                              handleBuy(selectedItem.id);
                              setSelectedItem(null);
                            },
                            disabled: purchaseMut.isPending,
                          },
                          'Buy for ' + selectedItem.price + ' XP',
                        ),
                ),
              )
            : null,
        ),
      ),
    ),

    // ─── Refund Modal ───────────────────────────────────────

    React.createElement(
      Modal,
      {
        visible: !!refundModal,
        transparent: true,
        animationType: 'fade',
        onRequestClose: function () {
          setRefundModal(null);
          setRefundReason('');
        },
      },
      React.createElement(
        TouchableOpacity,
        {
          style: styles.modalOverlay,
          activeOpacity: 1,
          onPress: function () {
            setRefundModal(null);
            setRefundReason('');
          },
        },
        React.createElement(
          TouchableOpacity,
          { style: styles.modalContent, activeOpacity: 1 },
          React.createElement(
            View,
            { style: { padding: 24 } },
            React.createElement(
              Text,
              { style: styles.modalTitle },
              'Request Refund',
            ),
            React.createElement(
              Text,
              { style: styles.modalSubtitle },
              'Refund for: ' + (refundModal && (refundModal.name || refundModal.itemName)),
            ),
            React.createElement(TextInput, {
              value: refundReason,
              onChangeText: setRefundReason,
              placeholder: 'Why do you want a refund?',
              placeholderTextColor: theme.textMuted,
              multiline: true,
              style: styles.textInput,
              accessible: true, accessibilityLabel: 'Refund reason', accessibilityHint: 'Explain why you want a refund',
            }),
            React.createElement(
              View,
              { style: styles.modalButtons },
              React.createElement(
                GlassButton,
                {
                  variant: 'secondary',
                  onPress: function () {
                    setRefundModal(null);
                    setRefundReason('');
                  },
                  style: { flex: 1 },
                },
                'Cancel',
              ),
              React.createElement(
                GlassButton,
                {
                  variant: 'primary',
                  onPress: function () {
                    refundMut.mutate({
                      purchaseId: refundModal && refundModal.id,
                      reason: refundReason.trim(),
                    });
                  },
                  disabled: !refundReason.trim(),
                  style: { flex: 1, marginLeft: 8 },
                },
                'Submit',
              ),
            ),
          ),
        ),
      ),
    ),
    tooltipCfg
      ? React.createElement(OnboardingTooltip, {
          id: tooltipCfg.id,
          message: tooltipCfg.message,
          position: tooltipCfg.position,
          targetRef: headerRef,
        })
      : null,
  );
};

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 32,
  },
  itemCard: {
    width: '48%',
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderRadius: RADIUS.xl,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    padding: 4,
  },
  itemEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  itemName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  rarityBadge: {
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 10,
  },
  priceIcon: {
    fontSize: 12,
    color: BRAND.yellow,
  },
  priceText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: BRAND.yellow,
  },
  ownedText: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 11,
    color: theme.textMuted,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyName: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
  },
  historyDate: {
    fontSize: 12,
    color: theme.textMuted,
  },
  historyPrice: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.semibold,
    color: BRAND.yellow,
  },
  loadingWrap: {
    padding: 60,
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.textTertiary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.bg,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    overflow: 'hidden',
  },
  modalWishlist: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 2,
    padding: 4,
  },
  modalEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  modalName: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalRarityWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  modalPriceIcon: {
    fontSize: 18,
    color: BRAND.yellow,
  },
  modalPriceText: {
    fontSize: 22,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: BRAND.yellow,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.text,
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: RADIUS.md,
    padding: 14,
    color: theme.text,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});

module.exports = StoreScreen;
