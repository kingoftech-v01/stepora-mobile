/**
 * useAchievementsScreen -- business logic for Achievements & Badges (React Native).
 * Synced with web app's useAchievementsScreen.js.
 * Adds progress tracking for each achievement.
 */
var { useState, useEffect, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiGet } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');
var { useT } = require('../../../context/I18nContext');
var { adaptColor, BRAND } = require('../../../styles/colors');

var CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'dreams', label: 'Dreams' },
  { id: 'social', label: 'Social' },
  { id: 'streak', label: 'Streak' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'special', label: 'Special' },
];

var CATEGORY_COLORS = {
  streaks: '#F69A9A',
  streak: '#F69A9A',
  dreams: '#C4B5FD',
  social: '#5EEAD4',
  tasks: '#5DE5A8',
  milestones: '#93C5FD',
  special: '#FCD34D',
};

// Default achievements for when API is not available
var DEFAULT_ACHIEVEMENTS = [
  // Dreams
  { id: 'first_dream', title: 'Dream Starter', description: 'Create your first dream', category: 'dreams', icon: '✨', xp: 50, maxProgress: 1 },
  { id: 'dream_5', title: 'Big Dreamer', description: 'Create 5 dreams', category: 'dreams', icon: '🌟', xp: 100, maxProgress: 5 },
  { id: 'dream_10', title: 'Dream Architect', description: 'Create 10 dreams', category: 'dreams', icon: '🏗️', xp: 250, maxProgress: 10 },
  { id: 'first_plan', title: 'Planner', description: 'Generate your first AI plan', category: 'dreams', icon: '📋', xp: 75, maxProgress: 1 },
  { id: 'complete_dream', title: 'Dream Achiever', description: 'Complete your first dream', category: 'dreams', icon: '🏆', xp: 500, maxProgress: 1 },
  { id: 'tasks_25', title: 'Task Machine', description: 'Complete 25 tasks', category: 'dreams', icon: '⚡', xp: 150, maxProgress: 25 },
  { id: 'tasks_100', title: 'Unstoppable', description: 'Complete 100 tasks', category: 'dreams', icon: '💎', xp: 500, maxProgress: 100 },
  // Social
  { id: 'first_friend', title: 'Social Butterfly', description: 'Add your first friend', category: 'social', icon: '🤝', xp: 50, maxProgress: 1 },
  { id: 'friends_10', title: 'Popular', description: 'Have 10 friends', category: 'social', icon: '🌐', xp: 150, maxProgress: 10 },
  { id: 'first_circle', title: 'Circle Up', description: 'Join your first circle', category: 'social', icon: '⭕', xp: 75, maxProgress: 1 },
  { id: 'first_buddy', title: 'Accountability Partner', description: 'Get your first buddy', category: 'social', icon: '👥', xp: 100, maxProgress: 1 },
  { id: 'encourage_5', title: 'Cheerleader', description: 'Encourage 5 friends', category: 'social', icon: '📣', xp: 100, maxProgress: 5 },
  // Streak
  { id: 'streak_3', title: 'Getting Started', description: 'Maintain a 3-day streak', category: 'streak', icon: '🔥', xp: 50, maxProgress: 3 },
  { id: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day streak', category: 'streak', icon: '🔥', xp: 100, maxProgress: 7 },
  { id: 'streak_30', title: 'Monthly Master', description: 'Maintain a 30-day streak', category: 'streak', icon: '🔥', xp: 300, maxProgress: 30 },
  { id: 'streak_100', title: 'Centurion', description: 'Maintain a 100-day streak', category: 'streak', icon: '👑', xp: 1000, maxProgress: 100 },
  { id: 'streak_365', title: 'Legendary', description: 'Maintain a 365-day streak', category: 'streak', icon: '🌟', xp: 5000, maxProgress: 365 },
  // Milestones
  { id: 'first_milestone', title: 'Milestone Reached', description: 'Complete your first milestone', category: 'milestones', icon: '🎯', xp: 75, maxProgress: 1 },
  { id: 'milestones_10', title: 'Progress Pro', description: 'Complete 10 milestones', category: 'milestones', icon: '📈', xp: 200, maxProgress: 10 },
  { id: 'first_checkin', title: 'Check-In Champion', description: 'Complete your first check-in', category: 'milestones', icon: '✅', xp: 50, maxProgress: 1 },
  { id: 'level_5', title: 'Rising Star', description: 'Reach level 5', category: 'milestones', icon: '⭐', xp: 200, maxProgress: 5 },
  { id: 'level_10', title: 'Veteran', description: 'Reach level 10', category: 'milestones', icon: '🎖️', xp: 500, maxProgress: 10 },
  // Special
  { id: 'early_bird', title: 'Early Bird', description: 'Complete a task before 7 AM', category: 'special', icon: '🌅', xp: 100, maxProgress: 1 },
  { id: 'night_owl', title: 'Night Owl', description: 'Complete a task after 11 PM', category: 'special', icon: '🦉', xp: 100, maxProgress: 1 },
  { id: 'perfect_week', title: 'Perfect Week', description: 'Complete all daily tasks for 7 days', category: 'special', icon: '💯', xp: 300, maxProgress: 1 },
  { id: 'explorer', title: 'Explorer', description: 'Use every feature at least once', category: 'special', icon: '🧭', xp: 200, maxProgress: 1 },
  { id: 'first_export', title: 'Data Owner', description: 'Export your data', category: 'special', icon: '📦', xp: 50, maxProgress: 1 },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

function useAchievementsScreen() {
  var navigation = useNavigation();
  var { t } = useT();

  var [loading, setLoading] = useState(true);
  var [achievements, setAchievements] = useState([]);
  var [selectedCategory, setSelectedCategory] = useState('all');
  var [selectedAchievement, setSelectedAchievement] = useState(null);
  var [showDetail, setShowDetail] = useState(false);
  var [error, setError] = useState('');

  // XP / Level / streak state
  var [totalXp, setTotalXp] = useState(0);
  var [level, setLevel] = useState(1);
  var [xpToNext, setXpToNext] = useState(100);
  var [levelProgress, setLevelProgress] = useState(0);
  var [unlockedCount, setUnlockedCount] = useState(0);
  var [streak, setStreak] = useState(0);

  // ─── Fetch achievements ───────────────────────────────────
  var fetchAchievements = useCallback(function () {
    setLoading(true);
    setError('');

    var achievementsPromise = apiGet(USERS.ACHIEVEMENTS).catch(function () { return null; });
    var gamificationPromise = apiGet(USERS.GAMIFICATION).catch(function () { return null; });

    Promise.all([achievementsPromise, gamificationPromise])
      .then(function (results) {
        var achData = results[0];
        var gamData = results[1];

        // Parse achievements
        var serverAchievements = [];
        if (achData) {
          if (Array.isArray(achData)) {
            serverAchievements = achData;
          } else if (achData.achievements && Array.isArray(achData.achievements)) {
            serverAchievements = achData.achievements;
          } else if (achData.results && Array.isArray(achData.results)) {
            serverAchievements = achData.results;
          }
        }

        // Merge server data with defaults
        var merged = DEFAULT_ACHIEVEMENTS.map(function (def) {
          var match = serverAchievements.find(function (s) {
            return s.id === def.id || s.slug === def.id || s.key === def.id;
          });
          if (match) {
            return {
              id: def.id,
              title: match.title || match.name || def.title,
              description: match.description || def.description,
              category: match.category || def.category,
              icon: match.icon || def.icon,
              xp: match.xp || match.xpReward || def.xp,
              maxProgress: match.maxProgress || match.target || def.maxProgress,
              progress: match.progress != null ? match.progress : (match.currentProgress || 0),
              unlocked: !!(match.unlocked || match.earned || match.completed || match.unlockedAt),
              unlockedAt: match.unlockedAt || match.earnedAt || match.completedAt || null,
              color: match.color || CATEGORY_COLORS[match.category || def.category] || '#C4B5FD',
            };
          }
          return {
            id: def.id,
            title: def.title,
            description: def.description,
            category: def.category,
            icon: def.icon,
            xp: def.xp,
            maxProgress: def.maxProgress,
            progress: 0,
            unlocked: false,
            unlockedAt: null,
            color: CATEGORY_COLORS[def.category] || '#C4B5FD',
          };
        });

        // Also add any server achievements not in defaults
        serverAchievements.forEach(function (s) {
          var exists = merged.find(function (m) {
            return m.id === s.id || m.id === s.slug || m.id === s.key;
          });
          if (!exists) {
            merged.push({
              id: s.id || s.slug || s.key,
              title: s.title || s.name || 'Achievement',
              description: s.description || '',
              category: s.category || 'special',
              icon: s.icon || '🏅',
              xp: s.xp || s.xpReward || 0,
              maxProgress: s.maxProgress || s.target || 1,
              progress: s.progress != null ? s.progress : (s.currentProgress || 0),
              unlocked: !!(s.unlocked || s.earned || s.completed || s.unlockedAt),
              unlockedAt: s.unlockedAt || s.earnedAt || s.completedAt || null,
              color: s.color || CATEGORY_COLORS[s.category] || '#C4B5FD',
            });
          }
        });

        setAchievements(merged);

        var count = merged.filter(function (a) { return a.unlocked; }).length;
        setUnlockedCount(count);

        var totalXpCalc = merged.filter(function (a) { return a.unlocked; }).reduce(function (sum, a) { return sum + a.xp; }, 0);
        setTotalXp(totalXpCalc);

        // Parse gamification data
        if (gamData) {
          if (gamData.totalXp || gamData.xp) setTotalXp(gamData.totalXp || gamData.xp);
          setLevel(gamData.level || 1);
          setXpToNext(gamData.xpToNext || gamData.xpToNextLevel || gamData.xp_to_next_level || 100);
          setStreak(gamData.currentStreak || gamData.streak || gamData.streak_days || 0);
          var prog = gamData.levelProgress || gamData.progress || 0;
          if (typeof prog === 'number' && prog <= 1) {
            setLevelProgress(prog);
          } else if (typeof prog === 'number') {
            setLevelProgress(prog / 100);
          }
        }

        setLoading(false);
      })
      .catch(function (err) {
        setError(err.userMessage || err.message || t('achievements.loadFailed'));
        // Fall back to defaults
        var defaultMerged = DEFAULT_ACHIEVEMENTS.map(function (def) {
          return Object.assign({}, def, { progress: 0, unlocked: false, unlockedAt: null, color: CATEGORY_COLORS[def.category] || '#C4B5FD' });
        });
        setAchievements(defaultMerged);
        setLoading(false);
      });
  }, []);

  useEffect(function () {
    fetchAchievements();
  }, [fetchAchievements]);

  // ─── Filtered achievements ────────────────────────────────
  var filteredAchievements = achievements.filter(function (a) {
    if (selectedCategory === 'all') return true;
    return a.category === selectedCategory;
  });

  // Sort: unlocked first, then by progress percentage
  filteredAchievements.sort(function (a, b) {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    var progA = a.maxProgress > 0 ? a.progress / a.maxProgress : 0;
    var progB = b.maxProgress > 0 ? b.progress / b.maxProgress : 0;
    return progB - progA;
  });

  // ─── Detail modal ─────────────────────────────────────────
  var handleSelectAchievement = function (achievement) {
    setSelectedAchievement(achievement);
    setShowDetail(true);
  };

  var handleCloseDetail = function () {
    setShowDetail(false);
    setSelectedAchievement(null);
  };

  // ─── Helpers ──────────────────────────────────────────────
  var getProgressPercent = function (achievement) {
    if (!achievement || !achievement.maxProgress) return 0;
    if (achievement.unlocked) return 1;
    return Math.min(achievement.progress / achievement.maxProgress, 1);
  };

  return {
    navigation: navigation,
    t: t,
    loading: loading,
    achievements: filteredAchievements,
    allAchievements: achievements,
    CATEGORIES: CATEGORIES,
    selectedCategory: selectedCategory,
    setSelectedCategory: setSelectedCategory,
    selectedAchievement: selectedAchievement,
    showDetail: showDetail,
    error: error,
    totalXp: totalXp,
    level: level,
    xpToNext: xpToNext,
    levelProgress: levelProgress,
    unlockedCount: unlockedCount,
    totalCount: achievements.length,
    streak: streak,
    fetchAchievements: fetchAchievements,
    handleSelectAchievement: handleSelectAchievement,
    handleCloseDetail: handleCloseDetail,
    getProgressPercent: getProgressPercent,
    formatDate: formatDate,
    adaptColor: adaptColor,
    BRAND: BRAND,
  };
}

module.exports = useAchievementsScreen;
