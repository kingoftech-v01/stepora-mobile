/**
 * useCalendarScreen — Business logic for the Calendar screen.
 * Fetches tasks, events, and time blocks, builds calendar grid, handles mutations.
 * Synced with web: normalizeTimeBlock, expandTimeBlocks, timeBlocksQuery,
 * toggleEventMut, calMenu, googleCalendarEnabled, sanitizeText.
 */
var { useState, useEffect, useRef } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;
var { apiGet, apiPost, apiPatch, apiDelete } = require('../../services/api');
var { CALENDAR, DREAMS } = require('../../services/endpoints');
var { BRAND, adaptColor } = require('../../styles/colors');
var { sanitizeText, validateRequired } = require('../../utils/sanitize');
var { isEnabled } = require('../../config/featureFlags');

var NOW = new Date();
var TODAY = { y: NOW.getFullYear(), m: NOW.getMonth(), d: NOW.getDate() };

var TYPE_COLORS = {
  task: '#5DE5A8',
  event: '#C4B5FD',
  reminder: '#FCD34D',
  deadline: '#F69A9A',
  timeblock: '#8B5CF6',
};

function getKey(y, m, d) { return y + '-' + m + '-' + d; }
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y, m) { var d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

function normalizeTask(t) {
  return {
    id: t.taskId || t.id,
    title: t.taskTitle || t.title || '',
    date: t.scheduledDate || t.date || '',
    time: t.scheduledTime || t.time || '',
    done: t.status === 'completed' || t.done || t.completed || false,
    type: 'task',
    color: TYPE_COLORS.task,
    dream: t.dreamTitle || t.dream || '',
    dreamId: t.dreamId || '',
    isTask: true,
    isDeadline: false,
  };
}

function normalizeEvent(e) {
  var start = e.startTime || e.start || '';
  var dateStr = start ? start.split('T')[0] : '';
  var timeStr = start && start.includes('T') ? start.split('T')[1].substring(0, 5) : '';
  return {
    id: e.id,
    title: e.title || '',
    date: dateStr,
    time: timeStr,
    done: e.status === 'completed' || e.completed || false,
    type: 'event',
    color: TYPE_COLORS.event,
    dream: e.dreamTitle || e.taskTitle || '',
    isTask: false,
    isDeadline: false,
  };
}

function normalizeTimeBlock(tb, dateStr) {
  var startTime = tb.startTime || tb.start_time || '';
  var endTime = tb.endTime || tb.end_time || '';
  return {
    id: tb._expandedId || tb.id,
    sourceId: tb.id,
    title: tb.title || tb.blockType || tb.block_type || 'Time Block',
    date: dateStr,
    time: startTime ? startTime.substring(0, 5) : '',
    endTime: endTime ? endTime.substring(0, 5) : '',
    done: false,
    type: 'timeblock',
    color: tb.color || TYPE_COLORS.timeblock,
    blockType: tb.blockType || tb.block_type || '',
    dream: tb.dreamTitle || '',
    isTask: false,
    isDeadline: false,
    isTimeBlock: true,
    isRecurring: true,
  };
}

function expandTimeBlocks(blocks, year, month) {
  var expanded = [];
  if (!blocks) return expanded;
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  for (var day = 1; day <= daysInMonth; day++) {
    var date = new Date(year, month, day);
    var jsDay = date.getDay();
    var pythonDay = jsDay === 0 ? 6 : jsDay - 1;
    blocks.forEach(function (block) {
      var blockDay = block.dayOfWeek != null ? block.dayOfWeek : block.day_of_week;
      if (blockDay === pythonDay) {
        if (block.isActive !== false && block.is_active !== false) {
          var dateStr = getKey(year, month, day);
          var tb = Object.assign({}, block, {
            _expandedId: 'tb-' + block.id + '-' + dateStr,
          });
          expanded.push(normalizeTimeBlock(tb, dateStr));
        }
      }
    });
  }
  return expanded;
}

function parseTimeTo24h(timeStr) {
  var match = (timeStr || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '09:00:00';
  var h = parseInt(match[1], 10);
  var m = match[2];
  var ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return String(h).padStart(2, '0') + ':' + m + ':00';
}

var DRAFT_KEY = 'dp-event-draft';

var useCalendarScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  var [mounted, setMounted] = useState(false);
  var [viewY, setViewY] = useState(TODAY.y);
  var [viewM, setViewM] = useState(TODAY.m);
  var [selDay, setSelDay] = useState(null);
  var [addEvt, setAddEvt] = useState(false);
  var [newTitle, setNewTitle] = useState('');
  var [newTime, setNewTime] = useState('9:00 AM');
  var [confirmDel, setConfirmDel] = useState(null);
  var [calMenu, setCalMenu] = useState(false);
  var draftLoaded = useRef(false);

  // Load draft on mount
  useEffect(function () {
    AsyncStorage.getItem(DRAFT_KEY).then(function (val) {
      if (val) {
        try {
          var d = JSON.parse(val);
          if (d.title) setNewTitle(d.title);
          if (d.time) setNewTime(d.time);
          if (d.title) setAddEvt(true);
          draftLoaded.current = true;
        } catch (e) { /* ignore malformed draft */ }
      }
    });
  }, []);

  // Auto-save draft every 5 seconds while editing
  useEffect(function () {
    var t = setInterval(function () {
      if (newTitle) {
        AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({
          title: newTitle,
          time: newTime,
        }));
      }
    }, 5000);
    return function () { clearInterval(t); };
  }, [newTitle, newTime]);

  var startDate = viewY + '-' + String(viewM + 1).padStart(2, '0') + '-01';
  var endDay = getDaysInMonth(viewY, viewM);
  var endDate = viewY + '-' + String(viewM + 1).padStart(2, '0') + '-' + String(endDay).padStart(2, '0');

  var tasksQuery = useQuery({
    queryKey: ['calendar-tasks', startDate, endDate],
    queryFn: function () { return apiGet(CALENDAR.VIEW + '?start=' + startDate + '&end=' + endDate); },
  });

  var eventsQuery = useQuery({
    queryKey: ['calendar-events', startDate, endDate],
    queryFn: function () { return apiGet(CALENDAR.EVENTS + '?start_time__gte=' + startDate + '&start_time__lte=' + endDate + 'T23:59:59'); },
  });

  var todayQuery = useQuery({
    queryKey: ['calendar-today'],
    queryFn: function () { return apiGet(CALENDAR.TODAY); },
  });

  var timeBlocksQuery = useQuery({
    queryKey: ['timeblocks'],
    queryFn: function () { return apiGet(CALENDAR.TIMEBLOCKS); },
    staleTime: 60000,
  });

  useEffect(function () { setTimeout(function () { setMounted(true); }, 100); }, []);

  // Build events map
  var events = {};
  function addToMap(item) {
    if (!item.date) return;
    var k;
    if (item.isTimeBlock) {
      // TimeBlocks already have the correct getKey() format as date
      k = item.date;
    } else {
      var d = new Date(item.date);
      if (isNaN(d.getTime())) return;
      k = getKey(d.getFullYear(), d.getMonth(), d.getDate());
    }
    if (!events[k]) events[k] = [];
    var exists = events[k].some(function (e) { return e.id === item.id; });
    if (!exists) events[k].push(item);
  }

  var rawTasks = (tasksQuery.data && tasksQuery.data.results) || tasksQuery.data || [];
  if (Array.isArray(rawTasks)) rawTasks.forEach(function (t) { addToMap(normalizeTask(t)); });

  var rawCalEvents = (eventsQuery.data && eventsQuery.data.results) || eventsQuery.data || [];
  if (Array.isArray(rawCalEvents)) rawCalEvents.forEach(function (e) { addToMap(normalizeEvent(e)); });

  var rawToday = (todayQuery.data && todayQuery.data.results) || todayQuery.data || [];
  if (Array.isArray(rawToday)) rawToday.forEach(function (t) { addToMap(normalizeTask(t)); });

  var rawTimeBlocks = (timeBlocksQuery.data && timeBlocksQuery.data.results) || timeBlocksQuery.data || [];
  var expandedBlocks = Array.isArray(rawTimeBlocks)
    ? expandTimeBlocks(rawTimeBlocks, viewY, viewM)
    : [];
  expandedBlocks.forEach(function (tb) { addToMap(tb); });

  function invalidateCalendar() {
    queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-today'] });
    queryClient.invalidateQueries({ queryKey: ['timeblocks'] });
  }

  var toggleTaskMut = useMutation({
    mutationFn: function (params) { return apiPost(DREAMS.TASKS.COMPLETE(params.id)); },
    onSuccess: function () { invalidateCalendar(); },
    onError: function (err) {
      console.warn('Failed to toggle task', err.userMessage || err.message);
    },
  });

  var toggleEventMut = useMutation({
    mutationFn: function (params) {
      return apiPatch(CALENDAR.EVENT_DETAIL(params.id), {
        status: params.completed ? 'completed' : 'scheduled',
      });
    },
    onSuccess: function () { invalidateCalendar(); },
    onError: function (err) {
      console.warn('Failed to toggle event', err.userMessage || err.message);
    },
  });

  var deleteEventMut = useMutation({
    mutationFn: function (params) { return apiDelete(CALENDAR.EVENT_DETAIL(params.id)); },
    onSuccess: function () { invalidateCalendar(); },
    onError: function (err) {
      console.warn('Failed to delete event', err.userMessage || err.message);
    },
  });

  var createMutation = useMutation({
    mutationFn: function (body) { return apiPost(CALENDAR.EVENTS, body); },
    onSuccess: function () { invalidateCalendar(); },
    onError: function (err) {
      console.warn('Failed to create event', err.userMessage || err.message);
    },
  });

  var prevMonth = function () {
    if (viewM === 0) { setViewM(11); setViewY(viewY - 1); }
    else { setViewM(viewM - 1); }
    setSelDay(1);
  };

  var nextMonth = function () {
    if (viewM === 11) { setViewM(0); setViewY(viewY + 1); }
    else { setViewM(viewM + 1); }
    setSelDay(1);
  };

  var goToday = function () { setViewY(TODAY.y); setViewM(TODAY.m); setSelDay(null); };

  var toggleTask = function (evtKey, evtId) {
    var evt = (events[evtKey] || []).find(function (e) { return e.id === evtId; });
    if (!evt) return;
    if (evt.isTask) {
      toggleTaskMut.mutate({ id: evtId });
    } else {
      toggleEventMut.mutate({ id: evtId, completed: !evt.done });
    }
  };

  var deleteEvent = function (evtKey, evtId) {
    var evt = (events[evtKey] || []).find(function (e) { return e.id === evtId; });
    if (evt && evt.isTask) {
      // Tasks are managed from their dream, not deleted from calendar
      console.warn('Tasks are managed from their dream screen');
    } else {
      deleteEventMut.mutate({ id: evtId });
    }
    setConfirmDel(null);
  };

  var handleAddEvt = function () {
    var cleanTitle = sanitizeText(newTitle, 200);
    var missing = validateRequired({ title: cleanTitle });
    if (missing.length > 0) return;
    var day = selDay || TODAY.d;
    var dateStr = viewY + '-' + String(viewM + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var time24 = parseTimeTo24h(newTime);
    var startTime = dateStr + 'T' + time24;
    var endH = parseInt(time24.split(':')[0], 10) + 1;
    var endTime = dateStr + 'T' + String(endH).padStart(2, '0') + ':' + time24.split(':')[1] + ':00';
    createMutation.mutate({ title: cleanTitle, start_time: startTime, end_time: endTime });
    setNewTitle('');
    setAddEvt(false);
    AsyncStorage.removeItem(DRAFT_KEY);
  };

  var isLoading = tasksQuery.isLoading || todayQuery.isLoading;
  var daysInMonth = getDaysInMonth(viewY, viewM);
  var firstDow = getFirstDow(viewY, viewM);

  var isToday = function (d) { return d === TODAY.d && viewM === TODAY.m && viewY === TODAY.y; };
  var isSel = function (d) { return selDay !== null && d === selDay; };

  var todayKey = getKey(TODAY.y, TODAY.m, TODAY.d);
  var tomorrowD = new Date(TODAY.y, TODAY.m, TODAY.d + 1);
  var tomorrowKey = getKey(tomorrowD.getFullYear(), tomorrowD.getMonth(), tomorrowD.getDate());
  var todayEvents = events[todayKey] || [];
  var tomorrowEvents = events[tomorrowKey] || [];
  var selKey = selDay ? getKey(viewY, viewM, selDay) : null;
  var selEvents = selKey ? events[selKey] || [] : [];

  var cells = [];
  for (var i = 0; i < firstDow; i++) cells.push(null);
  for (var d = 1; d <= daysInMonth; d++) cells.push(d);

  var googleCalendarEnabled = isEnabled('GOOGLE_CALENDAR');

  return {
    navigation: navigation,
    googleCalendarEnabled: googleCalendarEnabled,
    mounted: mounted,
    viewY: viewY,
    viewM: viewM,
    selDay: selDay,
    setSelDay: setSelDay,
    addEvt: addEvt,
    setAddEvt: setAddEvt,
    newTitle: newTitle,
    setNewTitle: setNewTitle,
    newTime: newTime,
    setNewTime: setNewTime,
    confirmDel: confirmDel,
    setConfirmDel: setConfirmDel,
    calMenu: calMenu,
    setCalMenu: setCalMenu,
    tasksQuery: tasksQuery,
    eventsQuery: eventsQuery,
    todayQuery: todayQuery,
    timeBlocksQuery: timeBlocksQuery,
    events: events,
    isLoading: isLoading,
    prevMonth: prevMonth,
    nextMonth: nextMonth,
    goToday: goToday,
    toggleTask: toggleTask,
    deleteEvent: deleteEvent,
    handleAddEvt: handleAddEvt,
    toggleTaskMut: toggleTaskMut,
    toggleEventMut: toggleEventMut,
    deleteEventMut: deleteEventMut,
    createMutation: createMutation,
    isToday: isToday,
    isSel: isSel,
    todayKey: todayKey,
    tomorrowKey: tomorrowKey,
    tomorrowD: tomorrowD,
    todayEvents: todayEvents,
    tomorrowEvents: tomorrowEvents,
    selKey: selKey,
    selEvents: selEvents,
    cells: cells,
    daysInMonth: daysInMonth,
    firstDow: firstDow,
    DAYS: DAYS,
    MONTHS: MONTHS,
    TODAY: TODAY,
    BRAND: BRAND,
    adaptColor: adaptColor,
    TYPE_COLORS: TYPE_COLORS,
    getKey: getKey,
  };
};

module.exports = useCalendarScreen;
