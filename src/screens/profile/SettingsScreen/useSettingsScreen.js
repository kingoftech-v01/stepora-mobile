/**
 * useSettingsScreen -- business logic for Settings (React Native).
 * Adapted from the web app's useSettingsScreen.js.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;
var { apiGet, apiPut, apiPost, apiDelete, clearAuth } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');
var { isValidEmail, sanitizeText } = require('../../../utils/sanitize');
var { BRAND, adaptColor } = require('../../../styles/colors');

var LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'es', label: 'Espa\u00f1ol' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Portugu\u00eas' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
  { code: 'ja', label: '\u65e5\u672c\u8a9e' },
  { code: 'ko', label: '\ud55c\uad6d\uc5b4' },
  { code: 'zh', label: '\u4e2d\u6587' },
  { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
  { code: 'hi', label: '\u0939\u093f\u0928\u094d\u0926\u0940' },
  { code: 'tr', label: 'T\u00fcrk\u00e7e' },
  { code: 'pl', label: 'Polski' },
  { code: 'ht', label: 'Krey\u00f2l Ayisyen' },
];

var TIMEZONES = [
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)', offset: '-10:00' },
  { value: 'America/Anchorage', label: 'Alaska (AKST)', offset: '-09:00' },
  { value: 'America/Los_Angeles', label: 'Pacific (PST)', offset: '-08:00' },
  { value: 'America/Denver', label: 'Mountain (MST)', offset: '-07:00' },
  { value: 'America/Chicago', label: 'Central (CST)', offset: '-06:00' },
  { value: 'America/New_York', label: 'Eastern (EST)', offset: '-05:00' },
  { value: 'America/Toronto', label: 'Toronto (EST)', offset: '-05:00' },
  { value: 'America/Halifax', label: 'Atlantic (AST)', offset: '-04:00' },
  { value: 'America/Sao_Paulo', label: 'S\u00e3o Paulo (BRT)', offset: '-03:00' },
  { value: 'Atlantic/Reykjavik', label: 'Iceland (GMT)', offset: '+00:00' },
  { value: 'Europe/London', label: 'London (GMT)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Paris (CET)', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: '+01:00' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET)', offset: '+02:00' },
  { value: 'Africa/Cairo', label: 'Cairo (EET)', offset: '+02:00' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: '+03:00' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+04:00' },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: '+05:30' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', offset: '+07:00' },
  { value: 'Asia/Shanghai', label: 'China (CST)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)', offset: '+10:00' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)', offset: '+12:00' },
];

function useSettingsScreen() {
  var navigation = useNavigation();
  var t = function (key) { return key; };

  // Placeholder user - in production, would come from AuthContext
  var user = { displayName: 'User', email: 'user@stepora.app', subscription: 'free', timezone: 'America/Toronto' };

  var [mounted, setMounted] = useState(false);
  var [locale, setLocale] = useState('en');
  var [notifs, setNotifs] = useState({ push: true, email: true, buddy: true, streak: true });
  var [dndEnabled, setDndEnabled] = useState(false);
  var [dndStart, setDndStart] = useState('22:00');
  var [dndEnd, setDndEnd] = useState('07:00');
  var [tz, setTz] = useState((user && user.timezone) || 'America/Toronto');
  var [showLang, setShowLang] = useState(false);
  var [showTz, setShowTz] = useState(false);
  var [tzSearch, setTzSearch] = useState('');
  var [showDelete, setShowDelete] = useState(false);
  var [deleteText, setDeleteText] = useState('');
  var [deletePassword, setDeletePassword] = useState('');
  var [showEmailChange, setShowEmailChange] = useState(false);
  var [newEmail, setNewEmail] = useState('');
  var [emailPassword, setEmailPassword] = useState('');
  var [emailTotpCode, setEmailTotpCode] = useState('');
  var [is2faEnabled, setIs2faEnabled] = useState(false);
  var [savingNotifs, setSavingNotifs] = useState(false);
  var [savingEmail, setSavingEmail] = useState(false);
  var [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(function () {
    setTimeout(function () { setMounted(true); }, 100);

    // Load saved locale
    AsyncStorage.getItem('dp-locale').then(function (val) {
      if (val) setLocale(val);
    }).catch(function () {});

    // Load saved timezone
    AsyncStorage.getItem('dp-timezone').then(function (val) {
      if (val) setTz(val);
    }).catch(function () {});

    // Fetch notification preferences
    apiGet(USERS.NOTIFICATION_PREFS).then(function (data) {
      if (data) {
        setNotifs({
          push: data.pushEnabled != null ? !!data.pushEnabled : true,
          email: data.emailEnabled != null ? !!data.emailEnabled : true,
          buddy: data.buddyReminders != null ? !!data.buddyReminders : true,
          streak: data.streakReminders != null ? !!data.streakReminders : true,
        });
        if (data.dndEnabled != null) setDndEnabled(!!data.dndEnabled);
        if (data.dndStart) setDndStart(data.dndStart);
        if (data.dndEnd) setDndEnd(data.dndEnd);
      }
    }).catch(function () {});

    // Check 2FA status
    apiGet(USERS.TFA.STATUS).then(function (data) {
      if (data && data.twoFactorEnabled) setIs2faEnabled(true);
    }).catch(function () {});
  }, []);

  var langMatch = LANGUAGES.find(function (l) { return l.code === locale; });
  var langLabel = (langMatch && langMatch.label) || 'English';

  var tzMatch = TIMEZONES.find(function (item) { return item.value === tz; });
  var tzLabel = (tzMatch && tzMatch.label) || tz;

  var filteredTimezones = TIMEZONES.filter(function (tzItem) {
    if (!tzSearch) return true;
    var s = tzSearch.toLowerCase();
    return tzItem.label.toLowerCase().indexOf(s) !== -1 || tzItem.value.toLowerCase().indexOf(s) !== -1;
  });

  var handleSetLocale = function (code) {
    setLocale(code);
    AsyncStorage.setItem('dp-locale', code).catch(function () {});
    setShowLang(false);
  };

  var handleSetTz = function (value) {
    setTz(value);
    AsyncStorage.setItem('dp-timezone', value).catch(function () {});
    apiPut(USERS.UPDATE_PROFILE, { timezone: value }).catch(function () {});
    setShowTz(false);
    setTzSearch('');
  };

  var handleToggleNotif = function (key) {
    var next = Object.assign({}, notifs);
    next[key] = !next[key];
    setNotifs(next);
    setSavingNotifs(true);
    apiPut(USERS.NOTIFICATION_PREFS, {
      pushEnabled: next.push,
      emailEnabled: next.email,
      buddyReminders: next.buddy,
      streakReminders: next.streak,
    }).then(function () {
      setSavingNotifs(false);
    }).catch(function () {
      setSavingNotifs(false);
    });
  };

  var handleToggleDnd = function () {
    var next = !dndEnabled;
    setDndEnabled(next);
    apiPut(USERS.NOTIFICATION_PREFS, {
      pushEnabled: notifs.push,
      emailEnabled: notifs.email,
      buddyReminders: notifs.buddy,
      streakReminders: notifs.streak,
      dndEnabled: next,
      dndStart: dndStart,
      dndEnd: dndEnd,
    }).catch(function () {});
  };

  var handleSignOut = function () {
    clearAuth().then(function () {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }).catch(function () {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    });
  };

  var handleChangeEmail = function () {
    if (!newEmail || !isValidEmail(newEmail)) return;
    if (!emailPassword) return;
    if (is2faEnabled && !emailTotpCode) return;

    var body = { newEmail: sanitizeText(newEmail, 254), password: emailPassword };
    if (is2faEnabled && emailTotpCode) body.totpCode = emailTotpCode;

    setSavingEmail(true);
    apiPost(USERS.CHANGE_EMAIL, body)
      .then(function () {
        setSavingEmail(false);
        setShowEmailChange(false);
        setNewEmail('');
        setEmailPassword('');
        setEmailTotpCode('');
      })
      .catch(function () {
        setSavingEmail(false);
      });
  };

  var handleDeleteAccount = function () {
    if (deleteText !== 'DELETE') return;
    if (!deletePassword) return;

    setDeletingAccount(true);
    apiDelete(USERS.DELETE_ACCOUNT, { body: { password: deletePassword, confirmation: deleteText } })
      .then(function () {
        setDeletingAccount(false);
        setShowDelete(false);
        clearAuth().then(function () {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        });
      })
      .catch(function () {
        setDeletingAccount(false);
      });
  };

  return {
    navigation: navigation,
    t: t,
    user: user,
    mounted: mounted,
    locale: locale,
    setLocale: handleSetLocale,
    notifs: notifs,
    dndEnabled: dndEnabled,
    dndStart: dndStart,
    setDndStart: setDndStart,
    dndEnd: dndEnd,
    setDndEnd: setDndEnd,
    tz: tz,
    setTz: handleSetTz,
    showLang: showLang,
    setShowLang: setShowLang,
    showTz: showTz,
    setShowTz: setShowTz,
    tzSearch: tzSearch,
    setTzSearch: setTzSearch,
    filteredTimezones: filteredTimezones,
    showDelete: showDelete,
    setShowDelete: setShowDelete,
    deleteText: deleteText,
    setDeleteText: setDeleteText,
    deletePassword: deletePassword,
    setDeletePassword: setDeletePassword,
    showEmailChange: showEmailChange,
    setShowEmailChange: setShowEmailChange,
    newEmail: newEmail,
    setNewEmail: setNewEmail,
    emailPassword: emailPassword,
    setEmailPassword: setEmailPassword,
    emailTotpCode: emailTotpCode,
    setEmailTotpCode: setEmailTotpCode,
    is2faEnabled: is2faEnabled,
    savingNotifs: savingNotifs,
    savingEmail: savingEmail,
    deletingAccount: deletingAccount,
    langLabel: langLabel,
    tzLabel: tzLabel,
    handleSignOut: handleSignOut,
    handleToggleNotif: handleToggleNotif,
    handleToggleDnd: handleToggleDnd,
    handleDeleteAccount: handleDeleteAccount,
    handleChangeEmail: handleChangeEmail,
    adaptColor: adaptColor,
    BRAND: BRAND,
    LANGUAGES: LANGUAGES,
    TIMEZONES: TIMEZONES,
  };
}

module.exports = useSettingsScreen;
