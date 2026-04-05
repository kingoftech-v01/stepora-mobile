var React = require('react');
var { render } = require('@testing-library/react-native');
jest.mock('./useEditProfileScreen', function () {
  return function () { return {
    navigation: { goBack: jest.fn() }, t: function (k) { return k; }, mounted: true,
    name: 'Test', setName: jest.fn(), bio: '', setBio: jest.fn(), timezone: 'UTC', setTimezone: jest.fn(),
    avatarPreview: null, showPicker: false, setShowPicker: jest.fn(), errors: {}, userEmail: 'test@test.com',
    userInitial: 'T', userAvatarUrl: null, saving: false, hasChanges: false,
    handleSave: jest.fn(), handleTakePhoto: jest.fn(), handleChooseGallery: jest.fn(), handleRemovePhoto: jest.fn(),
    adaptColor: function () { return '#8B5CF6'; }, BRAND: { purple: '#8B5CF6' }, GRADIENTS: {},
  }; };
});
jest.mock('../../../styles/colors', function () { return { BRAND: { bgDeep: '#000', purple: '#8B5CF6', redSolid: '#EF4444', greenSolid: '#10B981' } }; });
jest.mock('../../../styles/theme', function () { return { dark: { text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc', glassBg: '#111', glassBorder: '#222', surface: '#333', inputBorder: '#444' } }; });
var Screen = require('./EditProfileScreen');
describe('EditProfileScreen', function () {
  it('renders without crash', function () { var { getByText } = render(React.createElement(Screen)); expect(getByText('Edit Profile')).toBeTruthy(); });
  it('has back button', function () { var { getByLabelText } = render(React.createElement(Screen)); expect(getByLabelText('Go back')).toBeTruthy(); });
});
