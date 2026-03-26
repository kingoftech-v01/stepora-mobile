/**
 * useTimeBlocksScreen — Business logic for the Time Blocks screen.
 * CRUD operations on time blocks, form state, dream association.
 * Synced with web: block_type + day_of_week fields, normalizeTime helpers,
 * calendar events overlay, toast messages, sanitizeText.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost, apiPatch, apiDelete } = require('../../services/api');
var { CALENDAR, DREAMS } = require('../../services/endpoints');
var { BRAND } = require('../../styles/colors');
var { sanitizeText } = require('../../utils/sanitize');
var logger = require('../../utils/logger');

var BLOCK_TYPE_OPTIONS = [
  { value: 'work', key: 'calendar.blockTypeWork' },
  { value: 'personal', key: 'calendar.blockTypePersonal' },
  { value: 'family', key: 'calendar.blockTypeFamily' },
  { value: 'exercise', key: 'calendar.blockTypeExercise' },
  { value: 'blocked', key: 'calendar.blockTypeBlocked' },
];

var DAY_OF_WEEK_OPTIONS = [
  { value: 0, key: 'calendar.dayMon' },
  { value: 1, key: 'calendar.dayTue' },
  { value: 2, key: 'calendar.dayWed' },
  { value: 3, key: 'calendar.dayThu' },
  { value: 4, key: 'calendar.dayFri' },
  { value: 5, key: 'calendar.daySat' },
  { value: 6, key: 'calendar.daySun' },
];

var BLOCK_COLOR_KEYS = [
  { value: '#8B5CF6', key: 'colors.purple' },
  { value: '#3B82F6', key: 'colors.blue' },
  { value: '#14B8A6', key: 'colors.teal' },
  { value: '#10B981', key: 'colors.green' },
  { value: '#FCD34D', key: 'colors.yellow' },
  { value: '#F59E0B', key: 'colors.amber' },
  { value: '#EC4899', key: 'colors.pink' },
  { value: '#EF4444', key: 'colors.red' },
];

function formatTimeDisplay(time) {
  if (!time) return '';
  var parts = time.split(':');
  var h = parseInt(parts[0], 10);
  var m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  var hour12 = h % 12 || 12;
  return hour12 + ':' + m + ' ' + ampm;
}

/**
 * Normalize a time string to HH:MM (strip seconds if present).
 * Input: "09:00:00" or "09:00" -> Output: "09:00"
 */
function normalizeTimeToHHMM(t) {
  if (!t) return t;
  var parts = t.split(':');
  if (parts.length >= 2) return parts[0] + ':' + parts[1];
  return t;
}

/**
 * Normalize a time string to HH:MM:SS for the backend.
 * Input: "09:00" -> Output: "09:00:00"
 * Input: "09:00:00" -> Output: "09:00:00"
 */
function normalizeTimeToHHMMSS(t) {
  if (!t) return t;
  var parts = t.split(':');
  if (parts.length === 2) return t + ':00';
  return t;
}

var useTimeBlocksScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  var [mounted, setMounted] = useState(false);
  var [showModal, setShowModal] = useState(false);
  var [editingBlock, setEditingBlock] = useState(null);
  var [confirmDelete, setConfirmDelete] = useState(null);

  var [formTitle, setFormTitle] = useState('');
  var [formBlockType, setFormBlockType] = useState('personal');
  var [formDayOfWeek, setFormDayOfWeek] = useState(function () {
    // JS: 0=Sunday, 6=Saturday -> convert to Python: 0=Monday, 6=Sunday
    var jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  });
  var [formStartTime, setFormStartTime] = useState('09:00');
  var [formEndTime, setFormEndTime] = useState('10:00');
  var [formDreamId, setFormDreamId] = useState('');
  var [formColor, setFormColor] = useState('#8B5CF6');

  useEffect(function () {
    var timer = setTimeout(function () { setMounted(true); }, 50);
    return function () { clearTimeout(timer); };
  }, []);

  var blocksQuery = useQuery({
    queryKey: ['time-blocks'],
    queryFn: function () { return apiGet(CALENDAR.TIMEBLOCKS); },
  });
  var timeBlocks = (blocksQuery.data && blocksQuery.data.results) || blocksQuery.data || [];

  var calEventsQuery = useQuery({
    queryKey: ['calendar-events'],
    queryFn: function () { return apiGet(CALENDAR.EVENTS); },
    staleTime: 60000,
  });

  var calEvents = (calEventsQuery.data && calEventsQuery.data.results) || calEventsQuery.data || [];

  // Group calendar events by day of week (Python: 0=Mon, 6=Sun)
  var eventsByDay = {};
  if (Array.isArray(calEvents)) {
    calEvents.forEach(function (evt) {
      var startStr = evt.startTime || evt.start_time || evt.start || '';
      if (!startStr) return;
      var d = new Date(startStr);
      if (isNaN(d.getTime())) return;
      var jsDay = d.getDay();
      var dow = jsDay === 0 ? 6 : jsDay - 1;
      if (!eventsByDay[dow]) eventsByDay[dow] = [];
      eventsByDay[dow].push({
        id: 'evt-' + evt.id,
        sourceId: evt.id,
        title: evt.title || '',
        startTime: startStr.includes('T') ? startStr.split('T')[1].substring(0, 5) : '',
        endTime: (evt.endTime || evt.end_time || evt.end || '').includes('T')
          ? (evt.endTime || evt.end_time || evt.end).split('T')[1].substring(0, 5)
          : '',
        color: '#6366F1',
        isCalendarEvent: true,
        date: startStr.split('T')[0],
      });
    });
  }

  var dreamsQuery = useQuery({
    queryKey: ['dreams-list'],
    queryFn: function () { return apiGet(DREAMS.LIST); },
  });
  var dreams = (dreamsQuery.data && dreamsQuery.data.results) || dreamsQuery.data || [];

  var createMut = useMutation({
    mutationFn: function (payload) { return apiPost(CALENDAR.TIMEBLOCKS, payload); },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
      resetFormAndClose();
    },
    onError: function (err) {
      logger.warn('Failed to create time block', err.userMessage || err.message);
    },
  });

  var updateMut = useMutation({
    mutationFn: function (params) { return apiPatch(CALENDAR.TIMEBLOCK_DETAIL(params.id), params.data); },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
      resetFormAndClose();
    },
    onError: function (err) {
      logger.warn('Failed to update time block', err.userMessage || err.message);
    },
  });

  var deleteMut = useMutation({
    mutationFn: function (id) { return apiDelete(CALENDAR.TIMEBLOCK_DETAIL(id)); },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
      setConfirmDelete(null);
    },
    onError: function (err) {
      logger.warn('Failed to delete time block', err.userMessage || err.message);
    },
  });

  var resetFormAndClose = function () {
    setFormTitle('');
    setFormBlockType('personal');
    var jsDay = new Date().getDay();
    setFormDayOfWeek(jsDay === 0 ? 6 : jsDay - 1);
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormDreamId('');
    setFormColor('#8B5CF6');
    setEditingBlock(null);
    setShowModal(false);
  };

  var openAddModal = function () {
    setEditingBlock(null);
    setFormTitle('');
    setFormBlockType('personal');
    var jsDay = new Date().getDay();
    setFormDayOfWeek(jsDay === 0 ? 6 : jsDay - 1);
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormDreamId('');
    setFormColor('#8B5CF6');
    setShowModal(true);
  };

  var openEditModal = function (block) {
    setEditingBlock(block);
    setFormTitle(block.title || block.label || '');
    setFormBlockType(block.blockType || 'personal');
    setFormDayOfWeek(block.dayOfWeek != null ? block.dayOfWeek : 0);
    // API returns "HH:MM:SS" but form expects "HH:MM"
    setFormStartTime(normalizeTimeToHHMM(block.startTime) || '09:00');
    setFormEndTime(normalizeTimeToHHMM(block.endTime) || '10:00');
    setFormDreamId(block.dreamId || block.dream || '');
    setFormColor(block.color || '#8B5CF6');
    setShowModal(true);
  };

  var handleSubmit = function () {
    var cleanTitle = sanitizeText(formTitle, 200);
    if (!cleanTitle) return;
    var timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(formStartTime) || !timeRegex.test(formEndTime)) return;
    var payload = {
      title: cleanTitle,
      block_type: formBlockType,
      day_of_week: formDayOfWeek,
      start_time: normalizeTimeToHHMMSS(formStartTime),
      end_time: normalizeTimeToHHMMSS(formEndTime),
      color: formColor,
    };
    if (formDreamId) payload.dream_id = formDreamId;
    if (editingBlock) {
      updateMut.mutate({ id: editingBlock.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  var handleDelete = function (id) { deleteMut.mutate(id); };

  return {
    navigation: navigation,
    mounted: mounted,
    showModal: showModal,
    setShowModal: setShowModal,
    editingBlock: editingBlock,
    confirmDelete: confirmDelete,
    setConfirmDelete: setConfirmDelete,
    formTitle: formTitle,
    setFormTitle: setFormTitle,
    formBlockType: formBlockType,
    setFormBlockType: setFormBlockType,
    formDayOfWeek: formDayOfWeek,
    setFormDayOfWeek: setFormDayOfWeek,
    formStartTime: formStartTime,
    setFormStartTime: setFormStartTime,
    formEndTime: formEndTime,
    setFormEndTime: setFormEndTime,
    formDreamId: formDreamId,
    setFormDreamId: setFormDreamId,
    formColor: formColor,
    setFormColor: setFormColor,
    blocksQuery: blocksQuery,
    timeBlocks: timeBlocks,
    calEventsQuery: calEventsQuery,
    calEvents: calEvents,
    eventsByDay: eventsByDay,
    dreamsQuery: dreamsQuery,
    dreams: dreams,
    createMut: createMut,
    updateMut: updateMut,
    deleteMut: deleteMut,
    resetFormAndClose: resetFormAndClose,
    openAddModal: openAddModal,
    openEditModal: openEditModal,
    handleSubmit: handleSubmit,
    handleDelete: handleDelete,
    formatTimeDisplay: formatTimeDisplay,
    BLOCK_COLOR_KEYS: BLOCK_COLOR_KEYS,
    BLOCK_TYPE_OPTIONS: BLOCK_TYPE_OPTIONS,
    DAY_OF_WEEK_OPTIONS: DAY_OF_WEEK_OPTIONS,
    BRAND: BRAND,
  };
};

module.exports = useTimeBlocksScreen;
