/**
 * useHomeScreen -- Business logic for the Home dashboard screen.
 * Fetches user info, active dreams, daily tasks, gamification data,
 * and today's calendar events.
 */
var { useState, useEffect, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useQueryClient } = require('@tanstack/react-query');
var { apiGet } = require('../../services/api');
var { USERS, DREAMS, CALENDAR } = require('../../services/endpoints');

function useHomeScreen() {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var [refreshing, setRefreshing] = useState(false);

  // Placeholder t() until I18nContext is wired up
  var t = function (key) { return key; };

  // ─── User profile ───────────────────────────────────────────
  var userQuery = useQuery({
    queryKey: ['user-me'],
    queryFn: function () {
      return apiGet(USERS.ME);
    },
  });

  // ─── Gamification (streak, XP, level) ─────────────────────
  var gamificationQuery = useQuery({
    queryKey: ['user-gamification'],
    queryFn: function () {
      return apiGet(USERS.GAMIFICATION);
    },
  });

  // ─── Active dreams ────────────────────────────────────────
  var dreamsQuery = useQuery({
    queryKey: ['dreams-active'],
    queryFn: function () {
      return apiGet(DREAMS.LIST + '?status=active&limit=5');
    },
  });

  // ─── Daily task priorities ────────────────────────────────
  var tasksQuery = useQuery({
    queryKey: ['tasks-daily'],
    queryFn: function () {
      return apiGet(DREAMS.TASKS.DAILY_PRIORITIES);
    },
  });

  // ─── Today's calendar events ──────────────────────────────
  var calendarQuery = useQuery({
    queryKey: ['calendar-today'],
    queryFn: function () {
      return apiGet(CALENDAR.TODAY);
    },
  });

  // ─── Derived data ─────────────────────────────────────────

  var user = userQuery.data || {};
  var displayName = user.displayName || user.firstName || user.username || '';
  var greeting = getGreeting(displayName);

  var gamification = gamificationQuery.data || {};
  var streak = gamification.currentStreak || gamification.streakDays || 0;
  var xp = gamification.totalXp || gamification.xp || 0;
  var level = gamification.currentLevel || gamification.level || 1;

  var rawDreams = dreamsQuery.data;
  var dreams = [];
  if (rawDreams) {
    if (Array.isArray(rawDreams.results)) dreams = rawDreams.results;
    else if (Array.isArray(rawDreams)) dreams = rawDreams;
  }

  var rawTasks = tasksQuery.data;
  var tasks = [];
  if (rawTasks) {
    if (Array.isArray(rawTasks.results)) tasks = rawTasks.results;
    else if (Array.isArray(rawTasks)) tasks = rawTasks;
  }

  var rawEvents = calendarQuery.data;
  var events = [];
  if (rawEvents) {
    if (Array.isArray(rawEvents.results)) events = rawEvents.results;
    else if (Array.isArray(rawEvents)) events = rawEvents;
    else if (rawEvents.events && Array.isArray(rawEvents.events)) events = rawEvents.events;
  }

  var completedTasks = tasks.filter(function (t) { return t.isCompleted || t.completed; }).length;
  var totalTasks = tasks.length;

  var isLoading = userQuery.isLoading || dreamsQuery.isLoading || tasksQuery.isLoading;
  var isError = userQuery.isError || dreamsQuery.isError;

  // ─── Pull-to-refresh ──────────────────────────────────────

  var onRefresh = useCallback(function () {
    setRefreshing(true);
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user-me'] }),
      queryClient.invalidateQueries({ queryKey: ['user-gamification'] }),
      queryClient.invalidateQueries({ queryKey: ['streak-details'] }),
      queryClient.invalidateQueries({ queryKey: ['dreams-active'] }),
      queryClient.invalidateQueries({ queryKey: ['tasks-daily'] }),
      queryClient.invalidateQueries({ queryKey: ['calendar-today'] }),
    ]).finally(function () {
      setRefreshing(false);
    });
  }, [queryClient]);

  // ─── Quick actions ────────────────────────────────────────

  var goToDreamCreate = useCallback(function () {
    navigation.navigate('DreamCreate');
  }, [navigation]);

  var goToCheckIn = useCallback(function () {
    if (dreams.length > 0) {
      navigation.navigate('DreamDetail', { id: dreams[0].id });
    }
  }, [navigation, dreams]);

  var goToFocusTimer = useCallback(function () {
    navigation.navigate('FocusTimer');
  }, [navigation]);

  var goToDreamDetail = useCallback(function (id) {
    navigation.navigate('DreamDetail', { id: id });
  }, [navigation]);

  var goToNotifications = useCallback(function () {
    navigation.navigate('Notifications');
  }, [navigation]);

  return {
    navigation: navigation,
    t: t,
    isLoading: isLoading,
    isError: isError,
    refreshing: refreshing,
    onRefresh: onRefresh,
    greeting: greeting,
    displayName: displayName,
    user: user,
    streak: streak,
    xp: xp,
    level: level,
    dreams: dreams,
    tasks: tasks,
    events: events,
    completedTasks: completedTasks,
    totalTasks: totalTasks,
    goToDreamCreate: goToDreamCreate,
    goToCheckIn: goToCheckIn,
    goToFocusTimer: goToFocusTimer,
    goToDreamDetail: goToDreamDetail,
    goToNotifications: goToNotifications,
  };
}

// ─── Helpers ──────────────────────────────────────────────────

function getGreeting(name) {
  var hour = new Date().getHours();
  var prefix;
  if (hour < 12) prefix = 'Good morning';
  else if (hour < 18) prefix = 'Good afternoon';
  else prefix = 'Good evening';
  return name ? prefix + ', ' + name : prefix;
}

module.exports = useHomeScreen;
