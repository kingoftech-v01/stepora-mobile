/**
 * useGoalRefineScreen — Business logic for Goal Refinement AI screen.
 * Multi-turn AI conversation to refine a goal into a SMART goal.
 */
var { useState, useEffect, useRef, useCallback } = require('react');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQueryClient } = require('@tanstack/react-query');
var { apiPost, apiPatch } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');

var STEPS = ['Understanding', 'Clarifying', 'Refining', 'SMART Goal Ready'];

var SMART_CRITERIA = [
  { key: 'specific', label: 'Specific', icon: 'crosshair', color: '#8B5CF6' },
  { key: 'measurable', label: 'Measurable', icon: 'bar-chart-2', color: '#3B82F6' },
  { key: 'achievable', label: 'Achievable', icon: 'award', color: '#10B981' },
  { key: 'relevant', label: 'Relevant', icon: 'star', color: '#F59E0B' },
  { key: 'timeBound', label: 'Time-bound', icon: 'clock', color: '#EF4444' },
];

var useGoalRefineScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var queryClient = useQueryClient();

  var goalId = route.params && route.params.goalId;
  var goalTitle = (route.params && route.params.goalTitle) || '';
  var goalDescription = (route.params && route.params.goalDescription) || '';
  var dreamId = route.params && route.params.dreamId;

  var [messages, setMessages] = useState([]);
  var [history, setHistory] = useState([]);
  var [input, setInput] = useState('');
  var [isLoading, setIsLoading] = useState(false);
  var [refinedGoal, setRefinedGoal] = useState(null);
  var [milestones, setMilestones] = useState(null);
  var [isComplete, setIsComplete] = useState(false);
  var [step, setStep] = useState(0);
  var [isApplying, setIsApplying] = useState(false);
  var [applied, setApplied] = useState(false);
  var [error, setError] = useState(null);
  var flatListRef = useRef(null);
  var inputRef = useRef(null);
  var hasStarted = useRef(false);

  /* ── Auto-start the conversation on mount ── */
  useEffect(function () {
    if (goalId && !hasStarted.current) {
      hasStarted.current = true;
      sendMessage('Help me refine this goal into a SMART goal.', true);
    }
  }, [goalId]);

  /* ── Scroll to bottom helper ── */
  var scrollToBottom = useCallback(function () {
    if (flatListRef.current) {
      setTimeout(function () {
        try {
          flatListRef.current.scrollToEnd({ animated: true });
        } catch (e) {
          // ignore scroll errors
        }
      }, 150);
    }
  }, []);

  /* ── Send message to the AI ── */
  var sendMessage = function (text, isInitial) {
    if (!text.trim() || isLoading) return;

    var userMsg = { role: 'user', content: text, id: String(Date.now()) };
    if (!isInitial) {
      setMessages(function (prev) {
        return prev.concat([userMsg]);
      });
    }
    setInput('');
    setError(null);
    setIsLoading(true);
    scrollToBottom();

    var currentHistory = isInitial ? [] : history;

    apiPost(DREAMS.GOALS.REFINE, {
      goalId: goalId,
      message: text,
      history: currentHistory,
    })
      .then(function (res) {
        var aiMsg = {
          role: 'assistant',
          content: res.message,
          id: String(Date.now() + 1),
          refinedGoal: res.refinedGoal || null,
          milestones: res.milestones || null,
        };

        setMessages(function (prev) {
          var base = isInitial ? [] : prev;
          return base.concat([aiMsg]);
        });

        /* Update history for the next turn */
        var newHistory = currentHistory.concat([
          { role: 'user', content: text },
          { role: 'assistant', content: res.message },
        ]);
        setHistory(newHistory);

        /* Progress tracking */
        var turnCount = Math.floor(newHistory.length / 2);
        if (res.isComplete) {
          setStep(3);
        } else if (turnCount >= 3) {
          setStep(2);
        } else if (turnCount >= 1) {
          setStep(1);
        }

        if (res.refinedGoal) {
          setRefinedGoal(res.refinedGoal);
        }
        if (res.milestones) {
          setMilestones(res.milestones);
        }
        if (res.isComplete) {
          setIsComplete(true);
        }

        setIsLoading(false);
        scrollToBottom();

        /* Focus input for next message */
        setTimeout(function () {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 200);
      })
      .catch(function (err) {
        var errMsg = {
          role: 'assistant',
          content: err.userMessage || err.message || 'Something went wrong. Please try again.',
          id: String(Date.now() + 1),
          isError: true,
        };
        setMessages(function (prev) {
          return prev.concat([errMsg]);
        });
        setIsLoading(false);
        setError(err.message);
        scrollToBottom();
      });
  };

  /* ── Handle user send ── */
  var handleSend = function () {
    if (!input.trim() || isLoading) return;
    sendMessage(input, false);
  };

  /* ── Apply refined goal ── */
  var handleApply = function () {
    if (!refinedGoal || isApplying) return;
    setIsApplying(true);

    apiPatch(DREAMS.GOALS.DETAIL(goalId), {
      title: refinedGoal.title,
      description: refinedGoal.description,
    })
      .then(function () {
        setApplied(true);
        setIsApplying(false);
        queryClient.invalidateQueries({ queryKey: ['dream', dreamId] });
        queryClient.invalidateQueries({ queryKey: ['dreams'] });
      })
      .catch(function (err) {
        setIsApplying(false);
        setError(err.userMessage || err.message || 'Failed to apply refinement.');
      });
  };

  /* ── Done / close ── */
  var handleDone = function () {
    navigation.goBack();
  };

  return {
    navigation: navigation,
    goalId: goalId,
    goalTitle: goalTitle,
    goalDescription: goalDescription,
    dreamId: dreamId,
    messages: messages,
    input: input,
    setInput: setInput,
    isLoading: isLoading,
    refinedGoal: refinedGoal,
    milestones: milestones,
    isComplete: isComplete,
    step: step,
    isApplying: isApplying,
    applied: applied,
    error: error,
    flatListRef: flatListRef,
    inputRef: inputRef,
    handleSend: handleSend,
    handleApply: handleApply,
    handleDone: handleDone,
    STEPS: STEPS,
    SMART_CRITERIA: SMART_CRITERIA,
    scrollToBottom: scrollToBottom,
  };
};

module.exports = useGoalRefineScreen;
