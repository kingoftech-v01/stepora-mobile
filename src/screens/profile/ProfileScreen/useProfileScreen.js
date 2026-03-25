/**
 * useProfileScreen -- business logic for Profile (React Native).
 * Synced with web app's useProfileScreen.js.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiGet } = require('../../../services/api');
var { USERS, NOTIFICATIONS } = require('../../../services/endpoints');
var { BRAND, adaptColor, GRADIENTS } = require('../../../styles/colors');
var { useAuth } = require('../../../context/AuthContext');
var { useToast } = require('../../../context/ToastContext');
var { useT } = require('../../../context/I18nContext');

var SKILL_COLOR_MAP = {
  health: BRAND.green,
  'health & fitness': BRAND.green,
  career: BRAND.purpleLight,
  'career & work': BRAND.purpleLight,
  relationships: BRAND.red || '#F69A9A',
  'personal growth': BRAND.yellow,
  personal: BRAND.yellow,
  hobbies: BRAND.tealLight || BRAND.teal,
  'hobbies & creativity': BRAND.tealLight || BRAND.teal,
};

var BADGE_COLOR_MAP = {
  streak: BRAND.red || '#F69A9A',
  level: BRAND.yellow,
  dream: BRAND.purpleLight,
  task: BRAND.green,
  social: BRAND.tealLight || BRAND.teal,
};

var MENU_ITEMS_FN = function (t) {
  return [
    { key: 'persona', label: t('profile.persona'), color: BRAND.green, route: 'Persona' },
    { key: 'conversations', label: t('profile.conversations'), color: BRAND.purpleLight, route: 'Conversations' },
    { key: 'savedPosts', label: t('profile.savedPosts'), color: BRAND.blueLight || BRAND.blue, route: 'SavedPosts' },
    { key: 'subscription', label: t('profile.subscription'), color: BRAND.yellow, route: 'Subscription' },
    { key: 'store', label: t('profile.store'), color: BRAND.tealLight || BRAND.teal, route: 'Store' },
    { key: 'leaderboard', label: t('profile.leaderboard'), color: BRAND.red || '#F69A9A', route: 'Leaderboard' },
    { key: 'notifications', label: t('notifications.title'), color: BRAND.purpleLight, route: 'Notifications', isNotif: true },
    { key: 'visionBoard', label: t('profile.visionBoard'), color: BRAND.green, route: 'VisionBoard' },
    { key: 'calendar', label: t('profile.calendarSync'), color: BRAND.blueLight || BRAND.blue, route: 'Calendar' },
  ];
};

function useProfileScreen() {
  var navigation = useNavigation();
  var { user, logout } = useAuth();
  var { showToast } = useToast();
  var { t } = useT();
  var [mounted, setMounted] = useState(false);
  var [isLoadingData, setIsLoadingData] = useState(true);
  var [isErrorData, setIsErrorData] = useState(false);
  var [errorMessage, setErrorMessage] = useState('');
  var [gamif, setGamif] = useState({});
  var [userStats, setUserStats] = useState({});
  var [notifUnread, setNotifUnread] = useState(0);

  var MENU = MENU_ITEMS_FN(t);

  useEffect(function () {
    setTimeout(function () { setMounted(true); }, 100);
    Promise.all([
      apiGet(USERS.GAMIFICATION).catch(function () { return {}; }),
      apiGet(USERS.STATS).catch(function () { return {}; }),
      apiGet(NOTIFICATIONS.UNREAD_COUNT).catch(function () { return {}; }),
    ])
      .then(function (results) {
        setGamif(results[0] || {});
        setUserStats(results[1] || {});
        setNotifUnread((results[2] && (results[2].unreadCount || results[2].count)) || 0);
        setIsLoadingData(false);
      })
      .catch(function (err) {
        setIsErrorData(true);
        setErrorMessage(err.userMessage || err.message || t('profile.failedLoad'));
        setIsLoadingData(false);
      });
  }, []);

  var displayName = (user && (user.displayName || user.display_name || user.firstName || user.username)) || '';
  var email = (user && user.email) || '';
  var subscription = (user && user.subscription) || 'free';
  var isPremium = subscription.toLowerCase() !== 'free';
  var subscriptionLabel = subscription.toUpperCase();

  var level = userStats.level || (user && user.level) || 1;
  var xp = userStats.xp || (user && user.xp) || 0;
  var xpToNext = userStats.xp_to_next_level || userStats.xpToNextLevel || 100 - (xp % 100);
  var streak = userStats.streak_days || userStats.streakDays || (user && user.streakDays) || 0;
  var renewDate = (user && user.renewDate) || (user && user.subscriptionRenewDate) || '';
  var lvlProgress = xpToNext > 0 ? (xp % 100) / 100 : 0;

  // -- Skills from gamification --
  var rawSkills = gamif.skill_radar || gamif.skillRadar || [];
  var skills = rawSkills.map(function (s) {
    var key = (s.label || s.category || '').toLowerCase();
    return {
      label: s.label || s.category || '',
      level: s.level || 1,
      xp: s.xp || 0,
      maxXp: 100,
      color: SKILL_COLOR_MAP[key] || BRAND.purpleLight,
    };
  });

  // -- Achievements --
  var rawBadges = gamif.badges || gamif.achievements || [];
  var achievements = (Array.isArray(rawBadges) ? rawBadges : []).slice(0, 5).map(function (b) {
    var key = (b.type || b.category || '').toLowerCase();
    return {
      label: b.label || b.name || b.title || '',
      color: BADGE_COLOR_MAP[key] || BRAND.purpleLight,
    };
  });

  var handleSignOut = function () {
    logout()
      .then(function () {
        showToast(t('profile.signedOut'), 'success');
      })
      .catch(function () {
        showToast(t('profile.signOutFailed'), 'error');
      });
  };

  var retryAll = function () {
    setIsLoadingData(true);
    setIsErrorData(false);
    Promise.all([
      apiGet(USERS.GAMIFICATION).catch(function () { return {}; }),
      apiGet(USERS.STATS).catch(function () { return {}; }),
      apiGet(NOTIFICATIONS.UNREAD_COUNT).catch(function () { return {}; }),
    ])
      .then(function (results) {
        setGamif(results[0] || {});
        setUserStats(results[1] || {});
        setNotifUnread((results[2] && (results[2].unreadCount || results[2].count)) || 0);
        setIsLoadingData(false);
      })
      .catch(function () {
        setIsErrorData(true);
        setIsLoadingData(false);
      });
  };

  return {
    navigation: navigation,
    t: t,
    user: user,
    mounted: mounted,
    isLoadingData: isLoadingData,
    isErrorData: isErrorData,
    errorMessage: errorMessage,
    displayName: displayName,
    email: email,
    subscription: subscription,
    isPremium: isPremium,
    subscriptionLabel: subscriptionLabel,
    level: level,
    xp: xp,
    xpToNext: xpToNext,
    streak: streak,
    renewDate: renewDate,
    lvlProgress: lvlProgress,
    userStats: userStats,
    skills: skills,
    achievements: achievements,
    notifUnread: notifUnread,
    MENU: MENU,
    handleSignOut: handleSignOut,
    retryAll: retryAll,
    adaptColor: adaptColor,
    BRAND: BRAND,
    GRADIENTS: GRADIENTS,
  };
}

module.exports = useProfileScreen;
