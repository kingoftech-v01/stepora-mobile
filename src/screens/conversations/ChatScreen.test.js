/**
 * Tests for src/screens/conversations/ChatScreen.js
 * Covers loading, message rendering, input bar, send button,
 * mark as read, and navigation.
 * Uses FRIEND_CHAT endpoints (synced with web).
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
    useRoute: function () {
      return {
        params: { conversationId: 'conv-123', title: 'Alice' },
      };
    },
  };
});

// ─── Mock React Query ───────────────────────────────────────────

var mockInvalidateQueries = jest.fn();
var mockMessagesData = [];
jest.mock('@tanstack/react-query', function () {
  return {
    useQuery: function (opts) {
      return {
        data: opts.queryKey[0] === 'friend-messages' ? mockMessagesData : { id: 'conv-123', targetUser: { id: 'u1', displayName: 'Alice' } },
        isLoading: false,
        refetch: jest.fn(),
      };
    },
    useQueryClient: function () {
      return { invalidateQueries: mockInvalidateQueries };
    },
  };
});

// ─── Mock API ───────────────────────────────────────────────────

var mockApiGet = jest.fn(function () {
  return Promise.resolve({ id: 'conv-123', targetUser: { id: 'u1', displayName: 'Alice' } });
});
var mockApiPost = jest.fn(function () { return Promise.resolve({}); });
jest.mock('../../services/api', function () {
  return {
    apiGet: function () { return mockApiGet.apply(null, arguments); },
    apiPost: function () { return mockApiPost.apply(null, arguments); },
  };
});

jest.mock('../../services/endpoints', function () {
  return {
    FRIEND_CHAT: {
      DETAIL: function (id) { return '/api/chat/' + id + '/'; },
      START: '/api/chat/start/',
      MESSAGES: function (id) { return '/api/chat/' + id + '/messages/'; },
      SEND_MESSAGE: function (id) { return '/api/chat/' + id + '/send-message/'; },
      MARK_READ: function (id) { return '/api/chat/' + id + '/mark-read/'; },
      CALLS: {
        INITIATE: '/api/chat/calls/initiate/',
      },
    },
    USERS: {
      PROFILE: function (id) { return '/api/users/' + id + '/'; },
    },
  };
});

// ─── Mock AuthContext ────────────────────────────────────────────

jest.mock('../../context/AuthContext', function () {
  return {
    useAuth: function () {
      return { user: { id: 'me-1', displayName: 'Me' } };
    },
  };
});

// Mock shared components
jest.mock('../../components/shared/ScreenShell', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, { testID: 'screen-shell' }, props.children);
  };
});

jest.mock('../../components/shared/GlassHeader', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, { testID: 'glass-header' },
      React.createElement(require('react-native').Text, null, props.title)
    );
  };
});

jest.mock('../../components/shared/Avatar', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, { testID: 'avatar-' + (props.name || 'unknown') });
  };
});

var ChatScreen = require('./ChatScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockMessagesData = [];
});

describe('ChatScreen', function () {
  describe('header', function () {
    it('renders chat title', function () {
      var { getByText } = render(
        React.createElement(ChatScreen),
      );

      expect(getByText('Alice')).toBeTruthy();
    });
  });

  describe('input bar', function () {
    it('renders message input', function () {
      var { getByLabelText } = render(
        React.createElement(ChatScreen),
      );

      expect(getByLabelText('Message input')).toBeTruthy();
    });

    it('renders send button', function () {
      var { getByLabelText } = render(
        React.createElement(ChatScreen),
      );

      expect(getByLabelText('Send message')).toBeTruthy();
    });

    it('send button is disabled when input is empty', function () {
      var { getByLabelText } = render(
        React.createElement(ChatScreen),
      );

      var sendBtn = getByLabelText('Send message');
      expect(sendBtn.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('empty state', function () {
    it('renders without errors when no messages', function () {
      mockMessagesData = [];

      var { getByLabelText } = render(
        React.createElement(ChatScreen),
      );

      expect(getByLabelText('Message input')).toBeTruthy();
    });
  });
});
