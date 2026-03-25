/**
 * usePersonalityQuizScreen — Business logic for the personality assessment quiz.
 * Adapted from the web app's usePersonalityQuiz.js.
 * 8 questions, determines dreamer type, submits to USERS.PERSONALITY_QUIZ.
 */
var { useState, useCallback, useMemo } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiPost } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');

// ─── Questions ──────────────────────────────────────────────
var QUESTIONS = [
  {
    question: 'When you face a tough decision, what do you rely on most?',
    options: [
      { text: 'Deep analysis and logic', icon: 'cpu' },
      { text: 'Input from people I trust', icon: 'users' },
      { text: 'My gut instinct', icon: 'zap' },
      { text: 'Clear goals and data', icon: 'target' },
    ],
  },
  {
    question: 'What motivates you the most?',
    options: [
      { text: 'Learning something new', icon: 'book-open' },
      { text: 'Helping others succeed', icon: 'heart' },
      { text: 'Winning and achievement', icon: 'award' },
      { text: 'Exploring the unknown', icon: 'compass' },
    ],
  },
  {
    question: 'How do you approach a new project?',
    options: [
      { text: 'Brainstorm creative ideas first', icon: 'star' },
      { text: 'Gather a team and delegate', icon: 'users' },
      { text: 'Set milestones and push through', icon: 'trending-up' },
      { text: 'Research thoroughly before starting', icon: 'cpu' },
    ],
  },
  {
    question: 'What does success look like to you?',
    options: [
      { text: 'Making a meaningful impact', icon: 'star' },
      { text: 'Strong relationships and community', icon: 'users' },
      { text: 'Hitting every target I set', icon: 'check-circle' },
      { text: 'Freedom to explore and create', icon: 'compass' },
    ],
  },
  {
    question: 'How do you recharge after a long day?',
    options: [
      { text: 'Creative hobbies or art', icon: 'edit-3' },
      { text: 'Spending time with loved ones', icon: 'users' },
      { text: 'Working on a side project', icon: 'briefcase' },
      { text: 'Exploring nature or traveling', icon: 'map' },
    ],
  },
  {
    question: 'What is your dream superpower?',
    options: [
      { text: 'Ability to innovate instantly', icon: 'zap' },
      { text: 'Empathy to understand everyone', icon: 'heart' },
      { text: 'Laser focus on any task', icon: 'target' },
      { text: 'Ability to see all possibilities', icon: 'compass' },
    ],
  },
  {
    question: 'When obstacles arise, you tend to...',
    options: [
      { text: 'Find a creative workaround', icon: 'star' },
      { text: 'Ask for help and collaborate', icon: 'users' },
      { text: 'Double down and push harder', icon: 'target' },
      { text: 'Step back and reassess the path', icon: 'map' },
    ],
  },
  {
    question: 'What do you value most in a dream buddy?',
    options: [
      { text: 'Shared ambition and vision', icon: 'star' },
      { text: 'Emotional support and empathy', icon: 'heart' },
      { text: 'Accountability and discipline', icon: 'award' },
      { text: 'Fresh perspectives and ideas', icon: 'compass' },
    ],
  },
];

// ─── Personality type configs ────────────────────────────────
var TYPE_CONFIG = {
  visionary: {
    title: 'The Visionary',
    description: 'You see the big picture and inspire others with your creative vision. You dream boldly and think outside the box.',
    traits: ['Creative thinker', 'Big-picture oriented', 'Inspiring leader', 'Innovation-driven'],
    color: '#8B5CF6',
    icon: 'star',
  },
  achiever: {
    title: 'The Achiever',
    description: 'You set ambitious goals and crush them with discipline and determination. Nothing stops you once you commit.',
    traits: ['Goal-oriented', 'Disciplined', 'Results-driven', 'Highly focused'],
    color: '#F59E0B',
    icon: 'award',
  },
  explorer: {
    title: 'The Explorer',
    description: 'You thrive on discovery and new experiences. Your curiosity drives you to constantly learn and grow.',
    traits: ['Adventurous spirit', 'Lifelong learner', 'Adaptable', 'Open-minded'],
    color: '#14B8A6',
    icon: 'compass',
  },
  collaborator: {
    title: 'The Collaborator',
    description: 'You believe in the power of connection. You lift others up and achieve more together than alone.',
    traits: ['Team player', 'Empathetic', 'Supportive', 'Community builder'],
    color: '#EC4899',
    icon: 'users',
  },
  strategist: {
    title: 'The Strategist',
    description: 'You approach dreams with logic and precision. Your analytical mind finds the optimal path to success.',
    traits: ['Analytical thinker', 'Detail-oriented', 'Problem solver', 'Data-driven'],
    color: '#6366F1',
    icon: 'cpu',
  },
};

function usePersonalityQuizScreen() {
  var navigation = useNavigation();
  var t = function (key) { return key; };

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
        })
        .catch(function (err) {
          setError(err.userMessage || err.message || 'Failed to submit quiz');
          setLoading(false);
        });
    }
  }, [answers, currentQ, loading, totalQuestions]);

  // ─── Go back to previous question ────────────────────
  var goBack = useCallback(function () {
    if (currentQ > 0 && !loading) {
      setCurrentQ(currentQ - 1);
    }
  }, [currentQ, loading]);

  // ─── Continue after results ──────────────────────────
  var handleContinue = useCallback(function () {
    apiPost(USERS.COMPLETE_ONBOARDING, { hasOnboarded: true })
      .then(function () {
        // Onboarding complete
      })
      .catch(function (err) {
        console.error('[PersonalityQuiz] complete onboarding failed:', err);
      });
    // Navigate to main app
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [navigation]);

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
    QUESTIONS: QUESTIONS,
    TYPE_CONFIG: TYPE_CONFIG,
  };
}

module.exports = usePersonalityQuizScreen;
