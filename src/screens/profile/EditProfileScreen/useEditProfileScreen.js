/**
 * useEditProfileScreen -- business logic for Edit Profile (React Native).
 * Synced with web app's useEditProfileScreen.js.
 */
var { useState, useEffect, useRef } = require('react');
var { useNavigation } = require('@react-navigation/native');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;
var { apiPut, apiUpload } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');
var { sanitizeText } = require('../../../utils/sanitize');
var { BRAND, GRADIENTS, adaptColor } = require('../../../styles/colors');
var { useAuth } = require('../../../context/AuthContext');
var { useToast } = require('../../../context/ToastContext');
var { useT } = require('../../../context/I18nContext');

var PROFILE_DRAFT_KEY = 'dp-profile-draft';

function useEditProfileScreen() {
  var navigation = useNavigation();
  var { user, updateUser } = useAuth();
  var { showToast } = useToast();
  var { t } = useT();

  var [mounted, setMounted] = useState(false);
  var [name, setName] = useState((user && (user.displayName || user.display_name)) || '');
  var [bio, setBio] = useState((user && user.bio) || '');
  var [timezone, setTimezone] = useState((user && user.timezone) || '');
  var [avatarPreview, setAvatarPreview] = useState(null);
  var [avatarFile, setAvatarFile] = useState(null);
  var [showPicker, setShowPicker] = useState(false);
  var [errors, setErrors] = useState({});
  var [saving, setSaving] = useState(false);
  var draftLoaded = useRef(false);

  var userEmail = (user && user.email) || '';
  var userInitial = user && (user.displayName || user.display_name)
    ? (user.displayName || user.display_name).charAt(0).toUpperCase()
    : '?';
  var userAvatarUrl = (user && user.avatarUrl) || null;

  // Load draft on mount
  useEffect(function () {
    AsyncStorage.getItem(PROFILE_DRAFT_KEY).then(function (val) {
      if (val) {
        try {
          var d = JSON.parse(val);
          if (d.name) setName(d.name);
          if (d.bio !== undefined) setBio(d.bio);
          if (d.timezone) setTimezone(d.timezone);
          draftLoaded.current = true;
        } catch (e) { /* ignore malformed draft */ }
      }
    });
  }, []);

  // Auto-save draft every 5 seconds while editing
  useEffect(function () {
    var origName = (user && (user.displayName || user.display_name)) || '';
    var origBio = (user && user.bio) || '';
    var origTimezone = (user && user.timezone) || '';
    var changed = name !== origName || bio !== origBio || timezone !== origTimezone;
    var t2 = setInterval(function () {
      if (changed) {
        AsyncStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify({
          name: name,
          bio: bio,
          timezone: timezone,
        }));
      }
    }, 5000);
    return function () { clearInterval(t2); };
  }, [name, bio, timezone, user]);

  useEffect(function () {
    setTimeout(function () { setMounted(true); }, 100);
  }, []);

  var origName = (user && (user.displayName || user.display_name)) || '';
  var origBio = (user && user.bio) || '';
  var origTimezone = (user && user.timezone) || '';
  var hasChanges = name !== origName || bio !== origBio || timezone !== origTimezone || !!avatarPreview;

  var validate = function () {
    var e = {};
    var cleanName = name.replace(/[<>"'`;\\]/g, '').trim();
    if (!cleanName) e.name = t('editProfile.nameRequired') || 'Display name is required';
    else if (cleanName.length < 2) e.name = t('editProfile.nameTooShort') || 'Name must be at least 2 characters';
    else if (cleanName.length > 50) e.name = t('editProfile.nameTooLong') || 'Name must be under 50 characters';
    var cleanBio = bio.replace(/[<>"'`;\\]/g, '');
    if (cleanBio.length > 200) e.bio = t('editProfile.bioTooLong') || 'Bio must be under 200 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  var handleSave = function () {
    if (!validate()) return;
    var cleanName = sanitizeText(name, 50);
    var cleanBio = sanitizeText(bio, 500);
    var cleanTimezone = sanitizeText(timezone, 100);
    if (!cleanName) {
      showToast(t('editProfile.nameRequired') || 'Display name is required', 'error');
      return;
    }

    setSaving(true);

    var promises = [];

    if (avatarFile) {
      var formData = new FormData();
      formData.append('avatar', avatarFile);
      promises.push(
        apiUpload(USERS.UPLOAD_AVATAR, formData).then(function (data) {
          var newUrl = (data && data.avatarUrl) || null;
          if (updateUser) updateUser({ avatarUrl: newUrl });
        }).catch(function (err) {
          showToast(err.userMessage || err.message || 'Failed to upload avatar', 'error');
        })
      );
    }

    promises.push(
      apiPut(USERS.UPDATE_PROFILE, {
        displayName: cleanName,
        bio: cleanBio,
        timezone: cleanTimezone,
      })
    );

    Promise.all(promises)
      .then(function () {
        if (updateUser) updateUser({ displayName: cleanName.trim(), bio: cleanBio.trim(), timezone: cleanTimezone });
        setSaving(false);
        AsyncStorage.removeItem(PROFILE_DRAFT_KEY);
        showToast(t('editProfile.saved') || 'Profile updated successfully!', 'success');
        navigation.goBack();
      })
      .catch(function (err) {
        setSaving(false);
        showToast(err.userMessage || err.message || 'Failed to update profile', 'error');
      });
  };

  var handleTakePhoto = function () {
    // TODO: Integrate react-native-image-picker or expo-image-picker for camera
    setShowPicker(false);
  };

  var handleChooseGallery = function () {
    // TODO: Integrate react-native-image-picker or expo-image-picker for gallery
    setShowPicker(false);
  };

  var handleRemovePhoto = function () {
    setAvatarPreview(null);
    setAvatarFile(null);
    setShowPicker(false);
  };

  return {
    navigation: navigation,
    t: t,
    mounted: mounted,
    name: name,
    setName: setName,
    bio: bio,
    setBio: setBio,
    timezone: timezone,
    setTimezone: setTimezone,
    avatarPreview: avatarPreview,
    showPicker: showPicker,
    setShowPicker: setShowPicker,
    errors: errors,
    userEmail: userEmail,
    userInitial: userInitial,
    userAvatarUrl: userAvatarUrl,
    saving: saving,
    hasChanges: hasChanges,
    handleSave: handleSave,
    handleTakePhoto: handleTakePhoto,
    handleChooseGallery: handleChooseGallery,
    handleRemovePhoto: handleRemovePhoto,
    adaptColor: adaptColor,
    BRAND: BRAND,
    GRADIENTS: GRADIENTS,
  };
}

module.exports = useEditProfileScreen;
