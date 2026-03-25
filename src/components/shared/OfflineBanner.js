// ─── Offline Banner (React Native) ─────────────────────────────────
// Shows a banner when offline or when syncing queued changes.
// Auto-hides after sync is complete.
// Also exports OfflineDataBanner for showing cached data indicator.

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNetwork } from '../../context/NetworkContext';

export default function OfflineBanner() {
  var { isOnline, queueCount } = useNetwork();

  // Fully online with nothing to sync — hide banner
  if (isOnline && queueCount === 0) return null;

  var message = '';
  var bgColor = '#e53e3e'; // red for offline

  if (!isOnline) {
    message = 'You are offline';
    if (queueCount > 0) {
      message += ' — ' + queueCount + ' change' + (queueCount > 1 ? 's' : '') + ' pending';
    }
  } else if (queueCount > 0) {
    message = 'Syncing ' + queueCount + ' change' + (queueCount > 1 ? 's' : '') + '...';
    bgColor = '#dd6b20'; // orange for syncing
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

/**
 * OfflineDataBanner — small dismissible banner shown when a screen
 * is displaying cached/stale data because the latest fetch failed.
 */
export function OfflineDataBanner() {
  var [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View style={styles.cachedContainer}>
      <Text style={styles.cachedText}>Showing cached data</Text>
      <TouchableOpacity
        onPress={function () { setDismissed(true); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Dismiss cached data banner"
      >
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

var styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  cachedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dd6b20',
    paddingVertical: 5,
    paddingHorizontal: 16,
    gap: 10,
  },
  cachedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  dismissText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
