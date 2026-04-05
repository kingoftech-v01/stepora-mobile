/**
 * Tests for src/components/CalendarHeatmap.js
 *
 * CalendarHeatmap uses conditional returns before hooks, so we mock
 * @tanstack/react-query to return data synchronously.
 */
var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Mock react-query directly ─────────────────────────────────
var mockQueryResult = {
  data: null,
  isLoading: true,
  isError: false,
};

jest.mock('@tanstack/react-query', function () {
  return {
    useQuery: jest.fn(function () { return mockQueryResult; }),
  };
});

jest.mock('../services/api', function () {
  return {
    apiGet: jest.fn(),
  };
});

jest.mock('../services/endpoints', function () {
  return {
    USERS: {
      STREAKS_CALENDAR: '/api/users/streaks/calendar/',
    },
  };
});

// Override Feather mock
jest.mock('react-native-vector-icons/Feather', function () {
  var _React = require('react');
  return {
    default: function (props) {
      return _React.createElement('Text', { testID: 'icon-' + props.name }, props.name);
    },
  };
});

var CalendarHeatmap = require('./CalendarHeatmap');

// Build sample heatmap data
function buildSampleData(days) {
  var data = [];
  var now = new Date();
  for (var i = days - 1; i >= 0; i--) {
    var d = new Date(now);
    d.setDate(d.getDate() - i);
    var dateStr = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
    data.push({
      date: dateStr,
      count: i % 3,
      level: i % 4,
    });
  }
  return data;
}

var MOCK_HEATMAP = {
  heatmap: buildSampleData(30),
};

var MOCK_EMPTY_HEATMAP = {
  heatmap: [],
};

beforeEach(function () {
  mockQueryResult.isLoading = true;
  mockQueryResult.isError = false;
  mockQueryResult.data = null;
});

describe('CalendarHeatmap', function () {
  it('shows loading text while fetching', function () {
    mockQueryResult.isLoading = true;
    mockQueryResult.data = null;
    var { getByText } = render(React.createElement(CalendarHeatmap));
    expect(getByText('Loading activity...')).toBeTruthy();
  });

  it('renders Activity header after loading', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_HEATMAP;
    var { getByText } = render(React.createElement(CalendarHeatmap, { days: 30 }));
    expect(getByText('Activity')).toBeTruthy();
  });

  it('shows active day count summary', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_HEATMAP;
    var { getByText } = render(React.createElement(CalendarHeatmap, { days: 30 }));
    expect(getByText(/active day/)).toBeTruthy();
  });

  it('shows legend with Less and More labels', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_HEATMAP;
    var { getByText } = render(React.createElement(CalendarHeatmap, { days: 30 }));
    expect(getByText('Less')).toBeTruthy();
    expect(getByText('More')).toBeTruthy();
  });

  it('renders nothing on API error', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.isError = true;
    mockQueryResult.data = null;
    var { toJSON } = render(React.createElement(CalendarHeatmap));
    expect(toJSON()).toBeNull();
  });

  it('shows 0 active days for empty data', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_EMPTY_HEATMAP;
    var { getByText } = render(React.createElement(CalendarHeatmap, { days: 30 }));
    expect(getByText(/0 active days/)).toBeTruthy();
  });

  it('defaults to 365 days in subtitle', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_HEATMAP;
    var { getByText } = render(React.createElement(CalendarHeatmap));
    expect(getByText(/365 days/)).toBeTruthy();
  });

  it('calls onDayPress when a cell is tapped', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_HEATMAP;
    var onDayPress = jest.fn();
    var { getAllByLabelText } = render(React.createElement(CalendarHeatmap, {
      days: 30,
      onDayPress: onDayPress,
    }));
    var cells = getAllByLabelText(/activity level/);
    expect(cells.length).toBeGreaterThan(0);
    fireEvent.press(cells[0]);
    expect(onDayPress).toHaveBeenCalled();
  });

  it('renders day-of-week labels', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_HEATMAP;
    var { getAllByText } = render(React.createElement(CalendarHeatmap, { days: 30 }));
    // M, W, F are the non-empty day labels
    expect(getAllByText('M').length).toBeGreaterThan(0);
    expect(getAllByText('W').length).toBeGreaterThan(0);
    expect(getAllByText('F').length).toBeGreaterThan(0);
  });

  it('has header with accessibility role', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_HEATMAP;
    var { getByRole } = render(React.createElement(CalendarHeatmap, { days: 30 }));
    expect(getByRole('header')).toBeTruthy();
  });
});
