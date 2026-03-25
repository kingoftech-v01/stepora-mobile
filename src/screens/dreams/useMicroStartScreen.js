/**
 * useMicroStartScreen — Business logic for quick-start micro-goals.
 * Fetches 5-minute tasks, manages timer, and handles XP rewards.
 */
var { useState, useCallback, useRef, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');

var MICRO_DURATION = 5 * 60; // 5 minutes in seconds

var SUGGESTED_MICROS = [
  { id: 'micro-1', title: 'Write 3 goals for today', emoji: '\uD83D\uDCDD', category: 'planning', xp: 15, duration: 300 },
  { id: 'micro-2', title: '5-minute meditation', emoji: '\uD83E\uDDD8', category: 'mindfulness', xp: 10, duration: 300 },
  { id: 'micro-3', title: 'Quick desk stretches', emoji: '\uD83E\uDD38', category: 'fitness', xp: 10, duration: 300 },
  { id: 'micro-4', title: 'Read 2 pages of a book', emoji: '\uD83D\uDCDA', category: 'education', xp: 10, duration: 300 },
  { id: 'micro-5', title: 'Organize your workspace', emoji: '\uD83E\uDDF9', category: 'productivity', xp: 10, duration: 300 },
  { id: 'micro-6', title: 'Send an encouraging message', emoji: '\uD83D\uDCAC', category: 'social', xp: 15, duration: 120 },
  { id: 'micro-7', title: 'Brainstorm 3 new ideas', emoji: '\uD83D\uDCA1', category: 'creativity', xp: 15, duration: 300 },
  { id: 'micro-8', title: 'Review your dream progress', emoji: '\uD83D\uDCC8', category: 'review', xp: 10, duration: 300 },
  { id: 'micro-9', title: 'Drink a glass of water', emoji: '\uD83D\uDCA7', category: 'health', xp: 5, duration: 30 },
  { id: 'micro-10', title: 'Take 10 deep breaths', emoji: '\uD83C\uDF2C\uFE0F', category: 'mindfulness', xp: 5, duration: 60 },
];

var useMicroStartScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  // Fetch user's daily priorities / quick tasks
  var tasksQuery = useQuery({
    queryKey: ['daily-micro-tasks'],
    queryFn: function () {
      return apiGet(DREAMS.TASKS.DAILY_PRIORITIES);
    },
  });

  var rawTasks = tasksQuery.data;
  var userTasks = Array.isArray(rawTasks)
    ? rawTasks
    : rawTasks && rawTasks.results
      ? rawTasks.results
      : [];

  // Map user tasks to micro format
  var userMicros = userTasks.slice(0, 5).map(function (task) {
    return {
      id: task.id,
      title: task.title,
      emoji: '\u2705',
      category: task.category || 'task',
      xp: task.xpReward || 10,
      duration: task.estimatedMinutes ? task.estimatedMinutes * 60 : 300,
      isUserTask: true,
      dreamId: task.dreamId || task.dream,
    };
  });

  // Combine user tasks and suggestions
  var allMicros = userMicros.concat(
    SUGGESTED_MICROS.slice(0, Math.max(3, 8 - userMicros.length))
  );

  // Timer state
  var [activeMicro, setActiveMicro] = useState(null);
  var [timeLeft, setTimeLeft] = useState(0);
  var [isRunning, setIsRunning] = useState(false);
  var [isPaused, setIsPaused] = useState(false);
  var [completedMicros, setCompletedMicros] = useState([]);
  var [showReward, setShowReward] = useState(false);
  var [lastRewardXp, setLastRewardXp] = useState(0);
  var intervalRef = useRef(null);

  // Timer tick
  useEffect(function () {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(function () {
        setTimeLeft(function (prev) {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleTimerComplete();
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

  // Complete task mutation
  var completeMut = useMutation({
    mutationFn: function (taskId) {
      return apiPost(DREAMS.TASKS.COMPLETE(taskId));
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['daily-micro-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dreams'] });
    },
  });

  var startMicro = useCallback(function (micro) {
    setActiveMicro(micro);
    setTimeLeft(micro.duration || MICRO_DURATION);
    setIsRunning(true);
    setIsPaused(false);
  }, []);

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
    setActiveMicro(null);
    setTimeLeft(0);
  }, []);

  var handleTimerComplete = useCallback(function () {
    if (!activeMicro) return;
    setCompletedMicros(function (prev) {
      return prev.concat([activeMicro.id]);
    });
    setLastRewardXp(activeMicro.xp || 10);
    setShowReward(true);
    // If it's a real user task, mark it complete on the backend
    if (activeMicro.isUserTask) {
      completeMut.mutate(activeMicro.id);
    }
    // Auto-dismiss reward animation
    setTimeout(function () {
      setShowReward(false);
      setActiveMicro(null);
      setIsRunning(false);
    }, 3000);
  }, [activeMicro]);

  var handleComplete = useCallback(function () {
    // Manual complete (before timer ends)
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
    handleTimerComplete();
  }, [handleTimerComplete]);

  var handleSkip = useCallback(function () {
    resetTimer();
  }, [resetTimer]);

  var formatTimer = useCallback(function (seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }, []);

  var totalXpEarned = completedMicros.reduce(function (sum, id) {
    var micro = allMicros.find(function (m) { return m.id === id; });
    return sum + (micro ? micro.xp : 10);
  }, 0);

  return {
    navigation: navigation,
    allMicros: allMicros,
    userMicros: userMicros,
    tasksQuery: tasksQuery,
    activeMicro: activeMicro,
    timeLeft: timeLeft,
    isRunning: isRunning,
    isPaused: isPaused,
    completedMicros: completedMicros,
    showReward: showReward,
    lastRewardXp: lastRewardXp,
    totalXpEarned: totalXpEarned,
    startMicro: startMicro,
    pauseTimer: pauseTimer,
    resumeTimer: resumeTimer,
    resetTimer: resetTimer,
    handleComplete: handleComplete,
    handleSkip: handleSkip,
    formatTimer: formatTimer,
  };
};

module.exports = useMicroStartScreen;
