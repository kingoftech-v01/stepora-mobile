/* ═══════════════════════════════════════════════════════════════════
 * ThemeProvider for React Native
 *
 * Simplified from web app — uses RN Appearance API + AsyncStorage.
 * Supports "dark" and "light" resolved modes.
 * Accent color system preserved for future theming.
 * ═══════════════════════════════════════════════════════════════════ */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Appearance, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

var ThemeContext = createContext(null);

var DEFAULT_ACCENT = '#8B5CF6';

// ─── Accent Color Presets ────────────────────────────────────────
export var ACCENT_PRESETS = [
  { name: 'Purple', color: '#8B5CF6' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Teal', color: '#14B8A6' },
  { name: 'Green', color: '#10B981' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Red', color: '#EF4444' },
  { name: 'Orange', color: '#F59E0B' },
  { name: 'Indigo', color: '#6366F1' },
  { name: 'Cyan', color: '#06B6D4' },
  { name: 'Rose', color: '#F43F5E' },
];

// Convert hex to RGB components
function hexToRgb(hex) {
  var result = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(hex);
  if (!result) return { r: 139, g: 92, b: 246 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Dark theme colors
var DARK_COLORS = {
  background: '#0F0A1E',
  surface: 'rgba(255,255,255,0.06)',
  surfaceBorder: 'rgba(255,255,255,0.1)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.4)',
  glassBg: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.1)',
  cardBg: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.12)',
  statusBarStyle: 'light-content',
};

// Light theme colors
var LIGHT_COLORS = {
  background: '#F5F0FF',
  surface: 'rgba(0,0,0,0.04)',
  surfaceBorder: 'rgba(0,0,0,0.08)',
  text: '#1A1A2E',
  textSecondary: 'rgba(0,0,0,0.6)',
  textTertiary: 'rgba(0,0,0,0.4)',
  glassBg: 'rgba(255,255,255,0.7)',
  glassBorder: 'rgba(255,255,255,0.5)',
  cardBg: 'rgba(255,255,255,0.8)',
  cardBorder: 'rgba(0,0,0,0.06)',
  statusBarStyle: 'dark-content',
};

export function ThemeProvider({ children }) {
  // ─── VISUAL THEME SELECTION ─────────────────────────────────
  var [visualTheme, setVisualThemeState] = useState('cosmos'); // cosmos = always dark
  var [accentColor, setAccentColorState] = useState(DEFAULT_ACCENT);
  var [isReady, setIsReady] = useState(false);

  // Load persisted preferences
  useEffect(function () {
    Promise.all([
      AsyncStorage.getItem('dp-theme'),
      AsyncStorage.getItem('dp-accent-color'),
    ])
      .then(function (results) {
        var storedTheme = results[0];
        var storedAccent = results[1];
        if (storedTheme) setVisualThemeState(storedTheme);
        if (storedAccent) setAccentColorState(storedAccent);
      })
      .catch(function () {})
      .finally(function () {
        setIsReady(true);
      });
  }, []);

  // ─── RESOLVED THEME ─────────────────────────────────────────
  var resolved = visualTheme === 'default' ? 'light' : 'dark';
  var colors = resolved === 'light' ? LIGHT_COLORS : DARK_COLORS;

  // Compute accent-derived colors
  var rgb = hexToRgb(accentColor);
  var accentSoft = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.2)';
  var accentGlow = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.1)';
  var accentBorder = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.25)';

  // Update status bar
  useEffect(
    function () {
      if (!isReady) return;
      StatusBar.setBarStyle(colors.statusBarStyle, true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(colors.background, true);
      }
    },
    [resolved, isReady],
  );

  // Persist theme selection
  useEffect(
    function () {
      if (!isReady) return;
      AsyncStorage.setItem('dp-theme', visualTheme).catch(function () {});
    },
    [visualTheme, isReady],
  );

  // Persist accent color
  useEffect(
    function () {
      if (!isReady) return;
      AsyncStorage.setItem('dp-accent-color', accentColor).catch(function () {});
    },
    [accentColor, isReady],
  );

  // Public setters
  var setTheme = useCallback(function (id) {
    if (id === 'cosmos' || id === 'default' || id === 'saturn') {
      setVisualThemeState(id);
    } else if (id === 'dark') {
      setVisualThemeState('cosmos');
    } else if (id === 'light') {
      setVisualThemeState('default');
    }
  }, []);

  var setAccentColor = useCallback(function (color) {
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      setAccentColorState(color);
    }
  }, []);

  var value = {
    // Backward-compatible fields
    theme: visualTheme,
    resolved: resolved,
    setTheme: setTheme,

    // Visual theme
    visualTheme: visualTheme,
    isDay: resolved === 'light',

    // Accent color
    accentColor: accentColor,
    accentSoft: accentSoft,
    accentGlow: accentGlow,
    accentBorder: accentBorder,
    setAccentColor: setAccentColor,

    // All theme colors
    colors: colors,

    // Ready flag
    isReady: isReady,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  var ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
