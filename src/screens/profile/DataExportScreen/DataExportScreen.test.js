var React = require('react');
var { render } = require('@testing-library/react-native');
jest.mock('./useDataExportScreen', function () {
  return function () { return {
    navigation: { goBack: jest.fn() }, t: function (k) { return k; }, mounted: true,
    selectedFormat: 'json', setSelectedFormat: jest.fn(), isExporting: false,
    exportProgress: 0, exportDone: false, handleExport: jest.fn(), exports: [], exportsQuery: { isLoading: false },
    EXPORT_FORMATS: [{ key: 'json', label: 'JSON' }, { key: 'csv', label: 'CSV' }],
    DATA_CATEGORIES: [{ key: 'dreams', label: 'Dreams', icon: 'star' }],
  }; };
});
jest.mock('../../../styles/colors', function () { return { BRAND: { bgDeep: '#000', purple: '#8B5CF6' } }; });
jest.mock('../../../styles/theme', function () { return { dark: { text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc', glassBg: '#111', glassBorder: '#222' } }; });
var Screen = require('./DataExportScreen');
describe('DataExportScreen', function () {
  it('renders without crash', function () { var { getByText } = render(React.createElement(Screen)); expect(getByText('Data Export')).toBeTruthy(); });
  it('has back button', function () { var { getByLabelText } = render(React.createElement(Screen)); expect(getByLabelText('Go back')).toBeTruthy(); });
});
