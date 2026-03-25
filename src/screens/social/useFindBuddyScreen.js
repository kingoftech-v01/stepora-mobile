/**
 * useFindBuddyScreen -- Business logic for the Find Buddy screen (React Native).
 * Adapted from the web app's useFindBuddyScreen.js.
 * Shows current buddy or AI-matched suggestions to pair with.
 */
var { useState, useEffect, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { BUDDIES } = require('../../services/endpoints');

var SUGGESTION_COLORS = [
  '#EC4899', '#3B82F6', '#F59E0B', '#8B5CF6',
  '#14B8A6', '#10B981', '#6366F1', '#EF4444',
];

var ENCOURAGE_PRESETS = [
  "Keep going, you're crushing it! \uD83D\uDCAA",
  "One step at a time \u2014 you've got this!",
  "Your streak is inspiring! Don't stop now \uD83D\uDD25",
  "Remember why you started. You're doing great!",
  "Proud of your progress this week! \u2B50",
];

function useFindBuddyScreen() {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var t = function (key) { return key; };

  var [sent, setSent] = useState({});
  var [encourage, setEncourage] = useState(false);
  var [encourageMsg, setEncourageMsg] = useState(ENCOURAGE_PRESETS[0]);
  var [sentEncourage, setSentEncourage] = useState(false);
  var [error, setError] = useState('');

  // ─── Current buddy ────────────────────────────────────
  var buddyQuery = useQuery({
    queryKey: ['buddy-current'],
    queryFn: function () {
      return apiGet(BUDDIES.CURRENT);
    },
  });
  var hasBuddy = buddyQuery.data && buddyQuery.data.buddy;

  // ─── Suggestions (only if no current buddy) ──────────
  var suggestionsQuery = useQuery({
    queryKey: ['buddy-suggestions'],
    queryFn: function () {
      return apiPost(BUDDIES.FIND_MATCH, {});
    },
    enabled: buddyQuery.isSuccess && !hasBuddy,
  });

  // ─── Parse current buddy ──────────────────────────────
  var CURRENT_BUDDY = (buddyQuery.data && buddyQuery.data.buddy) || null;
  var _partner = CURRENT_BUDDY && CURRENT_BUDDY.partner;
  var buddy = {
    id: (_partner && _partner.id) || null,
    name: (_partner && (_partner.username || _partner.displayName || _partner.display_name)) || 'Buddy',
    initial: ((_partner && (_partner.username || _partner.displayName || _partner.display_name)) || 'B')[0].toUpperCase(),
    level: (_partner && (_partner.currentLevel || _partner.level)) || 0,
    xp: (_partner && (_partner.influenceScore || _partner.xp)) || 0,
    streak: (_partner && (_partner.currentStreak || _partner.streak)) || 0,
    avatar: (_partner && (_partner.avatar || _partner.avatarUrl)) || null,
    compatibility: (CURRENT_BUDDY && CURRENT_BUDDY.compatibilityScore) || 0,
    sharedDreams: (CURRENT_BUDDY && CURRENT_BUDDY.sharedDreams) || (_partner && _partner.sharedDreams) || [],
    sharedCategories: (CURRENT_BUDDY && CURRENT_BUDDY.sharedCategories) || (_partner && _partner.sharedCategories) || [],
    dreams: (_partner && _partner.dreams) || (CURRENT_BUDDY && CURRENT_BUDDY.partnerDreams) || [],
  };

  // ─── Parse suggestions ────────────────────────────────
  var rawSuggestions = suggestionsQuery.data;
  var suggestionsList = [];
  if (rawSuggestions) {
    if (Array.isArray(rawSuggestions.results)) suggestionsList = rawSuggestions.results;
    else if (Array.isArray(rawSuggestions)) suggestionsList = rawSuggestions;
    else if (rawSuggestions.match) suggestionsList = [rawSuggestions.match];
  }
  var suggestions = suggestionsList.map(function (s, i) {
    if (!s) return null;
    return {
      id: s.id,
      name: s.name || s.displayName || s.display_name || s.username || 'User',
      initial: (s.name || s.displayName || s.display_name || s.username || '?')[0].toUpperCase(),
      color: s.color || SUGGESTION_COLORS[i % SUGGESTION_COLORS.length],
      avatar: s.avatar || s.avatarUrl || null,
      compatibility: s.compatibilityScore || s.compatibility || 0,
      sharedDreams: s.sharedDreams || s.sharedInterests || [],
      sharedCategories: s.sharedCategories || [],
      level: s.level || s.currentLevel || 1,
      streak: s.streak || s.currentStreak || 0,
      bio: s.bio || '',
    };
  }).filter(Boolean);

  // ─── Send buddy request ──────────────────────────────
  var sendRequest = useCallback(function (id) {
    setSent(function (prev) {
      var next = {};
      for (var k in prev) next[k] = prev[k];
      next[id] = true;
      return next;
    });
    setError('');
    apiPost(BUDDIES.PAIR, { partner_id: id })
      .then(function () {
        queryClient.invalidateQueries({ queryKey: ['buddy-current'] });
        queryClient.invalidateQueries({ queryKey: ['buddy-suggestions'] });
      })
      .catch(function (err) {
        setError(err.userMessage || err.message || 'Failed to send request');
        setSent(function (prev) {
          var next = {};
          for (var k in prev) {
            if (k !== String(id)) next[k] = prev[k];
          }
          return next;
        });
      });
  }, [queryClient]);

  // ─── Send encouragement ──────────────────────────────
  var sendEncourageMsg = useCallback(function () {
    if (!CURRENT_BUDDY) return;
    setSentEncourage(true);
    apiPost(BUDDIES.ENCOURAGE(CURRENT_BUDDY.id), { message: encourageMsg })
      .then(function () {
        // success
      })
      .catch(function (err) {
        setError(err.userMessage || err.message || 'Failed to send encouragement');
      })
      .finally(function () {
        setTimeout(function () {
          setEncourage(false);
          setSentEncourage(false);
        }, 1500);
      });
  }, [CURRENT_BUDDY, encourageMsg]);

  // ─── Refresh ─────────────────────────────────────────
  var refresh = useCallback(function () {
    buddyQuery.refetch();
    suggestionsQuery.refetch();
  }, [buddyQuery, suggestionsQuery]);

  var isLoading = buddyQuery.isLoading;
  var isError = buddyQuery.isError || suggestionsQuery.isError;

  return {
    navigation: navigation,
    t: t,
    isLoading: isLoading,
    isError: isError,
    error: error,
    hasBuddy: hasBuddy,
    CURRENT_BUDDY: CURRENT_BUDDY,
    buddy: buddy,
    suggestions: suggestions,
    sent: sent,
    sendRequest: sendRequest,
    encourage: encourage,
    setEncourage: setEncourage,
    encourageMsg: encourageMsg,
    setEncourageMsg: setEncourageMsg,
    sentEncourage: sentEncourage,
    sendEncourageMsg: sendEncourageMsg,
    refresh: refresh,
    ENCOURAGE_PRESETS: ENCOURAGE_PRESETS,
  };
}

module.exports = useFindBuddyScreen;
