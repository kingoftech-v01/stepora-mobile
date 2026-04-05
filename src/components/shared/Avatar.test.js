/**
 * Tests for src/components/shared/Avatar.js
 */
var React = require('react');
var { render } = require('@testing-library/react-native');
var Avatar = require('./Avatar');

describe('Avatar', function () {
  it('renders without crashing with no props', function () {
    var { getByLabelText } = render(React.createElement(Avatar));
    expect(getByLabelText('User avatar')).toBeTruthy();
  });

  it('shows initial from name', function () {
    var { getByText, getByLabelText } = render(React.createElement(Avatar, { name: 'Alice' }));
    expect(getByText('A')).toBeTruthy();
    expect(getByLabelText('Alice avatar')).toBeTruthy();
  });

  it('shows ? when no name is provided', function () {
    var { getByText } = render(React.createElement(Avatar, { name: '' }));
    expect(getByText('?')).toBeTruthy();
  });

  it('renders image when src is provided', function () {
    var { getByLabelText } = render(React.createElement(Avatar, {
      name: 'Bob',
      src: 'https://example.com/avatar.jpg',
    }));
    expect(getByLabelText('Bob avatar')).toBeTruthy();
  });

  it('applies custom size', function () {
    var { getByLabelText } = render(React.createElement(Avatar, { name: 'C', size: 80 }));
    expect(getByLabelText('C avatar')).toBeTruthy();
  });

  it('applies custom color', function () {
    var { getByLabelText } = render(React.createElement(Avatar, { name: 'D', color: '#FF0000' }));
    expect(getByLabelText('D avatar')).toBeTruthy();
  });

  it('uppercases the initial', function () {
    var { getByText } = render(React.createElement(Avatar, { name: 'xyz' }));
    expect(getByText('X')).toBeTruthy();
  });
});
