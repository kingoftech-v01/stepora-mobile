/**
 * Tests for src/screens/profile/SettingsScreen/SettingsScreen.js
 * Covers sections (Account, Preferences, Subscription, About, Danger Zone),
 * toggles, modals, navigation, sign out, and delete account.
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Mock the hook ──────────────────────────────────────────────

var mockHookReturn = {
  navigation: {
    goBack: jest.fn(),
    navigate: jest.fn(),
  },
  user: {
    displayName: 'Test User',
    email: 'test@example.com',
    subscription: 'premium',
  },
  locale: 'en',
  setLocale: jest.fn(),
  langLabel: 'English',
  tz: 'UTC',
  setTz: jest.fn(),
  tzLabel: 'UTC',
  tzSearch: '',
  setTzSearch: jest.fn(),
  filteredTimezones: [
    { value: 'UTC', label: 'UTC', offset: '+00:00' },
    { value: 'America/New_York', label: 'New York', offset: '-05:00' },
  ],
  notifs: { push: true, email: false, buddy: true },
  handleToggleNotif: jest.fn(),
  dndEnabled: false,
  handleToggleDnd: jest.fn(),
  dndStart: '22:00',
  dndEnd: '07:00',
  setDndStart: jest.fn(),
  setDndEnd: jest.fn(),
  showLang: false,
  setShowLang: jest.fn(),
  showTz: false,
  setShowTz: jest.fn(),
  showEmailChange: false,
  setShowEmailChange: jest.fn(),
  newEmail: '',
  setNewEmail: jest.fn(),
  emailPassword: '',
  setEmailPassword: jest.fn(),
  emailTotpCode: '',
  setEmailTotpCode: jest.fn(),
  is2faEnabled: false,
  savingEmail: false,
  handleChangeEmail: jest.fn(),
  showDelete: false,
  setShowDelete: jest.fn(),
  deleteText: '',
  setDeleteText: jest.fn(),
  deletePassword: '',
  setDeletePassword: jest.fn(),
  deletingAccount: false,
  handleDeleteAccount: jest.fn(),
  handleSignOut: jest.fn(),
  LANGUAGES: [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'French' },
  ],
};

jest.mock('./useSettingsScreen', function () {
  return function () {
    return mockHookReturn;
  };
});

var SettingsScreen = require('./SettingsScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.dndEnabled = false;
  mockHookReturn.showLang = false;
  mockHookReturn.showTz = false;
  mockHookReturn.showEmailChange = false;
  mockHookReturn.showDelete = false;
});

describe('SettingsScreen', function () {
  describe('header', function () {
    it('renders Settings title', function () {
      var { getByText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByText('Settings')).toBeTruthy();
    });

    it('navigates back on back press', function () {
      var { getByLabelText } = render(
        React.createElement(SettingsScreen),
      );

      fireEvent.press(getByLabelText('Go back'));
      expect(mockHookReturn.navigation.goBack).toHaveBeenCalled();
    });
  });

  describe('account section', function () {
    it('renders account section header', function () {
      var { getByText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByText('Account')).toBeTruthy();
    });

    it('renders account tiles', function () {
      var { getByText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByText('Edit Profile')).toBeTruthy();
      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Change Password')).toBeTruthy();
      expect(getByText('Two-Factor Auth')).toBeTruthy();
      expect(getByText('Blocked Users')).toBeTruthy();
      expect(getByText('Data Export')).toBeTruthy();
    });

    it('navigates to EditProfile on press', function () {
      var { getByLabelText } = render(
        React.createElement(SettingsScreen),
      );

      fireEvent.press(getByLabelText('Edit Profile, Test User'));
      expect(mockHookReturn.navigation.navigate).toHaveBeenCalledWith('EditProfile');
    });
  });

  describe('preferences section', function () {
    it('renders preferences section header', function () {
      var { getByText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByText('Preferences')).toBeTruthy();
    });

    it('renders language tile with current label', function () {
      var { getByText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByText('Language')).toBeTruthy();
      expect(getByText('English')).toBeTruthy();
    });

    it('renders notification toggles', function () {
      var { getByLabelText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByLabelText('Push Notifications')).toBeTruthy();
      expect(getByLabelText('Email Notifications')).toBeTruthy();
      expect(getByLabelText('Buddy Reminders')).toBeTruthy();
    });

    it('renders DND toggle', function () {
      var { getByLabelText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByLabelText('Do Not Disturb')).toBeTruthy();
    });
  });

  describe('subscription section', function () {
    it('renders subscription section', function () {
      var { getByText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByText('Subscription')).toBeTruthy();
      expect(getByText('Manage Subscription')).toBeTruthy();
      expect(getByText('Store')).toBeTruthy();
    });

    it('shows subscription tier', function () {
      var { getByText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByText('Premium')).toBeTruthy();
    });
  });

  describe('about section', function () {
    it('renders about section items', function () {
      var { getByText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByText('About')).toBeTruthy();
      expect(getByText('App Version')).toBeTruthy();
      expect(getByText('Terms of Service')).toBeTruthy();
      expect(getByText('Privacy Policy')).toBeTruthy();
    });
  });

  describe('danger zone', function () {
    it('renders sign out button', function () {
      var { getByLabelText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByLabelText('Sign Out')).toBeTruthy();
    });

    it('calls handleSignOut on sign out press', function () {
      var { getByLabelText } = render(
        React.createElement(SettingsScreen),
      );

      fireEvent.press(getByLabelText('Sign Out'));
      expect(mockHookReturn.handleSignOut).toHaveBeenCalled();
    });

    it('renders delete account button', function () {
      var { getByLabelText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByLabelText('Delete Account')).toBeTruthy();
    });
  });

  describe('language modal', function () {
    it('renders language picker when showLang is true', function () {
      mockHookReturn.showLang = true;

      var { getByText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByText('Choose Language')).toBeTruthy();
      expect(getByText('English')).toBeTruthy();
      expect(getByText('French')).toBeTruthy();
    });
  });

  describe('timezone modal', function () {
    it('renders timezone picker when showTz is true', function () {
      mockHookReturn.showTz = true;

      var { getByText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByText('Choose Timezone')).toBeTruthy();
    });
  });

  describe('delete account modal', function () {
    it('renders delete confirmation when showDelete is true', function () {
      mockHookReturn.showDelete = true;

      var { getByText } = render(
        React.createElement(SettingsScreen),
      );

      expect(getByText('Delete Account')).toBeTruthy();
      expect(getByText('This cannot be undone')).toBeTruthy();
    });
  });
});
