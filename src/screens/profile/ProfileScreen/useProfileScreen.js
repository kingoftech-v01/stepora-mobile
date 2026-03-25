/**
 * useProfileScreen -- business logic for Profile (React Native).
 * Adapted from the web app's useProfileScreen.js.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiGet } = require('../../../services/api');
var { USERS, NOTIFICATIONS } = require('../../../services/endpoints');
var { BRAND, adaptColor } = require('../../../styles/colors');

var MENU_ITEMS = [
  { key: 'persona', label: 'Persona', color: BRAND.green, route: 'Persona' },
  { key: 'conversations', label: 'Conversations', color: BRAND.purpleLight, route: 'Conversations' },
  { key: 'subscription', label: 'Subscription', color: BRAND.yellow, route: 'Subscription' },
  { key: 'store', label: 'Store', color: BRAND.tealLight, route: 'Store' },
  { key: 'leaderboard', label: 'Leaderboard', color: BRAND.red, route: 'Leaderboard' },
  { key: 'notifications', label: 'Notifications', color: BRAND.purpleLight, route: 'Notifications', isNotif: true },
  { key: 'visionBoard', label: 'Vision Board', color: BRAND.green, route: 'VisionBoard' },
  { key: 'calendar', label: 'Calendar Sync', color: BRAND.blueLight, route: 'Calendar' },
];

function useProfileScreen() {
  var navigation = useNavigation();
  var t = function (key) { return key; };
  var [mounted, setMounted] = useState(false);
  var [isLoadingData, setIsLoadingData] = useState(true);
  var [isErrorData, setIsErrorData] = useState(false);
  var [errorMessage, setErrorMessage] = useState('');
  var [gamif, setGamif] = useState({});
  var [userStats, setUserStats] = useState({});
  var [notifUnread, setNotifUnread] = useState(0);

  // Placeholder user - in production, would come from AuthContext
  var user = { displayName: 'User', email: 'user@stepora.app', subscription: 'free' };

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
        setErrorMessage(err.userMessage || err.message || 'Failed to load profile');
        setIsLoadingData(false);
      });
  }, []);

  var displayName = (user && (user.displayName || user.display_name || user.username)) || '';
  var email = (user && user.email) || '';
  var subscription = (user && user.subscription) || 'free';
  var isPremium = subscription.toLowerCase() !== 'free';
  var subscriptionLabel = subscription.toUpperCase();

  var level = userStats.level || 1;
  var xp = userStats.xp || 0;
  var xpToNext = userStats.xpToNextLevel || 100 - (xp % 100);
  var streak = userStats.streakDays || 0;
  var lvlProgress = xpToNext > 0 ? (xp % 100) / 100 : 0;

  var handleSignOut = function () {
    var { clearTokens } = require('../../../services/api');
    clearTokens().then(function () {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    });
  };

  var retryAll = function () {
    setIsLoadingData(true);
    setIsErrorData(false);
    Promise.all([
      apiGet(USERS.GAMIFICATION).catch(function () { return {}; }),
      apiGet(USERS.STATS).catch(function () { return {}; }),
    ])
      .then(function (results) {
        setGamif(results[0] || {});
        setUserStats(results[1] || {});
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
    lvlProgress: lvlProgress,
    userStats: userStats,
    notifUnread: notifUnread,
    MENU: MENU_ITEMS,
    handleSignOut: handleSignOut,
    retryAll: retryAll,
    adaptColor: adaptColor,
    BRAND: BRAND,
  };
}

module.exports = useProfileScreen;
