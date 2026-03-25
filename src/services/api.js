// ─── Stepora API Client (React Native) ─────────────────────────────
// Fetch wrapper with JWT auth, case transforms, and error handling.
// React Native: ALL tokens stored in AsyncStorage (no cookies).
// Always sends X-Client-Platform: native so backend returns refresh in body.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { snakeToCamel, camelToSnake } from './transforms';
import { getUserMessage } from '../utils/errorMessages';
import Config from '../config';

var API_BASE = Config.API_BASE;
var REFRESH_URL = '/api/auth/token/refresh/';

// ─── Token helpers (JWT) ─────────────────────────────────────────

var _accessToken = '';

// Event listeners for auth state changes (logout redirect, subscription events)
var _authEventListeners = [];

export function addAuthEventListener(listener) {
  _authEventListeners.push(listener);
  return function () {
    _authEventListeners = _authEventListeners.filter(function (l) {
      return l !== listener;
    });
  };
}

function _emitAuthEvent(event) {
  for (var i = 0; i < _authEventListeners.length; i++) {
    try {
      _authEventListeners[i](event);
    } catch (e) {
      console.error('[API] auth event listener error:', e);
    }
  }
}

/**
 * Initialize token from AsyncStorage at startup.
 */
export function initToken() {
  return AsyncStorage.getItem('dp-access-token')
    .then(function (value) {
      _accessToken = value || '';
      // Migrate legacy key if present
      if (!_accessToken) {
        return AsyncStorage.getItem('dp-token').then(function (legacyValue) {
          if (legacyValue) {
            _accessToken = legacyValue;
            AsyncStorage.removeItem('dp-token');
          }
        });
      }
    })
    .then(function () {
      return _accessToken;
    })
    .catch(function () {
      _accessToken = '';
      return '';
    });
}

export function getToken() {
  return _accessToken;
}

/** Exported for WebSocket auth */
export function getAccessTokenForWS() {
  return _accessToken;
}

/**
 * Store JWT tokens after login/register/refresh.
 * @param {string} access - JWT access token
 * @param {string} [refresh] - JWT refresh token
 */
export function setToken(access, refresh) {
  _accessToken = access || '';
  if (access) {
    AsyncStorage.setItem('dp-access-token', access).catch(function (err) {
      console.error('[Auth] token storage failed:', err);
    });
  } else {
    AsyncStorage.removeItem('dp-access-token').catch(function () {});
  }
  if (refresh) {
    AsyncStorage.setItem('dp-refresh-token', refresh).catch(function (err) {
      console.error('[Auth] refresh token storage failed:', err);
    });
  } else if (refresh === null) {
    AsyncStorage.removeItem('dp-refresh-token').catch(function () {});
  }
}

export function clearAuth() {
  _accessToken = '';
  var keys = [
    'dp-access-token',
    'dp-refresh-token',
    'dp-token',
    'dp-splash-shown',
    'dp-offline-queue',
    'dp-recent-searches',
    'dp-dream-draft',
  ];
  AsyncStorage.multiRemove(keys).catch(function (err) {
    console.error('[Auth] token removal failed:', err);
  });
}

// ─── Silent Token Refresh ────────────────────────────────────────

var _isRefreshing = false;
var _refreshQueue = [];

async function _doRefresh() {
  var refreshToken = await AsyncStorage.getItem('dp-refresh-token');
  if (!refreshToken) throw new Error('No refresh token');
  var resp = await fetch(API_BASE + REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!resp.ok) throw new Error('Refresh failed');
  var data = await resp.json();
  setToken(data.access, data.refresh || refreshToken);
  return data.access;
}

/**
 * Refresh the access token, deduplicating concurrent calls.
 */
export function refreshAccessToken() {
  if (_isRefreshing) {
    return new Promise(function (resolve, reject) {
      _refreshQueue.push({ resolve: resolve, reject: reject });
    });
  }
  _isRefreshing = true;
  return _doRefresh()
    .then(function (newToken) {
      _isRefreshing = false;
      for (var i = 0; i < _refreshQueue.length; i++) {
        _refreshQueue[i].resolve(newToken);
      }
      _refreshQueue = [];
      return newToken;
    })
    .catch(function (err) {
      _isRefreshing = false;
      for (var i = 0; i < _refreshQueue.length; i++) {
        _refreshQueue[i].reject(err);
      }
      _refreshQueue = [];
      throw err;
    });
}

// ─── Core request function ──────────────────────────────────────

async function request(url, options) {
  if (!options) options = {};
  var method = (options.method || 'GET').toUpperCase();
  var headers = Object.assign({}, options.headers || {});
  var isFormData = options.body instanceof FormData;
  var _skipRefresh = options._skipRefresh || false;

  // Auth header
  var token = getToken();
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  // Native platform header — tells backend to return refresh token in body
  headers['X-Client-Platform'] = 'native';

  // JSON body — auto-serialize and convert camelCase -> snake_case
  if (options.body && typeof options.body === 'object' && !isFormData) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(camelToSnake(options.body));
  }

  // Build full URL
  var fullUrl = url.startsWith('http') ? url : API_BASE + url;

  var response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      method: method,
      headers: headers,
    });
  } catch (fetchError) {
    // AbortError
    if (fetchError && fetchError.name === 'AbortError') {
      throw fetchError;
    }
    // Network error
    var networkMsg =
      'Network error: ' +
      (fetchError && fetchError.message ? fetchError.message : String(fetchError));
    if (method !== 'GET' && method !== 'HEAD') {
      enqueueOfflineMutation(url, { method: method, body: options.body ? options.body : null });
      var offlineError = new Error(networkMsg);
      offlineError.status = 0;
      offlineError.offline = true;
      throw offlineError;
    }
    var getError = new Error(networkMsg);
    getError.status = 0;
    getError.offline = true;
    throw getError;
  }

  // ─── Handle blob responses ────────────────────────────────
  if (options.responseType === 'blob' && response.ok) {
    return response.blob();
  }

  // ─── Error handling ─────────────────────────────────────────
  if (!response.ok) {
    // 401 — try silent refresh before giving up
    if (response.status === 401 && !_skipRefresh && !url.includes(REFRESH_URL)) {
      try {
        var newToken = await refreshAccessToken();
        var retryHeaders = Object.assign({}, options.headers || {});
        retryHeaders['Authorization'] = 'Bearer ' + newToken;
        return request(url, {
          ...options,
          headers: retryHeaders,
          _skipRefresh: true,
        });
      } catch (refreshErr) {
        // Refresh failed — emit auth event so navigation can handle redirect
        clearAuth();
        _emitAuthEvent({ type: 'session_expired' });
        var authError = new Error('Session expired. Please log in again.');
        authError.status = 401;
        throw authError;
      }
    }

    var errorBody = null;
    try {
      errorBody = await response.json();
    } catch (e) {
      /* ignore */
    }

    // Extract the most useful error message from the response body
    var _firstFieldMsg = null;
    var fieldErrors = {};
    if (errorBody && typeof errorBody === 'object') {
      for (var _fk in errorBody) {
        if (Array.isArray(errorBody[_fk]) && errorBody[_fk].length > 0) {
          if (!_firstFieldMsg) _firstFieldMsg = errorBody[_fk][0];
          fieldErrors[_fk] = errorBody[_fk][0];
        }
      }
    }

    var _cleanError = errorBody?.error;
    if (_cleanError && /ErrorDetail|non_field_errors|password1|password2/.test(_cleanError)) {
      _cleanError = null;
    }
    var error = new Error(
      errorBody?.detail ||
        errorBody?.non_field_errors?.[0] ||
        _cleanError ||
        errorBody?.message ||
        _firstFieldMsg ||
        'Request failed: ' + response.status,
    );
    error.status = response.status;
    error.body = errorBody ? snakeToCamel(errorBody) : null;

    if (Object.keys(fieldErrors).length > 0) {
      error.fieldErrors = snakeToCamel(fieldErrors);
    }

    error.userMessage = getUserMessage(error);

    // Emit events for subscription-gated 403s
    if (error.status === 403 && error.body && error.body.code === 'subscription_required') {
      _emitAuthEvent({
        type: 'subscription_required',
        detail: {
          requiredTier: error.body.requiredTier || 'premium',
          featureName: error.body.featureName || '',
          message: error.body.error || error.message,
        },
      });
    }

    // Emit events for daily quota 429s
    if (error.status === 429 && error.body && error.body.code === 'daily_quota_exceeded') {
      _emitAuthEvent({
        type: 'daily_quota_exceeded',
        detail: {
          category: error.body.category || '',
          limit: error.body.limit || 0,
          used: error.body.used || 0,
          remaining: error.body.remaining || 0,
          resetAt: error.body.resetAt || '',
        },
      });
    }

    throw error;
  }

  // ─── Parse response ─────────────────────────────────────────
  if (response.status === 204) return null;

  var contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    var data = await response.json();
    return snakeToCamel(data);
  }

  var text = await response.text();
  if (text && (text.charAt(0) === '{' || text.charAt(0) === '[')) {
    try {
      return snakeToCamel(JSON.parse(text));
    } catch (_e) {
      /* not JSON */
    }
  }
  return text;
}

// ─── Convenience methods ────────────────────────────────────────────

export function apiGet(url, options) {
  return request(url, { ...options, method: 'GET' });
}

export function apiPost(url, body, options) {
  return request(url, { ...options, method: 'POST', body: body });
}

export function apiPut(url, body, options) {
  return request(url, { ...options, method: 'PUT', body: body });
}

export function apiPatch(url, body, options) {
  return request(url, { ...options, method: 'PATCH', body: body });
}

export function apiDelete(url, options) {
  return request(url, { ...options, method: 'DELETE' });
}

export function apiUpload(url, formData, options) {
  return request(url, {
    ...options,
    method: 'POST',
    body: formData,
  });
}

// ── Offline Mutation Queue ──────────────────────────────────────
var QUEUE_KEY = 'dp-offline-queue';

function getQueue() {
  return AsyncStorage.getItem(QUEUE_KEY)
    .then(function (raw) {
      return raw ? JSON.parse(raw) : [];
    })
    .catch(function () {
      return [];
    });
}

function saveQueue(queue) {
  return AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(function () {});
}

export function getOfflineQueueCount() {
  return getQueue().then(function (q) {
    return q.length;
  });
}

export function enqueueOfflineMutation(url, options) {
  var sensitivePatterns = [
    '/auth/',
    '/2fa/',
    '/password/',
    '/delete-account',
    '/conversations/',
    '/users/',
    '/social/report',
    '/export',
    '/subscription/',
  ];
  for (var i = 0; i < sensitivePatterns.length; i++) {
    if (url.indexOf(sensitivePatterns[i]) !== -1) return;
  }
  getQueue().then(function (queue) {
    var filtered = queue.filter(function (item) {
      return Date.now() - item.timestamp < 86400000;
    });
    filtered.push({
      url: url,
      method: options.method || 'POST',
      body: options.body || null,
      timestamp: Date.now(),
    });
    saveQueue(filtered);
  });
}

export async function flushOfflineQueue() {
  var queue = await getQueue();
  if (queue.length === 0) return 0;

  var flushed = 0;
  var failed = [];

  for (var i = 0; i < queue.length; i++) {
    var item = queue[i];
    try {
      await request(item.url, {
        method: item.method,
        body: item.body ? JSON.parse(item.body) : undefined,
      });
      flushed++;
    } catch (e) {
      failed.push(item);
      failed = failed.concat(queue.slice(i + 1));
      break;
    }
  }

  await saveQueue(failed);
  return flushed;
}
