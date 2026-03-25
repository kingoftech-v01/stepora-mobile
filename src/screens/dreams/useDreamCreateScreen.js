/**
 * useDreamCreateScreen — Business logic for the dream creation flow.
 * 3-step wizard: Details -> Category -> Timeframe -> Create.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQueryClient } = require('@tanstack/react-query');
var { apiPost } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');
var { catSolid, BRAND } = require('../../styles/colors');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;

var CATEGORIES = [
  { id: 'career', label: 'Career', icon: 'briefcase', color: catSolid('career') },
  { id: 'health', label: 'Health', icon: 'heart', color: catSolid('health') },
  { id: 'finance', label: 'Finance', icon: 'dollar-sign', color: catSolid('finance') },
  { id: 'hobbies', label: 'Hobbies', icon: 'edit-3', color: catSolid('hobbies') },
  { id: 'personal', label: 'Growth', icon: 'trending-up', color: catSolid('personal') },
  { id: 'relationships', label: 'Social', icon: 'users', color: catSolid('relationships') },
];

var TIMEFRAMES = [
  { id: '1m', label: '1 Month' },
  { id: '3m', label: '3 Months' },
  { id: '6m', label: '6 Months' },
  { id: '1y', label: '1 Year' },
];

var MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

var DAYS_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

var useDreamCreateScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  var [step, setStep] = useState(0);
  var [title, setTitle] = useState('');
  var [description, setDescription] = useState('');
  var [category, setCategory] = useState(null);
  var [timeframe, setTimeframe] = useState(null);
  var [customDate, setCustomDate] = useState(null);
  var [showCustom, setShowCustom] = useState(false);
  var [calMonth, setCalMonth] = useState(new Date().getMonth());
  var [calYear, setCalYear] = useState(new Date().getFullYear());
  var [touched, setTouched] = useState({ 0: false, 1: false, 2: false });
  var [submitting, setSubmitting] = useState(false);
  var [serverError, setServerError] = useState('');

  // AI auto-categorize
  var [aiLoading, setAiLoading] = useState(false);
  var [aiSuggestion, setAiSuggestion] = useState(null);
  var [selectedTags, setSelectedTags] = useState({});
  var [aiError, setAiError] = useState('');

  // Draft auto-save
  useEffect(function () {
    AsyncStorage.getItem('dp-dream-draft').then(function (val) {
      if (val) {
        try {
          var parsed = JSON.parse(val);
          if (parsed.title && !title) setTitle(parsed.title);
          if (parsed.description && !description) setDescription(parsed.description);
          if (parsed.category) setCategory(parsed.category);
        } catch (e) { /* ignore */ }
      }
    }).catch(function () {});
  }, []);

  useEffect(function () {
    if (!title && !description) return;
    var timer = setTimeout(function () {
      AsyncStorage.setItem('dp-dream-draft',
        JSON.stringify({ title: title, description: description, category: category })
      ).catch(function () {});
    }, 1000);
    return function () { clearTimeout(timer); };
  }, [title, description, category]);

  function clearDraft() {
    AsyncStorage.removeItem('dp-dream-draft').catch(function () {});
  }

  var STEPS = ['Details', 'Category', 'Timeframe'];
  var progressPercent = ((step + 1) / STEPS.length) * 100;

  function canNext() {
    if (step === 0) return title.trim().length > 0 && description.trim().length >= 10;
    if (step === 1) return category !== null;
    if (step === 2) return timeframe !== null || customDate !== null;
    return true;
  }

  function getValidationMessage(s) {
    if (s === 0 && title.trim().length === 0) return 'Enter a dream title';
    if (s === 0 && title.trim().length > 0 && description.trim().length < 10) return 'Description must be at least 10 characters';
    if (s === 1 && category === null) return 'Select a category';
    if (s === 2 && timeframe === null && customDate === null) return 'Set a target date';
    return null;
  }

  function handleAutoCategorize() {
    if (aiLoading) return;
    if (!title.trim() || description.trim().length < 10) return;
    setAiLoading(true);
    setAiError('');
    setAiSuggestion(null);
    apiPost(DREAMS.AUTO_CATEGORIZE, { title: title.trim(), description: description.trim() })
      .then(function (result) {
        setAiLoading(false);
        setAiSuggestion(result);
        var tagMap = {};
        (result.tags || []).forEach(function (tg) { tagMap[tg.name] = true; });
        setSelectedTags(tagMap);
      })
      .catch(function (err) {
        setAiLoading(false);
        setAiError(err.userMessage || err.message || 'AI categorization failed');
      });
  }

  function handleApplyAiCategory() {
    if (!aiSuggestion) return;
    setCategory(aiSuggestion.category);
  }

  function handleToggleTag(tagName) {
    setSelectedTags(function (prev) {
      var next = Object.assign({}, prev);
      next[tagName] = !next[tagName];
      return next;
    });
  }

  function handleCreateDream() {
    if (submitting) return;
    setSubmitting(true);
    setServerError('');

    var targetDate = null;
    if (customDate) {
      targetDate = customDate.year + '-' +
        String(customDate.month + 1).padStart(2, '0') + '-' +
        String(customDate.day).padStart(2, '0');
    } else if (timeframe) {
      var now = new Date();
      var months = timeframe === '1m' ? 1 : timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : 12;
      now.setMonth(now.getMonth() + months);
      targetDate = now.toISOString().split('T')[0];
    }

    var tagsToAdd = [];
    if (aiSuggestion && aiSuggestion.tags) {
      aiSuggestion.tags.forEach(function (tg) {
        if (selectedTags[tg.name]) tagsToAdd.push(tg.name);
      });
    }

    apiPost(DREAMS.LIST, {
      title: title.trim(),
      description: description.trim(),
      category: category,
      target_date: targetDate,
    })
      .then(function (dream) {
        clearDraft();
        if (tagsToAdd.length > 0) {
          var tagPromises = tagsToAdd.map(function (tagName) {
            return apiPost(DREAMS.TAGS(dream.id), { tag_name: tagName }).catch(function () {});
          });
          return Promise.all(tagPromises).then(function () { return dream; });
        }
        return dream;
      })
      .then(function (dream) {
        setSubmitting(false);
        queryClient.invalidateQueries({ queryKey: ['dreams'] });
        navigation.navigate('Calibration', { id: dream.id });
      })
      .catch(function (err) {
        setSubmitting(false);
        var msg = err.userMessage || err.message || 'Failed to create dream. Please try again.';
        setServerError(msg);
      });
  }

  function handleNext() {
    if (!canNext()) {
      setTouched(function (prev) { return Object.assign({}, prev, { [step]: true }); });
      return;
    }
    setTouched(function (prev) { return Object.assign({}, prev, { [step]: false }); });
    if (step === 2) {
      handleCreateDream();
    } else {
      setStep(step + 1);
    }
  }

  // Calendar helpers
  function getCalendarCells() {
    var firstDay = new Date(calYear, calMonth, 1).getDay();
    var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    var prevMonthDays = new Date(calYear, calMonth, 0).getDate();
    var cells = [];
    for (var i = 0; i < firstDay; i++) cells.push({ day: prevMonthDays - firstDay + 1 + i, outside: true });
    for (var d = 1; d <= daysInMonth; d++) cells.push({ day: d, outside: false });
    var remaining = 7 - (cells.length % 7);
    if (remaining < 7) for (var j = 1; j <= remaining; j++) cells.push({ day: j, outside: true });
    return cells;
  }

  function isSelectedDate(d) {
    return customDate && customDate.year === calYear && customDate.month === calMonth && customDate.day === d;
  }

  function isTodayDate(d) {
    var today = new Date();
    return calYear === today.getFullYear() && calMonth === today.getMonth() && d === today.getDate();
  }

  function isPastDate(d) {
    var today = new Date();
    return new Date(calYear, calMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  function handleCalPrev() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else { setCalMonth(calMonth - 1); }
  }

  function handleCalNext() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else { setCalMonth(calMonth + 1); }
  }

  function handleSelectDate(day) {
    setCustomDate({ year: calYear, month: calMonth, day: day });
    setTimeframe('custom');
  }

  return {
    navigation: navigation,
    step: step,
    setStep: setStep,
    STEPS: STEPS,
    progressPercent: progressPercent,
    title: title,
    setTitle: setTitle,
    description: description,
    setDescription: setDescription,
    category: category,
    setCategory: setCategory,
    timeframe: timeframe,
    setTimeframe: setTimeframe,
    customDate: customDate,
    showCustom: showCustom,
    setShowCustom: setShowCustom,
    calMonth: calMonth,
    calYear: calYear,
    touched: touched,
    submitting: submitting,
    serverError: serverError,
    aiLoading: aiLoading,
    aiSuggestion: aiSuggestion,
    selectedTags: selectedTags,
    aiError: aiError,
    CATEGORIES: CATEGORIES,
    TIMEFRAMES: TIMEFRAMES,
    MONTHS: MONTHS,
    DAYS_LABELS: DAYS_LABELS,
    canNext: canNext,
    getValidationMessage: getValidationMessage,
    handleNext: handleNext,
    handleAutoCategorize: handleAutoCategorize,
    handleApplyAiCategory: handleApplyAiCategory,
    handleToggleTag: handleToggleTag,
    getCalendarCells: getCalendarCells,
    isSelectedDate: isSelectedDate,
    isTodayDate: isTodayDate,
    isPastDate: isPastDate,
    handleCalPrev: handleCalPrev,
    handleCalNext: handleCalNext,
    handleSelectDate: handleSelectDate,
  };
};

module.exports = useDreamCreateScreen;
