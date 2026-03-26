/**
 * Tests for src/screens/social/CommunityScreen.js
 * Covers loading, empty state, stories bar, quick nav pills,
 * post rendering, event cards, like/comment, FAB, and navigation.
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Mock external dependencies ─────────────────────────────────

var mockNavigate = jest.fn();
var mockGoBack = jest.fn();
jest.mock('@react-navigation/native', function () {
  return {
    useNavigation: function () {
      return { navigate: mockNavigate, goBack: mockGoBack };
    },
  };
});

var mockInvalidateQueries = jest.fn();
jest.mock('@tanstack/react-query', function () {
  return {
    useQuery: function (opts) {
      if (opts.queryKey[0] === 'stories-feed') return { data: [], isLoading: false };
      if (opts.queryKey[0] === 'social-events-feed') return { data: [], isLoading: false };
      if (opts.queryKey[0] === 'friend-requests-count') return { data: [], isLoading: false };
      return { data: null, isLoading: false };
    },
    useQueryClient: function () {
      return { invalidateQueries: mockInvalidateQueries, cancelQueries: jest.fn(), getQueryData: jest.fn(), setQueryData: jest.fn() };
    },
    useMutation: function (opts) {
      return { mutate: jest.fn(), isLoading: false };
    },
  };
});

var mockPostsFeed = {
  items: [],
  isLoading: false,
  hasNextPage: false,
  fetchNextPage: jest.fn(),
};
jest.mock('../../hooks/useInfiniteList', function () {
  return function () {
    return mockPostsFeed;
  };
});

jest.mock('../../services/api', function () {
  return {
    apiGet: jest.fn(function () { return Promise.resolve([]); }),
    apiPost: jest.fn(function () { return Promise.resolve({}); }),
  };
});

jest.mock('../../services/endpoints', function () {
  return {
    SOCIAL: {
      STORIES: { FEED: '/api/social/stories/feed/' },
      EVENTS: { FEED: '/api/social/events/feed/' },
      POSTS: {
        FEED: '/api/social/posts/feed/',
        LIKE: function (id) { return '/api/social/posts/' + id + '/like/'; },
      },
      FRIENDS: { PENDING: '/api/social/friends/pending/' },
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

jest.mock('../../components/shared/GlassCard', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, { testID: 'glass-card', style: props.style }, props.children);
  };
});

jest.mock('../../components/shared/Avatar', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, { testID: 'avatar-' + (props.name || 'unknown') });
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

var CommunityScreen = require('./CommunityScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockPostsFeed.items = [];
  mockPostsFeed.isLoading = false;
});

describe('CommunityScreen', function () {
  describe('header', function () {
    it('renders Community title', function () {
      var { getByText } = render(
        React.createElement(CommunityScreen),
      );

      expect(getByText('Community')).toBeTruthy();
    });
  });

  describe('loading state', function () {
    it('shows loading indicator when posts are loading', function () {
      mockPostsFeed.isLoading = true;

      var { UNSAFE_getByType } = render(
        React.createElement(CommunityScreen),
      );

      var ActivityIndicator = require('react-native').ActivityIndicator;
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe('empty state', function () {
    it('shows empty message when no posts', function () {
      mockPostsFeed.items = [];
      mockPostsFeed.isLoading = false;

      var { getByText } = render(
        React.createElement(CommunityScreen),
      );

      expect(getByText('No posts yet')).toBeTruthy();
      expect(getByText('Be the first to share something with the community!')).toBeTruthy();
    });
  });

  describe('stories bar', function () {
    it('renders You story button', function () {
      var { getByLabelText } = render(
        React.createElement(CommunityScreen),
      );

      expect(getByLabelText('Add your story')).toBeTruthy();
    });
  });

  describe('quick nav', function () {
    it('renders quick nav pills', function () {
      var { getByLabelText } = render(
        React.createElement(CommunityScreen),
      );

      expect(getByLabelText('Circles')).toBeTruthy();
      expect(getByLabelText('Leaderboard')).toBeTruthy();
      expect(getByLabelText('Find Buddy')).toBeTruthy();
      expect(getByLabelText('Search')).toBeTruthy();
      expect(getByLabelText('Friends')).toBeTruthy();
    });

    it('navigates on quick nav press', function () {
      var { getByLabelText } = render(
        React.createElement(CommunityScreen),
      );

      fireEvent.press(getByLabelText('Circles'));
      expect(mockNavigate).toHaveBeenCalledWith('Circles');
    });
  });

  describe('post rendering', function () {
    it('renders post content', function () {
      mockPostsFeed.items = [
        {
          id: 1,
          _type: 'post',
          content: 'Just completed my first milestone!',
          author: { id: 10, displayName: 'Jane Doe' },
          likesCount: 5,
          commentsCount: 2,
          isLiked: false,
          createdAt: new Date().toISOString(),
        },
      ];

      var { getByText } = render(
        React.createElement(CommunityScreen),
      );

      expect(getByText('Just completed my first milestone!')).toBeTruthy();
      expect(getByText('Jane Doe')).toBeTruthy();
    });

    it('shows like and comment counts', function () {
      mockPostsFeed.items = [
        {
          id: 1,
          content: 'Hello world',
          author: { id: 10, displayName: 'Alice' },
          likesCount: 12,
          commentsCount: 3,
          createdAt: new Date().toISOString(),
        },
      ];

      var { getByText } = render(
        React.createElement(CommunityScreen),
      );

      expect(getByText('12')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
    });
  });

  describe('FAB', function () {
    it('renders create post FAB', function () {
      var { getByLabelText } = render(
        React.createElement(CommunityScreen),
      );

      expect(getByLabelText('Create new post')).toBeTruthy();
    });
  });

  describe('navigation', function () {
    it('navigates to FindBuddy from quick nav', function () {
      var { getByLabelText } = render(
        React.createElement(CommunityScreen),
      );

      fireEvent.press(getByLabelText('Find Buddy'));
      expect(mockNavigate).toHaveBeenCalledWith('FindBuddy');
    });

    it('navigates to Leaderboard from quick nav', function () {
      var { getByLabelText } = render(
        React.createElement(CommunityScreen),
      );

      fireEvent.press(getByLabelText('Leaderboard'));
      expect(mockNavigate).toHaveBeenCalledWith('Leaderboard');
    });
  });
});
