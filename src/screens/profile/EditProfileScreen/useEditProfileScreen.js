/**
 * useEditProfileScreen -- business logic for Edit Profile (React Native).
 * Adapted from the web app's useEditProfileScreen.js.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiPut, apiUpload } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');
var { sanitizeText } = require('../../../utils/sanitize');
var { BRAND, adaptColor } = require('../../../styles/colors');

function useEditProfileScreen() {
  var navigation = useNavigation();
  var t = function (key) { return key; };

  // Placeholder user - in production, would come from AuthContext
  var user = { displayName: 'User', email: 'user@stepora.app', bio: '', timezone: '', avatarUrl: null };

  var [mounted, setMounted] = useState(false);
  var [name, setName] = useState((user && (user.displayName || user.display_name)) || '');
  var [bio, setBio] = useState((user && user.bio) || '');
  var [timezone, setTimezone] = useState((user && user.timezone) || '');
  var [avatarPreview, setAvatarPreview] = useState(null);
  var [avatarFile, setAvatarFile] = useState(null);
  var [showPicker, setShowPicker] = useState(false);
  var [errors, setErrors] = useState({});
  var [saving, setSaving] = useState(false);
  var [showToast, setShowToast] = useState(false);

  var userEmail = (user && user.email) || '';
  var userInitial = user && (user.displayName || user.display_name)
    ? (user.displayName || user.display_name).charAt(0).toUpperCase()
    : '?';
  var userAvatarUrl = (user && user.avatarUrl) || null;

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
    if (!cleanName) e.name = 'Display name is required';
    else if (cleanName.length < 2) e.name = 'Name must be at least 2 characters';
    else if (cleanName.length > 50) e.name = 'Name must be under 50 characters';
    var cleanBio = bio.replace(/[<>"'`;\\]/g, '');
    if (cleanBio.length > 200) e.bio = 'Bio must be under 200 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  var handleSave = function () {
    if (!validate()) return;
    var cleanName = sanitizeText(name, 50);
    var cleanBio = sanitizeText(bio, 500);
    var cleanTimezone = sanitizeText(timezone, 100);
    if (!cleanName) return;

    setSaving(true);

    var promises = [];

    if (avatarFile) {
      var formData = new FormData();
      formData.append('avatar', avatarFile);
      promises.push(
        apiUpload(USERS.UPLOAD_AVATAR, formData).catch(function (err) {
          setErrors(function (prev) {
            return Object.assign({}, prev, { avatar: err.userMessage || err.message || 'Failed to upload avatar' });
          });
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
        setSaving(false);
        setShowToast(true);
        setTimeout(function () {
          setShowToast(false);
          navigation.goBack();
        }, 1200);
      })
      .catch(function (err) {
        setSaving(false);
        setErrors(function (prev) {
          return Object.assign({}, prev, { server: err.userMessage || err.message || 'Failed to update profile' });
        });
      });
  };

  var handleTakePhoto = function () {
    // TODO: Integrate react-native-image-picker or expo-image-picker for camera
    // For now, close picker
    setShowPicker(false);
  };

  var handleChooseGallery = function () {
    // TODO: Integrate react-native-image-picker or expo-image-picker for gallery
    // For now, close picker
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
    showToast: showToast,
    handleSave: handleSave,
    handleTakePhoto: handleTakePhoto,
    handleChooseGallery: handleChooseGallery,
    handleRemovePhoto: handleRemovePhoto,
    adaptColor: adaptColor,
    BRAND: BRAND,
  };
}

module.exports = useEditProfileScreen;
