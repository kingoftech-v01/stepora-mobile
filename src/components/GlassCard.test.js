/**
 * Tests for src/components/GlassCard.js
 */
var React = require('react');
var { render } = require('@testing-library/react-native');
var { Text } = require('react-native');
var GlassCard = require('./GlassCard');

describe('GlassCard', function () {
  it('renders without crashing', function () {
    var { getByText } = render(React.createElement(GlassCard, null,
      React.createElement(Text, null, 'Hello'),
    ));
    expect(getByText('Hello')).toBeTruthy();
  });

  it('renders children', function () {
    var { getByText } = render(React.createElement(GlassCard, null,
      React.createElement(Text, null, 'First'),
      React.createElement(Text, null, 'Second'),
    ));
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('accepts accessibility props', function () {
    var { getByLabelText } = render(React.createElement(GlassCard, {
      accessible: true,
      accessibilityLabel: 'My card',
    },
      React.createElement(Text, null, 'Content'),
    ));
    expect(getByLabelText('My card')).toBeTruthy();
  });

  it('accepts custom padding', function () {
    var { toJSON } = render(React.createElement(GlassCard, { padding: 0 },
      React.createElement(Text, null, 'No pad'),
    ));
    expect(toJSON()).toBeTruthy();
  });

  it('accepts custom mb', function () {
    var { toJSON } = render(React.createElement(GlassCard, { mb: 20 },
      React.createElement(Text, null, 'Margin'),
    ));
    expect(toJSON()).toBeTruthy();
  });

  it('accepts custom style with borderRadius', function () {
    var { toJSON } = render(React.createElement(GlassCard, {
      style: { borderRadius: 30 },
    },
      React.createElement(Text, null, 'Rounded'),
    ));
    expect(toJSON()).toBeTruthy();
  });
});
