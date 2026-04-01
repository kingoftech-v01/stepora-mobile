/**
 * useCalibrationScreen — Business logic for dream calibration questions.
 * Fetches AI-generated questions, collects answers, triggers plan generation.
 * Synced with web useDreamDetailScreen: cache invalidation, resume support,
 * dream status pre-check, waitingForGeneration polling.
 */
var { useState, useEffect, useRef } = require('react');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');
var { BRAND, GRADIENTS, adaptColor } = require('../../styles/colors');
var logger = require('../../utils/logger');

var FALLBACK_QUESTIONS = [
  { id: 1, text: 'What experience level do you have with this?', type: 'choice', options: ['Beginner', 'Some experience', 'Intermediate', 'Advanced'] },
  { id: 2, text: 'How many hours per week can you dedicate?', type: 'choice', options: ['1-3 hours', '3-5 hours', '5-10 hours', '10+ hours'] },
  { id: 3, text: 'What would success look like for you?', type: 'text', placeholder: 'Describe your ideal outcome...' },
  { id: 4, text: 'What is your biggest motivation?', type: 'choice', options: ['Personal growth', 'Career advancement', 'Financial freedom', 'Better health'] },
  { id: 5, text: 'What obstacles do you anticipate?', type: 'choice', options: ['Time', 'Money', 'Knowledge', 'Motivation'] },
  { id: 6, text: 'What resources do you currently have?', type: 'text', placeholder: 'What might get in the way?' },
  { id: 7, text: 'Do you prefer structured or flexible plans?', type: 'choice', options: ['Very structured', 'Mostly structured', 'Mostly flexible', 'Very flexible'] },
];

var useCalibrationScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var id = route.params && route.params.id;
  var queryClient = useQueryClient();

  var [mounted, setMounted] = useState(false);
  var [currentQ, setCurrentQ] = useState(0);
  var [answers, setAnswers] = useState({});
  var [textValue, setTextValue] = useState('');
  var [completed, setCompleted] = useState(false);
  var [cardAnim, setCardAnim] = useState(true);
  var [questions, setQuestions] = useState([]);
  var [loadingQuestions, setLoadingQuestions] = useState(true);
  var [submittingAnswer, setSubmittingAnswer] = useState(false);
  var [generatingPlan, setGeneratingPlan] = useState(false);
  var [planResult, setPlanResult] = useState(null);
  var [planError, setPlanError] = useState(null);
  var [planMessage, setPlanMessage] = useState('');
  var [calibrationCount, setCalibrationCount] = useState(0);
  var [waitingForGeneration, setWaitingForGeneration] = useState(false);
  var pollIntervalRef = useRef(null);
  var genPollRef = useRef(null);

  useEffect(function () {
    setTimeout(function () { setMounted(true); }, 100);
    return function () {
      if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
      if (genPollRef.current) { clearInterval(genPollRef.current); genPollRef.current = null; }
    };
  }, []);

  function handleCalibrationComplete() {
    setCompleted(true);
    setGeneratingPlan(true);
    setPlanError(null);
    setPlanMessage('Starting plan generation...');
    // Immediately invalidate dream cache so DreamDetail shows updated status
    queryClient.invalidateQueries({ queryKey: ['dream', id] });
    queryClient.invalidateQueries({ queryKey: ['dreams'] });

    apiGet(DREAMS.DETAIL(id)).then(function (dreamData) {
      if (dreamData && Array.isArray(dreamData.calibrationResponses))
        setCalibrationCount(dreamData.calibrationResponses.length);
    }).catch(function () {});

    apiPost(DREAMS.GENERATE_PLAN(id)).catch(function (err) {
      var errStatus = err && err.status;
      if (errStatus === 429) {
        var isDailyQuota = err.body && err.body.code === 'daily_quota_exceeded';
        setPlanError(isDailyQuota ? 'Daily limit reached. Try again tomorrow.' : 'Rate limit reached. Please try again later.');
        setGeneratingPlan(false);
        return;
      }
      if (errStatus !== 202) {
        setPlanError(err.userMessage || err.message || 'Failed to start plan generation');
        setGeneratingPlan(false);
      }
    });

    var maxPolls = 120;
    var pollCount = 0;
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    var pollInterval = setInterval(function () {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(pollInterval);
        pollIntervalRef.current = null;
        setPlanError('Plan generation timed out');
        setGeneratingPlan(false);
        return;
      }
      apiGet(DREAMS.PLAN_STATUS(id)).then(function (statusData) {
        if (statusData.message) setPlanMessage(statusData.message);
        if (statusData.status === 'completed') {
          clearInterval(pollInterval);
          pollIntervalRef.current = null;
          queryClient.invalidateQueries({ queryKey: ['dream', id] });
          queryClient.invalidateQueries({ queryKey: ['dreams'] });
          setPlanResult({
            goals: Array(statusData.goals || 0).fill({}),
            milestones: statusData.milestones || 0,
            tasks: statusData.tasks || 0,
          });
          setGeneratingPlan(false);
        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval);
          pollIntervalRef.current = null;
          setPlanError(statusData.error || 'Plan generation failed');
          setGeneratingPlan(false);
        }
      }).catch(function () {});
    }, 5000);
    pollIntervalRef.current = pollInterval;
  }

  function mapQuestionsFromData(data) {
    if (!data || !Array.isArray(data.questions) || data.questions.length === 0) return null;
    return data.questions.map(function (q, i) {
      return {
        id: q.id || i + 1,
        text: q.question || q.text || 'Question ' + (i + 1),
        type: 'text',
        placeholder: 'Type your answer...',
        category: q.category || '',
        answer: q.answer || '',
      };
    });
  }

  function applyMappedQuestions(mapped) {
    setQuestions(mapped);
    // Resume support: pre-fill answers and skip to first unanswered question
    var answeredCount = 0;
    var prefilled = {};
    mapped.forEach(function (mq, idx) {
      if (mq.answer && mq.answer.trim()) {
        prefilled[mq.id] = mq.answer.trim();
        answeredCount = idx + 1;
      }
    });
    var hasUnanswered = mapped.some(function (mq, idx) {
      return idx >= answeredCount && (!mq.answer || !mq.answer.trim());
    });
    if (answeredCount > 0 && hasUnanswered) {
      setAnswers(prefilled);
      setCurrentQ(answeredCount);
    } else if (answeredCount > 0) {
      setAnswers(prefilled);
    }
  }

  function startPollingForQuestions(cancelledRef) {
    setWaitingForGeneration(true);
    setLoadingQuestions(false);
    if (genPollRef.current) clearInterval(genPollRef.current);
    var pollCount = 0;
    genPollRef.current = setInterval(function () {
      pollCount++;
      if (pollCount > 60 || (cancelledRef && cancelledRef.current)) {
        clearInterval(genPollRef.current);
        genPollRef.current = null;
        if (!cancelledRef || !cancelledRef.current) {
          setWaitingForGeneration(false);
          setQuestions(FALLBACK_QUESTIONS);
          setLoadingQuestions(false);
        }
        return;
      }
      apiGet(DREAMS.DETAIL(id)).then(function (dreamData) {
        if (cancelledRef && cancelledRef.current) return;
        var status = dreamData.calibrationStatus || dreamData.calibration_status;
        if (status === 'completed') {
          clearInterval(genPollRef.current);
          genPollRef.current = null;
          setWaitingForGeneration(false);
          setCompleted(true);
          queryClient.invalidateQueries({ queryKey: ['dream', id] });
          queryClient.invalidateQueries({ queryKey: ['dreams'] });
          return;
        }
        var responses = dreamData.calibrationResponses || dreamData.calibration_responses || [];
        var unanswered = responses.filter(function (r) { return !r.answer || r.answer === ''; });
        if (unanswered.length > 0) {
          clearInterval(genPollRef.current);
          genPollRef.current = null;
          setWaitingForGeneration(false);
          var mapped = unanswered.map(function (q, i) {
            return {
              id: q.id || i + 1,
              text: q.question || q.text || 'Question ' + (i + 1),
              type: 'text',
              placeholder: 'Type your answer...',
              category: q.category || '',
              answer: '',
            };
          });
          setQuestions(mapped);
        }
      }).catch(function () { /* ignore poll errors */ });
    }, 5000);
  }

  useEffect(function () {
    var cancelledRef = { current: false };
    // Invalidate dream cache so DreamDetail gets fresh data when user returns
    queryClient.invalidateQueries({ queryKey: ['dream', id] });
    queryClient.invalidateQueries({ queryKey: ['dreams'] });

    // First check dream status to avoid unnecessary start_calibration calls
    apiGet(DREAMS.DETAIL(id))
      .then(function (dreamData) {
        if (cancelledRef.current) return;
        var status = dreamData.calibrationStatus || dreamData.calibration_status || 'pending';

        if (status === 'completed') {
          // Calibration already done — show completed state, don't re-trigger
          setCompleted(true);
          setLoadingQuestions(false);
          return;
        }

        // For pending, skipped, or in_progress — call start_calibration
        return apiPost(DREAMS.START_CALIBRATION(id))
          .then(function (data) {
            if (cancelledRef.current) return;
            var mapped = mapQuestionsFromData(data);
            if (mapped && mapped.length > 0) {
              var hasUnanswered = mapped.some(function (mq) {
                return !mq.answer || !mq.answer.trim();
              });
              if (hasUnanswered) {
                applyMappedQuestions(mapped);
              } else {
                startPollingForQuestions(cancelledRef);
              }
            } else if (status === 'in_progress') {
              startPollingForQuestions(cancelledRef);
            } else {
              setQuestions(FALLBACK_QUESTIONS);
            }
          })
          .catch(function (err) {
            if (cancelledRef.current) return;
            var msg = (err && err.message) || '';
            if (msg.toLowerCase().includes('already completed')) {
              setCompleted(true);
              return;
            }
            if (status === 'in_progress') {
              startPollingForQuestions(cancelledRef);
              return;
            }
            setQuestions(FALLBACK_QUESTIONS);
          });
      })
      .catch(function () {
        if (cancelledRef.current) return;
        // If we can't fetch dream, fall back to calling start_calibration directly
        apiPost(DREAMS.START_CALIBRATION(id))
          .then(function (data) {
            if (cancelledRef.current) return;
            var mapped = mapQuestionsFromData(data);
            if (mapped && mapped.length > 0) {
              applyMappedQuestions(mapped);
            } else {
              setQuestions(FALLBACK_QUESTIONS);
            }
          })
          .catch(function (err) {
            if (cancelledRef.current) return;
            var msg = (err && err.message) || '';
            if (msg.toLowerCase().includes('already completed')) {
              setCompleted(true);
              return;
            }
            setQuestions(FALLBACK_QUESTIONS);
          });
      })
      .finally(function () {
        if (!cancelledRef.current && !genPollRef.current) setLoadingQuestions(false);
      });
    return function () { cancelledRef.current = true; };
  }, [id]);

  var question = questions[currentQ];
  var progress = questions.length > 0 ? ((currentQ + (completed ? 1 : 0)) / questions.length) * 100 : 0;
  var selectedOption = question ? answers[question.id] : undefined;

  function handleSelect(option) {
    setAnswers(function (prev) { return Object.assign({}, prev, { [question.id]: option }); });
  }

  function handleNext() {
    var answer;
    if (question.type === 'text' && textValue.trim()) {
      answer = textValue.trim();
      setAnswers(function (prev) { return Object.assign({}, prev, { [question.id]: answer }); });
      setTextValue('');
    } else { answer = selectedOption; }

    var isLastQuestion = currentQ >= questions.length - 1;
    if (answer) {
      if (isLastQuestion) setSubmittingAnswer(true);
      apiPost(DREAMS.ANSWER_CALIBRATION(id), { question: question.text, answer: answer, questionNumber: currentQ + 1 })
        .then(function (res) {
          setSubmittingAnswer(false);
          // Mid-batch completion: backend marked calibration done before we reached the last question
          if (!isLastQuestion && res && res.status === 'completed') {
            handleCalibrationComplete();
            return;
          }
          if (isLastQuestion && res && Array.isArray(res.questions) && res.questions.length > 0) {
            var newQs = res.questions.map(function (q, i) {
              return { id: q.id || 'extra-' + Date.now() + '-' + i, text: q.question || q.text || 'Follow-up question', type: 'text', placeholder: 'Type your answer...' };
            });
            setQuestions(function (prev) {
              var existingTexts = {};
              prev.forEach(function (p) { existingTexts[p.text.toLowerCase().trim()] = true; });
              var unique = newQs.filter(function (nq) { return !existingTexts[nq.text.toLowerCase().trim()]; });
              if (unique.length > 0) {
                setCardAnim(false);
                setTimeout(function () { setCurrentQ(prev.length); setCardAnim(true); }, 200);
                return prev.concat(unique);
              }
              handleCalibrationComplete();
              return prev;
            });
          } else if (isLastQuestion) { handleCalibrationComplete(); }
        })
        .catch(function (err) {
          setSubmittingAnswer(false);
          var errMsg = (err && err.message) || '';
          if (errMsg.toLowerCase().includes('already completed')) {
            handleCalibrationComplete();
            return;
          }
          if (isLastQuestion) {
            logger.warn('Failed to save calibration answer', err);
          }
        });
    }
    if (!isLastQuestion) {
      setCardAnim(false);
      setTimeout(function () { setCurrentQ(function (prev) { return prev + 1; }); setCardAnim(true); }, 200);
    } else if (!answer) { handleCalibrationComplete(); }
  }

  function handleSkip() {
    if (currentQ < questions.length - 1) {
      setCardAnim(false);
      setTimeout(function () { setCurrentQ(function (prev) { return prev + 1; }); setCardAnim(true); }, 200);
    } else {
      apiPost(DREAMS.SKIP_CALIBRATION(id)).catch(function () {});
      handleCalibrationComplete();
    }
  }

  var canProceed = question
    ? (question.type === 'choice' ? !!selectedOption : (question.type === 'text' ? textValue.trim().length > 0 : false))
    : false;

  return {
    navigation: navigation,
    id: id,
    mounted: mounted,
    currentQ: currentQ,
    questions: questions,
    question: question,
    progress: progress,
    answers: answers,
    selectedOption: selectedOption,
    textValue: textValue,
    setTextValue: setTextValue,
    completed: completed,
    cardAnim: cardAnim,
    loadingQuestions: loadingQuestions,
    waitingForGeneration: waitingForGeneration,
    submittingAnswer: submittingAnswer,
    generatingPlan: generatingPlan,
    planResult: planResult,
    planError: planError,
    calibrationCount: calibrationCount,
    planMessage: planMessage,
    canProceed: canProceed,
    handleSelect: handleSelect,
    handleNext: handleNext,
    handleSkip: handleSkip,
    handleCalibrationComplete: handleCalibrationComplete,
    BRAND: BRAND,
    GRADIENTS: GRADIENTS,
    adaptColor: adaptColor,
  };
};

module.exports = useCalibrationScreen;
