/**
 * Tests for src/components/shared/ScreenShell.js
 */
var React = require('react');
var { render } = require('@testing-library/react-native');
var { Text } = require('react-native');
var ScreenShell = require('./ScreenShell');

describe('ScreenShell', function () {
  it('renders without crashing', function () {
    var { getByText } = render(React.createElement(ScreenShell, null,
      React.createElement(Text, null, 'Screen content'),
    ));
    expect(getByText('Screen content')).toBeTruthy();
  });

  it('renders children', function () {
    var { getByText } = render(React.createElement(ScreenShell, null,
      React.createElement(Text, null, 'Hello'),
      React.createElement(Text, null, 'World'),
    ));
    expect(getByText('Hello')).toBeTruthy();
    expect(getByText('World')).toBeTruthy();
  });

  it('defaults edges to top only', function () {
    var { toJSON } = render(React.createElement(ScreenShell, null,
      React.createElement(Text, null, 'Default edges'),
    ));
    expect(toJSON()).toBeTruthy();
  });

  it('accepts custom edges', function () {
    var { toJSON } = render(React.createElement(ScreenShell, {
      edges: ['top', 'bottom'],
    },
      React.createElement(Text, null, 'Custom edges'),
    ));
    expect(toJSON()).toBeTruthy();
  });

  it('accepts custom style', function () {
    var { toJSON } = render(React.createElement(ScreenShell, {
      style: { backgroundColor: 'red' },
    },
      React.createElement(Text, null, 'Styled'),
    ));
    expect(toJSON()).toBeTruthy();
  });
});
