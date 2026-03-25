/**
 * useOnboardingScreen — Business logic for the multi-step onboarding flow.
 * Steps: 1) Welcome + name, 2) Avatar, 3) Interests, 4) Notifications, 5) Subscription
 */
var { useState, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { Platform, Alert } = require('react-native');
var { useAuth } = require('../../../context/AuthContext');
var { apiPost, apiPatch, apiUpload } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');
var { requestPermission } = require('../../../services/pushNotifications');

var TOTAL_STEPS = 5;

var INTEREST_OPTIONS = [
  { key: 'travel', label: 'Travel', emoji: '\u2708\uFE0F' },
  { key: 'fitness', label: 'Fitness', emoji: '\uD83C\uDFCB\uFE0F' },
  { key: 'career', label: 'Career', emoji: '\uD83D\uDCBC' },
  { key: 'education', label: 'Education', emoji: '\uD83C\uDF93' },
  { key: 'finance', label: 'Finance', emoji: '\uD83D\uDCB0' },
  { key: 'creativity', label: 'Creativity', emoji: '\uD83C\uDFA8' },
  { key: 'health', label: 'Health', emoji: '\uD83E\uDDCB' },
  { key: 'relationships', label: 'Relationships', emoji: '\u2764\uFE0F' },
  { key: 'mindfulness', label: 'Mindfulness', emoji: '\uD83E\uDDD8' },
  { key: 'hobbies', label: 'Hobbies', emoji: '\uD83C\uDFB5' },
  { key: 'personal', label: 'Personal Growth', emoji: '\uD83C\uDF31' },
  { key: 'tech', label: 'Technology', emoji: '\uD83D\uDCBB' },
];

var useOnboardingScreen = function () {
  var navigation = useNavigation();
  var { user, updateUser, completeOnboarding, refreshUser } = useAuth();

  var [step, setStep] = useState(1);
  var [displayName, setDisplayName] = useState(
    (user && user.displayName) || (user && user.firstName) || ''
  );
  var [avatarUri, setAvatarUri] = useState(null);
  var [selectedInterests, setSelectedInterests] = useState([]);
  var [notifGranted, setNotifGranted] = useState(null);
  var [submitting, setSubmitting] = useState(false);
  var [error, setError] = useState('');

  // ─── Step navigation ────────────────────────────────────────

  var goNext = useCallback(function () {
    setError('');
    if (step === 1) {
      if (!displayName.trim()) {
        setError('Please enter your name');
        return;
      }
      // Save name to backend
      setSubmitting(true);
      apiPatch(USERS.UPDATE_PROFILE, { displayName: displayName.trim() })
        .then(function () {
          updateUser({ displayName: displayName.trim() });
          setStep(2);
        })
        .catch(function (err) {
          setError(err.userMessage || err.message || 'Failed to save name');
        })
        .finally(function () {
          setSubmitting(false);
        });
      return;
    }
    if (step === 2) {
      // Avatar upload (optional — can skip)
      if (avatarUri) {
        setSubmitting(true);
        var formData = new FormData();
        formData.append('avatar', {
          uri: avatarUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        });
        apiUpload(USERS.UPLOAD_AVATAR, formData)
          .then(function (data) {
            if (data && data.avatar) {
              updateUser({ avatar: data.avatar });
            }
            setStep(3);
          })
          .catch(function (err) {
            setError(err.userMessage || err.message || 'Failed to upload avatar');
          })
          .finally(function () {
            setSubmitting(false);
          });
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      // Save interests to backend
      if (selectedInterests.length > 0) {
        setSubmitting(true);
        apiPatch(USERS.UPDATE_PROFILE, { interests: selectedInterests })
          .then(function () {
            updateUser({ interests: selectedInterests });
            setStep(4);
          })
          .catch(function () {
            // Non-blocking: continue anyway
            setStep(4);
          })
          .finally(function () {
            setSubmitting(false);
          });
        return;
      }
      setStep(4);
      return;
    }
    if (step === 4) {
      // After notification step, go to personality quiz intro
      setStep(5);
      return;
    }
    if (step === 5) {
      // Navigate to PersonalityQuiz — matches web flow (onboarding -> quiz -> subscription)
      navigation.navigate('PersonalityQuiz');
      return;
    }
  }, [step, displayName, avatarUri, selectedInterests, navigation, updateUser]);

  var goBack = useCallback(function () {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  var skipStep = useCallback(function () {
    setError('');
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleFinishOnboarding();
    }
  }, [step]);

  // ─── Interest toggle ────────────────────────────────────────

  var toggleInterest = useCallback(function (key) {
    setSelectedInterests(function (prev) {
      var idx = prev.indexOf(key);
      if (idx !== -1) {
        var next = prev.slice();
        next.splice(idx, 1);
        return next;
      }
      if (prev.length >= 5) return prev; // max 5
      return prev.concat([key]);
    });
  }, []);

  // ─── Notification permission ────────────────────────────────

  var handleRequestNotifications = useCallback(function () {
    setSubmitting(true);
    requestPermission()
      .then(function (granted) {
        setNotifGranted(granted);
        if (granted) {
          // Small delay for visual feedback
          setTimeout(function () {
            setStep(5);
          }, 600);
        }
      })
      .catch(function () {
        setNotifGranted(false);
      })
      .finally(function () {
        setSubmitting(false);
      });
  }, []);

  // ─── Avatar picker ──────────────────────────────────────────

  var handlePickAvatar = useCallback(function () {
    try {
      var ImagePicker = require('react-native-image-picker');
      ImagePicker.launchImageLibrary(
        {
          mediaType: 'photo',
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.8,
        },
        function (response) {
          if (response.didCancel || response.errorCode) return;
          var asset = response.assets && response.assets[0];
          if (asset && asset.uri) {
            setAvatarUri(asset.uri);
          }
        }
      );
    } catch (e) {
      Alert.alert('Camera not available', 'Image picker is not configured yet.');
    }
  }, []);

  var handleTakePhoto = useCallback(function () {
    try {
      var ImagePicker = require('react-native-image-picker');
      ImagePicker.launchCamera(
        {
          mediaType: 'photo',
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.8,
        },
        function (response) {
          if (response.didCancel || response.errorCode) return;
          var asset = response.assets && response.assets[0];
          if (asset && asset.uri) {
            setAvatarUri(asset.uri);
          }
        }
      );
    } catch (e) {
      Alert.alert('Camera not available', 'Camera is not configured yet.');
    }
  }, []);

  // ─── Finish onboarding ──────────────────────────────────────

  var handleFinishOnboarding = useCallback(function () {
    setSubmitting(true);
    completeOnboarding()
      .then(function () {
        refreshUser();
      })
      .catch(function (err) {
        console.error('[Onboarding] completeOnboarding failed:', err);
        // Still proceed — the user should not be stuck
        refreshUser();
      })
      .finally(function () {
        setSubmitting(false);
      });
  }, [completeOnboarding, refreshUser]);

  return {
    navigation: navigation,
    user: user,
    step: step,
    totalSteps: TOTAL_STEPS,
    displayName: displayName,
    setDisplayName: setDisplayName,
    avatarUri: avatarUri,
    selectedInterests: selectedInterests,
    toggleInterest: toggleInterest,
    notifGranted: notifGranted,
    submitting: submitting,
    error: error,
    goNext: goNext,
    goBack: goBack,
    skipStep: skipStep,
    handlePickAvatar: handlePickAvatar,
    handleTakePhoto: handleTakePhoto,
    handleRequestNotifications: handleRequestNotifications,
    handleFinishOnboarding: handleFinishOnboarding,
    INTEREST_OPTIONS: INTEREST_OPTIONS,
  };
};

module.exports = useOnboardingScreen;
