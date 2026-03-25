/**
 * useFocusTimerScreen — Business logic for the Pomodoro-style focus timer.
 * Manages timer state, session tracking, dream/task association, and notifications.
 */
var { useState, useCallback, useRef, useEffect } = require('react');
var { AppState } = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');

var PRESET_DURATIONS = [
  { key: 'short', label: '15 min', work: 15 * 60, breakTime: 3 * 60 },
  { key: 'pomodoro', label: '25 min', work: 25 * 60, breakTime: 5 * 60 },
  { key: 'long', label: '45 min', work: 45 * 60, breakTime: 10 * 60 },
  { key: 'deep', label: '60 min', work: 60 * 60, breakTime: 15 * 60 },
];

var useFocusTimerScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  // ─── Timer state ────────────────────────────────────────────

  var [selectedPreset, setSelectedPreset] = useState('pomodoro');
  var [customMinutes, setCustomMinutes] = useState(25);
  var [timeLeft, setTimeLeft] = useState(25 * 60);
  var [isRunning, setIsRunning] = useState(false);
  var [isPaused, setIsPaused] = useState(false);
  var [isBreak, setIsBreak] = useState(false);
  var [sessionsCompleted, setSessionsCompleted] = useState(0);
  var [totalFocusTime, setTotalFocusTime] = useState(0);
  var [selectedDreamId, setSelectedDreamId] = useState(null);
  var [selectedTaskId, setSelectedTaskId] = useState(null);
  var [showDreamPicker, setShowDreamPicker] = useState(false);
  var [sessionId, setSessionId] = useState(null);
  var intervalRef = useRef(null);
  var startTimeRef = useRef(null);

  // Track when app goes to background (for background timer accuracy)
  var appStateRef = useRef(AppState.currentState);
  var backgroundTimeRef = useRef(null);

  useEffect(function () {
    var subscription = AppState.addEventListener('change', function (nextState) {
      if (appStateRef.current.match(/active/) && nextState === 'background') {
        backgroundTimeRef.current = Date.now();
      }
      if (nextState === 'active' && backgroundTimeRef.current && isRunning && !isPaused) {
        var elapsed = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
        setTimeLeft(function (prev) {
          var newTime = Math.max(0, prev - elapsed);
          if (newTime <= 0) {
            handleSessionEnd();
            return 0;
          }
          return newTime;
        });
        backgroundTimeRef.current = null;
      }
      appStateRef.current = nextState;
    });
    return function () { subscription.remove(); };
  }, [isRunning, isPaused]);

  // ─── Fetch dreams for picker ────────────────────────────────

  var dreamsQuery = useQuery({
    queryKey: ['dreams-focus'],
    queryFn: function () {
      return apiGet(DREAMS.LIST + '?status=active&page_size=50');
    },
  });

  var rawDreams = dreamsQuery.data;
  var dreams = Array.isArray(rawDreams)
    ? rawDreams
    : rawDreams && rawDreams.results
      ? rawDreams.results
      : [];

  // Fetch focus session history
  var historyQuery = useQuery({
    queryKey: ['focus-history'],
    queryFn: function () {
      return apiGet(DREAMS.FOCUS.HISTORY);
    },
  });

  var historyData = historyQuery.data;
  var history = Array.isArray(historyData)
    ? historyData
    : historyData && historyData.results
      ? historyData.results
      : [];

  // Fetch focus stats
  var statsQuery = useQuery({
    queryKey: ['focus-stats'],
    queryFn: function () {
      return apiGet(DREAMS.FOCUS.STATS);
    },
  });

  var stats = statsQuery.data || {};

  // ─── Timer tick ─────────────────────────────────────────────

  useEffect(function () {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(function () {
        setTimeLeft(function (prev) {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return function () {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused]);

  // ─── Mutations removed — using direct apiPost calls matching web pattern ──

  // ─── Actions ────────────────────────────────────────────────

  var selectPreset = useCallback(function (presetKey) {
    var preset = PRESET_DURATIONS.find(function (p) { return p.key === presetKey; });
    if (!preset) return;
    setSelectedPreset(presetKey);
    setCustomMinutes(preset.work / 60);
    if (!isRunning) {
      setTimeLeft(preset.work);
    }
  }, [isRunning]);

  var setCustomDuration = useCallback(function (minutes) {
    var mins = parseInt(minutes, 10) || 25;
    mins = Math.max(1, Math.min(120, mins));
    setCustomMinutes(mins);
    setSelectedPreset('custom');
    if (!isRunning) {
      setTimeLeft(mins * 60);
    }
  }, [isRunning]);

  var startTimer = useCallback(function () {
    if (timeLeft <= 0) {
      var preset = PRESET_DURATIONS.find(function (p) { return p.key === selectedPreset; });
      setTimeLeft(preset ? preset.work : customMinutes * 60);
    }
    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    // Notify backend — camelCase keys auto-converted to snake_case by transform
    apiPost(DREAMS.FOCUS.START, {
      taskId: selectedTaskId || null,
      durationMinutes: customMinutes,
      sessionType: 'work',
    })
      .then(function (data) {
        setSessionId(data.id);
      })
      .catch(function () {});
  }, [timeLeft, selectedPreset, customMinutes, selectedDreamId, selectedTaskId]);

  var pauseTimer = useCallback(function () {
    setIsPaused(true);
  }, []);

  var resumeTimer = useCallback(function () {
    setIsPaused(false);
  }, []);

  var resetTimer = useCallback(function () {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setIsBreak(false);
    setSessionId(null);
    var preset = PRESET_DURATIONS.find(function (p) { return p.key === selectedPreset; });
    setTimeLeft(preset ? preset.work : customMinutes * 60);
  }, [selectedPreset, customMinutes]);

  var handleSessionEnd = useCallback(function () {
    setIsRunning(false);
    setIsPaused(false);

    if (!isBreak) {
      // Work session completed
      var elapsed = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : customMinutes * 60;
      var elapsedMinutes = Math.floor(elapsed / 60);
      setSessionsCompleted(function (prev) { return prev + 1; });
      setTotalFocusTime(function (prev) { return prev + elapsed; });

      // Notify backend — camelCase keys auto-converted to snake_case by transform
      if (sessionId) {
        apiPost(DREAMS.FOCUS.COMPLETE, {
          sessionId: sessionId,
          actualMinutes: elapsedMinutes,
        })
          .then(function () {
            queryClient.invalidateQueries({ queryKey: ['focus-history'] });
            queryClient.invalidateQueries({ queryKey: ['focus-stats'] });
          })
          .catch(function () {});
      }

      // Start break
      var preset = PRESET_DURATIONS.find(function (p) { return p.key === selectedPreset; });
      var breakDuration = preset ? preset.breakTime : 5 * 60;
      setIsBreak(true);
      setTimeLeft(breakDuration);
      setSessionId(null);
      // Auto-start break after 1 second
      setTimeout(function () {
        setIsRunning(true);
        setIsPaused(false);
        startTimeRef.current = Date.now();
        apiPost(DREAMS.FOCUS.START, { durationMinutes: Math.floor(breakDuration / 60), sessionType: 'break' })
          .then(function (data) {
            setSessionId(data.id);
          })
          .catch(function () {});
      }, 1000);
    } else {
      // Break completed — reset for next work session
      setIsBreak(false);
      setSessionId(null);
      var workPreset = PRESET_DURATIONS.find(function (p) { return p.key === selectedPreset; });
      setTimeLeft(workPreset ? workPreset.work : customMinutes * 60);
    }

    // Send notification
    try {
      var notifee = require('@notifee/react-native').default;
      notifee.displayNotification({
        title: isBreak ? 'Break Over!' : 'Focus Session Complete!',
        body: isBreak ? 'Ready for another focus session?' : 'Time for a break. You earned it!',
        android: {
          channelId: 'stepora-default',
          smallIcon: 'ic_notification',
          color: '#8B5CF6',
        },
      }).catch(function () {});
    } catch (e) {
      // Notifee not available
    }
  }, [isBreak, selectedPreset, customMinutes, sessionId]);

  var formatTimer = useCallback(function (seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }, []);

  var formatTotalTime = useCallback(function (seconds) {
    var hrs = Math.floor(seconds / 3600);
    var mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return hrs + 'h ' + mins + 'm';
    return mins + 'm';
  }, []);

  return {
    navigation: navigation,
    // Timer state
    selectedPreset: selectedPreset,
    customMinutes: customMinutes,
    timeLeft: timeLeft,
    isRunning: isRunning,
    isPaused: isPaused,
    isBreak: isBreak,
    sessionsCompleted: sessionsCompleted,
    totalFocusTime: totalFocusTime,
    // Dream selection
    dreams: dreams,
    selectedDreamId: selectedDreamId,
    setSelectedDreamId: setSelectedDreamId,
    selectedTaskId: selectedTaskId,
    setSelectedTaskId: setSelectedTaskId,
    showDreamPicker: showDreamPicker,
    setShowDreamPicker: setShowDreamPicker,
    // Session tracking
    sessionId: sessionId,
    // Data
    history: history,
    stats: stats,
    // Actions
    selectPreset: selectPreset,
    setCustomDuration: setCustomDuration,
    startTimer: startTimer,
    pauseTimer: pauseTimer,
    resumeTimer: resumeTimer,
    resetTimer: resetTimer,
    formatTimer: formatTimer,
    formatTotalTime: formatTotalTime,
    PRESET_DURATIONS: PRESET_DURATIONS,
  };
};

module.exports = useFocusTimerScreen;
