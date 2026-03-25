/**
 * SettingsScreen -- React Native.
 * Ported from SettingsMobile.jsx (web app).
 */
var React = require('react');
var {
  View, Text, TextInput, TouchableOpacity, ScrollView, Switch,
  StyleSheet, ActivityIndicator, Modal, FlatList,
} = require('react-native');
var useSettingsScreen = require('./useSettingsScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

/* ─── Reusable Toggle ─────────────────────────────────────────── */
function Toggle(props) {
  return (
    <TouchableOpacity
      onPress={props.onToggle}
      activeOpacity={0.7}
      style={[toggleStyles.track, props.on ? toggleStyles.trackOn : null]}
      accessible={true}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!props.on }}
      accessibilityLabel={props.label || ''}
    >
      <View style={[toggleStyles.thumb, props.on ? toggleStyles.thumbOn : null]} />
    </TouchableOpacity>
  );
}

var toggleStyles = StyleSheet.create({
  track: {
    width: 44, height: 26, borderRadius: 13, padding: 2,
    backgroundColor: dark.accentSoft, justifyContent: 'center',
  },
  trackOn: { backgroundColor: 'rgba(93,229,168,0.3)' },
  thumb: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: dark.textMuted,
  },
  thumbOn: {
    backgroundColor: '#5DE5A8',
    alignSelf: 'flex-end',
  },
});

/* ─── Reusable Tile ───────────────────────────────────────────── */
function Tile(props) {
  var color = props.color || '#C4B5FD';
  var content = (
    <View style={tileStyles.row}>
      <View style={[tileStyles.iconWrap, { backgroundColor: color + '15' }]}>
        <View style={[tileStyles.dot, { backgroundColor: color }]} />
      </View>
      <View style={tileStyles.textWrap}>
        <Text style={tileStyles.title}>{props.title}</Text>
        {props.sub ? <Text style={tileStyles.sub}>{props.sub}</Text> : null}
      </View>
      {props.right || <Text style={tileStyles.chevron}>{'>'}</Text>}
    </View>
  );

  if (props.onPress) {
    return (
      <TouchableOpacity
        style={tileStyles.card}
        onPress={props.onPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={props.title + (props.sub ? ', ' + props.sub : '')}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={tileStyles.card} accessible={true} accessibilityLabel={props.title + (props.sub ? ', ' + props.sub : '')}>{content}</View>;
}

var tileStyles = StyleSheet.create({
  card: {
    backgroundColor: dark.glassBg, borderRadius: 14,
    borderWidth: 1, borderColor: dark.glassBorder,
    marginBottom: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '500', color: dark.text },
  sub: { fontSize: 12, color: dark.textTertiary, marginTop: 1 },
  chevron: { fontSize: 18, color: dark.textMuted, fontWeight: '500' },
});

/* ─── Section Header ──────────────────────────────────────────── */
function SectionHeader(props) {
  return (
    <Text style={sectionStyles.title} accessibilityRole="header">{props.title}</Text>
  );
}

var sectionStyles = StyleSheet.create({
  title: {
    fontSize: 12, fontWeight: '700', color: dark.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingLeft: 4, marginBottom: 8, marginTop: 12,
  },
});

/* ─── Main Screen ─────────────────────────────────────────────── */
function SettingsScreen() {
  var h = useSettingsScreen();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>{'<-'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ─── Account Section ─────────────────────────────── */}
        <SectionHeader title="Account" />
        <Tile
          title="Edit Profile"
          sub={(h.user && (h.user.displayName || h.user.display_name)) || ''}
          color="#C4B5FD"
          onPress={function () { h.navigation.navigate('EditProfile'); }}
        />
        <Tile
          title="Email"
          sub={(h.user && h.user.email) || ''}
          color="#C4B5FD"
          onPress={function () {
            h.setShowEmailChange(true);
            h.setNewEmail('');
          }}
        />
        <Tile
          title="Change Password"
          color="#C4B5FD"
          onPress={function () { h.navigation.navigate('ChangePassword'); }}
        />
        <Tile
          title="Two-Factor Auth"
          color="#C4B5FD"
          onPress={function () { h.navigation.navigate('TwoFactorAuth'); }}
        />
        <Tile
          title="Blocked Users"
          color="#C4B5FD"
          onPress={function () { h.navigation.navigate('BlockedUsers'); }}
        />
        <Tile
          title="Data Export"
          color="#C4B5FD"
          onPress={function () { h.navigation.navigate('DataExport'); }}
        />

        {/* ─── Preferences Section ─────────────────────────── */}
        <SectionHeader title="Preferences" />
        <Tile
          title="Language"
          sub={h.langLabel}
          color="#C4B5FD"
          onPress={function () { h.setShowLang(true); }}
        />
        <Tile
          title="Timezone"
          sub={h.tzLabel}
          color="#C4B5FD"
          onPress={function () { h.setShowTz(true); }}
        />
        <Tile
          title="Push Notifications"
          color="#C4B5FD"
          right={<Toggle on={h.notifs.push} onToggle={function () { h.handleToggleNotif('push'); }} label="Push Notifications" />}
        />
        <Tile
          title="Email Notifications"
          color="#C4B5FD"
          right={<Toggle on={h.notifs.email} onToggle={function () { h.handleToggleNotif('email'); }} label="Email Notifications" />}
        />
        <Tile
          title="Buddy Reminders"
          color="#5EEAD4"
          right={<Toggle on={h.notifs.buddy} onToggle={function () { h.handleToggleNotif('buddy'); }} label="Buddy Reminders" />}
        />
        <Tile
          title="Do Not Disturb"
          sub={h.dndEnabled ? h.dndStart + ' - ' + h.dndEnd : undefined}
          color="#C4B5FD"
          right={<Toggle on={h.dndEnabled} onToggle={h.handleToggleDnd} label="Do Not Disturb" />}
        />
        {h.dndEnabled ? (
          <View style={styles.dndCard}>
            <View style={styles.dndRow}>
              <View style={styles.dndCol}>
                <Text style={styles.dndLabel}>From</Text>
                <TextInput
                  style={styles.dndInput}
                  value={h.dndStart}
                  onChangeText={h.setDndStart}
                  placeholder="22:00"
                  placeholderTextColor={dark.textMuted}
                  accessible={true}
                  accessibilityLabel="Do not disturb start time"
                />
              </View>
              <View style={styles.dndCol}>
                <Text style={styles.dndLabel}>To</Text>
                <TextInput
                  style={styles.dndInput}
                  value={h.dndEnd}
                  onChangeText={h.setDndEnd}
                  placeholder="07:00"
                  placeholderTextColor={dark.textMuted}
                  accessible={true}
                  accessibilityLabel="Do not disturb end time"
                />
              </View>
            </View>
          </View>
        ) : null}
        <Tile
          title="Google Calendar"
          sub="Sync events"
          color="#93C5FD"
          onPress={function () { h.navigation.navigate('CalendarConnect'); }}
        />

        {/* ─── Subscription Section ────────────────────────── */}
        <SectionHeader title="Subscription" />
        <Tile
          title="Manage Subscription"
          sub={
            h.user && h.user.subscription && h.user.subscription !== 'free'
              ? h.user.subscription.charAt(0).toUpperCase() + h.user.subscription.slice(1)
              : 'Free Plan'
          }
          color="#FCD34D"
          onPress={function () { h.navigation.navigate('Subscription'); }}
        />
        <Tile
          title="Store"
          color="#5EEAD4"
          onPress={function () { h.navigation.navigate('Store'); }}
        />

        {/* ─── About Section ───────────────────────────────── */}
        <SectionHeader title="About" />
        <Tile
          title="App Version"
          sub="1.0.0"
          color="rgba(255,255,255,0.5)"
        />
        <Tile
          title="Terms of Service"
          color="rgba(255,255,255,0.5)"
          onPress={function () { h.navigation.navigate('TermsOfService'); }}
        />
        <Tile
          title="Privacy Policy"
          color="rgba(255,255,255,0.5)"
          onPress={function () { h.navigation.navigate('PrivacyPolicy'); }}
        />

        {/* ─── Danger Zone ─────────────────────────────────── */}
        <View style={{ marginTop: 20 }}>
          <TouchableOpacity style={styles.dangerBtn} onPress={h.handleSignOut} activeOpacity={0.7} accessible={true} accessibilityRole="button" accessibilityLabel="Sign Out">
            <Text style={styles.dangerBtnText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dangerBtn, { marginTop: 10 }]}
            onPress={function () {
              h.setShowDelete(true);
              h.setDeleteText('');
              h.setDeletePassword('');
            }}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Delete Account"
          >
            <Text style={styles.dangerBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── Language Picker Modal ─────────────────────────── */}
      <Modal
        visible={h.showLang}
        transparent
        animationType="fade"
        onRequestClose={function () { h.setShowLang(false); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={function () { h.setShowLang(false); }}
        >
          <View style={styles.modalContent} accessibilityViewIsModal={true}>
            <Text style={styles.modalTitle} accessibilityRole="header">Choose Language</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {h.LANGUAGES.map(function (l) {
                var active = h.locale === l.code;
                return (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.pickerItem, active ? styles.pickerItemActive : null]}
                    onPress={function () { h.setLocale(l.code); }}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={l.label + (active ? ', selected' : '')}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.pickerItemText, active ? styles.pickerItemTextActive : null]}>
                      {l.label}
                    </Text>
                    {active ? <Text style={styles.checkMark}>{'check'}</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Timezone Picker Modal ─────────────────────────── */}
      <Modal
        visible={h.showTz}
        transparent
        animationType="fade"
        onRequestClose={function () { h.setShowTz(false); h.setTzSearch(''); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={function () { h.setShowTz(false); h.setTzSearch(''); }}
        >
          <View style={[styles.modalContent, { maxHeight: '80%' }]} accessibilityViewIsModal={true}>
            <Text style={styles.modalTitle} accessibilityRole="header">Choose Timezone</Text>
            <TextInput
              style={styles.searchInput}
              value={h.tzSearch}
              onChangeText={h.setTzSearch}
              placeholder="Search timezones..."
              placeholderTextColor={dark.textMuted}
              autoFocus
              accessible={true}
              accessibilityLabel="Search timezones"
              accessibilityRole="search"
            />
            <ScrollView style={{ maxHeight: 350 }}>
              {h.filteredTimezones.map(function (tzItem) {
                var active = h.tz === tzItem.value;
                return (
                  <TouchableOpacity
                    key={tzItem.value}
                    style={[styles.pickerItem, active ? styles.pickerItemActive : null]}
                    onPress={function () { h.setTz(tzItem.value); }}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={tzItem.label + ', UTC' + tzItem.offset + (active ? ', selected' : '')}
                    accessibilityState={{ selected: active }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerItemText, active ? styles.pickerItemTextActive : null]}>
                        {tzItem.label}
                      </Text>
                      <Text style={styles.pickerItemSub}>UTC{tzItem.offset}</Text>
                    </View>
                    {active ? <Text style={styles.checkMark}>{'check'}</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Email Change Modal ────────────────────────────── */}
      <Modal
        visible={h.showEmailChange}
        transparent
        animationType="fade"
        onRequestClose={function () { h.setShowEmailChange(false); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={function () { h.setShowEmailChange(false); }}
        >
          <View style={styles.modalContent} accessibilityViewIsModal={true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <View style={[styles.modalDot, { backgroundColor: BRAND.purple }]} />
              </View>
              <View>
                <Text style={styles.modalHeaderTitle} accessibilityRole="header">Change Email</Text>
                <Text style={styles.modalHeaderSub}>A verification will be sent</Text>
              </View>
            </View>

            <Text style={styles.currentEmail}>
              Current: {(h.user && h.user.email) || ''}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={h.newEmail}
              onChangeText={h.setNewEmail}
              placeholder="New email address"
              placeholderTextColor={dark.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              accessible={true}
              accessibilityLabel="New email address"
              textContentType="emailAddress"
              autoComplete="email"
            />
            <TextInput
              style={styles.modalInput}
              value={h.emailPassword}
              onChangeText={h.setEmailPassword}
              placeholder="Enter your password"
              placeholderTextColor={dark.textMuted}
              secureTextEntry
              autoCapitalize="none"
              accessible={true}
              accessibilityLabel="Password"
              textContentType="password"
            />
            {h.is2faEnabled ? (
              <TextInput
                style={[styles.modalInput, { letterSpacing: 4, textAlign: 'center', fontSize: 18, fontWeight: '600' }]}
                value={h.emailTotpCode}
                onChangeText={function (val) {
                  var clean = val.replace(/[^0-9]/g, '');
                  if (clean.length <= 6) h.setEmailTotpCode(clean);
                }}
                placeholder="2FA Code"
                placeholderTextColor={dark.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                accessible={true}
                accessibilityLabel="Two-factor authentication code"
              />
            ) : null}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={function () {
                  h.setShowEmailChange(false);
                  h.setNewEmail('');
                  h.setEmailPassword('');
                  h.setEmailTotpCode('');
                }}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn, styles.modalBtnPrimary,
                  (!h.newEmail || !h.emailPassword || (h.is2faEnabled && h.emailTotpCode.length !== 6)) && styles.btnDisabled,
                ]}
                onPress={h.handleChangeEmail}
                disabled={!h.newEmail || !h.emailPassword || (h.is2faEnabled && h.emailTotpCode.length !== 6)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Save email change"
                accessibilityState={{ disabled: !h.newEmail || !h.emailPassword || (h.is2faEnabled && h.emailTotpCode.length !== 6), busy: !!h.savingEmail }}
              >
                {h.savingEmail ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Delete Account Modal ──────────────────────────── */}
      <Modal
        visible={h.showDelete}
        transparent
        animationType="fade"
        onRequestClose={function () { h.setShowDelete(false); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={function () { h.setShowDelete(false); }}
        >
          <View style={styles.modalContent} accessibilityViewIsModal={true}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <View style={[styles.modalDot, { backgroundColor: BRAND.redSolid }]} />
              </View>
              <View>
                <Text style={styles.modalHeaderTitle} accessibilityRole="header">Delete Account</Text>
                <Text style={styles.modalHeaderSub}>This cannot be undone</Text>
              </View>
            </View>

            <Text style={styles.deleteWarning} accessibilityRole="alert">
              All your data will be permanently deleted. Type{' '}
              <Text style={{ color: BRAND.redSolid, fontWeight: '700' }}>DELETE</Text>
              {' '}to confirm.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={h.deleteText}
              onChangeText={h.setDeleteText}
              placeholder='Type "DELETE"'
              placeholderTextColor={dark.textMuted}
              autoCapitalize="characters"
              accessible={true}
              accessibilityLabel="Type DELETE to confirm account deletion"
            />
            <TextInput
              style={styles.modalInput}
              value={h.deletePassword}
              onChangeText={h.setDeletePassword}
              placeholder="Enter your password"
              placeholderTextColor={dark.textMuted}
              secureTextEntry
              autoCapitalize="none"
              accessible={true}
              accessibilityLabel="Password for account deletion"
              textContentType="password"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={function () { h.setShowDelete(false); }}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn, styles.modalBtnDanger,
                  (h.deleteText !== 'DELETE' || !h.deletePassword) && styles.btnDisabled,
                ]}
                onPress={h.handleDeleteAccount}
                disabled={h.deleteText !== 'DELETE' || !h.deletePassword}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Delete account permanently"
                accessibilityState={{ disabled: h.deleteText !== 'DELETE' || !h.deletePassword, busy: !!h.deletingAccount }}
              >
                {h.deletingAccount ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalBtnDangerText}>Delete Forever</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backText: { fontSize: 14, color: dark.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: dark.text },
  dndCard: {
    backgroundColor: dark.glassBg, borderRadius: 14,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 14, marginBottom: 6,
  },
  dndRow: { flexDirection: 'row', gap: 12 },
  dndCol: { flex: 1 },
  dndLabel: { fontSize: 12, fontWeight: '600', color: dark.textTertiary, marginBottom: 6 },
  dndInput: {
    height: 42, borderRadius: 10,
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.inputBorder,
    paddingHorizontal: 12, fontSize: 14, color: dark.text,
  },
  dangerBtn: {
    height: 48, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  dangerBtnText: { fontSize: 15, fontWeight: '600', color: BRAND.redSolid },
  /* Modal styles */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    width: '100%', maxWidth: 380,
    backgroundColor: BRAND.bgMid, borderRadius: 20,
    borderWidth: 1, borderColor: dark.glassBorder, padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: dark.text, marginBottom: 14, textAlign: 'center' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  modalIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: dark.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  modalDot: { width: 12, height: 12, borderRadius: 6 },
  modalHeaderTitle: { fontSize: 16, fontWeight: '600', color: dark.text },
  modalHeaderSub: { fontSize: 12, color: dark.textTertiary },
  currentEmail: { fontSize: 13, color: dark.textPrimary, marginBottom: 12, lineHeight: 20 },
  deleteWarning: { fontSize: 13, color: dark.textPrimary, marginBottom: 16, lineHeight: 20 },
  modalInput: {
    height: 48, borderRadius: 12,
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.inputBorder,
    paddingHorizontal: 16, fontSize: 15, color: dark.text, marginBottom: 10,
  },
  searchInput: {
    height: 44, borderRadius: 12,
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.inputBorder,
    paddingHorizontal: 14, fontSize: 14, color: dark.text, marginBottom: 10,
  },
  modalBtnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  modalBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnSecondary: {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.glassBorder,
  },
  modalBtnSecondaryText: { fontSize: 14, fontWeight: '500', color: dark.textSecondary },
  modalBtnPrimary: { backgroundColor: BRAND.purple },
  modalBtnPrimaryText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modalBtnDanger: { backgroundColor: BRAND.redSolid },
  modalBtnDangerText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4,
  },
  pickerItemActive: { backgroundColor: dark.accentSoft },
  pickerItemText: { fontSize: 14, fontWeight: '400', color: dark.textPrimary },
  pickerItemTextActive: { fontWeight: '600', color: BRAND.purple },
  pickerItemSub: { fontSize: 12, color: dark.textMuted, marginTop: 1 },
  checkMark: { fontSize: 14, fontWeight: '700', color: BRAND.purple },
});

module.exports = SettingsScreen;
