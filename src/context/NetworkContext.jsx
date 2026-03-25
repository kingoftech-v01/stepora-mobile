// ─── Network Context (React Native) ───────────────────────────────────
// Provides online/offline status and pending queue count.
// Uses periodic fetch-based connectivity checks since @react-native-community/netinfo
// is not installed. Also triggers offline queue flush on reconnect.

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { flushOfflineQueue, getOfflineQueueCount } from '../services/api';
import Config from '../config';

var NetworkContext = createContext({ isOnline: true, queueCount: 0 });

var CHECK_INTERVAL = 15000; // 15 seconds
var PING_TIMEOUT = 5000; // 5 second timeout for connectivity check

function checkConnectivity() {
  var controller;
  try {
    controller = new AbortController();
  } catch (_e) {
    controller = null;
  }
  var timeout = setTimeout(function () {
    if (controller) controller.abort();
  }, PING_TIMEOUT);

  return fetch(Config.API_BASE + '/api/health/', {
    method: 'HEAD',
    signal: controller ? controller.signal : undefined,
    cache: 'no-store',
  })
    .then(function () {
      clearTimeout(timeout);
      return true;
    })
    .catch(function () {
      clearTimeout(timeout);
      return false;
    });
}

export function NetworkProvider({ children }) {
  var [isOnline, setIsOnline] = useState(true);
  var [queueCount, setQueueCount] = useState(0);
  var wasOffline = useRef(false);
  var intervalRef = useRef(null);

  var updateQueueCount = useCallback(function () {
    getOfflineQueueCount().then(function (count) {
      setQueueCount(count);
    }).catch(function () {});
  }, []);

  var performCheck = useCallback(function () {
    checkConnectivity().then(function (online) {
      setIsOnline(online);
      if (online && wasOffline.current) {
        // Just came back online — flush queue
        wasOffline.current = false;
        flushOfflineQueue()
          .then(function () {
            updateQueueCount();
          })
          .catch(function () {});
      }
      if (!online) {
        wasOffline.current = true;
      }
      updateQueueCount();
    });
  }, [updateQueueCount]);

  // Periodic connectivity checks
  useEffect(function () {
    performCheck(); // Initial check
    intervalRef.current = setInterval(performCheck, CHECK_INTERVAL);
    return function () {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [performCheck]);

  // Check on app foreground
  useEffect(function () {
    var sub = AppState.addEventListener('change', function (state) {
      if (state === 'active') {
        performCheck();
      }
    });
    return function () { sub.remove(); };
  }, [performCheck]);

  var value = { isOnline: isOnline, queueCount: queueCount };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  return useContext(NetworkContext);
}
