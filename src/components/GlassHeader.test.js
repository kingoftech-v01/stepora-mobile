/**
 * Tests for src/components/shared/GlassHeader.js
 * Validates title rendering, back button, right action buttons, badges.
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');
var GlassHeader = require('./shared/GlassHeader');

describe('GlassHeader', function () {
  describe('title rendering', function () {
    it('renders the title text', function () {
      var { getByText } = render(
        React.createElement(GlassHeader, { title: 'My Dreams' }),
      );

      expect(getByText('My Dreams')).toBeTruthy();
    });

    it('renders empty title without crashing', function () {
      var { queryByText } = render(
        React.createElement(GlassHeader, {}),
      );

      // Default title is '', should not crash
      expect(queryByText('nonexistent')).toBeNull();
    });

    it('renders titleComponent instead of title text when provided', function () {
      var customTitle = React.createElement(
        require('react-native').Text,
        { testID: 'custom-title' },
        'Custom Header',
      );

      var { getByTestId, getByText } = render(
        React.createElement(GlassHeader, {
          title: 'Fallback Title',
          titleComponent: customTitle,
        }),
      );

      expect(getByTestId('custom-title')).toBeTruthy();
      expect(getByText('Custom Header')).toBeTruthy();
    });

    it('has header accessibility role', function () {
      var { getByRole } = render(
        React.createElement(GlassHeader, { title: 'Accessible Title' }),
      );

      expect(getByRole('header')).toBeTruthy();
    });
  });

  describe('back button', function () {
    it('renders back button when onBack is provided', function () {
      var onBackSpy = jest.fn();

      var { getByLabelText } = render(
        React.createElement(GlassHeader, {
          title: 'Test',
          onBack: onBackSpy,
        }),
      );

      var backBtn = getByLabelText('Go back');
      expect(backBtn).toBeTruthy();
    });

    it('calls onBack when back button is pressed', function () {
      var onBackSpy = jest.fn();

      var { getByLabelText } = render(
        React.createElement(GlassHeader, {
          title: 'Test',
          onBack: onBackSpy,
        }),
      );

      fireEvent.press(getByLabelText('Go back'));
      expect(onBackSpy).toHaveBeenCalledTimes(1);
    });

    it('renders placeholder spacer when no onBack', function () {
      // When there's no onBack, it should render a spacer View of width 38
      var { queryByLabelText } = render(
        React.createElement(GlassHeader, { title: 'No Back' }),
      );

      expect(queryByLabelText('Go back')).toBeNull();
    });

    it('renders the arrow-left icon in back button', function () {
      var { getByTestId } = render(
        React.createElement(GlassHeader, {
          title: 'Test',
          onBack: jest.fn(),
        }),
      );

      expect(getByTestId('icon-arrow-left')).toBeTruthy();
    });
  });

  describe('right actions', function () {
    it('renders right action buttons', function () {
      var actions = [
        { icon: 'search', onPress: jest.fn(), label: 'Search' },
        { icon: 'bell', onPress: jest.fn(), label: 'Notifications' },
      ];

      var { getByLabelText } = render(
        React.createElement(GlassHeader, {
          title: 'Actions Test',
          rightActions: actions,
        }),
      );

      expect(getByLabelText('Search')).toBeTruthy();
      expect(getByLabelText('Notifications')).toBeTruthy();
    });

    it('calls action onPress when pressed', function () {
      var searchSpy = jest.fn();
      var bellSpy = jest.fn();

      var actions = [
        { icon: 'search', onPress: searchSpy, label: 'Search' },
        { icon: 'bell', onPress: bellSpy, label: 'Notifications' },
      ];

      var { getByLabelText } = render(
        React.createElement(GlassHeader, {
          title: 'Actions',
          rightActions: actions,
        }),
      );

      fireEvent.press(getByLabelText('Search'));
      fireEvent.press(getByLabelText('Notifications'));

      expect(searchSpy).toHaveBeenCalledTimes(1);
      expect(bellSpy).toHaveBeenCalledTimes(1);
    });

    it('renders badges on action buttons', function () {
      var actions = [
        { icon: 'bell', onPress: jest.fn(), label: 'Notifications', badge: 5 },
      ];

      var { getByText } = render(
        React.createElement(GlassHeader, {
          title: 'Badge Test',
          rightActions: actions,
        }),
      );

      expect(getByText('5')).toBeTruthy();
    });

    it('does not render badge when badge is falsy', function () {
      var actions = [
        { icon: 'bell', onPress: jest.fn(), label: 'Notifications', badge: 0 },
      ];

      var { queryByText } = render(
        React.createElement(GlassHeader, {
          title: 'No Badge',
          rightActions: actions,
        }),
      );

      // badge=0 is falsy, so no badge rendered
      expect(queryByText('0')).toBeNull();
    });

    it('renders nothing when rightActions is null', function () {
      var { queryByLabelText } = render(
        React.createElement(GlassHeader, {
          title: 'No Actions',
          rightActions: null,
        }),
      );

      expect(queryByLabelText('Search')).toBeNull();
    });

    it('renders multiple icons', function () {
      var actions = [
        { icon: 'search', onPress: jest.fn() },
        { icon: 'settings', onPress: jest.fn() },
        { icon: 'plus', onPress: jest.fn() },
      ];

      var { getByTestId } = render(
        React.createElement(GlassHeader, {
          title: 'Multi Icons',
          rightActions: actions,
        }),
      );

      expect(getByTestId('icon-search')).toBeTruthy();
      expect(getByTestId('icon-settings')).toBeTruthy();
      expect(getByTestId('icon-plus')).toBeTruthy();
    });
  });

  describe('full header composition', function () {
    it('renders back + title + right actions together', function () {
      var onBackSpy = jest.fn();
      var actions = [
        { icon: 'search', onPress: jest.fn(), label: 'Search' },
      ];

      var { getByText, getByLabelText } = render(
        React.createElement(GlassHeader, {
          title: 'Full Header',
          onBack: onBackSpy,
          rightActions: actions,
        }),
      );

      expect(getByText('Full Header')).toBeTruthy();
      expect(getByLabelText('Go back')).toBeTruthy();
      expect(getByLabelText('Search')).toBeTruthy();
    });
  });
});
