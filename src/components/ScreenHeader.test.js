/**
 * Tests for src/components/ScreenHeader.js
 */
var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');
var { Text } = require('react-native');

// The BackButton component does: Icon = require('react-native-vector-icons/Feather')
// then uses Icon directly as a component. The jest.setup mock returns { default: fn },
// so we need to override to return a plain component function for this test file.
jest.mock('react-native-vector-icons/Feather', function () {
  var _React = require('react');
  var MockIcon = function (props) {
    return _React.createElement('Text', { testID: 'icon-' + props.name }, props.name);
  };
  // Make the module itself callable as a component (for direct require usage)
  // and also have .default for import default usage
  MockIcon.default = MockIcon;
  return MockIcon;
});

var { ScreenHeader, BackButton, HeaderIconButton } = require('./ScreenHeader');

describe('ScreenHeader', function () {
  it('renders without crashing', function () {
    var { getByText } = render(React.createElement(ScreenHeader, { title: 'Test' }));
    expect(getByText('Test')).toBeTruthy();
  });

  it('renders title with header role', function () {
    var { getByRole } = render(React.createElement(ScreenHeader, { title: 'My Screen' }));
    expect(getByRole('header')).toBeTruthy();
  });

  it('renders empty title when none provided', function () {
    var { getByRole } = render(React.createElement(ScreenHeader));
    expect(getByRole('header')).toBeTruthy();
  });

  it('renders left slot content', function () {
    var { getByText } = render(React.createElement(ScreenHeader, {
      title: 'Title',
      left: React.createElement(Text, null, 'Left'),
    }));
    expect(getByText('Left')).toBeTruthy();
  });

  it('renders right slot content', function () {
    var { getByText } = render(React.createElement(ScreenHeader, {
      title: 'Title',
      right: React.createElement(Text, null, 'Right'),
    }));
    expect(getByText('Right')).toBeTruthy();
  });
});

describe('BackButton', function () {
  it('renders with Go back label', function () {
    var { getByLabelText } = render(React.createElement(BackButton, { onPress: jest.fn() }));
    expect(getByLabelText('Go back')).toBeTruthy();
  });

  it('calls onPress when pressed', function () {
    var onPress = jest.fn();
    var { getByLabelText } = render(React.createElement(BackButton, { onPress: onPress }));
    fireEvent.press(getByLabelText('Go back'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('HeaderIconButton', function () {
  it('renders with custom label', function () {
    var { getByLabelText } = render(React.createElement(HeaderIconButton, {
      onPress: jest.fn(),
      label: 'Settings',
    },
      React.createElement(Text, null, 'gear'),
    ));
    expect(getByLabelText('Settings')).toBeTruthy();
  });

  it('calls onPress when pressed', function () {
    var onPress = jest.fn();
    var { getByLabelText } = render(React.createElement(HeaderIconButton, {
      onPress: onPress,
      label: 'Action',
    },
      React.createElement(Text, null, 'icon'),
    ));
    fireEvent.press(getByLabelText('Action'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders children', function () {
    var { getByText } = render(React.createElement(HeaderIconButton, {
      onPress: jest.fn(),
      label: 'Btn',
    },
      React.createElement(Text, null, 'child content'),
    ));
    expect(getByText('child content')).toBeTruthy();
  });
});
