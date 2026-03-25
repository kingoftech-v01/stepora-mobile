/**
 * Tests for src/screens/conversations/ChatScreen.js
 * Covers loading, message rendering, input bar, send button,
 * WebSocket integration, mark as read, and navigation.
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
    useQuery: function () {
      return {
        data: mockMessagesData,
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

var mockApiPost = jest.fn(function () { return Promise.resolve({}); });
jest.mock('../../services/api', function () {
  return {
    apiGet: jest.fn(function () { return Promise.resolve([]); }),
    apiPost: function () { return mockApiPost.apply(null, arguments); },
    getAccessToken: function () { return 'test-token'; },
  };
});

jest.mock('../../services/endpoints', function () {
  return {
    CONVERSATIONS: {
      MESSAGES: function (id) { return '/api/conversations/' + id + '/messages/'; },
      SEND_MESSAGE: function (id) { return '/api/conversations/' + id + '/send/'; },
      MARK_READ: function (id) { return '/api/conversations/' + id + '/read/'; },
    },
    WS: {
      AI_CHAT: function (id) { return '/ws/conversations/' + id + '/'; },
    },
  };
});

// ─── Mock chat socket ───────────────────────────────────────────

var mockSendMessage = jest.fn(function () { return false; });
jest.mock('../../hooks/useChatSocket', function () {
  return function () {
    return {
      connected: true,
      sendMessage: mockSendMessage,
    };
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
      props.titleComponent || React.createElement(require('react-native').Text, null, props.title)
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
  mockSendMessage.mockReturnValue(false);
});

describe('ChatScreen', function () {
  describe('header', function () {
    it('renders chat title', function () {
      var { getByText } = render(
        React.createElement(ChatScreen),
      );

      expect(getByText('Alice')).toBeTruthy();
    });

    it('shows Online status when connected', function () {
      var { getByText } = render(
        React.createElement(ChatScreen),
      );

      expect(getByText('Online')).toBeTruthy();
    });
  });

  describe('mark as read', function () {
    it('calls mark read API on mount', function () {
      render(React.createElement(ChatScreen));

      expect(mockApiPost).toHaveBeenCalledWith('/api/conversations/conv-123/read/');
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

    it('renders attach button', function () {
      var { getByLabelText } = render(
        React.createElement(ChatScreen),
      );

      expect(getByLabelText('Attach file')).toBeTruthy();
    });

    it('send button is disabled when input is empty', function () {
      var { getByLabelText } = render(
        React.createElement(ChatScreen),
      );

      var sendBtn = getByLabelText('Send message');
      expect(sendBtn.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('message rendering', function () {
    it('renders user messages', function () {
      mockMessagesData = [
        { id: 1, content: 'Hello there!', isUser: true, createdAt: '2026-03-15T10:00:00Z' },
      ];

      var { getByText } = render(
        React.createElement(ChatScreen),
      );

      expect(getByText('Hello there!')).toBeTruthy();
    });

    it('renders other user messages', function () {
      mockMessagesData = [
        { id: 2, content: 'Hi! How are you?', isUser: false, createdAt: '2026-03-15T10:01:00Z' },
      ];

      var { getByText } = render(
        React.createElement(ChatScreen),
      );

      expect(getByText('Hi! How are you?')).toBeTruthy();
    });

    it('renders multiple messages', function () {
      mockMessagesData = [
        { id: 1, content: 'First message', isUser: true, createdAt: '2026-03-15T10:00:00Z' },
        { id: 2, content: 'Second message', isUser: false, createdAt: '2026-03-15T10:01:00Z' },
        { id: 3, content: 'Third message', isUser: true, createdAt: '2026-03-15T10:02:00Z' },
      ];

      var { getByText } = render(
        React.createElement(ChatScreen),
      );

      expect(getByText('First message')).toBeTruthy();
      expect(getByText('Second message')).toBeTruthy();
      expect(getByText('Third message')).toBeTruthy();
    });
  });

  describe('message timestamps', function () {
    it('displays formatted time', function () {
      mockMessagesData = [
        { id: 1, content: 'Hello', isUser: true, createdAt: '2026-03-15T14:30:00Z' },
      ];

      var { getByText } = render(
        React.createElement(ChatScreen),
      );

      // Time format is HH:MM
      expect(getByText('14:30')).toBeTruthy();
    });
  });

  describe('empty state', function () {
    it('renders without errors when no messages', function () {
      mockMessagesData = [];

      var { getByLabelText } = render(
        React.createElement(ChatScreen),
      );

      // Input should still be available
      expect(getByLabelText('Message input')).toBeTruthy();
    });
  });
});
