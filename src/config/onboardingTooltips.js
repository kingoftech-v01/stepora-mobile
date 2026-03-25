/**
 * Onboarding Tooltip Configurations
 *
 * Each key maps to a screen name. The value is an object (or array of objects
 * for screens with multiple tooltips) containing:
 *   id       — Unique tooltip ID (used as AsyncStorage key)
 *   message  — Text displayed in the bubble
 *   position — 'top' | 'bottom' (where bubble appears relative to target)
 *   target   — Descriptive name of the element the tooltip points at
 *              (used as a ref key in the screen component)
 */

var ONBOARDING_TOOLTIPS = {
  // ─── HomeScreen ────────────────────────────────────────────────
  HomeScreen: {
    id: 'home_welcome',
    message: 'Welcome! This is your dashboard \u2014 track dreams, tasks, and progress.',
    position: 'bottom',
    target: 'header',
  },

  // ─── DreamsListScreen ──────────────────────────────────────────
  DreamsListScreen: {
    id: 'dreams_list_create',
    message: 'Tap here to create your first dream!',
    position: 'bottom',
    target: 'addBtn',
  },

  // ─── DreamDetailScreen (multiple tooltips shown in sequence) ──
  DreamDetailScreen: [
    {
      id: 'dream_detail_checkin',
      message: 'Check in regularly to track your progress.',
      position: 'bottom',
      target: 'checkinBanner',
    },
    {
      id: 'dream_detail_calibrate',
      message: 'AI calibration adjusts difficulty and timeline.',
      position: 'bottom',
      target: 'calibrateBtn',
    },
  ],

  // ─── CalendarScreen ────────────────────────────────────────────
  CalendarScreen: {
    id: 'calendar_timeblocks',
    message: 'Organize your day with time blocks.',
    position: 'bottom',
    target: 'timeBlockBtn',
  },

  // ─── CommunityScreen ──────────────────────────────────────────
  CommunityScreen: {
    id: 'community_post',
    message: 'Share your progress with the community!',
    position: 'bottom',
    target: 'postBtn',
  },

  // ─── LeaderboardScreen ────────────────────────────────────────
  LeaderboardScreen: {
    id: 'leaderboard_welcome',
    message: 'Compete with friends by completing tasks and earning XP.',
    position: 'bottom',
    target: 'header',
  },

  // ─── ConversationListScreen ───────────────────────────────────
  ConversationListScreen: {
    id: 'conversations_new_chat',
    message: 'Chat with our AI coach for guidance.',
    position: 'bottom',
    target: 'newChatBtn',
  },

  // ─── ProfileScreen ────────────────────────────────────────────
  ProfileScreen: {
    id: 'profile_achievements',
    message: 'Complete challenges to unlock achievements.',
    position: 'top',
    target: 'achievementsBtn',
  },

  // ─── CircleListScreen ─────────────────────────────────────────
  CircleListScreen: {
    id: 'circles_create',
    message: 'Create a circle to collaborate with friends.',
    position: 'bottom',
    target: 'createBtn',
  },

  // ─── StoreScreen ──────────────────────────────────────────────
  StoreScreen: {
    id: 'store_welcome',
    message: 'Browse virtual items and customize your experience.',
    position: 'bottom',
    target: 'header',
  },

  // ─── FocusTimerScreen ─────────────────────────────────────────
  FocusTimerScreen: {
    id: 'focus_timer_welcome',
    message: 'Use Pomodoro technique to stay focused.',
    position: 'bottom',
    target: 'header',
  },

  // ─── VisionBoardScreen ────────────────────────────────────────
  VisionBoardScreen: {
    id: 'vision_board_welcome',
    message: 'Add images that represent your goals.',
    position: 'bottom',
    target: 'addBtn',
  },
};

/**
 * getTooltipConfig — Helper to get tooltip config for a given screen.
 * Returns the first unseen tooltip config or null.
 * For screens with multiple tooltips, pass an index to get a specific one.
 */
var getTooltipConfig = function (screenName, index) {
  var config = ONBOARDING_TOOLTIPS[screenName];
  if (!config) return null;

  if (Array.isArray(config)) {
    if (index != null) return config[index] || null;
    return config[0] || null;
  }

  return config;
};

/**
 * getTooltipCount — Returns how many tooltips a screen has.
 */
var getTooltipCount = function (screenName) {
  var config = ONBOARDING_TOOLTIPS[screenName];
  if (!config) return 0;
  if (Array.isArray(config)) return config.length;
  return 1;
};

module.exports = ONBOARDING_TOOLTIPS;
module.exports.getTooltipConfig = getTooltipConfig;
module.exports.getTooltipCount = getTooltipCount;
