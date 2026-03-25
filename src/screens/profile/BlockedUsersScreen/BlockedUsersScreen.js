/**
 * BlockedUsersScreen -- React Native.
 * Manage blocked users: view list, unblock with confirmation.
 */
var React = require('react');
var {
  View, Text, TouchableOpacity, FlatList, Image,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var useBlockedUsersScreen = require('./useBlockedUsersScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

/* ─── User Row ────────────────────────────────────────────── */
function UserRow(props) {
  var h = props.hook;
  var user = props.item;
  var userId = user.id || user.userId || user.blockedUser;
  var isUnblocking = h.unblocking[userId];
  var avatarUrl = h.getAvatarUrl(user);

  return (
    <View style={styles.userCard}>
      <View style={styles.userRow}>
        {/* Avatar */}
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} accessible={true} accessibilityRole="image" accessibilityLabel={h.getUserName(user) + ' avatar'} />
        ) : (
          <View style={styles.avatarFallback} accessible={true} accessibilityRole="image" accessibilityLabel={h.getUserName(user) + ' avatar'}>
            <Text style={styles.avatarInitial}>{h.getUserInitial(user)}</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{h.getUserName(user)}</Text>
          {user.username ? (
            <Text style={styles.userHandle}>@{user.username}</Text>
          ) : null}
          <Text style={styles.blockedDate}>{h.getBlockedDate(user)}</Text>
        </View>

        {/* Unblock Button */}
        <TouchableOpacity
          style={[styles.unblockBtn, isUnblocking && styles.btnDisabled]}
          onPress={function () { h.handleUnblock(user); }}
          disabled={isUnblocking}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={'Unblock ' + h.getUserName(user)}
          accessibilityState={{ disabled: !!isUnblocking, busy: !!isUnblocking }}
        >
          {isUnblocking ? (
            <ActivityIndicator color={BRAND.redSolid} size="small" />
          ) : (
            <Text style={styles.unblockBtnText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Empty State ─────────────────────────────────────────── */
function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyIcon}>🕊️</Text>
      </View>
      <Text style={styles.emptyTitle}>No Blocked Users</Text>
      <Text style={styles.emptyDesc}>
        You have not blocked anyone. When you block a user, they will appear here and you can unblock them at any time.
      </Text>
    </View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────── */
function BlockedUsersScreen() {
  var h = useBlockedUsersScreen();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>{'<-'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">Blocked Users</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Count badge */}
        {!h.loading && h.users.length > 0 ? (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {h.users.length} {h.users.length === 1 ? 'user' : 'users'} blocked
            </Text>
          </View>
        ) : null}
      </View>

      {/* Error */}
      {h.error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{h.error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={h.fetchBlocked} activeOpacity={0.7} accessible={true} accessibilityRole="button" accessibilityLabel="Retry loading blocked users">
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Loading */}
      {h.loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.purple} size="large" />
          <Text style={styles.loadingText}>Loading blocked users...</Text>
        </View>
      ) : h.users.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={h.users}
          keyExtractor={function (item, index) {
            return String(item.id || item.userId || item.blockedUser || index);
          }}
          renderItem={function (info) {
            return <UserRow item={info.item} hook={h} />;
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={function () { return <View style={{ height: 0 }} />; }}
        />
      )}

      {/* Info footer */}
      {!h.loading && h.users.length > 0 ? (
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Blocked users cannot see your profile, send you messages, or interact with your content.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  headerWrap: { paddingHorizontal: 16, paddingTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  backText: { fontSize: 14, color: dark.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: dark.text },
  countRow: { marginBottom: 12 },
  countText: { fontSize: 12, color: dark.textMuted, textAlign: 'center' },

  // Error
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  errorText: { fontSize: 13, color: BRAND.redSolid, flex: 1, lineHeight: 19 },
  retryBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: BRAND.purple, marginLeft: 10 },
  retryText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: dark.textMuted },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },

  // User card
  userCard: {
    backgroundColor: dark.glassBg, borderRadius: 16,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 14, marginBottom: 8,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  // Avatar
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: BRAND.purpleLight },

  // User info
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 15, fontWeight: '600', color: dark.text },
  userHandle: { fontSize: 12, color: dark.textTertiary, marginTop: 1 },
  blockedDate: { fontSize: 11, color: dark.textMuted, marginTop: 2 },

  // Unblock button
  unblockBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    minWidth: 80, alignItems: 'center',
  },
  unblockBtnText: { fontSize: 13, fontWeight: '600', color: BRAND.redSolid },
  btnDisabled: { opacity: 0.5 },

  // Empty state
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: dark.text, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: dark.textTertiary, textAlign: 'center', lineHeight: 19 },

  // Footer
  footerInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: BRAND.bgDeep, borderTopWidth: 1, borderTopColor: dark.divider,
  },
  footerText: { fontSize: 11, color: dark.textMuted, textAlign: 'center', lineHeight: 16 },
});

module.exports = BlockedUsersScreen;
