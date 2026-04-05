/**
 * Tests for src/context/ToastContext.jsx
 * Covers provider rendering, showToast type mapping, dismissToast,
 * default parameters, and useToast guard.
 */

var React = require('react');
var { renderHook, act } = require('@testing-library/react-native');

// Override the global Toast mock to be a proper component for rendering
var mockToastShow = jest.fn();
var mockToastHide = jest.fn();
jest.mock('react-native-toast-message', function () {
  var RN = require('react');
  var ToastComponent = function () { return RN.createElement('View', { testID: 'toast' }); };
  ToastComponent.show = mockToastShow;
  ToastComponent.hide = mockToastHide;
  return {
    __esModule: true,
    default: ToastComponent,
  };
});

var { ToastProvider, useToast } = require('./ToastContext');

beforeEach(function () {
  jest.clearAllMocks();
});

function wrapper(props) {
  return React.createElement(ToastProvider, null, props.children);
}

describe('ToastContext', function () {
  describe('useToast outside provider', function () {
    it('throws error when used outside ToastProvider', function () {
      var spy = jest.spyOn(console, 'error').mockImplementation(function () {});

      expect(function () {
        renderHook(function () { return useToast(); });
      }).toThrow('useToast must be used within ToastProvider');

      spy.mockRestore();
    });
  });

  describe('provider', function () {
    it('renders children and provides context', function () {
      var { result } = renderHook(function () { return useToast(); }, { wrapper: wrapper });

      expect(result.current).toBeDefined();
      expect(typeof result.current.showToast).toBe('function');
      expect(typeof result.current.dismissToast).toBe('function');
    });
  });

  describe('showToast', function () {
    it('calls Toast.show with default type info and 3000ms duration', function () {
      var { result } = renderHook(function () { return useToast(); }, { wrapper: wrapper });

      act(function () {
        result.current.showToast('Hello World');
      });

      expect(mockToastShow).toHaveBeenCalledWith({
        type: 'info',
        text1: 'Hello World',
        visibilityTime: 3000,
        position: 'top',
        topOffset: 60,
      });
    });

    it('maps "success" type correctly', function () {
      var { result } = renderHook(function () { return useToast(); }, { wrapper: wrapper });

      act(function () {
        result.current.showToast('Success!', 'success');
      });

      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          text1: 'Success!',
        }),
      );
    });

    it('maps "error" type correctly', function () {
      var { result } = renderHook(function () { return useToast(); }, { wrapper: wrapper });

      act(function () {
        result.current.showToast('Error occurred', 'error');
      });

      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: 'Error occurred',
        }),
      );
    });

    it('maps "warning" type to "error" toast type', function () {
      var { result } = renderHook(function () { return useToast(); }, { wrapper: wrapper });

      act(function () {
        result.current.showToast('Warning!', 'warning');
      });

      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: 'Warning!',
        }),
      );
    });

    it('maps unknown type to "info" toast type', function () {
      var { result } = renderHook(function () { return useToast(); }, { wrapper: wrapper });

      act(function () {
        result.current.showToast('Some message', 'custom');
      });

      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
        }),
      );
    });

    it('uses custom duration when provided', function () {
      var { result } = renderHook(function () { return useToast(); }, { wrapper: wrapper });

      act(function () {
        result.current.showToast('Timed toast', 'info', 5000);
      });

      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          visibilityTime: 5000,
        }),
      );
    });

    it('always positions toast at top with 60 offset', function () {
      var { result } = renderHook(function () { return useToast(); }, { wrapper: wrapper });

      act(function () {
        result.current.showToast('Position test');
      });

      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 'top',
          topOffset: 60,
        }),
      );
    });
  });

  describe('dismissToast', function () {
    it('calls Toast.hide', function () {
      var { result } = renderHook(function () { return useToast(); }, { wrapper: wrapper });

      act(function () {
        result.current.dismissToast();
      });

      expect(mockToastHide).toHaveBeenCalled();
    });
  });

  describe('multiple toasts', function () {
    it('can show multiple toasts sequentially', function () {
      var { result } = renderHook(function () { return useToast(); }, { wrapper: wrapper });

      act(function () {
        result.current.showToast('First', 'success');
        result.current.showToast('Second', 'error');
      });

      expect(mockToastShow).toHaveBeenCalledTimes(2);
      expect(mockToastShow).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ type: 'success', text1: 'First' }),
      );
      expect(mockToastShow).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ type: 'error', text1: 'Second' }),
      );
    });
  });
});
