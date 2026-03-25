import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { I18nManager, Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../i18n/en.json';
import fr from '../i18n/fr.json';
import es from '../i18n/es.json';
import de from '../i18n/de.json';
import pt from '../i18n/pt.json';
import it from '../i18n/it.json';
import nl from '../i18n/nl.json';
import ru from '../i18n/ru.json';
import ja from '../i18n/ja.json';
import ko from '../i18n/ko.json';
import zh from '../i18n/zh.json';
import ar from '../i18n/ar.json';
import hi from '../i18n/hi.json';
import tr from '../i18n/tr.json';
import pl from '../i18n/pl.json';
import ht from '../i18n/ht.json';

var translations = { en, fr, es, de, pt, it, nl, ru, ja, ko, zh, ar, hi, tr, pl, ht };

var RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

var I18nContext = createContext(null);

/**
 * Get the device language code (2 chars).
 * Uses react-native's NativeModules as a fallback if react-native-localize is not installed.
 */
function getDeviceLanguage() {
  try {
    // Try react-native-localize first
    var RNLocalize = require('react-native-localize');
    if (RNLocalize && RNLocalize.getLocales) {
      var locales = RNLocalize.getLocales();
      if (locales && locales.length > 0) {
        return locales[0].languageCode;
      }
    }
  } catch (e) {
    // react-native-localize not installed, use fallback
  }

  // Fallback: read from native modules
  var deviceLocale = '';
  if (Platform.OS === 'ios') {
    deviceLocale =
      (NativeModules.SettingsManager &&
        NativeModules.SettingsManager.settings &&
        NativeModules.SettingsManager.settings.AppleLocale) ||
      (NativeModules.SettingsManager &&
        NativeModules.SettingsManager.settings &&
        NativeModules.SettingsManager.settings.AppleLanguages &&
        NativeModules.SettingsManager.settings.AppleLanguages[0]) ||
      '';
  } else {
    deviceLocale = (NativeModules.I18nManager && NativeModules.I18nManager.localeIdentifier) || '';
  }
  return deviceLocale ? deviceLocale.substring(0, 2) : 'en';
}

export function I18nProvider({ children }) {
  var [locale, setLocale] = useState('en');
  var [isReady, setIsReady] = useState(false);

  // Load stored language or detect device language
  useEffect(function () {
    AsyncStorage.getItem('dp-language')
      .then(function (stored) {
        if (stored && translations[stored]) {
          setLocale(stored);
        } else {
          // Auto-detect device language
          var lang = getDeviceLanguage();
          if (translations[lang]) {
            setLocale(lang);
          }
        }
      })
      .catch(function () {})
      .finally(function () {
        setIsReady(true);
      });
  }, []);

  // Persist language and handle RTL
  useEffect(
    function () {
      if (!isReady) return;
      AsyncStorage.setItem('dp-language', locale).catch(function () {});
      var shouldBeRTL = RTL_LANGUAGES.indexOf(locale) !== -1;
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
        // Note: RTL change requires app restart on RN
      }
    },
    [locale, isReady],
  );

  var t = useCallback(
    function (key, params) {
      var dict = translations[locale] || translations.en;
      var str = dict[key] || translations.en[key] || key;
      if (params) {
        for (var k in params) {
          str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
        }
      }
      return str;
    },
    [locale],
  );

  var isRTL = RTL_LANGUAGES.indexOf(locale) !== -1;

  return (
    <I18nContext.Provider value={{ t: t, locale: locale, setLocale: setLocale, isRTL: isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  var ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside I18nProvider');
  return ctx;
}
