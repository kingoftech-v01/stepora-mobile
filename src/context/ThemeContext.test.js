/**
 * Tests for src/context/ThemeContext.jsx
 * Covers theme provider, dark mode toggle, accent color, persistence,
 * hex-to-rgb conversion, and useTheme guard.
 */

var React = require('react');
var { renderHook, act, waitFor } = require('@testing-library/react-native');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;
var { ThemeProvider, useTheme, ACCENT_PRESETS } = require('./ThemeContext');

beforeEach(function () {
  jest.clearAllMocks();
  AsyncStorage._reset();
  // Reset getItem to default behavior so persistence test mockImplementation doesn't leak
  AsyncStorage.getItem.mockReset();
  AsyncStorage.getItem.mockImplementation(function () {
    return Promise.resolve(null);
  });
  AsyncStorage.setItem.mockReset();
  AsyncStorage.setItem.mockImplementation(function () {
    return Promise.resolve();
  });
});

function wrapper(props) {
  return React.createElement(ThemeProvider, null, props.children);
}

describe('ThemeContext', function () {
  describe('useTheme outside provider', function () {
    it('throws error when used outside ThemeProvider', function () {
      var spy = jest.spyOn(console, 'error').mockImplementation(function () {});

      expect(function () {
        renderHook(function () { return useTheme(); });
      }).toThrow('useTheme must be used within ThemeProvider');

      spy.mockRestore();
    });
  });

  describe('default state', function () {
    it('starts with cosmos theme (dark) by default', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.theme).toBe('cosmos');
      expect(result.current.resolved).toBe('dark');
      expect(result.current.isDay).toBe(false);
    });

    it('has default purple accent color', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.accentColor).toBe('#8B5CF6');
    });

    it('provides dark theme colors by default', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.colors.background).toBe('#0F0A1E');
      expect(result.current.colors.text).toBe('#FFFFFF');
    });
  });

  describe('setTheme', function () {
    it('switches to light mode with "default" id', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setTheme('default');
      });

      expect(result.current.resolved).toBe('light');
      expect(result.current.isDay).toBe(true);
      expect(result.current.colors.background).toBe('#F5F0FF');
    });

    it('switches to dark mode with "cosmos" id', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setTheme('default');
      });
      expect(result.current.resolved).toBe('light');

      act(function () {
        result.current.setTheme('cosmos');
      });
      expect(result.current.resolved).toBe('dark');
    });

    it('maps "dark" alias to cosmos', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setTheme('default');
      });
      act(function () {
        result.current.setTheme('dark');
      });

      expect(result.current.visualTheme).toBe('cosmos');
      expect(result.current.resolved).toBe('dark');
    });

    it('maps "light" alias to default', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setTheme('light');
      });

      expect(result.current.visualTheme).toBe('default');
      expect(result.current.resolved).toBe('light');
    });

    it('ignores invalid theme ids', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setTheme('neon-rainbow');
      });

      expect(result.current.theme).toBe('cosmos');
    });
  });

  describe('setAccentColor', function () {
    it('changes accent color with valid hex', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setAccentColor('#3B82F6');
      });

      expect(result.current.accentColor).toBe('#3B82F6');
    });

    it('rejects invalid hex values', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setAccentColor('not-a-color');
      });

      expect(result.current.accentColor).toBe('#8B5CF6');
    });

    it('computes accent-derived colors (soft, glow, border)', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setAccentColor('#FF0000');
      });

      expect(result.current.accentSoft).toContain('rgba(255,0,0,0.2)');
      expect(result.current.accentGlow).toContain('rgba(255,0,0,0.1)');
      expect(result.current.accentBorder).toContain('rgba(255,0,0,0.25)');
    });
  });

  describe('persistence', function () {
    it('loads persisted theme from AsyncStorage', async function () {
      AsyncStorage.getItem.mockImplementation(function (key) {
        if (key === 'dp-theme') return Promise.resolve('default');
        if (key === 'dp-accent-color') return Promise.resolve('#EC4899');
        return Promise.resolve(null);
      });

      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.visualTheme).toBe('default');
      expect(result.current.resolved).toBe('light');
      expect(result.current.accentColor).toBe('#EC4899');
    });

    it('persists theme on change', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setTheme('default');
      });

      await waitFor(function () {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('dp-theme', 'default');
      });
    });
  });

  describe('ACCENT_PRESETS', function () {
    it('exports 10 accent presets', function () {
      expect(ACCENT_PRESETS).toHaveLength(10);
      expect(ACCENT_PRESETS[0]).toEqual({ name: 'Purple', color: '#8B5CF6' });
    });

    it('all presets have valid hex colors', function () {
      ACCENT_PRESETS.forEach(function (preset) {
        expect(preset.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(typeof preset.name).toBe('string');
        expect(preset.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('saturn theme', function () {
    it('supports saturn as a valid theme id (resolves to dark)', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setTheme('saturn');
      });

      expect(result.current.visualTheme).toBe('saturn');
      expect(result.current.resolved).toBe('dark');
      expect(result.current.isDay).toBe(false);
    });
  });

  describe('accent color edge cases', function () {
    it('rejects 3-character hex codes', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setAccentColor('#F00');
      });

      expect(result.current.accentColor).toBe('#8B5CF6');
    });

    it('rejects empty string', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setAccentColor('');
      });

      expect(result.current.accentColor).toBe('#8B5CF6');
    });

    it('rejects null', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setAccentColor(null);
      });

      expect(result.current.accentColor).toBe('#8B5CF6');
    });

    it('accepts lowercase hex', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setAccentColor('#abcdef');
      });

      expect(result.current.accentColor).toBe('#abcdef');
    });

    it('persists accent color to AsyncStorage', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setAccentColor('#FF0000');
      });

      await waitFor(function () {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('dp-accent-color', '#FF0000');
      });
    });
  });

  describe('theme value shape', function () {
    it('provides all expected context fields', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current).toEqual(expect.objectContaining({
        theme: expect.any(String),
        resolved: expect.any(String),
        setTheme: expect.any(Function),
        visualTheme: expect.any(String),
        isDay: expect.any(Boolean),
        accentColor: expect.any(String),
        accentSoft: expect.any(String),
        accentGlow: expect.any(String),
        accentBorder: expect.any(String),
        setAccentColor: expect.any(Function),
        colors: expect.any(Object),
        isReady: true,
      }));
    });

    it('colors object has required color keys', async function () {
      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      var requiredKeys = [
        'background', 'surface', 'surfaceBorder', 'text',
        'textSecondary', 'textTertiary', 'glassBg', 'glassBorder',
        'cardBg', 'cardBorder', 'statusBarStyle',
      ];

      requiredKeys.forEach(function (key) {
        expect(result.current.colors).toHaveProperty(key);
      });
    });
  });

  describe('persistence errors', function () {
    it('handles AsyncStorage load errors gracefully', async function () {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage crash'));

      var { result } = renderHook(function () { return useTheme(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      // Falls back to defaults
      expect(result.current.theme).toBe('cosmos');
      expect(result.current.accentColor).toBe('#8B5CF6');
    });
  });
});
