/**
 * usePersonalityQuizScreen — Business logic for the personality assessment quiz.
 * Synced with the web app's usePersonalityQuiz.js.
 * 8 questions, determines dreamer type, submits to USERS.PERSONALITY_QUIZ.
 * Key fixes from web: i18n-ready question keys, handleSkip, updateUser on result,
 * onboardingCompleted key, visible error on API failure.
 */
var { useState, useCallback, useMemo } = require('react');
var { useNavigation } = require('@react-navigation/native');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;
var { apiPost } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');
var { useAuth } = require('../../../context/AuthContext');

// ─── Questions (i18n key-based, matching web) ───────────────
var QUESTIONS_KEYS = [
  {
    questionKey: 'quiz.q1.question',
    options: [
      { textKey: 'quiz.q1.opt1', icon: 'cpu' },
      { textKey: 'quiz.q1.opt2', icon: 'users' },
      { textKey: 'quiz.q1.opt3', icon: 'zap' },
      { textKey: 'quiz.q1.opt4', icon: 'target' },
    ],
  },
  {
    questionKey: 'quiz.q2.question',
    options: [
      { textKey: 'quiz.q2.opt1', icon: 'book-open' },
      { textKey: 'quiz.q2.opt2', icon: 'heart' },
      { textKey: 'quiz.q2.opt3', icon: 'award' },
      { textKey: 'quiz.q2.opt4', icon: 'compass' },
    ],
  },
  {
    questionKey: 'quiz.q3.question',
    options: [
      { textKey: 'quiz.q3.opt1', icon: 'star' },
      { textKey: 'quiz.q3.opt2', icon: 'users' },
      { textKey: 'quiz.q3.opt3', icon: 'trending-up' },
      { textKey: 'quiz.q3.opt4', icon: 'cpu' },
    ],
  },
  {
    questionKey: 'quiz.q4.question',
    options: [
      { textKey: 'quiz.q4.opt1', icon: 'star' },
      { textKey: 'quiz.q4.opt2', icon: 'users' },
      { textKey: 'quiz.q4.opt3', icon: 'check-circle' },
      { textKey: 'quiz.q4.opt4', icon: 'compass' },
    ],
  },
  {
    questionKey: 'quiz.q5.question',
    options: [
      { textKey: 'quiz.q5.opt1', icon: 'edit-3' },
      { textKey: 'quiz.q5.opt2', icon: 'users' },
      { textKey: 'quiz.q5.opt3', icon: 'briefcase' },
      { textKey: 'quiz.q5.opt4', icon: 'map' },
    ],
  },
  {
    questionKey: 'quiz.q6.question',
    options: [
      { textKey: 'quiz.q6.opt1', icon: 'zap' },
      { textKey: 'quiz.q6.opt2', icon: 'heart' },
      { textKey: 'quiz.q6.opt3', icon: 'target' },
      { textKey: 'quiz.q6.opt4', icon: 'compass' },
    ],
  },
  {
    questionKey: 'quiz.q7.question',
    options: [
      { textKey: 'quiz.q7.opt1', icon: 'star' },
      { textKey: 'quiz.q7.opt2', icon: 'users' },
      { textKey: 'quiz.q7.opt3', icon: 'target' },
      { textKey: 'quiz.q7.opt4', icon: 'map' },
    ],
  },
  {
    questionKey: 'quiz.q8.question',
    options: [
      { textKey: 'quiz.q8.opt1', icon: 'star' },
      { textKey: 'quiz.q8.opt2', icon: 'heart' },
      { textKey: 'quiz.q8.opt3', icon: 'award' },
      { textKey: 'quiz.q8.opt4', icon: 'compass' },
    ],
  },
];

// ─── Personality type configs (i18n key-based, matching web) ──
var TYPE_CONFIG_KEYS = {
  visionary: {
    titleKey: 'quiz.type.visionary.title',
    descriptionKey: 'quiz.type.visionary.description',
    traitKeys: [
      'quiz.type.visionary.trait1',
      'quiz.type.visionary.trait2',
      'quiz.type.visionary.trait3',
      'quiz.type.visionary.trait4',
    ],
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#EC4899'],
    icon: 'star',
  },
  achiever: {
    titleKey: 'quiz.type.achiever.title',
    descriptionKey: 'quiz.type.achiever.description',
    traitKeys: [
      'quiz.type.achiever.trait1',
      'quiz.type.achiever.trait2',
      'quiz.type.achiever.trait3',
      'quiz.type.achiever.trait4',
    ],
    color: '#F59E0B',
    gradient: ['#F59E0B', '#EF4444'],
    icon: 'award',
  },
  explorer: {
    titleKey: 'quiz.type.explorer.title',
    descriptionKey: 'quiz.type.explorer.description',
    traitKeys: [
      'quiz.type.explorer.trait1',
      'quiz.type.explorer.trait2',
      'quiz.type.explorer.trait3',
      'quiz.type.explorer.trait4',
    ],
    color: '#14B8A6',
    gradient: ['#14B8A6', '#3B82F6'],
    icon: 'compass',
  },
  collaborator: {
    titleKey: 'quiz.type.collaborator.title',
    descriptionKey: 'quiz.type.collaborator.description',
    traitKeys: [
      'quiz.type.collaborator.trait1',
      'quiz.type.collaborator.trait2',
      'quiz.type.collaborator.trait3',
      'quiz.type.collaborator.trait4',
    ],
    color: '#EC4899',
    gradient: ['#EC4899', '#F59E0B'],
    icon: 'users',
  },
  strategist: {
    titleKey: 'quiz.type.strategist.title',
    descriptionKey: 'quiz.type.strategist.description',
    traitKeys: [
      'quiz.type.strategist.trait1',
      'quiz.type.strategist.trait2',
      'quiz.type.strategist.trait3',
      'quiz.type.strategist.trait4',
    ],
    color: '#6366F1',
    gradient: ['#6366F1', '#8B5CF6'],
    icon: 'cpu',
  },
};

function usePersonalityQuizScreen() {
  var navigation = useNavigation();
  var { updateUser } = useAuth();
  // Placeholder t() — returns key as-is until I18nContext is wired up
  var t = function (key) { return key; };

  // Build translated QUESTIONS from keys (matching web's useMemo pattern)
  var QUESTIONS = useMemo(function () {
    return QUESTIONS_KEYS.map(function (q) {
      return {
        question: t(q.questionKey),
        options: q.options.map(function (o) {
          return { text: t(o.textKey), icon: o.icon };
        }),
      };
    });
  }, [t]);

  // Build translated TYPE_CONFIG from keys (matching web's useMemo pattern)
  var TYPE_CONFIG = useMemo(function () {
    var cfg = {};
    Object.keys(TYPE_CONFIG_KEYS).forEach(function (key) {
      var raw = TYPE_CONFIG_KEYS[key];
      cfg[key] = {
        title: t(raw.titleKey),
        description: t(raw.descriptionKey),
        traits: raw.traitKeys.map(function (tk) { return t(tk); }),
        color: raw.color,
        gradient: raw.gradient,
        icon: raw.icon,
      };
    });
    return cfg;
  }, [t]);

  var [currentQ, setCurrentQ] = useState(0);
  var [answers, setAnswers] = useState([]);
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var [showResult, setShowResult] = useState(false);
  var [error, setError] = useState('');

  var totalQuestions = QUESTIONS.length;
  var progress = ((currentQ + (answers[currentQ] !== undefined ? 1 : 0)) / totalQuestions) * 100;
  var question = QUESTIONS[currentQ];

  // ─── Answer a question ────────────────────────────────
  var handleAnswer = useCallback(function (optionIndex) {
    if (loading) return;

    var newAnswers = answers.slice();
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
    setError('');

    if (currentQ < totalQuestions - 1) {
      // Move to next question after a short delay
      setTimeout(function () {
        setCurrentQ(currentQ + 1);
      }, 350);
    } else {
      // Submit quiz
      setLoading(true);
      apiPost(USERS.PERSONALITY_QUIZ, { answers: newAnswers })
        .then(function (data) {
          setResult(data);
          setShowResult(true);
          // Optimistically update user's dreamerType (matching web)
          if (data.dreamerType && updateUser) {
            updateUser({ dreamerType: data.dreamerType });
          }
        })
        .catch(function (err) {
          // Show error to user — do NOT silently fail (matching web's toast behavior)
          setError(
            err.userMessage || err.message ||
            t('quiz.saveFailed') || 'Failed to save quiz results. Please try again.'
          );
          setLoading(false);
        });
    }
  }, [answers, currentQ, loading, totalQuestions, updateUser]);

  // ─── Go back to previous question ────────────────────
  var goBack = useCallback(function () {
    if (currentQ > 0 && !loading) {
      setCurrentQ(currentQ - 1);
    }
  }, [currentQ, loading]);

  // ─── Complete onboarding helper ────────────────────────
  var _completeOnboarding = useCallback(function () {
    AsyncStorage.setItem('dp-onboarded', 'true').catch(function () {});
    apiPost(USERS.COMPLETE_ONBOARDING, { hasOnboarded: true })
      .then(function () {
        if (updateUser) updateUser({ onboardingCompleted: true });
      })
      .catch(function (err) {
        // Show error — no silent failures
        setError(
          err.userMessage || err.message ||
          t('quiz.failedSave') || 'Failed to save onboarding status.'
        );
      });
  }, [updateUser]);

  // ─── Continue after results ──────────────────────────
  var handleContinue = useCallback(function () {
    _completeOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [navigation, _completeOnboarding]);

  // ─── Skip quiz (matching web — navigate forward, not backward) ───
  var handleSkip = useCallback(function () {
    _completeOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [navigation, _completeOnboarding]);

  // ─── Get result config ────────────────────────────────
  var typeKey = result ? result.dreamerType : null;
  var cfg = TYPE_CONFIG[typeKey] || TYPE_CONFIG.visionary;

  return {
    navigation: navigation,
    t: t,
    currentQ: currentQ,
    totalQuestions: totalQuestions,
    question: question,
    answers: answers,
    progress: progress,
    result: result,
    loading: loading,
    showResult: showResult,
    error: error,
    typeKey: typeKey,
    cfg: cfg,
    handleAnswer: handleAnswer,
    goBack: goBack,
    handleContinue: handleContinue,
    handleSkip: handleSkip,
    QUESTIONS: QUESTIONS,
    TYPE_CONFIG: TYPE_CONFIG,
  };
}

module.exports = usePersonalityQuizScreen;
