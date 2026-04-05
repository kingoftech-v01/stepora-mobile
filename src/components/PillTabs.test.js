/**
 * Tests for src/components/PillTabs.js
 */
var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');
var PillTabs = require('./PillTabs');

var SAMPLE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

describe('PillTabs', function () {
  it('renders without crashing', function () {
    var { getByText } = render(React.createElement(PillTabs, {
      tabs: SAMPLE_TABS,
      active: 'all',
      onChange: jest.fn(),
    }));
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Active')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
  });

  it('calls onChange when a tab is pressed', function () {
    var onChange = jest.fn();
    var { getByText } = render(React.createElement(PillTabs, {
      tabs: SAMPLE_TABS,
      active: 'all',
      onChange: onChange,
    }));
    fireEvent.press(getByText('Active'));
    expect(onChange).toHaveBeenCalledWith('active');
  });

  it('marks the active tab as selected via accessibilityState', function () {
    var { getByLabelText } = render(React.createElement(PillTabs, {
      tabs: SAMPLE_TABS,
      active: 'active',
      onChange: jest.fn(),
    }));
    var activeTab = getByLabelText('Active');
    expect(activeTab.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );
  });

  it('renders badge count when provided', function () {
    var tabsWithCount = [
      { key: 'inbox', label: 'Inbox', count: 5 },
      { key: 'sent', label: 'Sent', count: 0 },
    ];
    var { getByText } = render(React.createElement(PillTabs, {
      tabs: tabsWithCount,
      active: 'inbox',
      onChange: jest.fn(),
    }));
    expect(getByText('5')).toBeTruthy();
  });

  it('shows 99+ for large counts', function () {
    var tabsWithLargeCount = [
      { key: 'inbox', label: 'Inbox', count: 150 },
    ];
    var { getByText } = render(React.createElement(PillTabs, {
      tabs: tabsWithLargeCount,
      active: 'inbox',
      onChange: jest.fn(),
    }));
    expect(getByText('99+')).toBeTruthy();
  });

  it('renders with scrollable false (wrapped mode)', function () {
    var { toJSON } = render(React.createElement(PillTabs, {
      tabs: SAMPLE_TABS,
      active: 'all',
      onChange: jest.fn(),
      scrollable: false,
    }));
    expect(toJSON()).toBeTruthy();
  });

  it('renders empty tabs array', function () {
    var { toJSON } = render(React.createElement(PillTabs, {
      tabs: [],
      active: null,
      onChange: jest.fn(),
    }));
    expect(toJSON()).toBeTruthy();
  });
});
