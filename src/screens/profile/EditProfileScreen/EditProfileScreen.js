/**
 * EditProfileScreen -- React Native.
 * Ported from EditProfileMobile.jsx (web app).
 */
var React = require('react');
var {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} = require('react-native');
var useEditProfileScreen = require('./useEditProfileScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

function EditProfileScreen() {
  var h = useEditProfileScreen();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>{'<-'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">Edit Profile</Text>
          <View style={{ width: 60, alignItems: 'flex-end' }}>
            {h.hasChanges && !h.saving ? (
              <Text style={styles.unsavedText}>Unsaved</Text>
            ) : h.saving ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ActivityIndicator color={BRAND.greenSolid} size="small" />
                <Text style={styles.savingText}>Saving</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle} accessible={true} accessibilityRole="image" accessibilityLabel="Profile avatar">
              {h.avatarPreview ? (
                <Image source={{ uri: h.avatarPreview }} style={styles.avatarImage} accessible={false} />
              ) : h.userAvatarUrl ? (
                <Image source={{ uri: h.userAvatarUrl }} style={styles.avatarImage} accessible={false} />
              ) : (
                <Text style={styles.avatarInitial} accessible={false}>{h.userInitial}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={function () { h.setShowPicker(true); }}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cameraEmoji}>{'camera'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap the camera to change your photo</Text>
        </View>

        {/* Server Error */}
        {h.errors.server ? (
          <View style={styles.errorBox} accessibilityLiveRegion="assertive" accessibilityRole="alert">
            <Text style={styles.errorText}>{h.errors.server}</Text>
          </View>
        ) : null}

        {/* Avatar Error */}
        {h.errors.avatar ? (
          <View style={styles.errorBox} accessibilityLiveRegion="assertive" accessibilityRole="alert">
            <Text style={styles.errorText}>{h.errors.avatar}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={styles.card}>
          {/* Display Name */}
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={[styles.input, h.errors.name ? styles.inputError : null]}
            placeholder="Your name"
            placeholderTextColor={dark.textMuted}
            value={h.name}
            onChangeText={h.setName}
            autoCapitalize="words"
            maxLength={50}
            accessible={true}
            accessibilityLabel="Display Name"
            textContentType="name"
            autoComplete="name"
          />
          {h.errors.name ? (
            <Text style={styles.fieldError} accessibilityLiveRegion="polite" accessibilityRole="alert">{h.errors.name}</Text>
          ) : null}

          {/* Email (disabled) */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={h.userEmail}
            editable={false}
            selectTextOnFocus={false}
            accessible={true}
            accessibilityLabel="Email, read only"
          />

          {/* Timezone */}
          <Text style={styles.label}>Timezone</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. America/New_York"
            placeholderTextColor={dark.textMuted}
            value={h.timezone}
            onChangeText={h.setTimezone}
            autoCapitalize="none"
            accessible={true}
            accessibilityLabel="Timezone"
          />

          {/* Bio */}
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself..."
            placeholderTextColor={dark.textMuted}
            value={h.bio}
            onChangeText={h.setBio}
            multiline
            maxLength={200}
            textAlignVertical="top"
            accessible={true}
            accessibilityLabel="Bio"
            accessibilityHint="Maximum 200 characters"
          />
          <Text style={styles.charCount}>{h.bio.length} / 200</Text>
          {h.errors.bio ? (
            <Text style={styles.fieldError} accessibilityLiveRegion="polite" accessibilityRole="alert">{h.errors.bio}</Text>
          ) : null}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, (!h.hasChanges || h.saving) && styles.btnDisabled]}
          onPress={h.handleSave}
          disabled={!h.hasChanges || h.saving}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Save Changes"
          accessibilityState={{ disabled: !h.hasChanges || !!h.saving, busy: !!h.saving }}
        >
          {h.saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Success Toast */}
        {h.showToast ? (
          <View style={styles.toast} accessibilityLiveRegion="assertive" accessibilityRole="alert">
            <Text style={styles.toastText}>Profile updated!</Text>
          </View>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={h.showPicker}
        transparent
        animationType="fade"
        onRequestClose={function () { h.setShowPicker(false); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={function () { h.setShowPicker(false); }}
        >
          <View style={styles.modalContent} accessibilityViewIsModal={true}>
            <Text style={styles.modalTitle} accessibilityRole="header">Change Photo</Text>

            <TouchableOpacity style={styles.pickerOption} onPress={h.handleTakePhoto} activeOpacity={0.7} accessible={true} accessibilityRole="button" accessibilityLabel="Take Photo">
              <View style={[styles.pickerIconWrap, { backgroundColor: 'rgba(196,181,253,0.12)' }]}>
                <Text style={styles.pickerEmoji}>{'cam'}</Text>
              </View>
              <Text style={styles.pickerLabel}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickerOption} onPress={h.handleChooseGallery} activeOpacity={0.7} accessible={true} accessibilityRole="button" accessibilityLabel="Choose from Gallery">
              <View style={[styles.pickerIconWrap, { backgroundColor: 'rgba(93,229,168,0.12)' }]}>
                <Text style={styles.pickerEmoji}>{'img'}</Text>
              </View>
              <Text style={styles.pickerLabel}>Choose from Gallery</Text>
            </TouchableOpacity>

            {h.avatarPreview ? (
              <TouchableOpacity style={styles.pickerOption} onPress={h.handleRemovePhoto} activeOpacity={0.7} accessible={true} accessibilityRole="button" accessibilityLabel="Remove Photo">
                <View style={[styles.pickerIconWrap, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                  <Text style={styles.pickerEmoji}>{'X'}</Text>
                </View>
                <Text style={[styles.pickerLabel, { color: 'rgba(239,68,68,0.8)' }]}>Remove Photo</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={function () { h.setShowPicker(false); }}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backText: { fontSize: 14, color: dark.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: dark.text },
  unsavedText: { fontSize: 11, fontWeight: '500', color: BRAND.yellow },
  savingText: { fontSize: 11, fontWeight: '600', color: BRAND.greenSolid },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarRing: { position: 'relative', width: 120, height: 120 },
  avatarCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 3, borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 42, fontWeight: '800', color: BRAND.purpleLight },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: BRAND.purpleDark,
    borderWidth: 3, borderColor: BRAND.bgDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  cameraEmoji: { fontSize: 14, color: '#fff', fontWeight: '600' },
  avatarHint: { fontSize: 12, color: dark.textTertiary, marginTop: 10 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: BRAND.redSolid, lineHeight: 19 },
  card: {
    backgroundColor: dark.glassBg, borderRadius: 20,
    borderWidth: 1, borderColor: dark.glassBorder, padding: 20,
  },
  label: { fontSize: 13, fontWeight: '500', color: dark.textSecondary, marginBottom: 8, marginTop: 14 },
  input: {
    height: 50, borderRadius: 14,
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.inputBorder,
    paddingHorizontal: 16, fontSize: 15, color: dark.text,
  },
  inputError: { borderColor: BRAND.redSolid },
  inputDisabled: { opacity: 0.5 },
  textArea: { height: 90, paddingTop: 14 },
  charCount: { fontSize: 11, color: dark.textMuted, textAlign: 'right', marginTop: 4 },
  fieldError: { fontSize: 12, color: BRAND.redSolid, marginTop: 4 },
  saveBtn: {
    height: 52, borderRadius: 14, backgroundColor: BRAND.purple,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  toast: {
    position: 'absolute', top: 24, alignSelf: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12,
  },
  toastText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    width: '100%', maxWidth: 340,
    backgroundColor: BRAND.bgMid, borderRadius: 20,
    borderWidth: 1, borderColor: dark.glassBorder, padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: dark.text, marginBottom: 16, textAlign: 'center' },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, paddingHorizontal: 4,
  },
  pickerIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pickerEmoji: { fontSize: 16 },
  pickerLabel: { fontSize: 15, fontWeight: '500', color: dark.text },
  cancelBtn: {
    height: 44, borderRadius: 12,
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '500', color: dark.textSecondary },
});

module.exports = EditProfileScreen;
