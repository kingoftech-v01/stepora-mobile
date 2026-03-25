/**
 * useCheckInScreen — Business logic for periodic dream check-ins.
 * Fetches check-in data, collects questionnaire answers, submits and polls for results.
 * Synced with web: handleBack, completed/failed/skipped status handling, PACE_STYLES.
 */
var { useState, useEffect, useRef } = require('react');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { apiGet, apiPost } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');
var { BRAND, GRADIENTS, adaptColor } = require('../../styles/colors');

var PACE_STYLES = {
  on_track: { color: '#5DE5A8', bg: 'rgba(93,229,168,0.12)', border: 'rgba(93,229,168,0.25)', label: 'On Track' },
  ahead: { color: '#14B8A6', bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.25)', label: 'Ahead of Schedule' },
  behind: { color: '#F69A9A', bg: 'rgba(246,154,154,0.12)', border: 'rgba(246,154,154,0.25)', label: 'Behind Schedule' },
};

var useCheckInScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var dreamId = route.params && route.params.dreamId;
  var checkinId = route.params && route.params.checkinId;
  var pollIntervalRef = useRef(null);

  var [mounted, setMounted] = useState(false);
  var [step, setStep] = useState('loading');
  var [checkin, setCheckin] = useState(null);
  var [questions, setQuestions] = useState([]);
  var [currentQ, setCurrentQ] = useState(0);
  var [answers, setAnswers] = useState({});
  var [cardAnim, setCardAnim] = useState(true);
  var [result, setResult] = useState(null);

  useEffect(function () {
    setTimeout(function () { setMounted(true); }, 100);
    return function () { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, []);

  useEffect(function () {
    var cancelled = false;
    apiGet(DREAMS.CHECKINS.DETAIL(checkinId))
      .then(function (data) {
        if (cancelled) return;
        setCheckin(data);
        // If check-in already completed, show results only (read-only)
        if (data.status === 'completed') {
          setResult(data);
          setStep('results');
          return;
        }
        // If check-in was already processed/failed, redirect to dream
        if (data.status === 'failed' || data.status === 'skipped') {
          navigation.navigate('DreamDetail', { id: dreamId });
          return;
        }
        var qs = (data.questionnaire || []).map(function (q, i) {
          return {
            id: q.id || 'q' + i,
            text: q.question || q.text || '',
            type: q.questionType || q.type || 'text',
            options: q.options || [],
            scaleMin: q.scaleMin || 1,
            scaleMax: q.scaleMax || 5,
            scaleLabels: q.scaleLabels || {},
            placeholder: q.placeholder || '',
            isRequired: q.isRequired !== false,
          };
        });
        setQuestions(qs);
        var initAnswers = {};
        qs.forEach(function (q) {
          if (q.type === 'slider') initAnswers[q.id] = Math.round((q.scaleMin + q.scaleMax) / 2);
        });
        setAnswers(initAnswers);
        setStep('intro');
      })
      .catch(function () {
        if (!cancelled) setStep('error');
      });
    return function () { cancelled = true; };
  }, [checkinId]);

  var setAnswer = function (qId, value) {
    setAnswers(function (prev) { var n = Object.assign({}, prev); n[qId] = value; return n; });
  };

  var handleNext = function () {
    var q = questions[currentQ];
    if (q.type !== 'slider' && !answers[q.id] && q.isRequired) return;
    if (currentQ >= questions.length - 1) { handleSubmit(); return; }
    setCardAnim(false);
    setTimeout(function () { setCurrentQ(function (p) { return p + 1; }); setCardAnim(true); }, 200);
  };

  var handleBack = function () {
    if (currentQ === 0) {
      setStep('intro');
      return;
    }
    setCardAnim(false);
    setTimeout(function () { setCurrentQ(function (p) { return p - 1; }); setCardAnim(true); }, 200);
  };

  var handleSubmit = function () {
    setStep('polling');
    var responseMap = {};
    questions.forEach(function (q) { if (answers[q.id] !== undefined) responseMap[q.id] = answers[q.id]; });
    apiPost(DREAMS.CHECKINS.RESPOND(checkinId), { responses: responseMap })
      .then(function () { startPolling(); })
      .catch(function () { setStep('question'); });
  };

  var startPolling = function () {
    var pollCount = 0;
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    var interval = setInterval(function () {
      pollCount++;
      if (pollCount > 60) {
        clearInterval(interval); pollIntervalRef.current = null;
        navigation.navigate('DreamDetail', { id: dreamId }); return;
      }
      apiGet(DREAMS.CHECKINS.STATUS(checkinId)).then(function (data) {
        if (data.status === 'completed') {
          clearInterval(interval); pollIntervalRef.current = null;
          setResult(data); setStep('results');
        } else if (data.status === 'failed') {
          clearInterval(interval); pollIntervalRef.current = null;
          navigation.navigate('DreamDetail', { id: dreamId });
        }
      }).catch(function () {});
    }, 3000);
    pollIntervalRef.current = interval;
  };

  var question = questions[currentQ];
  var progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;
  var canProceed = question
    ? (question.type === 'slider' ? true : question.type === 'choice' ? !!answers[question.id] : !!(answers[question.id] && String(answers[question.id]).trim()))
    : false;

  return {
    navigation: navigation,
    dreamId: dreamId,
    checkinId: checkinId,
    mounted: mounted,
    step: step,
    setStep: setStep,
    checkin: checkin,
    questions: questions,
    currentQ: currentQ,
    question: question,
    answers: answers,
    setAnswer: setAnswer,
    cardAnim: cardAnim,
    result: result,
    progress: progress,
    canProceed: canProceed,
    handleNext: handleNext,
    handleBack: handleBack,
    handleSubmit: handleSubmit,
    BRAND: BRAND,
    GRADIENTS: GRADIENTS,
    adaptColor: adaptColor,
    PACE_STYLES: PACE_STYLES,
  };
};

module.exports = useCheckInScreen;
