/**
 * usePersonaScreen -- business logic for Persona profile fields (React Native).
 * Synced with web app's usePersonaScreen.js.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiGet, apiPut } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');
var { BRAND, GRADIENTS, adaptColor } = require('../../../styles/colors');
var { useToast } = require('../../../context/ToastContext');
var { useT } = require('../../../context/I18nContext');

var ALL_KEYS = [
  'occupation',
  'typical_day',
  'astrological_sign',
  'available_hours_per_week',
  'preferred_schedule',
  'budget_range',
  'fitness_level',
  'learning_style',
  'global_motivation',
  'global_constraints',
];

function buildSections(t) {
  return [
    {
      title: t('persona.aboutYou'),
      fields: [
        { key: 'occupation', label: t('persona.occupation'), placeholder: t('persona.occupationPlaceholder'), color: BRAND.purpleLight },
        { key: 'typical_day', label: t('persona.typicalDay'), placeholder: t('persona.typicalDayPlaceholder'), color: '#93C5FD', multiline: true },
        { key: 'astrological_sign', label: t('persona.astrologicalSign'), placeholder: t('persona.astrologicalSignPlaceholder'), color: '#FCD34D' },
      ],
    },
    {
      title: t('persona.scheduleBudget'),
      fields: [
        { key: 'available_hours_per_week', label: t('persona.availableHours'), placeholder: t('persona.availableHoursPlaceholder'), color: '#5EEAD4', type: 'number' },
        { key: 'preferred_schedule', label: t('persona.preferredSchedule'), placeholder: t('persona.preferredSchedulePlaceholder'), color: '#93C5FD' },
        { key: 'budget_range', label: t('persona.budgetRange'), placeholder: t('persona.budgetRangePlaceholder'), color: '#FCD34D' },
      ],
    },
    {
      title: t('persona.abilities'),
      fields: [
        { key: 'fitness_level', label: t('persona.fitnessLevel'), placeholder: t('persona.fitnessLevelPlaceholder'), color: '#F87171' },
        { key: 'learning_style', label: t('persona.learningStyle'), placeholder: t('persona.learningStylePlaceholder'), color: BRAND.purpleLight },
      ],
    },
    {
      title: t('persona.motivationConstraints'),
      fields: [
        { key: 'global_motivation', label: t('persona.whatDrivesYou'), placeholder: t('persona.whatDrivesYouPlaceholder'), color: '#5DE5A8', multiline: true },
        { key: 'global_constraints', label: t('persona.recurringChallenges'), placeholder: t('persona.recurringChallengesPlaceholder'), color: '#F87171', multiline: true },
      ],
    },
  ];
}

function usePersonaScreen() {
  var navigation = useNavigation();
  var { showToast } = useToast();
  var { t } = useT();
  var SECTIONS = buildSections(t);
  var [mounted, setMounted] = useState(false);
  var [form, setForm] = useState({});
  var [dirty, setDirty] = useState(false);
  var [saving, setSaving] = useState(false);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');

  useEffect(function () {
    setTimeout(function () { setMounted(true); }, 100);
  }, []);

  // Fetch persona data
  useEffect(function () {
    setLoading(true);
    apiGet(USERS.PERSONA)
      .then(function (data) {
        if (data && data.persona) {
          setForm(data.persona);
        }
        setLoading(false);
      })
      .catch(function (err) {
        setError(err.userMessage || err.message || 'Failed to load persona');
        setLoading(false);
      });
  }, []);

  var handleChange = function (key, value) {
    setForm(function (prev) {
      var next = Object.assign({}, prev);
      if (value === '' || value === null) {
        delete next[key];
      } else {
        next[key] = key === 'available_hours_per_week' ? Number(value) || 0 : value;
      }
      return next;
    });
    setDirty(true);
  };

  var handleSave = function () {
    setSaving(true);
    apiPut(USERS.PERSONA, form)
      .then(function () {
        setSaving(false);
        setDirty(false);
        showToast(t('profile.personaSaved'), 'success');
      })
      .catch(function (err) {
        setSaving(false);
        showToast(err.userMessage || err.message || t('error.failedSavePersona'), 'error');
      });
  };

  var filledCount = ALL_KEYS.filter(function (k) {
    var v = form[k];
    return v !== undefined && v !== null && v !== '' && v !== 0;
  }).length;
  var completionPct = Math.round((filledCount / ALL_KEYS.length) * 100);

  var ringR = 38;
  var ringC = 2 * Math.PI * ringR;
  var ringOffset = ringC * (1 - completionPct / 100);

  return {
    navigation: navigation,
    t: t,
    mounted: mounted,
    form: form,
    dirty: dirty,
    saving: saving,
    loading: loading,
    error: error,
    SECTIONS: SECTIONS,
    handleChange: handleChange,
    handleSave: handleSave,
    completionPct: completionPct,
    ringR: ringR,
    ringC: ringC,
    ringOffset: ringOffset,
    BRAND: BRAND,
    GRADIENTS: GRADIENTS,
    adaptColor: adaptColor,
  };
}

module.exports = usePersonaScreen;
