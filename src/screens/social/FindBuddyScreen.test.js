/**
 * Tests for src/screens/social/FindBuddyScreen.js
 * Covers loading, error, info card, current buddy, suggestions,
 * empty state, encourage flow, and navigation.
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Mock the hook ──────────────────────────────────────────────

var mockHookReturn = {
  navigation: {
    goBack: jest.fn(),
    navigate: jest.fn(),
  },
  isLoading: false,
  isError: false,
  hasBuddy: false,
  buddy: null,
  CURRENT_BUDDY: null,
  suggestions: [],
  sent: {},
  error: null,
  encourage: false,
  setEncourage: jest.fn(),
  encourageMsg: '',
  setEncourageMsg: jest.fn(),
  sentEncourage: false,
  sendEncourageMsg: jest.fn(),
  sendRequest: jest.fn(),
  refresh: jest.fn(),
  ENCOURAGE_PRESETS: [
    'You got this!',
    'Keep going!',
    'Proud of you!',
  ],
};

jest.mock('./useFindBuddyScreen', function () {
  return function () {
    return mockHookReturn;
  };
});

var FindBuddyScreen = require('./FindBuddyScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.isLoading = false;
  mockHookReturn.isError = false;
  mockHookReturn.hasBuddy = false;
  mockHookReturn.buddy = null;
  mockHookReturn.CURRENT_BUDDY = null;
  mockHookReturn.suggestions = [];
  mockHookReturn.sent = {};
  mockHookReturn.error = null;
  mockHookReturn.encourage = false;
  mockHookReturn.sentEncourage = false;
});

describe('FindBuddyScreen', function () {
  describe('header', function () {
    it('renders Dream Buddy title', function () {
      var { getByText } = render(
        React.createElement(FindBuddyScreen),
      );

      expect(getByText('Dream Buddy')).toBeTruthy();
    });

    it('navigates back on back press', function () {
      var { getAllByProps } = render(
        React.createElement(FindBuddyScreen),
      );

      // Press the first touchable (back button)
      fireEvent.press(getAllByProps({ activeOpacity: 0.7 })[0]);
      expect(mockHookReturn.navigation.goBack).toHaveBeenCalled();
    });
  });

  describe('loading state', function () {
    it('shows loading indicator', function () {
      mockHookReturn.isLoading = true;

      var { UNSAFE_getByType } = render(
        React.createElement(FindBuddyScreen),
      );

      var ActivityIndicator = require('react-native').ActivityIndicator;
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe('error state', function () {
    it('shows error message', function () {
      mockHookReturn.isError = true;

      var { getByText } = render(
        React.createElement(FindBuddyScreen),
      );

      expect(getByText('Failed to load buddy data')).toBeTruthy();
    });

    it('shows retry button', function () {
      mockHookReturn.isError = true;

      var { getByText } = render(
        React.createElement(FindBuddyScreen),
      );

      expect(getByText('Retry')).toBeTruthy();
    });
  });

  describe('info card', function () {
    it('renders what is a dream buddy info', function () {
      var { getByText } = render(
        React.createElement(FindBuddyScreen),
      );

      expect(getByText('What is a Dream Buddy?')).toBeTruthy();
    });
  });

  describe('current buddy', function () {
    it('renders current buddy when present', function () {
      mockHookReturn.hasBuddy = true;
      mockHookReturn.buddy = {
        id: 42,
        name: 'Alice Smith',
        initial: 'A',
        level: 8,
        streak: 12,
        compatibility: 85,
        avatar: null,
      };
      mockHookReturn.CURRENT_BUDDY = { id: 42 };

      var { getByText } = render(
        React.createElement(FindBuddyScreen),
      );

      expect(getByText('Your Buddy')).toBeTruthy();
      expect(getByText('Alice Smith')).toBeTruthy();
      expect(getByText('85% match')).toBeTruthy();
      expect(getByText('Level 8')).toBeTruthy();
      expect(getByText('12 streak')).toBeTruthy();
    });

    it('renders action buttons for current buddy', function () {
      mockHookReturn.hasBuddy = true;
      mockHookReturn.buddy = {
        id: 42,
        name: 'Alice',
        initial: 'A',
        level: 5,
        streak: 3,
        compatibility: 90,
      };
      mockHookReturn.CURRENT_BUDDY = { id: 42 };

      var { getByText } = render(
        React.createElement(FindBuddyScreen),
      );

      expect(getByText('Chat')).toBeTruthy();
      expect(getByText('Encourage')).toBeTruthy();
      expect(getByText('Profile')).toBeTruthy();
    });
  });

  describe('no buddy - suggestions', function () {
    it('shows empty state when no suggestions', function () {
      mockHookReturn.hasBuddy = false;
      mockHookReturn.suggestions = [];

      var { getByText } = render(
        React.createElement(FindBuddyScreen),
      );

      expect(getByText('No matches yet')).toBeTruthy();
      expect(getByText('Find Matches')).toBeTruthy();
    });

    it('renders suggestion cards', function () {
      mockHookReturn.hasBuddy = false;
      mockHookReturn.suggestions = [
        {
          id: 1,
          name: 'Bob Jones',
          initial: 'B',
          level: 5,
          streak: 3,
          compatibility: 78,
          bio: 'Love learning new things',
          sharedDreams: ['Guitar', 'Fitness'],
          color: '#14B8A6',
        },
      ];

      var { getByText } = render(
        React.createElement(FindBuddyScreen),
      );

      expect(getByText('Suggested Buddies')).toBeTruthy();
      expect(getByText('Bob Jones')).toBeTruthy();
      expect(getByText('78%')).toBeTruthy();
      expect(getByText('Love learning new things')).toBeTruthy();
    });

    it('renders send request button', function () {
      mockHookReturn.hasBuddy = false;
      mockHookReturn.suggestions = [
        {
          id: 1,
          name: 'Bob',
          initial: 'B',
          level: 5,
          streak: 0,
          compatibility: 0,
          sharedDreams: [],
          color: '#14B8A6',
        },
      ];

      var { getByText } = render(
        React.createElement(FindBuddyScreen),
      );

      expect(getByText('Send Request')).toBeTruthy();
    });
  });

  describe('error banner', function () {
    it('shows error banner when error is present', function () {
      mockHookReturn.error = 'Something went wrong';

      var { getByText } = render(
        React.createElement(FindBuddyScreen),
      );

      expect(getByText('Something went wrong')).toBeTruthy();
    });
  });

  describe('encourage flow', function () {
    it('shows encourage presets when encourage mode is active', function () {
      mockHookReturn.hasBuddy = true;
      mockHookReturn.buddy = {
        id: 42,
        name: 'Alice',
        initial: 'A',
        level: 5,
        streak: 3,
        compatibility: 90,
      };
      mockHookReturn.CURRENT_BUDDY = { id: 42 };
      mockHookReturn.encourage = true;

      var { getByText } = render(
        React.createElement(FindBuddyScreen),
      );

      expect(getByText('Send encouragement')).toBeTruthy();
      expect(getByText('You got this!')).toBeTruthy();
      expect(getByText('Keep going!')).toBeTruthy();
      expect(getByText('Proud of you!')).toBeTruthy();
    });
  });
});
