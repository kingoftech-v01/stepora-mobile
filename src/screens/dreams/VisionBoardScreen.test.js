/**
 * Tests for src/screens/dreams/VisionBoardScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { goBack: jest.fn() },
  dreams: [],
  selectedDreamId: 'all',
  setSelectedDreamId: jest.fn(),
  visionImages: [],
  dreamsQuery: { isLoading: false, isError: false },
  visionQuery: { isLoading: false, isError: false },
  addImageMut: { isPending: false },
  deleteImageMut: { isPending: false },
  addingImage: false,
  setAddingImage: jest.fn(),
  handleAddImage: jest.fn(),
  handleTakePhoto: jest.fn(),
  handleDeleteImage: jest.fn(),
  confirmAddToDream: jest.fn(),
  catSolid: function () { return '#8B5CF6'; },
};

jest.mock('./useVisionBoardScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../components/SubscriptionGate', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, null, props.children);
  };
});

jest.mock('../../components/OnboardingTooltip', function () {
  var React = require('react');
  return function () { return React.createElement(require('react-native').View, { testID: 'tooltip' }); };
});

jest.mock('../../config/onboardingTooltips', function () {
  return { getTooltipConfig: function () { return null; } };
});

jest.mock('../../theme/tokens', function () {
  return {
    COLORS: {
      bodyBg: '#0F0A1E', glassBg: '#111', glassBorder: '#222', text: '#fff',
      textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6',
    },
    SPACING: { sm: 8, md: 12, lg: 16, xl: 20 },
    RADIUS: { md: 14, lg: 16 },
  };
});

jest.mock('../../styles/colors', function () {
  return { BRAND: { purple: '#8B5CF6' } };
});

var VisionBoardScreen = require('./VisionBoardScreen');

describe('VisionBoardScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(VisionBoardScreen));
    expect(getByText('Vision Board')).toBeTruthy();
  });

  it('renders back button', function () {
    var { getByLabelText } = render(React.createElement(VisionBoardScreen));
    expect(getByLabelText('Go back')).toBeTruthy();
  });
});
