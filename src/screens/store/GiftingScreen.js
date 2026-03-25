/**
 * GiftingScreen — Send and receive gifts from the store.
 * Features: browse giftable items, select recipient from friends,
 * add personal message, confirm & send, gift history (sent/received).
 */
var React = require('react');
var { useState, useCallback } = React;
var {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { STORE, SOCIAL } = require('../../services/endpoints');
var { BRAND } = require('../../styles/colors');
var { dark: theme } = require('../../styles/theme');
var { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS, SHADOWS } = require('../../styles/tokens');
var GlassCard = require('../../components/GlassCard');
var GlassButton = require('../../components/GlassButton');
var PillTabs = require('../../components/PillTabs');
var { ScreenHeader, BackButton } = require('../../components/ScreenHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, CONTACT_COLORS } = require('../../theme/tokens');

var getAvatarColor = function (name) {
  if (!name) return CONTACT_COLORS[0];
  var hash = 0;
  for (var i = 0; i < name.length; i++) hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  return CONTACT_COLORS[Math.abs(hash) % CONTACT_COLORS.length];
};

// ─── Screen ─────────────────────────────────────────────────────

var GiftingScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  // Offline guard: try to use NetworkContext if available, else assume online
  var isOnline = true;
  try { var net = require('../../context/NetworkContext'); isOnline = net.useNetwork().isOnline; } catch(e) {}

  var [activeTab, setActiveTab] = useState('browse');
  var [historyTab, setHistoryTab] = useState('sent');
  var [selectedItem, setSelectedItem] = useState(null);
  var [selectedRecipient, setSelectedRecipient] = useState(null);
  var [giftMessage, setGiftMessage] = useState('');
  var [showRecipientPicker, setShowRecipientPicker] = useState(false);
  var [friendSearch, setFriendSearch] = useState('');
  var [showConfirmModal, setShowConfirmModal] = useState(false);
  var [refreshing, setRefreshing] = useState(false);

  // ─── Queries ────────────────────────────────────────────────

  var itemsQuery = useQuery({
    queryKey: ['store-giftable-items'],
    queryFn: function () {
      return apiGet(STORE.ITEMS + '?giftable=true');
    },
  });

  var friendsQuery = useQuery({
    queryKey: ['friends-list'],
    queryFn: function () {
      return apiGet(SOCIAL.FRIENDS.LIST);
    },
  });

  var giftsSentQuery = useQuery({
    queryKey: ['gifts-sent'],
    queryFn: function () {
      return apiGet(STORE.GIFTS + '?direction=sent');
    },
    enabled: activeTab === 'history',
  });

  var giftsReceivedQuery = useQuery({
    queryKey: ['gifts-received'],
    queryFn: function () {
      return apiGet(STORE.GIFTS + '?direction=received');
    },
    enabled: activeTab === 'history',
  });

  var items = (function () {
    var data = itemsQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  })();

  var friends = (function () {
    var data = friendsQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  })();

  var filteredFriends = friends.filter(function (f) {
    if (!friendSearch.trim()) return true;
    var name = (f.displayName || f.username || '').toLowerCase();
    return name.indexOf(friendSearch.trim().toLowerCase()) !== -1;
  });

  var giftsSent = (function () {
    var data = giftsSentQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  })();

  var giftsReceived = (function () {
    var data = giftsReceivedQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  })();

  // ─── Mutations ──────────────────────────────────────────────

  var sendGiftMut = useMutation({
    mutationFn: function (payload) {
      return apiPost(STORE.GIFT_SEND, payload);
    },
    onSuccess: function () {
      setShowConfirmModal(false);
      setSelectedItem(null);
      setSelectedRecipient(null);
      setGiftMessage('');
      queryClient.invalidateQueries({ queryKey: ['gifts-sent'] });
      queryClient.invalidateQueries({ queryKey: ['store-giftable-items'] });
      Alert.alert('Gift Sent!', 'Your gift has been sent successfully.');
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to send gift.');
    },
  });

  var claimGiftMut = useMutation({
    mutationFn: function (giftId) {
      return apiPost(STORE.GIFT_CLAIM(giftId));
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['gifts-received'] });
      queryClient.invalidateQueries({ queryKey: ['gifts-sent'] });
      Alert.alert('Gift Claimed!', 'The gift has been added to your inventory.');
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to claim gift.');
    },
  });

  var handleSendGift = function () {
    if (!selectedItem || !selectedRecipient) return;
    if (!isOnline) {
      Alert.alert('Offline', 'Sending gifts requires an internet connection.');
      return;
    }
    sendGiftMut.mutate({
      item_id: selectedItem.id,
      recipient_id: selectedRecipient.id,
      message: giftMessage.trim() || undefined,
    });
  };

  var handleClaimGift = function (giftId) {
    if (!isOnline) {
      Alert.alert('Offline', 'Claiming gifts requires an internet connection.');
      return;
    }
    claimGiftMut.mutate(giftId);
  };

  var onRefresh = useCallback(function () {
    setRefreshing(true);
    Promise.all([
      itemsQuery.refetch(),
      friendsQuery.refetch(),
      giftsSentQuery.refetch(),
      giftsReceivedQuery.refetch(),
    ]).finally(function () {
      setRefreshing(false);
    });
  }, []);

  // ─── Render: Browse Items ─────────────────────────────────────

  var renderItemCard = function (item, index) {
    return React.createElement(
      TouchableOpacity,
      {
        key: item.id || index,
        style: styles.itemCard,
        activeOpacity: 0.8,
        onPress: function () {
          setSelectedItem(item);
          setShowRecipientPicker(true);
        },
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Gift ' + (item.name || 'item') + ', ' + (item.price || 0) + ' XP', accessibilityHint: 'Tap to choose a recipient',
      },
      React.createElement(
        Text,
        { style: styles.itemEmoji },
        item.image || '\uD83C\uDF81',
      ),
      React.createElement(
        Text,
        { style: styles.itemName, numberOfLines: 1 },
        item.name || 'Gift Item',
      ),
      item.rarity
        ? React.createElement(
            View,
            { style: styles.rarityBadge },
            React.createElement(
              Text,
              { style: styles.rarityText },
              item.rarity,
            ),
          )
        : null,
      React.createElement(
        View,
        { style: styles.priceRow },
        React.createElement(Text, { style: styles.priceIcon }, '\u26A1'),
        React.createElement(Text, { style: styles.priceText }, String(item.price || 0)),
      ),
      React.createElement(
        GlassButton,
        {
          variant: 'primary',
          size: 'sm',
          fullWidth: true,
          onPress: function () {
            setSelectedItem(item);
            setShowRecipientPicker(true);
          },
        },
        '\uD83C\uDF81 Gift',
      ),
    );
  };

  // ─── Render: Friend Picker ────────────────────────────────────

  var renderFriendRow = function (info) {
    var friend = info.item;
    var name = friend.displayName || friend.username || 'User';
    var isSelected = selectedRecipient && selectedRecipient.id === friend.id;

    return React.createElement(
      TouchableOpacity,
      {
        style: [styles.friendRow, isSelected && styles.friendRowSelected],
        activeOpacity: 0.7,
        onPress: function () {
          setSelectedRecipient(friend);
        },
        accessible: true, accessibilityRole: 'radio', accessibilityLabel: 'Select ' + name + ' as recipient', accessibilityState: { selected: isSelected },
      },
      React.createElement(Avatar, {
        name: name,
        src: friend.avatar || friend.avatarUrl || null,
        size: 40,
        color: getAvatarColor(name),
      }),
      React.createElement(
        View,
        { style: { flex: 1, marginLeft: 12 } },
        React.createElement(
          Text,
          { style: styles.friendName },
          name,
        ),
        friend.username
          ? React.createElement(
              Text,
              { style: styles.friendUsername },
              '@' + friend.username,
            )
          : null,
      ),
      isSelected
        ? React.createElement(
            View,
            { style: styles.checkCircle },
            React.createElement(Icon, { name: 'check', size: 14, color: '#fff' }),
          )
        : null,
    );
  };

  // ─── Render: Gift History ──────────────────────────────────────

  var renderGiftHistoryItem = function (info) {
    var gift = info.item;
    var otherUser = historyTab === 'sent'
      ? (gift.recipient || gift.recipientName || 'Unknown')
      : (gift.sender || gift.senderName || 'Unknown');
    var otherName = typeof otherUser === 'object'
      ? (otherUser.displayName || otherUser.username || 'User')
      : otherUser;
    var itemName = gift.itemName || gift.item?.name || 'Gift';
    var date = gift.createdAt || gift.sentAt || gift.date;

    return React.createElement(
      GlassCard,
      { key: gift.id || info.index, padding: 14, mb: 10 },
      React.createElement(
        View,
        { style: styles.historyRow },
        React.createElement(
          View,
          { style: styles.giftIconWrap },
          React.createElement(Text, { style: { fontSize: 24 } }, gift.itemImage || '\uD83C\uDF81'),
        ),
        React.createElement(
          View,
          { style: { flex: 1, marginLeft: 12 } },
          React.createElement(
            Text,
            { style: styles.historyItemName, numberOfLines: 1 },
            itemName,
          ),
          React.createElement(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', marginTop: 4 } },
            React.createElement(
              Icon,
              {
                name: historyTab === 'sent' ? 'arrow-up-right' : 'arrow-down-left',
                size: 12,
                color: historyTab === 'sent' ? BRAND.pink : BRAND.greenSolid,
              },
            ),
            React.createElement(
              Text,
              { style: styles.historyMeta },
              (historyTab === 'sent' ? ' To: ' : ' From: ') + otherName,
            ),
          ),
          date
            ? React.createElement(
                Text,
                { style: styles.historyDate },
                new Date(date).toLocaleDateString(),
              )
            : null,
        ),
        gift.status
          ? React.createElement(
              View,
              {
                style: [
                  styles.statusBadge,
                  gift.status === 'claimed'
                    ? { backgroundColor: 'rgba(16,185,129,0.12)' }
                    : { backgroundColor: 'rgba(251,191,36,0.12)' },
                ],
              },
              React.createElement(
                Text,
                {
                  style: {
                    fontSize: 10,
                    fontWeight: FONT_WEIGHTS.semibold,
                    color: gift.status === 'claimed' ? BRAND.greenSolid : BRAND.yellow,
                    textTransform: 'capitalize',
                  },
                },
                gift.status,
              ),
            )
          : null,
      ),
      gift.message
        ? React.createElement(
            View,
            { style: styles.giftMessageWrap },
            React.createElement(Icon, { name: 'message-circle', size: 12, color: COLORS.textMuted }),
            React.createElement(
              Text,
              { style: styles.giftMessageText, numberOfLines: 2 },
              gift.message,
            ),
          )
        : null,
      // Claim button for unclaimed received gifts
      historyTab === 'received' && gift.status !== 'claimed'
        ? React.createElement(
            View,
            { style: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.divider } },
            React.createElement(
              GlassButton,
              {
                variant: 'primary',
                size: 'sm',
                fullWidth: true,
                onPress: function () { handleClaimGift(gift.id); },
                disabled: claimGiftMut.isPending,
                loading: claimGiftMut.isPending,
              },
              'Claim Gift',
            ),
          )
        : null,
    );
  };

  // ─── Loading state ──────────────────────────────────────────

  var isLoading = activeTab === 'browse' ? itemsQuery.isLoading : (giftsSentQuery.isLoading || giftsReceivedQuery.isLoading);

  // ─── Render ─────────────────────────────────────────────────

  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(ScreenHeader, {
      title: 'Gift Shop',
      left: React.createElement(BackButton, {
        onPress: function () { navigation.goBack(); },
      }),
    }),

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

      // Main tabs
      React.createElement(PillTabs, {
        tabs: [
          { key: 'browse', label: '\uD83C\uDF81 Browse Gifts' },
          { key: 'history', label: '\uD83D\uDCDC History' },
        ],
        active: activeTab,
        onChange: setActiveTab,
        scrollable: false,
        style: { marginBottom: 16 },
      }),

      // Loading
      isLoading
        ? React.createElement(
            View,
            { style: styles.loadingWrap },
            React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple }),
          )
        : null,

      // Browse tab — item grid
      activeTab === 'browse' && !isLoading
        ? React.createElement(
            View,
            null,
            items.length === 0
              ? React.createElement(
                  View,
                  { style: styles.emptyWrap },
                  React.createElement(Text, { style: styles.emptyIcon }, '\uD83C\uDF81'),
                  React.createElement(Text, { style: styles.emptyTitle }, 'No giftable items'),
                  React.createElement(Text, { style: styles.emptyDesc }, 'Check back later for giftable items.'),
                )
              : React.createElement(
                  View,
                  { style: styles.grid },
                  items.map(renderItemCard),
                ),
          )
        : null,

      // History tab
      activeTab === 'history' && !isLoading
        ? React.createElement(
            View,
            null,
            // Sent/Received sub-tabs
            React.createElement(
              GlassCard,
              { padding: 4, mb: 16, style: { borderRadius: 14 } },
              React.createElement(PillTabs, {
                tabs: [
                  { key: 'sent', label: 'Sent' },
                  { key: 'received', label: 'Received' },
                ],
                active: historyTab,
                onChange: setHistoryTab,
                scrollable: false,
              }),
            ),
            // History list
            (historyTab === 'sent' ? giftsSent : giftsReceived).length === 0
              ? React.createElement(
                  View,
                  { style: styles.emptyWrap },
                  React.createElement(Text, { style: styles.emptyIcon }, historyTab === 'sent' ? '\uD83D\uDCE4' : '\uD83D\uDCE5'),
                  React.createElement(
                    Text,
                    { style: styles.emptyTitle },
                    historyTab === 'sent' ? 'No gifts sent yet' : 'No gifts received yet',
                  ),
                  React.createElement(
                    Text,
                    { style: styles.emptyDesc },
                    historyTab === 'sent'
                      ? 'Send a gift to a friend to brighten their day!'
                      : 'Gifts from friends will appear here.',
                  ),
                )
              : React.createElement(FlatList, {
                  data: historyTab === 'sent' ? giftsSent : giftsReceived,
                  renderItem: renderGiftHistoryItem,
                  keyExtractor: function (item, idx) { return String(item.id || idx); },
                  scrollEnabled: false,
                }),
          )
        : null,

      React.createElement(View, { style: { height: 40 } }),
    ),

    // ─── Recipient Picker Modal ─────────────────────────────

    React.createElement(
      Modal,
      {
        visible: showRecipientPicker,
        transparent: true,
        animationType: 'slide',
        onRequestClose: function () {
          setShowRecipientPicker(false);
          setSelectedRecipient(null);
          setFriendSearch('');
        },
      },
      React.createElement(
        View,
        { style: styles.modalOverlay },
        React.createElement(
          View,
          { style: styles.recipientModalContent },
          // Header
          React.createElement(
            View,
            { style: styles.recipientModalHeader },
            React.createElement(
              Text,
              { style: styles.modalTitle },
              'Choose Recipient',
            ),
            React.createElement(
              TouchableOpacity,
              {
                onPress: function () {
                  setShowRecipientPicker(false);
                  setSelectedRecipient(null);
                  setFriendSearch('');
                },
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Close recipient picker',
              },
              React.createElement(Icon, { name: 'x', size: 22, color: COLORS.text }),
            ),
          ),
          // Search
          React.createElement(
            View,
            { style: styles.searchWrap },
            React.createElement(Icon, { name: 'search', size: 16, color: COLORS.textMuted, style: { marginRight: 8 } }),
            React.createElement(TextInput, {
              value: friendSearch,
              onChangeText: setFriendSearch,
              placeholder: 'Search friends...',
              placeholderTextColor: theme.textMuted,
              style: styles.searchInput,
              accessible: true, accessibilityRole: 'search', accessibilityLabel: 'Search friends',
            }),
          ),
          // Friends list
          friendsQuery.isLoading
            ? React.createElement(
                View,
                { style: { padding: 40, alignItems: 'center' } },
                React.createElement(ActivityIndicator, { size: 'small', color: BRAND.purple }),
              )
            : React.createElement(FlatList, {
                data: filteredFriends,
                renderItem: renderFriendRow,
                keyExtractor: function (item) { return String(item.id); },
                style: { flex: 1 },
                contentContainerStyle: { paddingBottom: 20 },
                ListEmptyComponent: React.createElement(
                  View,
                  { style: { padding: 40, alignItems: 'center' } },
                  React.createElement(Text, { style: styles.emptyTitle }, 'No friends found'),
                ),
              }),
          // Continue button
          selectedRecipient
            ? React.createElement(
                View,
                { style: styles.recipientModalFooter },
                React.createElement(
                  GlassButton,
                  {
                    variant: 'primary',
                    size: 'lg',
                    fullWidth: true,
                    onPress: function () {
                      setShowRecipientPicker(false);
                      setShowConfirmModal(true);
                    },
                  },
                  'Continue with ' + (selectedRecipient.displayName || selectedRecipient.username || 'Friend'),
                ),
              )
            : null,
        ),
      ),
    ),

    // ─── Confirm Gift Modal ──────────────────────────────────

    React.createElement(
      Modal,
      {
        visible: showConfirmModal,
        transparent: true,
        animationType: 'fade',
        onRequestClose: function () {
          setShowConfirmModal(false);
        },
      },
      React.createElement(
        TouchableOpacity,
        {
          style: styles.modalOverlay,
          activeOpacity: 1,
          onPress: function () { setShowConfirmModal(false); },
        },
        React.createElement(
          TouchableOpacity,
          { style: styles.confirmModalContent, activeOpacity: 1 },
          selectedItem && selectedRecipient
            ? React.createElement(
                View,
                { style: { padding: 24 } },
                // Gift preview
                React.createElement(
                  Text,
                  { style: styles.confirmEmoji },
                  selectedItem.image || '\uD83C\uDF81',
                ),
                React.createElement(
                  Text,
                  { style: styles.confirmItemName },
                  selectedItem.name || 'Gift',
                ),
                React.createElement(
                  View,
                  { style: styles.confirmRecipientRow },
                  React.createElement(Icon, { name: 'arrow-right', size: 14, color: COLORS.textMuted }),
                  React.createElement(Avatar, {
                    name: selectedRecipient.displayName || selectedRecipient.username || 'U',
                    size: 28,
                    color: getAvatarColor(selectedRecipient.displayName || selectedRecipient.username || 'U'),
                    style: { marginHorizontal: 8 },
                  }),
                  React.createElement(
                    Text,
                    { style: styles.confirmRecipientName },
                    selectedRecipient.displayName || selectedRecipient.username || 'Friend',
                  ),
                ),
                // Personal message
                React.createElement(
                  Text,
                  { style: styles.messageLabel },
                  'Add a personal message (optional)',
                ),
                React.createElement(TextInput, {
                  value: giftMessage,
                  onChangeText: setGiftMessage,
                  placeholder: 'Write something nice...',
                  placeholderTextColor: theme.textMuted,
                  multiline: true,
                  maxLength: 200,
                  style: styles.textInput,
                  accessible: true, accessibilityLabel: 'Personal message for gift', accessibilityHint: 'Optional, 200 characters max',
                }),
                React.createElement(
                  Text,
                  { style: styles.charCount },
                  giftMessage.length + '/200',
                ),
                // Cost
                React.createElement(
                  View,
                  { style: styles.costRow },
                  React.createElement(Text, { style: styles.costLabel }, 'Cost:'),
                  React.createElement(Text, { style: styles.costIcon }, '\u26A1'),
                  React.createElement(
                    Text,
                    { style: styles.costValue },
                    String(selectedItem.price || 0) + ' XP',
                  ),
                ),
                // Buttons
                React.createElement(
                  View,
                  { style: styles.confirmButtons },
                  React.createElement(
                    GlassButton,
                    {
                      variant: 'secondary',
                      size: 'lg',
                      onPress: function () { setShowConfirmModal(false); },
                      style: { flex: 1 },
                    },
                    'Cancel',
                  ),
                  React.createElement(
                    GlassButton,
                    {
                      variant: 'primary',
                      size: 'lg',
                      onPress: handleSendGift,
                      disabled: sendGiftMut.isPending,
                      loading: sendGiftMut.isPending,
                      style: { flex: 1, marginLeft: 10 },
                    },
                    '\uD83C\uDF81 Send Gift',
                  ),
                ),
              )
            : null,
        ),
      ),
    ),
  );
};

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  loadingWrap: { padding: 60, alignItems: 'center' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: FONT_WEIGHTS.semibold, color: theme.textTertiary, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: theme.textMuted, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 32 },
  itemCard: {
    width: '48%',
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderRadius: RADIUS.xl,
    padding: 16,
    overflow: 'hidden',
  },
  itemEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
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
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    marginBottom: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: BRAND.purple,
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
  priceIcon: { fontSize: 12, color: BRAND.yellow },
  priceText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: BRAND.yellow },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
  giftIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItemName: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
  },
  historyMeta: { fontSize: 12, color: theme.textSecondary },
  historyDate: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  giftMessageWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
    gap: 6,
  },
  giftMessageText: { fontSize: 12, color: theme.textSecondary, flex: 1, fontStyle: 'italic' },

  // Recipient picker modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  recipientModalContent: {
    backgroundColor: theme.bg,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '80%',
    paddingTop: 16,
  },
  recipientModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.text,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.xl,
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    paddingVertical: 10,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  friendRowSelected: {
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  friendName: { fontSize: 14, fontWeight: FONT_WEIGHTS.semibold, color: theme.text },
  friendUsername: { fontSize: 12, color: theme.textMuted, marginTop: 1 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientModalFooter: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
  },

  // Confirm modal
  confirmModalContent: {
    width: '92%',
    maxWidth: 380,
    backgroundColor: theme.bg,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 40,
  },
  confirmEmoji: { fontSize: 64, textAlign: 'center', marginBottom: 12 },
  confirmItemName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmRecipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  confirmRecipientName: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
  },
  messageLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: theme.textSecondary,
    marginBottom: 8,
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
  },
  charCount: { fontSize: 11, color: theme.textMuted, textAlign: 'right', marginTop: 4 },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 20,
  },
  costLabel: { fontSize: 14, color: theme.textSecondary },
  costIcon: { fontSize: 14, color: BRAND.yellow },
  costValue: { fontSize: 16, fontWeight: FONT_WEIGHTS.bold, color: BRAND.yellow },
  confirmButtons: { flexDirection: 'row', gap: 8 },
});

module.exports = GiftingScreen;
