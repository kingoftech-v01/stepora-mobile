/**
 * Stepora Mobile — Main App Component
 *
 * Sets up all providers (Auth, Theme, I18n, Toast, React Query)
 * and renders the root navigator.
 */

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet, AppState } from 'react-native';
import { flushOfflineQueue } from './services/api';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';
import { ToastProvider } from './context/ToastContext';
import { NetworkProvider } from './context/NetworkContext';
import RootNavigator from './navigation/RootNavigator';
import OfflineBanner from './components/shared/OfflineBanner';

// ─── Ad compliance & initialization ─────────────────────────────────
// Order matters: ATT (iOS) → GDPR consent (EU) → AdMob SDK init
var { requestTrackingPermission } = require('./services/trackingConsent');
var { gatherGDPRConsent } = require('./services/adsConsent');
var { initAdMob } = require('./services/admobInit');

requestTrackingPermission()
  .then(function (trackingStatus) {
    console.log('[App] ATT status:', trackingStatus);
    return gatherGDPRConsent();
  })
  .then(function (consentInfo) {
    console.log('[App] GDPR consent:', consentInfo);
    return initAdMob();
  })
  .catch(function (err) {
    console.warn('[App] Ad initialization chain failed — ads may not load:', err);
  });

// ─── React Query client ──────────────────────────────────────────
var queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours — keep cached data for offline access
      refetchOnWindowFocus: false, // Not applicable on RN but harmless
    },
  },
});

export default function App() {
  // Flush offline queue when app comes to foreground
  useEffect(function () {
    var sub = AppState.addEventListener('change', function (state) {
      if (state === 'active') {
        flushOfflineQueue().catch(function () {});
      }
    });
    return function () { sub.remove(); };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <ThemeProvider>
              <ToastProvider>
                <NetworkProvider>
                  <AuthProvider>
                    <OfflineBanner />
                    <RootNavigator />
                  </AuthProvider>
                </NetworkProvider>
              </ToastProvider>
            </ThemeProvider>
          </I18nProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

var styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
