/**
 * Tests for src/context/ThemeContext.jsx
 * Covers theme provider, dark mode toggle, accent color, persistence,
 * hex-to-rgb conversion, and useTheme guard.
 */

var React = require('react');
var { renderHook, act, waitFor } = require('@testing-library/react-native');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Must reset modules each time so ThemeProvider has fresh state
beforeEach(function () {
  jest.clearAllMocks();
  AsyncStorage._reset();
});

// We re-require to get fresh context per test
function loadModule() {
  jest.resetModules();
  return require('./ThemeContext');
}

function makeWrapper(mod) {
  return function wrapper(props) {
    return React.createElement(mod.ThemeProvider, null, props.children);
  };
}

describe('ThemeContext', function () {
  describe('useTheme outside provider', function () {
    it('throws error when used outside ThemeProvider', function () {
      var mod = loadModule();
      var spy = jest.spyOn(console, 'error').mockImplementation(function () {});

      expect(function () {
        renderHook(function () { return mod.useTheme(); });
      }).toThrow('useTheme must be used within ThemeProvider');

      spy.mockRestore();
    });
  });

  describe('default state', function () {
    it('starts with cosmos theme (dark) by default', async function () {
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.theme).toBe('cosmos');
      expect(result.current.resolved).toBe('dark');
      expect(result.current.isDay).toBe(false);
    });

    it('has default purple accent color', async function () {
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.accentColor).toBe('#8B5CF6');
    });

    it('provides dark theme colors by default', async function () {
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.colors.background).toBe('#0F0A1E');
      expect(result.current.colors.text).toBe('#FFFFFF');
    });
  });

  describe('setTheme', function () {
    it('switches to light mode with "default" id', async function () {
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

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
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

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
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

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
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

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
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

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
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setAccentColor('#3B82F6');
      });

      expect(result.current.accentColor).toBe('#3B82F6');
    });

    it('rejects invalid hex values', async function () {
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      act(function () {
        result.current.setAccentColor('not-a-color');
      });

      expect(result.current.accentColor).toBe('#8B5CF6');
    });

    it('computes accent-derived colors (soft, glow, border)', async function () {
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

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

      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

      await waitFor(function () {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.visualTheme).toBe('default');
      expect(result.current.resolved).toBe('light');
      expect(result.current.accentColor).toBe('#EC4899');
    });

    it('persists theme on change', async function () {
      var mod = loadModule();
      var { result } = renderHook(function () { return mod.useTheme(); }, { wrapper: makeWrapper(mod) });

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
      var mod = loadModule();
      expect(mod.ACCENT_PRESETS).toHaveLength(10);
      expect(mod.ACCENT_PRESETS[0]).toEqual({ name: 'Purple', color: '#8B5CF6' });
    });
  });
});
