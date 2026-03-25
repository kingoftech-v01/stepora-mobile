/**
 * Tests for src/screens/notifications/NotificationsScreen.js
 * Covers loading, empty state, notification rendering, filter tabs,
 * date sections, mark all read, dismiss, and unread indicators.
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

var mockNotifsPages = [];
var mockMarkAllRead = jest.fn();
var mockMarkRead = jest.fn();
var mockInvalidateQueries = jest.fn();
var mockRefetch = jest.fn(function () { return Promise.resolve(); });

jest.mock('@tanstack/react-query', function () {
  return {
    useInfiniteQuery: function () {
      return {
        data: { pages: mockNotifsPages },
        isLoading: false,
        isFetchingNextPage: false,
        refetch: mockRefetch,
      };
    },
    useMutation: function (opts) {
      return {
        mutate: opts.mutationFn.toString().includes('MARK_ALL') ? mockMarkAllRead : mockMarkRead,
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
  };
});

jest.mock('../../services/endpoints', function () {
  return {
    NOTIFICATIONS: {
      LIST: '/api/notifications/',
      MARK_ALL_READ: '/api/notifications/mark-all-read/',
      MARK_READ: function (id) { return '/api/notifications/' + id + '/read/'; },
    },
  };
});

// Mock Toast context
jest.mock('../../context/ToastContext', function () {
  return {
    useToast: function () {
      return {
        showToast: jest.fn(),
        dismissToast: jest.fn(),
      };
    },
  };
});

// Fix FeatherIcon mock for require() without .default
jest.mock('react-native-vector-icons/Feather', function () {
  var React = require('react');
  var comp = function (props) {
    return React.createElement(require('react-native').Text, { testID: 'icon-' + props.name }, props.name);
  };
  comp.default = comp;
  return comp;
});

// Mock components
jest.mock('../../components/GlassCard', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, { testID: 'glass-card' }, props.children);
  };
});

jest.mock('../../components/PillTabs', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, { testID: 'pill-tabs' },
      props.tabs.map(function (tab) {
        return React.createElement(
          require('react-native').TouchableOpacity,
          {
            key: tab.key,
            onPress: function () { props.onChange(tab.key); },
            accessibilityLabel: tab.label,
          },
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
        props.left,
        props.right
      );
    },
    BackButton: function (props) {
      return React.createElement(
        require('react-native').TouchableOpacity,
        { onPress: props.onPress, accessibilityLabel: 'Go back' },
        React.createElement(require('react-native').Text, null, 'Back')
      );
    },
    HeaderIconButton: function (props) {
      return React.createElement(
        require('react-native').TouchableOpacity,
        { onPress: props.onPress, accessibilityLabel: props.label },
        props.children
      );
    },
  };
});

var NotificationsScreen = require('./NotificationsScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockNotifsPages = [];
});

describe('NotificationsScreen', function () {
  describe('header', function () {
    it('renders Notifications title', function () {
      var { getByText } = render(
        React.createElement(NotificationsScreen),
      );

      expect(getByText('Notifications')).toBeTruthy();
    });

    it('renders back button', function () {
      var { getByLabelText } = render(
        React.createElement(NotificationsScreen),
      );

      fireEvent.press(getByLabelText('Go back'));
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('filter tabs', function () {
    it('renders filter tab labels', function () {
      var { getByText } = render(
        React.createElement(NotificationsScreen),
      );

      expect(getByText('All')).toBeTruthy();
      expect(getByText('Dreams')).toBeTruthy();
      expect(getByText('Social')).toBeTruthy();
      expect(getByText('System')).toBeTruthy();
    });
  });

  describe('empty state', function () {
    it('shows empty message when no notifications', function () {
      mockNotifsPages = [];

      var { getByText } = render(
        React.createElement(NotificationsScreen),
      );

      expect(getByText('All caught up!')).toBeTruthy();
      expect(getByText('No new notifications')).toBeTruthy();
    });
  });

  describe('notification rendering', function () {
    it('renders notification cards', function () {
      var now = new Date().toISOString();
      mockNotifsPages = [
        {
          results: [
            {
              id: 1,
              title: 'Dream Progress',
              body: 'You completed 3 tasks!',
              notificationType: 'dream_progress',
              isRead: false,
              createdAt: now,
            },
            {
              id: 2,
              title: 'New Friend Request',
              body: 'Alice wants to be your friend',
              notificationType: 'friend_request',
              isRead: true,
              createdAt: now,
            },
          ],
        },
      ];

      var { getByText } = render(
        React.createElement(NotificationsScreen),
      );

      expect(getByText('Dream Progress')).toBeTruthy();
      expect(getByText('You completed 3 tasks!')).toBeTruthy();
      expect(getByText('New Friend Request')).toBeTruthy();
    });
  });

  describe('date sections', function () {
    it('groups notifications by date', function () {
      var now = new Date().toISOString();
      mockNotifsPages = [
        {
          results: [
            {
              id: 1,
              title: 'Today Notification',
              body: 'Something happened today',
              notificationType: 'system',
              isRead: false,
              createdAt: now,
            },
          ],
        },
      ];

      var { getByText } = render(
        React.createElement(NotificationsScreen),
      );

      expect(getByText('Today')).toBeTruthy();
    });
  });

  describe('mark all read', function () {
    it('shows mark all read button when unread exist', function () {
      var now = new Date().toISOString();
      mockNotifsPages = [
        {
          results: [
            {
              id: 1,
              title: 'Unread',
              body: 'test',
              notificationType: 'system',
              isRead: false,
              createdAt: now,
            },
          ],
        },
      ];

      var { getByLabelText } = render(
        React.createElement(NotificationsScreen),
      );

      expect(getByLabelText('Mark all read')).toBeTruthy();
    });

    it('calls markAllRead on button press', function () {
      var now = new Date().toISOString();
      mockNotifsPages = [
        {
          results: [
            {
              id: 1,
              title: 'Unread',
              body: 'test',
              notificationType: 'system',
              isRead: false,
              createdAt: now,
            },
          ],
        },
      ];

      var { getByLabelText } = render(
        React.createElement(NotificationsScreen),
      );

      fireEvent.press(getByLabelText('Mark all read'));
      expect(mockMarkAllRead).toHaveBeenCalled();
    });
  });

  describe('dismiss notification', function () {
    it('calls markRead when notification is tapped', function () {
      var now = new Date().toISOString();
      mockNotifsPages = [
        {
          results: [
            {
              id: 42,
              title: 'Tap me',
              body: 'Dismiss me',
              notificationType: 'system',
              isRead: false,
              createdAt: now,
            },
          ],
        },
      ];

      var { getByText } = render(
        React.createElement(NotificationsScreen),
      );

      fireEvent.press(getByText('Tap me'));
      expect(mockMarkRead).toHaveBeenCalledWith(42);
    });
  });
});
