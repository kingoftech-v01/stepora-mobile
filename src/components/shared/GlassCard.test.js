/**
 * Tests for src/components/shared/GlassCard.js
 */
var React = require('react');
var { render } = require('@testing-library/react-native');
var { Text } = require('react-native');
var GlassCard = require('./GlassCard');

describe('shared/GlassCard', function () {
  it('renders without crashing', function () {
    var { getByText } = render(React.createElement(GlassCard, null,
      React.createElement(Text, null, 'Card content'),
    ));
    expect(getByText('Card content')).toBeTruthy();
  });

  it('renders children', function () {
    var { getByText } = render(React.createElement(GlassCard, null,
      React.createElement(Text, null, 'Child A'),
      React.createElement(Text, null, 'Child B'),
    ));
    expect(getByText('Child A')).toBeTruthy();
    expect(getByText('Child B')).toBeTruthy();
  });

  it('accepts accessibility props', function () {
    var { getByLabelText } = render(React.createElement(GlassCard, {
      accessible: true,
      accessibilityLabel: 'Test card',
    },
      React.createElement(Text, null, 'Content'),
    ));
    expect(getByLabelText('Test card')).toBeTruthy();
  });

  it('accepts custom padding prop', function () {
    var { toJSON } = render(React.createElement(GlassCard, { padding: 32 },
      React.createElement(Text, null, 'Padded'),
    ));
    expect(toJSON()).toBeTruthy();
  });

  it('accepts custom mb prop', function () {
    var { toJSON } = render(React.createElement(GlassCard, { mb: 24 },
      React.createElement(Text, null, 'Spaced'),
    ));
    expect(toJSON()).toBeTruthy();
  });
});
