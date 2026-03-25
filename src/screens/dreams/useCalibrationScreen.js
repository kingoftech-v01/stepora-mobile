/**
 * useCalibrationScreen — Business logic for dream calibration questions.
 * Fetches AI-generated questions, collects answers, triggers plan generation.
 */
var { useState, useEffect, useRef } = require('react');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { apiGet, apiPost } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');
var { BRAND, GRADIENTS, adaptColor } = require('../../styles/colors');

var FALLBACK_QUESTIONS = [
  { id: 1, text: 'What experience level do you have with this?', type: 'choice', options: ['Beginner', 'Some experience', 'Intermediate', 'Advanced'] },
  { id: 2, text: 'How many hours per week can you dedicate?', type: 'choice', options: ['1-3 hours', '3-5 hours', '5-10 hours', '10+ hours'] },
  { id: 3, text: 'What would success look like for you?', type: 'text', placeholder: 'Describe your ideal outcome...' },
  { id: 4, text: 'What is your biggest motivation?', type: 'choice', options: ['Personal growth', 'Career advancement', 'Financial freedom', 'Better health'] },
  { id: 5, text: 'What obstacles do you anticipate?', type: 'text', placeholder: 'What might get in the way?' },
];

var useCalibrationScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var id = route.params && route.params.id;

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
  var pollIntervalRef = useRef(null);

  useEffect(function () {
    setTimeout(function () { setMounted(true); }, 100);
    return function () {
      if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    };
  }, []);

  function handleCalibrationComplete() {
    setCompleted(true);
    setGeneratingPlan(true);
    setPlanError(null);
    setPlanMessage('Starting plan generation...');

    apiGet(DREAMS.DETAIL(id)).then(function (dreamData) {
      if (dreamData && Array.isArray(dreamData.calibrationResponses))
        setCalibrationCount(dreamData.calibrationResponses.length);
    }).catch(function () {});

    apiPost(DREAMS.GENERATE_PLAN(id)).catch(function (err) {
      var errStatus = err && err.status;
      if (errStatus === 429) {
        setPlanError('Rate limit reached. Please try again later.');
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

  useEffect(function () {
    var cancelled = false;
    apiPost(DREAMS.START_CALIBRATION(id))
      .then(function (data) {
        if (!cancelled && data && Array.isArray(data.questions) && data.questions.length > 0) {
          var mapped = data.questions.map(function (q, i) {
            return { id: q.id || i + 1, text: q.question || q.text || 'Question ' + (i + 1), type: 'text', placeholder: 'Type your answer...', category: q.category || '' };
          });
          setQuestions(mapped);
        } else if (!cancelled) { setQuestions(FALLBACK_QUESTIONS); }
      })
      .catch(function (err) {
        if (!cancelled) {
          var msg = (err && err.message) || '';
          if (msg.toLowerCase().includes('already completed')) { handleCalibrationComplete(); return; }
          setQuestions(FALLBACK_QUESTIONS);
        }
      })
      .finally(function () { if (!cancelled) setLoadingQuestions(false); });
    return function () { cancelled = true; };
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
          if (isLastQuestion && res && Array.isArray(res.questions) && res.questions.length > 0) {
            var newQs = res.questions.map(function (q, i) {
              return { id: q.id || 'extra-' + Date.now() + '-' + i, text: q.question || q.text, type: 'text', placeholder: 'Type your answer...' };
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
        .catch(function () { setSubmittingAnswer(false); if (isLastQuestion) handleCalibrationComplete(); });
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
