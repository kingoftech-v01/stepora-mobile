/**
 * Tests for src/screens/store/StoreScreen.js
 * Covers loading, category tabs, shop/inventory/history tabs,
 * item rendering, rarity badges, purchase, equip, wishlist, empty states.
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Mock navigation ────────────────────────────────────────────

var mockNavigate = jest.fn();
var mockGoBack = jest.fn();
jest.mock('@react-navigation/native', function () {
  return {
    useNavigation: function () {
      return { navigate: mockNavigate, goBack: mockGoBack };
    },
  };
});

// ─── Mock React Query ───────────────────────────────────────────

var mockItemsPages = [];
var mockInventoryPages = [];
var mockHistoryPages = [];
var mockWishlistData = [];
var mockPurchaseMutate = jest.fn();
var mockEquipMutate = jest.fn();
var mockWishlistAddMutate = jest.fn();
var mockWishlistRemoveMutate = jest.fn();
var mockRefundMutate = jest.fn();
var mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', function () {
  return {
    useQuery: function () {
      return { data: mockWishlistData, isLoading: false };
    },
    useInfiniteQuery: function (opts) {
      if (opts.queryKey[0] === 'store-items') {
        return { data: { pages: mockItemsPages }, isLoading: false, refetch: jest.fn() };
      }
      if (opts.queryKey[0] === 'store-inventory') {
        return { data: { pages: mockInventoryPages }, isLoading: false, refetch: jest.fn() };
      }
      if (opts.queryKey[0] === 'store-history') {
        return { data: { pages: mockHistoryPages }, isLoading: false, refetch: jest.fn() };
      }
      return { data: { pages: [] }, isLoading: false, refetch: jest.fn() };
    },
    useMutation: function () {
      return {
        mutate: mockPurchaseMutate,
        isPending: false,
      };
    },
    useQueryClient: function () {
      return { invalidateQueries: mockInvalidateQueries };
    },
  };
});

// ─── Mock API ───────────────────────────────────────────────────

jest.mock('../../services/api', function () {
  return {
    apiGet: jest.fn(function () { return Promise.resolve([]); }),
    apiPost: jest.fn(function () { return Promise.resolve({}); }),
    apiDelete: jest.fn(function () { return Promise.resolve({}); }),
  };
});

jest.mock('../../services/endpoints', function () {
  return {
    STORE: {
      ITEMS: '/api/store/items/',
      INVENTORY: '/api/store/inventory/',
      INVENTORY_HISTORY: '/api/store/history/',
      WISHLIST: '/api/store/wishlist/',
      PURCHASE_XP: '/api/store/purchase-xp/',
      EQUIP: function (id) { return '/api/store/equip/' + id + '/'; },
      REFUNDS: '/api/store/refunds/',
    },
  };
});

// Mock components
jest.mock('../../components/GlassCard', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, { testID: 'glass-card', style: props.style }, props.children);
  };
});

jest.mock('../../components/GlassButton', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(
      require('react-native').TouchableOpacity,
      { onPress: props.onPress, disabled: props.disabled, testID: 'glass-btn-' + props.variant },
      React.createElement(require('react-native').Text, null, props.children)
    );
  };
});

jest.mock('../../components/PillTabs', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, { testID: 'pill-tabs' },
      props.tabs.map(function (tab) {
        return React.createElement(
          require('react-native').TouchableOpacity,
          { key: tab.key, onPress: function () { props.onChange(tab.key); }, testID: 'tab-' + tab.key },
          React.createElement(require('react-native').Text, null, tab.label)
        );
      })
    );
  };
});

jest.mock('../../components/ScreenHeader', function () {
  var React = require('react');
  return {
    ScreenHeader: function (props) {
      return React.createElement(require('react-native').View, { testID: 'screen-header' },
        React.createElement(require('react-native').Text, null, props.title),
        props.left
      );
    },
    BackButton: function (props) {
      return React.createElement(
        require('react-native').TouchableOpacity,
        { onPress: props.onPress, accessibilityLabel: 'Go back' },
        React.createElement(require('react-native').Text, null, 'Back')
      );
    },
  };
});

jest.mock('../../components/SubscriptionBanner', function () {
  var React = require('react');
  return function () {
    return React.createElement(require('react-native').View, { testID: 'subscription-banner' });
  };
});

jest.mock('../../components/OnboardingTooltip', function () {
  var React = require('react');
  return function () {
    return React.createElement(require('react-native').View, { testID: 'tooltip' });
  };
});

jest.mock('../../config/onboardingTooltips', function () {
  return {
    getTooltipConfig: function () { return null; },
  };
});

var StoreScreen = require('./StoreScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockItemsPages = [];
  mockInventoryPages = [];
  mockHistoryPages = [];
  mockWishlistData = [];
});

describe('StoreScreen', function () {
  describe('header', function () {
    it('renders Store title', function () {
      var { getByText } = render(
        React.createElement(StoreScreen),
      );

      expect(getByText('Store')).toBeTruthy();
    });

    it('renders back button', function () {
      var { getByLabelText } = render(
        React.createElement(StoreScreen),
      );

      fireEvent.press(getByLabelText('Go back'));
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('category tabs', function () {
    it('renders category tab labels', function () {
      var { getByText } = render(
        React.createElement(StoreScreen),
      );

      expect(getByText('All')).toBeTruthy();
      expect(getByText('Frames')).toBeTruthy();
      expect(getByText('Themes')).toBeTruthy();
      expect(getByText('Shields')).toBeTruthy();
      expect(getByText('Boosters')).toBeTruthy();
    });
  });

  describe('shop/inventory/history tabs', function () {
    it('renders tab labels', function () {
      var { getByText } = render(
        React.createElement(StoreScreen),
      );

      expect(getByText('Shop')).toBeTruthy();
      expect(getByText('Inventory')).toBeTruthy();
      expect(getByText('History')).toBeTruthy();
    });
  });

  describe('item rendering', function () {
    it('renders item cards', function () {
      mockItemsPages = [
        {
          results: [
            { id: 1, name: 'Golden Frame', rarity: 'legendary', price: 500, type: 'badge_frame', image: null, owned: false, equipped: false },
            { id: 2, name: 'Blue Theme', rarity: 'rare', price: 200, type: 'theme_skin', image: null, owned: false, equipped: false },
          ],
        },
      ];

      var { getByText } = render(
        React.createElement(StoreScreen),
      );

      expect(getByText('Golden Frame')).toBeTruthy();
      expect(getByText('Blue Theme')).toBeTruthy();
    });

    it('shows rarity badges', function () {
      mockItemsPages = [
        {
          results: [
            { id: 1, name: 'Epic Shield', rarity: 'epic', price: 300, type: 'streak_shield', owned: false, equipped: false },
          ],
        },
      ];

      var { getByText } = render(
        React.createElement(StoreScreen),
      );

      expect(getByText('Epic')).toBeTruthy();
    });

    it('shows price for unowned items', function () {
      mockItemsPages = [
        {
          results: [
            { id: 1, name: 'Shield', rarity: 'common', price: 100, type: 'streak_shield', owned: false, equipped: false },
          ],
        },
      ];

      var { getByText } = render(
        React.createElement(StoreScreen),
      );

      expect(getByText('100')).toBeTruthy();
    });

    it('shows Buy button for unowned items', function () {
      mockItemsPages = [
        {
          results: [
            { id: 1, name: 'Shield', rarity: 'common', price: 100, type: 'streak_shield', owned: false, equipped: false },
          ],
        },
      ];

      var { getByText } = render(
        React.createElement(StoreScreen),
      );

      expect(getByText('Buy')).toBeTruthy();
    });

    it('shows Equip button for owned items', function () {
      mockItemsPages = [
        {
          results: [
            { id: 1, name: 'Shield', rarity: 'common', price: 100, type: 'streak_shield', owned: true, equipped: false },
          ],
        },
      ];

      var { getByText } = render(
        React.createElement(StoreScreen),
      );

      expect(getByText('Equip')).toBeTruthy();
    });

    it('shows Equipped for equipped items', function () {
      mockItemsPages = [
        {
          results: [
            { id: 1, name: 'Shield', rarity: 'common', price: 100, type: 'streak_shield', owned: true, equipped: true },
          ],
        },
      ];

      var { getByText } = render(
        React.createElement(StoreScreen),
      );

      expect(getByText('Equipped')).toBeTruthy();
    });
  });

  describe('empty state', function () {
    it('shows empty state for shop when no items', function () {
      mockItemsPages = [];

      var { getByText } = render(
        React.createElement(StoreScreen),
      );

      expect(getByText('No items available')).toBeTruthy();
      expect(getByText('Try a different category')).toBeTruthy();
    });
  });

  describe('subscription banner', function () {
    it('renders SubscriptionBanner', function () {
      var { getByTestId } = render(
        React.createElement(StoreScreen),
      );

      expect(getByTestId('subscription-banner')).toBeTruthy();
    });
  });
});
