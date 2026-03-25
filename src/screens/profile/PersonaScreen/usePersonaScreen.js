/**
 * usePersonaScreen -- business logic for AI Coach Persona customization (React Native).
 */
var { useState, useEffect, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiGet, apiPut } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');

var PERSONAS = [
  {
    id: 'motivator',
    name: 'The Motivator',
    emoji: '🔥',
    color: '#EF4444',
    tagline: 'Energizing and encouraging',
    description: 'Always pumped and ready to push you forward. Uses positive reinforcement, celebrates every win, and keeps you fired up to reach your dreams.',
    preview: [
      { role: 'user', text: 'I missed my deadline today...' },
      { role: 'ai', text: 'Hey, setbacks happen to everyone! What matters is you are here, ready to bounce back. Let us break that task into smaller wins you can crush tomorrow. You have got this! 💪' },
    ],
  },
  {
    id: 'analyst',
    name: 'The Analyst',
    emoji: '📊',
    color: '#3B82F6',
    tagline: 'Data-driven and strategic',
    description: 'Focuses on patterns, metrics, and optimization. Provides detailed insights, tracks your productivity trends, and suggests evidence-based improvements.',
    preview: [
      { role: 'user', text: 'I missed my deadline today...' },
      { role: 'ai', text: 'Let us analyze what happened. Looking at your task history, I notice your completion rate drops 40% on Wednesdays. Consider front-loading critical tasks earlier in the week and using time blocks for deep work.' },
    ],
  },
  {
    id: 'friend',
    name: 'The Friend',
    emoji: '☕',
    color: '#10B981',
    tagline: 'Warm and conversational',
    description: 'Like chatting with your best friend who genuinely cares about your growth. Empathetic, supportive, and always ready to listen before advising.',
    preview: [
      { role: 'user', text: 'I missed my deadline today...' },
      { role: 'ai', text: 'Oh no, that is rough. Want to talk about what happened? Sometimes life just gets in the way, and that is okay. Let us grab a virtual coffee and figure out a plan that works better for you.' },
    ],
  },
  {
    id: 'mentor',
    name: 'The Mentor',
    emoji: '🎓',
    color: '#8B5CF6',
    tagline: 'Wise and experienced',
    description: 'Shares wisdom from proven frameworks and methodologies. Teaches you principles you can apply broadly, not just quick fixes.',
    preview: [
      { role: 'user', text: 'I missed my deadline today...' },
      { role: 'ai', text: 'In my experience, missed deadlines often signal a planning issue, not a discipline issue. Let me teach you the "2x estimation" rule — always double your time estimate. It accounts for the unexpected and builds confidence.' },
    ],
  },
  {
    id: 'challenger',
    name: 'The Challenger',
    emoji: '⚡',
    color: '#F59E0B',
    tagline: 'Direct and no-nonsense',
    description: 'Cuts through excuses and holds you accountable. Not harsh, but refreshingly honest. Pushes you to level up and face uncomfortable truths.',
    preview: [
      { role: 'user', text: 'I missed my deadline today...' },
      { role: 'ai', text: 'Let us be real — was it truly unexpected, or did you see it coming? Own it, learn from it, move forward. Set a reminder 48 hours before your next deadline and commit to a no-excuses check-in. Deal?' },
    ],
  },
];

var TONES = [
  { id: 'casual', label: 'Casual', desc: 'Relaxed, friendly language with contractions and emojis' },
  { id: 'balanced', label: 'Balanced', desc: 'Professional but approachable, clear and warm' },
  { id: 'formal', label: 'Formal', desc: 'Polished and structured, respectful and professional' },
];

var CHECKIN_FREQUENCIES = [
  { id: 'daily', label: 'Daily', desc: 'Check in every day to maintain momentum' },
  { id: 'every_other_day', label: 'Every Other Day', desc: 'Balanced frequency for steady progress' },
  { id: 'weekly', label: 'Weekly', desc: 'Weekly summary and planning session' },
  { id: 'as_needed', label: 'As Needed', desc: 'Only when you initiate or hit a milestone' },
];

function usePersonaScreen() {
  var navigation = useNavigation();

  var [loading, setLoading] = useState(true);
  var [selectedPersona, setSelectedPersona] = useState('motivator');
  var [selectedTone, setSelectedTone] = useState('balanced');
  var [selectedFrequency, setSelectedFrequency] = useState('daily');
  var [expandedPersona, setExpandedPersona] = useState(null);
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState('');
  var [saved, setSaved] = useState(false);
  var [hasChanges, setHasChanges] = useState(false);

  // Track original values to detect changes
  var [originalPersona, setOriginalPersona] = useState('motivator');
  var [originalTone, setOriginalTone] = useState('balanced');
  var [originalFrequency, setOriginalFrequency] = useState('daily');

  // ─── Fetch current preferences ────────────────────────────
  var fetchPreferences = useCallback(function () {
    setLoading(true);
    setError('');
    apiGet(USERS.ME)
      .then(function (data) {
        if (data) {
          var persona = data.aiPersona || data.persona || data.coachPersona || 'motivator';
          var tone = data.aiTone || data.communicationTone || 'balanced';
          var freq = data.checkinFrequency || data.checkInFrequency || 'daily';
          setSelectedPersona(persona);
          setSelectedTone(tone);
          setSelectedFrequency(freq);
          setOriginalPersona(persona);
          setOriginalTone(tone);
          setOriginalFrequency(freq);
        }
        setLoading(false);
      })
      .catch(function (err) {
        setLoading(false);
        // Non-critical, just use defaults
      });
  }, []);

  useEffect(function () {
    fetchPreferences();
  }, [fetchPreferences]);

  // ─── Track changes ────────────────────────────────────────
  useEffect(function () {
    var changed = selectedPersona !== originalPersona ||
      selectedTone !== originalTone ||
      selectedFrequency !== originalFrequency;
    setHasChanges(changed);
    if (changed) setSaved(false);
  }, [selectedPersona, selectedTone, selectedFrequency, originalPersona, originalTone, originalFrequency]);

  // ─── Select persona ───────────────────────────────────────
  var handleSelectPersona = function (id) {
    setSelectedPersona(id);
    // Expand to show preview
    setExpandedPersona(id === expandedPersona ? null : id);
  };

  var handleToggleExpand = function (id) {
    setExpandedPersona(id === expandedPersona ? null : id);
  };

  // ─── Save preferences ────────────────────────────────────
  var handleSave = function () {
    setSaving(true);
    setError('');
    setSaved(false);
    apiPut(USERS.UPDATE_PROFILE, {
      aiPersona: selectedPersona,
      aiTone: selectedTone,
      checkinFrequency: selectedFrequency,
    })
      .then(function () {
        setSaving(false);
        setSaved(true);
        setOriginalPersona(selectedPersona);
        setOriginalTone(selectedTone);
        setOriginalFrequency(selectedFrequency);
        setHasChanges(false);
        setTimeout(function () { setSaved(false); }, 3000);
      })
      .catch(function (err) {
        setSaving(false);
        setError(err.message || 'Failed to save preferences');
      });
  };

  return {
    navigation: navigation,
    loading: loading,
    PERSONAS: PERSONAS,
    TONES: TONES,
    CHECKIN_FREQUENCIES: CHECKIN_FREQUENCIES,
    selectedPersona: selectedPersona,
    selectedTone: selectedTone,
    selectedFrequency: selectedFrequency,
    expandedPersona: expandedPersona,
    saving: saving,
    error: error,
    saved: saved,
    hasChanges: hasChanges,
    handleSelectPersona: handleSelectPersona,
    handleToggleExpand: handleToggleExpand,
    setSelectedTone: setSelectedTone,
    setSelectedFrequency: setSelectedFrequency,
    handleSave: handleSave,
  };
}

module.exports = usePersonaScreen;
