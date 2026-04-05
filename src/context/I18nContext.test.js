/**
 * Tests for src/context/I18nContext.jsx
 * Covers provider rendering, translation lookup, parameter interpolation,
 * language switching, RTL detection, persistence, device language detection,
 * and useT guard.
 */

var React = require('react');
var { renderHook, act, waitFor } = require('@testing-library/react-native');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Mock i18n JSON files
jest.mock('../i18n/en.json', function () {
  return {
    'greeting': 'Hello',
    'greeting.name': 'Hello, {name}!',
    'items.count': '{count} items',
    'multi.param': '{a} and {b}',
    'only.en': 'English only',
  };
});
jest.mock('../i18n/fr.json', function () {
  return {
    'greeting': 'Bonjour',
    'greeting.name': 'Bonjour, {name} !',
    'items.count': '{count} articles',
  };
});
jest.mock('../i18n/es.json', function () { return { 'greeting': 'Hola' }; });
jest.mock('../i18n/de.json', function () { return { 'greeting': 'Hallo' }; });
jest.mock('../i18n/pt.json', function () { return { 'greeting': 'Ola' }; });
jest.mock('../i18n/it.json', function () { return { 'greeting': 'Ciao' }; });
jest.mock('../i18n/nl.json', function () { return { 'greeting': 'Hallo' }; });
jest.mock('../i18n/ru.json', function () { return { 'greeting': 'Privet' }; });
jest.mock('../i18n/ja.json', function () { return { 'greeting': 'Konnichiwa' }; });
jest.mock('../i18n/ko.json', function () { return { 'greeting': 'Annyeong' }; });
jest.mock('../i18n/zh.json', function () { return { 'greeting': 'Ni hao' }; });
jest.mock('../i18n/ar.json', function () { return { 'greeting': 'Marhaba' }; });
jest.mock('../i18n/hi.json', function () { return { 'greeting': 'Namaste' }; });
jest.mock('../i18n/tr.json', function () { return { 'greeting': 'Merhaba' }; });
jest.mock('../i18n/pl.json', function () { return { 'greeting': 'Czesc' }; });
jest.mock('../i18n/ht.json', function () { return { 'greeting': 'Bonjou' }; });

// Mock react-native-localize to avoid native module issues
jest.mock('react-native-localize', function () {
  return {
    getLocales: jest.fn(function () {
      return [{ languageCode: 'fr', countryCode: 'FR' }];
    }),
  };
});

// Mock I18nManager from react-native
jest.mock('react-native', function () {
  return {
    I18nManager: {
      isRTL: false,
      forceRTL: jest.fn(),
    },
    Platform: { OS: 'android' },
    NativeModules: {},
  };
});

var { I18nProvider, useT } = require('./I18nContext');

function wrapper(props) {
  return React.createElement(I18nProvider, null, props.children);
}

beforeEach(function () {
  jest.clearAllMocks();
  AsyncStorage._reset();
});

describe('I18nContext', function () {
  describe('useT outside provider', function () {
    it('throws error when used outside I18nProvider', function () {
      var spy = jest.spyOn(console, 'error').mockImplementation(function () {});

      expect(function () {
        renderHook(function () { return useT(); });
      }).toThrow('useT must be used inside I18nProvider');

      spy.mockRestore();
    });
  });

  describe('default state', function () {
    it('provides t function, locale, setLocale, isRTL, and i18nLoading', async function () {
      AsyncStorage.getItem.mockResolvedValue('en');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.i18nLoading).toBe(false);
      });

      expect(typeof result.current.t).toBe('function');
      expect(typeof result.current.setLocale).toBe('function');
      expect(typeof result.current.isRTL).toBe('boolean');
      expect(result.current.locale).toBeDefined();
    });

    it('defaults to "en" locale initially', function () {
      AsyncStorage.getItem.mockImplementation(function () { return new Promise(function () {}); });

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      // The initial state is 'en' before async code runs
      expect(result.current.locale).toBe('en');
    });
  });

  describe('translation (t function)', function () {
    it('translates a simple key in default locale', async function () {
      AsyncStorage.getItem.mockResolvedValue('en');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('en');
      });

      expect(result.current.t('greeting')).toBe('Hello');
    });

    it('translates key with parameter interpolation', async function () {
      AsyncStorage.getItem.mockResolvedValue('en');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('en');
      });

      expect(result.current.t('greeting.name', { name: 'Alice' })).toBe('Hello, Alice!');
    });

    it('handles multiple parameters', async function () {
      AsyncStorage.getItem.mockResolvedValue('en');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('en');
      });

      expect(result.current.t('multi.param', { a: 'X', b: 'Y' })).toBe('X and Y');
    });

    it('falls back to English when key missing in current locale', async function () {
      AsyncStorage.getItem.mockResolvedValue('fr');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('fr');
      });

      // 'only.en' exists only in English
      expect(result.current.t('only.en')).toBe('English only');
    });

    it('returns the key itself when not found in any locale', async function () {
      AsyncStorage.getItem.mockResolvedValue('en');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('en');
      });

      expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('translates in French when locale is fr', async function () {
      AsyncStorage.getItem.mockResolvedValue('fr');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('fr');
      });

      expect(result.current.t('greeting')).toBe('Bonjour');
      expect(result.current.t('greeting.name', { name: 'Alice' })).toBe('Bonjour, Alice !');
    });
  });

  describe('setLocale', function () {
    it('changes locale and updates translations', async function () {
      AsyncStorage.getItem.mockResolvedValue('en');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('en');
      });

      act(function () {
        result.current.setLocale('fr');
      });

      expect(result.current.locale).toBe('fr');
      expect(result.current.t('greeting')).toBe('Bonjour');
    });

    it('persists new locale to AsyncStorage', async function () {
      AsyncStorage.getItem.mockResolvedValue('en');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.i18nLoading).toBe(false);
      });

      act(function () {
        result.current.setLocale('fr');
      });

      await waitFor(function () {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('dp-language', 'fr');
      });
    });
  });

  describe('RTL detection', function () {
    it('isRTL is false for English', async function () {
      AsyncStorage.getItem.mockResolvedValue('en');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('en');
      });

      expect(result.current.isRTL).toBe(false);
    });

    it('isRTL is true for Arabic', async function () {
      AsyncStorage.getItem.mockResolvedValue('ar');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('ar');
      });

      expect(result.current.isRTL).toBe(true);
    });

    it('isRTL is false for French', async function () {
      AsyncStorage.getItem.mockResolvedValue('fr');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('fr');
      });

      expect(result.current.isRTL).toBe(false);
    });

    it('isRTL updates when locale changes to Arabic', async function () {
      AsyncStorage.getItem.mockResolvedValue('en');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('en');
      });

      expect(result.current.isRTL).toBe(false);

      act(function () {
        result.current.setLocale('ar');
      });

      expect(result.current.isRTL).toBe(true);
    });
  });

  describe('stored language loading', function () {
    it('loads stored language from AsyncStorage on mount', async function () {
      AsyncStorage.getItem.mockResolvedValue('es');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.locale).toBe('es');
      });

      expect(result.current.t('greeting')).toBe('Hola');
    });

    it('ignores stored language that is not in translations', async function () {
      AsyncStorage.getItem.mockResolvedValue('xx');

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.i18nLoading).toBe(false);
      });

      // Should not be 'xx'; should fall back to device language or 'en'
      expect(result.current.locale).not.toBe('xx');
    });

    it('handles AsyncStorage errors gracefully', async function () {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      var { result } = renderHook(function () { return useT(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.i18nLoading).toBe(false);
      });

      // Should not crash, default locale is used
      expect(result.current.locale).toBeDefined();
    });
  });
});
