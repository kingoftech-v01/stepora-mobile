/**
 * useDreamDetailScreen — Business logic for the Dream detail screen.
 * Mirrors the web app's useDreamDetailScreen hook.
 */
var { useState, useEffect } = require('react');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost, apiPatch, apiDelete } = require('../../services/api');
var { DREAMS, SOCIAL } = require('../../services/endpoints');
var { adaptColor, GRADIENTS, STATUS } = require('../../styles/colors');

var STATUS_COLORS = STATUS;

var useDreamDetailScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var id = route.params && route.params.id;
  var queryClient = useQueryClient();

  var dreamQuery = useQuery({
    queryKey: ['dream', id],
    queryFn: function () { return apiGet(DREAMS.DETAIL(id)); },
    enabled: !!id,
    refetchOnMount: 'always',
  });
  var DREAM = dreamQuery.data || {};

  var MILESTONES = (DREAM.milestones || []).map(function (m, i) {
    var isDone = m.status === 'completed' || m.completed;
    var isActive =
      (!isDone && i === 0) ||
      (!isDone &&
        (DREAM.milestones || []).slice(0, i).every(function (pm) {
          return pm.status === 'completed' || pm.completed;
        }));
    // Compute task-based progress for this milestone (more granular than backend's goal-based %)
    var msGoals = m.goals || [];
    var msTotalTasks = 0;
    var msDoneTasks = 0;
    msGoals.forEach(function (g) {
      (g.tasks || []).forEach(function (tk) {
        msTotalTasks++;
        if (tk.status === 'completed' || tk.completed) msDoneTasks++;
      });
    });
    var taskBasedProgress = msTotalTasks > 0 ? Math.round((msDoneTasks / msTotalTasks) * 100) : 0;
    return {
      id: m.id,
      label: m.title,
      description: m.description,
      order: m.order != null ? m.order : i,
      done: isDone,
      active: isActive,
      progressPercentage: taskBasedProgress,
      totalTasks: msTotalTasks,
      doneTasks: msDoneTasks,
      goalsCount: msGoals.length,
      completedGoalsCount: m.completedGoalsCount || 0,
      expectedDate: m.expectedDate,
      deadlineDate: m.deadlineDate,
      date: m.deadlineDate
        ? new Date(m.deadlineDate).toLocaleDateString()
        : m.expectedDate
          ? new Date(m.expectedDate).toLocaleDateString()
          : '',
      goals: msGoals,
    };
  });

  // Mutations
  var taskCompleteMut = useMutation({
    mutationFn: function (taskId) { return apiPost(DREAMS.TASKS.COMPLETE(taskId)); },
    onMutate: function (taskId) {
      queryClient.cancelQueries({ queryKey: ['dream', id] });
      var prev = queryClient.getQueryData(['dream', id]);
      queryClient.setQueryData(['dream', id], function (old) {
        if (!old || !old.milestones) return old;
        return Object.assign({}, old, {
          milestones: old.milestones.map(function (m) {
            return Object.assign({}, m, {
              goals: (m.goals || []).map(function (g) {
                return Object.assign({}, g, {
                  tasks: (g.tasks || []).map(function (tk) {
                    if (tk.id === taskId) {
                      var wasCompleted = tk.status === 'completed' || tk.completed;
                      return Object.assign({}, tk, {
                        completed: !wasCompleted,
                        status: wasCompleted ? 'in_progress' : 'completed',
                      });
                    }
                    return tk;
                  }),
                });
              }),
            });
          }),
        });
      });
      return { prev: prev };
    },
    onError: function (err, taskId, ctx) {
      if (ctx && ctx.prev) queryClient.setQueryData(['dream', id], ctx.prev);
    },
    onSettled: function () {
      queryClient.invalidateQueries({ queryKey: ['dream', id] });
      queryClient.invalidateQueries({ queryKey: ['dreams'] });
    },
  });

  var deleteDreamMut = useMutation({
    mutationFn: function () { return apiDelete(DREAMS.DETAIL(id)); },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['dreams'] });
      navigation.goBack();
    },
  });

  var duplicateDreamMut = useMutation({
    mutationFn: function () { return apiPost(DREAMS.DUPLICATE(id)); },
    onSuccess: function (data) {
      navigation.navigate('DreamDetail', { id: data.id });
    },
  });

  var milestoneCompleteMut = useMutation({
    mutationFn: function (milestoneId) { return apiPost(DREAMS.MILESTONES.COMPLETE(milestoneId)); },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['dream', id] });
    },
  });

  // Obstacles
  var obstaclesQuery = useQuery({
    queryKey: ['obstacles', id],
    queryFn: function () { return apiGet(DREAMS.OBSTACLES.LIST + '?dream=' + id); },
    enabled: !!id,
  });
  var obstacles = (obstaclesQuery.data && obstaclesQuery.data.results) || obstaclesQuery.data || [];

  var addObstacleMut = useMutation({
    mutationFn: function (data) { return apiPost(DREAMS.OBSTACLES.LIST, data); },
    onSuccess: function () { queryClient.invalidateQueries({ queryKey: ['obstacles', id] }); },
  });

  var resolveObstacleMut = useMutation({
    mutationFn: function (obstacleId) { return apiPost(DREAMS.OBSTACLES.RESOLVE(obstacleId)); },
    onSuccess: function () { queryClient.invalidateQueries({ queryKey: ['obstacles', id] }); },
  });

  // Pending check-in
  var checkinQuery = useQuery({
    queryKey: ['pending-checkin', id],
    queryFn: function () { return apiGet(DREAMS.CHECKINS.LIST + '?dream=' + id + '&status=awaiting_user'); },
    enabled: !!id,
    staleTime: 60000,
  });

  // State
  var [goals, setGoals] = useState([]);
  var [expanded, setExpanded] = useState({});
  var [goalsUpdatedAt, setGoalsUpdatedAt] = useState(0);
  var [menu, setMenu] = useState(false);
  var [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  var [addGoal, setAddGoal] = useState(false);
  var [addTask, setAddTask] = useState(null);
  var [newTitle, setNewTitle] = useState('');
  var [newDesc, setNewDesc] = useState('');
  var [pendingCheckin, setPendingCheckin] = useState(null);
  var [showAllMilestones, setShowAllMilestones] = useState(false);
  var [showAllGoals, setShowAllGoals] = useState(false);

  useEffect(function () {
    var data = checkinQuery.data;
    var list = (data && data.results) || data || [];
    var awaiting = Array.isArray(list) ? list[0] : null;
    setPendingCheckin(awaiting || null);
  }, [checkinQuery.data]);

  useEffect(function () {
    if (dreamQuery.data && dreamQuery.dataUpdatedAt !== goalsUpdatedAt) {
      var allGoals = [];
      var milestones = dreamQuery.data.milestones || [];
      if (milestones.length > 0) {
        milestones.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
          .forEach(function (ms) {
            (ms.goals || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
              .forEach(function (g) { allGoals.push(g); });
          });
      }
      if (allGoals.length === 0) allGoals = dreamQuery.data.goals || [];
      var initGoals = allGoals.map(function (g, i) {
        return Object.assign({}, g, {
          order: g.order !== undefined ? g.order : i,
          completed: g.status === 'completed' || g.completed || false,
          tasks: (g.tasks || []).map(function (tk) {
            return Object.assign({}, tk, { completed: tk.status === 'completed' || tk.completed || false });
          }),
        });
      });
      setGoals(initGoals);
      var first = initGoals.find(function (g) { return !g.completed; });
      var initExpanded = {};
      if (first) initExpanded[first.id] = true;
      setExpanded(initExpanded);
      setGoalsUpdatedAt(dreamQuery.dataUpdatedAt);
    }
  }, [dreamQuery.data, dreamQuery.dataUpdatedAt, goalsUpdatedAt]);

  var toggleExpand = function (gid) {
    setExpanded(function (p) {
      var n = {};
      n[gid] = !p[gid];
      return Object.assign({}, p, n);
    });
  };

  var toggleTask = function (gId, tId) {
    setGoals(function (prev) {
      return prev.map(function (g) {
        return g.id === gId
          ? Object.assign({}, g, {
              tasks: g.tasks.map(function (tk) {
                return tk.id === tId ? Object.assign({}, tk, { completed: !tk.completed }) : tk;
              }),
            })
          : g;
      });
    });
    taskCompleteMut.mutate(tId);
  };

  var handleAddGoal = function () {
    if (!newTitle.trim()) return;
    apiPost(DREAMS.GOALS.LIST, { dream: id, title: newTitle.trim(), description: newDesc.trim() })
      .then(function () { queryClient.invalidateQueries({ queryKey: ['dream', id] }); });
    setNewTitle('');
    setNewDesc('');
    setAddGoal(false);
  };

  var handleAddTask = function (gId, recurrenceOpts) {
    if (!newTitle.trim()) return;
    var taskData = { goal: gId, title: newTitle.trim(), description: newDesc.trim() };
    if (recurrenceOpts && recurrenceOpts.recurrence_type && recurrenceOpts.recurrence_type !== 'none') {
      taskData.recurrence_type = recurrenceOpts.recurrence_type;
      if (recurrenceOpts.recurrence_days && recurrenceOpts.recurrence_days.length > 0) {
        taskData.recurrence_days = recurrenceOpts.recurrence_days;
      }
      if (recurrenceOpts.recurrence_end_date) {
        taskData.recurrence_end_date = recurrenceOpts.recurrence_end_date;
      }
    }
    apiPost(DREAMS.TASKS.LIST, taskData)
      .then(function () { queryClient.invalidateQueries({ queryKey: ['dream', id] }); });
    setNewTitle('');
    setNewDesc('');
    setAddTask(null);
  };

  // Computed
  var totalTasks = goals.reduce(function (s, g) { return s + g.tasks.length; }, 0);
  var doneTasks = goals.reduce(function (s, g) {
    return s + g.tasks.filter(function (tk) { return tk.completed; }).length;
  }, 0);
  var completedGoals = (goals || []).filter(function (g) {
    return g.status === 'completed' || g.completedAt;
  }).length;
  var completedMilestones = MILESTONES.filter(function (m) {
    return m.done;
  }).length;
  var progress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  var menuItems = [
    { icon: 'edit-3', label: 'Edit', action: function () { setMenu(false); navigation.navigate('DreamEdit', { id: DREAM.id }); } },
    { icon: 'zap', label: 'Generate Plan', action: function () { setMenu(false); navigation.navigate('Calibration', { id: DREAM.id }); } },
    { icon: 'share-2', label: 'Share', action: function () { setMenu(false); } },
    { icon: 'copy', label: 'Duplicate', action: function () { setMenu(false); duplicateDreamMut.mutate(); } },
    { icon: 'trash-2', label: 'Delete', danger: true, action: function () { setMenu(false); setShowDeleteConfirm(true); } },
  ];

  /* Navigate to GoalRefine screen for a specific goal */
  var navigateToRefine = function (goal) {
    navigation.navigate('GoalRefine', {
      goalId: goal.id,
      goalTitle: goal.title,
      goalDescription: goal.description || '',
      dreamId: id,
    });
  };

  return {
    navigation: navigation,
    id: id,
    dreamQuery: dreamQuery,
    DREAM: DREAM,
    MILESTONES: MILESTONES,
    STATUS_COLORS: STATUS_COLORS,
    adaptColor: adaptColor,
    GRADIENTS: GRADIENTS,
    taskCompleteMut: taskCompleteMut,
    deleteDreamMut: deleteDreamMut,
    duplicateDreamMut: duplicateDreamMut,
    milestoneCompleteMut: milestoneCompleteMut,
    obstaclesQuery: obstaclesQuery,
    obstacles: obstacles,
    addObstacleMut: addObstacleMut,
    resolveObstacleMut: resolveObstacleMut,
    checkinQuery: checkinQuery,
    goals: goals,
    setGoals: setGoals,
    expanded: expanded,
    menu: menu,
    setMenu: setMenu,
    showDeleteConfirm: showDeleteConfirm,
    setShowDeleteConfirm: setShowDeleteConfirm,
    addGoal: addGoal,
    setAddGoal: setAddGoal,
    addTask: addTask,
    setAddTask: setAddTask,
    newTitle: newTitle,
    setNewTitle: setNewTitle,
    newDesc: newDesc,
    setNewDesc: setNewDesc,
    pendingCheckin: pendingCheckin,
    showAllMilestones: showAllMilestones,
    setShowAllMilestones: setShowAllMilestones,
    showAllGoals: showAllGoals,
    setShowAllGoals: setShowAllGoals,
    toggleExpand: toggleExpand,
    toggleTask: toggleTask,
    handleAddGoal: handleAddGoal,
    handleAddTask: handleAddTask,
    totalTasks: totalTasks,
    doneTasks: doneTasks,
    completedGoals: completedGoals,
    completedMilestones: completedMilestones,
    progress: progress,
    menuItems: menuItems,
    navigateToRefine: navigateToRefine,
    // Check-in fields (synced with web)
    canCheckin: DREAM ? DREAM.canCheckin || DREAM.can_checkin || false : false,
    daysUntilCheckin: DREAM ? DREAM.daysUntilCheckin || DREAM.days_until_checkin || 0 : 0,
    nextCheckinAt: DREAM ? DREAM.nextCheckinAt || DREAM.next_checkin_at || null : null,
    calibrationStatus: DREAM
      ? DREAM.calibrationStatus || DREAM.calibration_status || 'pending'
      : 'pending',
  };
};

module.exports = useDreamDetailScreen;
