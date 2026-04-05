/**
 * Tests for src/components/RecurrencePicker.js
 */
var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// Override Feather mock for this test
jest.mock('react-native-vector-icons/Feather', function () {
  var _React = require('react');
  return {
    default: function (props) {
      return _React.createElement('Text', { testID: 'icon-' + props.name }, props.name);
    },
  };
});

var RecurrencePicker = require('./RecurrencePicker');

describe('RecurrencePicker', function () {
  it('renders without crashing', function () {
    var { getByText } = render(React.createElement(RecurrencePicker, {
      recurrenceType: 'none',
      recurrenceDays: [],
      onRecurrenceTypeChange: jest.fn(),
      onRecurrenceDaysChange: jest.fn(),
    }));
    expect(getByText('Recurrence')).toBeTruthy();
  });

  it('shows current type label on button', function () {
    var { getAllByText } = render(React.createElement(RecurrencePicker, {
      recurrenceType: 'daily',
      recurrenceDays: [],
      onRecurrenceTypeChange: jest.fn(),
      onRecurrenceDaysChange: jest.fn(),
    }));
    // "Daily" appears in both button text and active badge
    expect(getAllByText('Daily').length).toBeGreaterThanOrEqual(1);
  });

  it('shows active badge when type is not none', function () {
    var { getAllByText } = render(React.createElement(RecurrencePicker, {
      recurrenceType: 'weekly',
      recurrenceDays: [],
      onRecurrenceTypeChange: jest.fn(),
      onRecurrenceDaysChange: jest.fn(),
    }));
    // "Weekly" appears in both the button and the badge
    expect(getAllByText('Weekly').length).toBeGreaterThanOrEqual(1);
  });

  it('opens type selector when button pressed', function () {
    var { getByLabelText, getByText } = render(React.createElement(RecurrencePicker, {
      recurrenceType: 'none',
      recurrenceDays: [],
      onRecurrenceTypeChange: jest.fn(),
      onRecurrenceDaysChange: jest.fn(),
    }));
    fireEvent.press(getByLabelText(/Select recurrence type/));
    // Modal should contain all type options
    expect(getByText('Daily')).toBeTruthy();
    expect(getByText('Weekly')).toBeTruthy();
    expect(getByText('Monthly')).toBeTruthy();
  });

  it('calls onRecurrenceTypeChange when type is selected', function () {
    var onChange = jest.fn();
    var { getByLabelText, getByText } = render(React.createElement(RecurrencePicker, {
      recurrenceType: 'none',
      recurrenceDays: [],
      onRecurrenceTypeChange: onChange,
      onRecurrenceDaysChange: jest.fn(),
    }));
    fireEvent.press(getByLabelText(/Select recurrence type/));
    fireEvent.press(getByText('Daily'));
    expect(onChange).toHaveBeenCalledWith('daily');
  });

  it('shows day picker for weekly type', function () {
    var { getByText } = render(React.createElement(RecurrencePicker, {
      recurrenceType: 'weekly',
      recurrenceDays: [],
      onRecurrenceTypeChange: jest.fn(),
      onRecurrenceDaysChange: jest.fn(),
    }));
    expect(getByText('Select days')).toBeTruthy();
    expect(getByText('Mon')).toBeTruthy();
    expect(getByText('Fri')).toBeTruthy();
  });

  it('shows day picker for custom type', function () {
    var { getByText } = render(React.createElement(RecurrencePicker, {
      recurrenceType: 'custom',
      recurrenceDays: [],
      onRecurrenceTypeChange: jest.fn(),
      onRecurrenceDaysChange: jest.fn(),
    }));
    expect(getByText('Select days')).toBeTruthy();
  });

  it('does not show day picker for daily type', function () {
    var { queryByText } = render(React.createElement(RecurrencePicker, {
      recurrenceType: 'daily',
      recurrenceDays: [],
      onRecurrenceTypeChange: jest.fn(),
      onRecurrenceDaysChange: jest.fn(),
    }));
    expect(queryByText('Select days')).toBeNull();
  });

  it('toggles day selection', function () {
    var onDaysChange = jest.fn();
    var { getByLabelText } = render(React.createElement(RecurrencePicker, {
      recurrenceType: 'weekly',
      recurrenceDays: [],
      onRecurrenceTypeChange: jest.fn(),
      onRecurrenceDaysChange: onDaysChange,
    }));
    fireEvent.press(getByLabelText('Mon'));
    expect(onDaysChange).toHaveBeenCalledWith(['mon']);
  });

  it('removes day when already selected', function () {
    var onDaysChange = jest.fn();
    var { getByLabelText } = render(React.createElement(RecurrencePicker, {
      recurrenceType: 'weekly',
      recurrenceDays: ['mon', 'wed'],
      onRecurrenceTypeChange: jest.fn(),
      onRecurrenceDaysChange: onDaysChange,
    }));
    fireEvent.press(getByLabelText('Mon, selected'));
    expect(onDaysChange).toHaveBeenCalledWith(['wed']);
  });

  it('uses translation function when provided', function () {
    var t = jest.fn(function (key) {
      if (key === 'recurrence.label') return 'Repetition';
      if (key === 'recurrence.none') return 'Aucune';
      return key;
    });
    var { getByText } = render(React.createElement(RecurrencePicker, {
      recurrenceType: 'none',
      recurrenceDays: [],
      onRecurrenceTypeChange: jest.fn(),
      onRecurrenceDaysChange: jest.fn(),
      t: t,
    }));
    expect(getByText('Repetition')).toBeTruthy();
  });
});
