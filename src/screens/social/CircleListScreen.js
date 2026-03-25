/**
 * CircleListScreen — List of user's circles + discover.
 * Adapted from CirclesMobile.jsx + useCirclesScreen.js
 */
var React = require('react');
var { useState, useEffect, useCallback, useRef } = React;
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiPost } = require('../../services/api');
var { CIRCLES } = require('../../services/endpoints');
var useInfiniteList = require('../../hooks/useInfiniteList');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var GlassCard = require('../../components/shared/GlassCard');
var Icon = require('react-native-vector-icons/Feather').default;
var OnboardingTooltip = require('../../components/OnboardingTooltip');
var { getTooltipConfig } = require('../../config/onboardingTooltips');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND, catSolid } = require('../../styles/colors');

var EXTRA_CAT_COLORS = {
  fitness: '#3B82F6',
  education: '#6366F1',
  creativity: '#EC4899',
  personal_growth: '#6366F1',
  other: '#9CA3AF',
};

var getCatColor = function (key) {
  if (!key) return BRAND.purple;
  var k = key.toLowerCase().replace(/\s+/g, '_');
  return catSolid(k) || EXTRA_CAT_COLORS[k] || BRAND.purple;
};

var CATEGORY_KEYS = [
  { key: 'all', label: 'All' },
  { key: 'career', label: 'Career' },
  { key: 'health', label: 'Health' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'education', label: 'Education' },
  { key: 'finance', label: 'Finance' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'relationships', label: 'Social' },
  { key: 'personal_growth', label: 'Growth' },
  { key: 'hobbies', label: 'Hobbies' },
];

var CircleListScreen = function () {
  var navigation = useNavigation();
  var qc = useQueryClient();
  var [discoverOpen, setDiscoverOpen] = useState(false);
  var createBtnRef = useRef(null);
  var tooltipCfg = getTooltipConfig('CircleListScreen');
  var [searchText, setSearchText] = useState('');
  var [debouncedSearch, setDebouncedSearch] = useState('');
  var [activeCategory, setActiveCategory] = useState('all');
  var [justJoinedSet, setJustJoinedSet] = useState({});
  var debounceRef = useRef(null);

  useEffect(function () {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(function () {
      setDebouncedSearch(searchText.trim());
    }, 300);
    return function () {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]);

  // My circles
  var myCirclesInf = useInfiniteList({
    queryKey: ['circles', 'my'],
    url: CIRCLES.LIST + '?filter=my',
    limit: 20,
  });

  // Discover
  var discoverUrl = CIRCLES.LIST + '?filter=recommended';
  if (activeCategory !== 'all') discoverUrl += '&category=' + activeCategory;
  if (debouncedSearch) discoverUrl += '&search=' + encodeURIComponent(debouncedSearch);

  var discoverInf = useInfiniteList({
    queryKey: ['circles', 'discover', activeCategory, debouncedSearch],
    url: discoverUrl,
    limit: 20,
    enabled: discoverOpen,
  });

  var joinMut = useMutation({
    mutationFn: function (circleId) {
      return apiPost(CIRCLES.JOIN(circleId));
    },
    onSuccess: function (_data, circleId) {
      setJustJoinedSet(function (prev) {
        var n = Object.assign({}, prev);
        n[circleId] = true;
        return n;
      });
      qc.invalidateQueries({ queryKey: ['circles'] });
    },
  });

  var renderCircle = useCallback(function (info) {
    var circle = info.item;
    var color = getCatColor(circle.category);

    return React.createElement(
      TouchableOpacity,
      {
        style: styles.circleCard,
        activeOpacity: 0.7,
        onPress: function () {
          navigation.navigate('CircleDetail', { circleId: circle.id });
        },
        accessible: true, accessibilityRole: 'button', accessibilityLabel: circle.name + ', ' + (circle.memberCount || 0) + ' members' + (circle.activeChallenge ? ', challenge active' : ''),
      },
      React.createElement(
        View,
        { style: [styles.circleColor, { backgroundColor: color + '20', borderColor: color + '40' }] },
        React.createElement(Icon, { name: 'users', size: 20, color: color }),
      ),
      React.createElement(
        View,
        { style: styles.circleInfo },
        React.createElement(
          Text,
          { style: styles.circleName, numberOfLines: 1 },
          circle.name,
        ),
        React.createElement(
          Text,
          { style: styles.circleMeta },
          (circle.memberCount || 0) + ' members' +
            (circle.activeChallenge ? ' \u00B7 Challenge active' : ''),
        ),
      ),
      React.createElement(Icon, { name: 'chevron-right', size: 18, color: COLORS.textMuted }),
    );
  }, [navigation]);

  var renderDiscoverCircle = useCallback(function (info) {
    var circle = info.item;
    var color = getCatColor(circle.category);
    var isJoined = circle.isJoined || justJoinedSet[circle.id];

    return React.createElement(
      GlassCard,
      { style: { marginHorizontal: SPACING.lg } },
      React.createElement(
        View,
        { style: { flexDirection: 'row', alignItems: 'center' } },
        React.createElement(
          View,
          { style: [styles.circleColor, { backgroundColor: color + '20', borderColor: color + '40' }] },
          React.createElement(Icon, { name: 'users', size: 18, color: color }),
        ),
        React.createElement(
          View,
          { style: { flex: 1, marginLeft: 12 } },
          React.createElement(Text, { style: styles.circleName }, circle.name),
          React.createElement(
            Text,
            { style: styles.circleMeta },
            (circle.memberCount || 0) + ' members \u00B7 ' + (circle.category || 'General'),
          ),
        ),
        !isJoined
          ? React.createElement(
              TouchableOpacity,
              {
                style: styles.joinBtn,
                onPress: function () { joinMut.mutate(circle.id); },
                disabled: joinMut.isPending,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Join ' + circle.name, accessibilityState: { disabled: joinMut.isPending },
              },
              React.createElement(Text, { style: styles.joinBtnText }, 'Join'),
            )
          : React.createElement(
              View,
              { style: styles.joinedLabel },
              React.createElement(Icon, { name: 'check', size: 14, color: COLORS.online }),
            ),
      ),
      circle.description
        ? React.createElement(
            Text,
            { style: styles.discoverDesc, numberOfLines: 2 },
            circle.description,
          )
        : null,
    );
  }, [justJoinedSet, joinMut]);

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(View, { ref: createBtnRef },
      React.createElement(GlassHeader, {
        title: 'Circles',
        onBack: function () { navigation.goBack(); },
        rightActions: [
          {
            icon: 'compass',
            onPress: function () { setDiscoverOpen(true); },
          },
          {
            icon: 'plus',
            onPress: function () { navigation.navigate('CircleCreate'); },
          },
        ],
      })
    ),

    // My circles list
    myCirclesInf.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
        )
      : React.createElement(FlatList, {
          data: myCirclesInf.items,
          renderItem: renderCircle,
          keyExtractor: keyExtractor,
          contentContainerStyle: { paddingBottom: 100 },
          ListEmptyComponent: React.createElement(
            View,
            { style: styles.emptyWrap },
            React.createElement(Icon, { name: 'users', size: 48, color: COLORS.textMuted }),
            React.createElement(Text, { style: styles.emptyText }, 'No circles yet'),
            React.createElement(
              Text,
              { style: styles.emptySubtext },
              'Join a circle or create your own',
            ),
          ),
          showsVerticalScrollIndicator: false,
          onRefresh: function () { myCirclesInf.refetch(); },
          refreshing: false,
        }),

    // Discover Modal
    React.createElement(
      Modal,
      {
        visible: discoverOpen,
        animationType: 'slide',
        transparent: false,
        onRequestClose: function () { setDiscoverOpen(false); },
      },
      React.createElement(
        ScreenShell,
        null,
        React.createElement(GlassHeader, {
          title: 'Discover Circles',
          onBack: function () { setDiscoverOpen(false); },
        }),
        // Search
        React.createElement(
          View,
          { style: styles.searchWrap },
          React.createElement(Icon, { name: 'search', size: 16, color: COLORS.textMuted, style: { marginRight: 8 } }),
          React.createElement(TextInput, {
            style: styles.searchInput,
            placeholder: 'Search circles...',
            placeholderTextColor: COLORS.textMuted,
            value: searchText,
            onChangeText: setSearchText,
          }),
        ),
        // Category filters
        React.createElement(
          ScrollView,
          {
            horizontal: true,
            showsHorizontalScrollIndicator: false,
            contentContainerStyle: { paddingHorizontal: SPACING.lg, paddingBottom: 10 },
          },
          CATEGORY_KEYS.map(function (cat) {
            var isActive = activeCategory === cat.key;
            var color = cat.key === 'all' ? COLORS.purple : getCatColor(cat.key);
            return React.createElement(
              TouchableOpacity,
              {
                key: cat.key,
                style: [
                  styles.catPill,
                  isActive && { backgroundColor: color + '20', borderColor: color + '40' },
                ],
                onPress: function () { setActiveCategory(cat.key); },
                accessible: true, accessibilityRole: 'tab', accessibilityLabel: cat.label, accessibilityState: { selected: isActive },
              },
              React.createElement(
                Text,
                { style: [styles.catPillText, isActive && { color: color }] },
                cat.label,
              ),
            );
          }),
        ),
        // Discover list
        React.createElement(FlatList, {
          data: discoverInf.items,
          renderItem: renderDiscoverCircle,
          keyExtractor: keyExtractor,
          contentContainerStyle: { paddingBottom: 100, paddingTop: 8 },
          showsVerticalScrollIndicator: false,
          onEndReached: function () {
            if (discoverInf.hasNextPage) discoverInf.fetchNextPage();
          },
          onEndReachedThreshold: 0.3,
          ListEmptyComponent: discoverInf.isLoading
            ? React.createElement(
                View,
                { style: styles.loadingWrap },
                React.createElement(ActivityIndicator, { size: 'small', color: COLORS.purple }),
              )
            : React.createElement(
                View,
                { style: styles.emptyWrap },
                React.createElement(Text, { style: styles.emptyText }, 'No circles found'),
              ),
        }),
      ),
    ),
    tooltipCfg
      ? React.createElement(OnboardingTooltip, {
          id: tooltipCfg.id,
          message: tooltipCfg.message,
          position: tooltipCfg.position,
          targetRef: createBtnRef,
        })
      : null,
  );
};

var styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  circleColor: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  circleMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 8,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  discoverDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 17,
  },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: COLORS.purple,
    borderRadius: 10,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinedLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});

module.exports = CircleListScreen;
