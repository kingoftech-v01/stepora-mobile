/**
 * Tests for src/components/GlassButton.js
 */
var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');
var GlassButton = require('./GlassButton');

describe('GlassButton', function () {
  it('renders without crashing', function () {
    var { getByText } = render(React.createElement(GlassButton, { onPress: jest.fn() }, 'Click me'));
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', function () {
    var onPress = jest.fn();
    var { getByRole } = render(React.createElement(GlassButton, { onPress: onPress }, 'Press'));
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', function () {
    var onPress = jest.fn();
    var { getByRole } = render(React.createElement(GlassButton, { onPress: onPress, disabled: true }, 'Disabled'));
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', function () {
    var { getByLabelText } = render(React.createElement(GlassButton, { onPress: jest.fn(), loading: true }, 'Load'));
    expect(getByLabelText('Loading')).toBeTruthy();
  });

  it('does not call onPress when loading', function () {
    var onPress = jest.fn();
    var { getByRole } = render(React.createElement(GlassButton, { onPress: onPress, loading: true }, 'Load'));
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders with secondary variant', function () {
    var { getByText } = render(React.createElement(GlassButton, { variant: 'secondary', onPress: jest.fn() }, 'Secondary'));
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('renders with ghost variant', function () {
    var { getByText } = render(React.createElement(GlassButton, { variant: 'ghost', onPress: jest.fn() }, 'Ghost'));
    expect(getByText('Ghost')).toBeTruthy();
  });

  it('renders with success variant', function () {
    var { getByText } = render(React.createElement(GlassButton, { variant: 'success', onPress: jest.fn() }, 'Success'));
    expect(getByText('Success')).toBeTruthy();
  });

  it('renders with danger variant', function () {
    var { getByText } = render(React.createElement(GlassButton, { variant: 'danger', onPress: jest.fn() }, 'Danger'));
    expect(getByText('Danger')).toBeTruthy();
  });

  it('renders with sm size', function () {
    var { getByText } = render(React.createElement(GlassButton, { size: 'sm', onPress: jest.fn() }, 'Small'));
    expect(getByText('Small')).toBeTruthy();
  });

  it('renders with lg size', function () {
    var { getByText } = render(React.createElement(GlassButton, { size: 'lg', onPress: jest.fn() }, 'Large'));
    expect(getByText('Large')).toBeTruthy();
  });

  it('renders fullWidth', function () {
    var { toJSON } = render(React.createElement(GlassButton, {
      fullWidth: true,
      onPress: jest.fn(),
    }, 'Full'));
    expect(toJSON()).toBeTruthy();
  });

  it('applies custom accessibilityLabel', function () {
    var { getByLabelText } = render(React.createElement(GlassButton, {
      onPress: jest.fn(),
      accessibilityLabel: 'Custom label',
    }, 'Btn'));
    expect(getByLabelText('Custom label')).toBeTruthy();
  });
});
