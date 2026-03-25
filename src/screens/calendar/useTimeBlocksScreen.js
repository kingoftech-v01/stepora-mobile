/**
 * useTimeBlocksScreen — Business logic for the Time Blocks screen.
 * CRUD operations on time blocks, form state, dream association.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost, apiPatch, apiDelete } = require('../../services/api');
var { CALENDAR, DREAMS } = require('../../services/endpoints');
var { BRAND } = require('../../styles/colors');

var BLOCK_COLOR_KEYS = [
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#10B981', label: 'Green' },
  { value: '#FCD34D', label: 'Yellow' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#EF4444', label: 'Red' },
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

var useTimeBlocksScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  var [mounted, setMounted] = useState(false);
  var [showModal, setShowModal] = useState(false);
  var [editingBlock, setEditingBlock] = useState(null);
  var [confirmDelete, setConfirmDelete] = useState(null);

  var [formTitle, setFormTitle] = useState('');
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
  });

  var updateMut = useMutation({
    mutationFn: function (params) { return apiPatch(CALENDAR.TIMEBLOCK_DETAIL(params.id), params.data); },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
      resetFormAndClose();
    },
  });

  var deleteMut = useMutation({
    mutationFn: function (id) { return apiDelete(CALENDAR.TIMEBLOCK_DETAIL(id)); },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
      setConfirmDelete(null);
    },
  });

  var resetFormAndClose = function () {
    setFormTitle('');
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
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormDreamId('');
    setFormColor('#8B5CF6');
    setShowModal(true);
  };

  var openEditModal = function (block) {
    setEditingBlock(block);
    setFormTitle(block.title || block.label || '');
    setFormStartTime(block.startTime || '09:00');
    setFormEndTime(block.endTime || '10:00');
    setFormDreamId(block.dreamId || block.dream || '');
    setFormColor(block.color || '#8B5CF6');
    setShowModal(true);
  };

  var handleSubmit = function () {
    var cleanTitle = (formTitle || '').trim().substring(0, 200);
    if (!cleanTitle) return;
    var timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(formStartTime) || !timeRegex.test(formEndTime)) return;
    var payload = {
      title: cleanTitle,
      start_time: formStartTime,
      end_time: formEndTime,
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
    BRAND: BRAND,
  };
};

module.exports = useTimeBlocksScreen;
