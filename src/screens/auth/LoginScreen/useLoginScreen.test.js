/**
 * Tests for src/screens/auth/LoginScreen/useLoginScreen.js
 * Covers email validation, password validation, login flow, 2FA flow,
 * error handling, and navigation.
 */

var React = require('react');
var { renderHook, act, waitFor } = require('@testing-library/react-native');

// Mock API
jest.mock('../../../services/api', function () {
  return {
    apiPost: jest.fn(),
    setTokens: jest.fn(function () { return Promise.resolve(); }),
  };
});

// Mock sanitize
jest.mock('../../../utils/sanitize', function () {
  return {
    isValidEmail: function (email) {
      if (!email || typeof email !== 'string') return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    },
  };
});

var { apiPost, setTokens } = require('../../../services/api');
var useLoginScreen = require('./useLoginScreen');

beforeEach(function () {
  jest.clearAllMocks();
  global.__mockNavigate.mockClear();
  global.__mockReset.mockClear();
});

describe('useLoginScreen', function () {
  describe('initial state', function () {
    it('initializes with empty form fields', function () {
      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      expect(result.current.email).toBe('');
      expect(result.current.password).toBe('');
      expect(result.current.showPassword).toBe(false);
      expect(result.current.errors).toEqual({});
      expect(result.current.serverError).toBe('');
      expect(result.current.submitting).toBe(false);
      expect(result.current.loginCooldown).toBe(false);
      expect(result.current.tfaRequired).toBe(false);
      expect(result.current.tfaCode).toBe('');
    });

    it('provides setter functions', function () {
      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      expect(typeof result.current.setEmail).toBe('function');
      expect(typeof result.current.setPassword).toBe('function');
      expect(typeof result.current.setShowPassword).toBe('function');
      expect(typeof result.current.setTfaCode).toBe('function');
    });
  });

  describe('email validation', function () {
    it('sets email error for invalid email', function () {
      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('not-an-email');
        result.current.setPassword('password123');
      });

      act(function () {
        result.current.handleSignIn();
      });

      expect(result.current.errors.email).toBeTruthy();
      expect(apiPost).not.toHaveBeenCalled();
    });

    it('sets email error for empty email', function () {
      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setPassword('password123');
      });

      act(function () {
        result.current.handleSignIn();
      });

      expect(result.current.errors.email).toBeTruthy();
    });

    it('accepts valid email', function () {
      apiPost.mockResolvedValue({ access: 'token', refresh: 'refresh' });

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('password123');
      });

      act(function () {
        result.current.handleSignIn();
      });

      // No email error
      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('password validation', function () {
    it('sets password error when empty', function () {
      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        // password left empty
      });

      act(function () {
        result.current.handleSignIn();
      });

      expect(result.current.errors.password).toBeTruthy();
      expect(apiPost).not.toHaveBeenCalled();
    });

    it('clears errors on re-submit', function () {
      apiPost.mockResolvedValue({ access: 'token', refresh: 'refresh' });

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      // First: trigger errors
      act(function () {
        result.current.handleSignIn();
      });

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      // Fix inputs
      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('password123');
      });

      act(function () {
        result.current.handleSignIn();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('successful login', function () {
    it('calls apiPost with email and password', async function () {
      apiPost.mockResolvedValue({
        access: 'access-token',
        refresh: 'refresh-token',
      });

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('password123');
      });

      await act(async function () {
        result.current.handleSignIn();
      });

      expect(apiPost).toHaveBeenCalledWith(
        '/api/auth/login/',
        { email: 'user@example.com', password: 'password123' },
      );
    });

    it('stores tokens and navigates to Main on success', async function () {
      apiPost.mockResolvedValue({
        access: 'access-token',
        refresh: 'refresh-token',
      });

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('password123');
      });

      await act(async function () {
        result.current.handleSignIn();
      });

      await waitFor(function () {
        expect(setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
        expect(global.__mockReset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      });
    });

    it('handles accessToken/refreshToken naming variant', async function () {
      apiPost.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('password123');
      });

      await act(async function () {
        result.current.handleSignIn();
      });

      await waitFor(function () {
        expect(setTokens).toHaveBeenCalledWith('at', 'rt');
      });
    });

    it('sets submitting to true during request', function () {
      apiPost.mockReturnValue(new Promise(function () {})); // never resolves

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('password123');
      });

      act(function () {
        result.current.handleSignIn();
      });

      expect(result.current.submitting).toBe(true);
    });
  });

  describe('2FA flow', function () {
    it('enters 2FA mode when server returns tfaRequired', async function () {
      apiPost.mockResolvedValue({
        tfaRequired: true,
        challengeToken: 'challenge-abc',
      });

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('password123');
      });

      await act(async function () {
        result.current.handleSignIn();
      });

      await waitFor(function () {
        expect(result.current.tfaRequired).toBe(true);
        expect(result.current.submitting).toBe(false);
      });
    });

    it('handleTfaVerify submits code and navigates on success', async function () {
      // First: enter 2FA mode
      apiPost.mockResolvedValueOnce({
        tfaRequired: true,
        challengeToken: 'challenge-abc',
      });

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('password123');
      });

      await act(async function () {
        result.current.handleSignIn();
      });

      await waitFor(function () {
        expect(result.current.tfaRequired).toBe(true);
      });

      // Now verify 2FA
      apiPost.mockResolvedValueOnce({
        access: 'tfa-access',
        refresh: 'tfa-refresh',
      });

      act(function () {
        result.current.setTfaCode('123456');
      });

      await act(async function () {
        result.current.handleTfaVerify();
      });

      await waitFor(function () {
        expect(apiPost).toHaveBeenCalledWith(
          '/api/auth/2fa-challenge/',
          { challengeToken: 'challenge-abc', code: '123456' },
        );
        expect(setTokens).toHaveBeenCalledWith('tfa-access', 'tfa-refresh');
      });
    });

    it('handleTfaVerify shows error for empty code', async function () {
      // Enter 2FA mode
      apiPost.mockResolvedValueOnce({
        tfaRequired: true,
        challengeToken: 'ch',
      });

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('password123');
      });

      await act(async function () {
        result.current.handleSignIn();
      });

      await waitFor(function () {
        expect(result.current.tfaRequired).toBe(true);
      });

      // Try to verify with empty code
      act(function () {
        result.current.handleTfaVerify();
      });

      expect(result.current.serverError).toBeTruthy();
    });

    it('resetTfa clears 2FA state', async function () {
      apiPost.mockResolvedValueOnce({
        tfaRequired: true,
        challengeToken: 'ch',
      });

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('password123');
      });

      await act(async function () {
        result.current.handleSignIn();
      });

      await waitFor(function () {
        expect(result.current.tfaRequired).toBe(true);
      });

      act(function () {
        result.current.resetTfa();
      });

      expect(result.current.tfaRequired).toBe(false);
      expect(result.current.tfaCode).toBe('');
      expect(result.current.serverError).toBe('');
    });
  });

  describe('error handling', function () {
    it('shows server error message on login failure', async function () {
      var err = new Error('Invalid credentials');
      err.userMessage = 'Incorrect email or password.';
      apiPost.mockRejectedValue(err);

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('wrong');
      });

      await act(async function () {
        result.current.handleSignIn();
      });

      await waitFor(function () {
        expect(result.current.serverError).toBe('Incorrect email or password.');
        expect(result.current.submitting).toBe(false);
        expect(result.current.loginCooldown).toBe(true);
      });
    });

    it('navigates to CheckEmail for unverified email error', async function () {
      var err = new Error('E-mail is not verified.');
      apiPost.mockRejectedValue(err);

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('unverified@example.com');
        result.current.setPassword('password123');
      });

      await act(async function () {
        result.current.handleSignIn();
      });

      await waitFor(function () {
        expect(global.__mockNavigate).toHaveBeenCalledWith(
          'CheckEmail',
          { email: 'unverified@example.com' },
        );
      });
    });

    it('navigates to CheckEmail for "not verified" variant', async function () {
      var err = new Error('Account not verified');
      apiPost.mockRejectedValue(err);

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('pass');
      });

      await act(async function () {
        result.current.handleSignIn();
      });

      await waitFor(function () {
        expect(global.__mockNavigate).toHaveBeenCalledWith(
          'CheckEmail',
          { email: 'user@example.com' },
        );
      });
    });

    it('sets loginCooldown that expires after 2 seconds', async function () {
      jest.useFakeTimers();

      var err = new Error('Server error');
      apiPost.mockRejectedValue(err);

      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.setEmail('user@example.com');
        result.current.setPassword('pass');
      });

      await act(async function () {
        result.current.handleSignIn();
      });

      expect(result.current.loginCooldown).toBe(true);

      act(function () {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.loginCooldown).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('social login stubs', function () {
    it('handleGoogleLogin sets error message', function () {
      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.handleGoogleLogin();
      });

      expect(result.current.serverError).toContain('Google');
    });

    it('handleAppleLogin sets error message', function () {
      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      act(function () {
        result.current.handleAppleLogin();
      });

      expect(result.current.serverError).toContain('Apple');
    });
  });

  describe('showPassword toggle', function () {
    it('toggles showPassword state', function () {
      var { result } = renderHook(function () {
        return useLoginScreen();
      });

      expect(result.current.showPassword).toBe(false);

      act(function () {
        result.current.setShowPassword(true);
      });

      expect(result.current.showPassword).toBe(true);
    });
  });
});
