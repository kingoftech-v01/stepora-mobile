/**
 * Route name constants and mapping from web app paths to RN screen names.
 *
 * This file serves as a reference for porting screens. When converting a web screen,
 * look up which RN screen name corresponds to its web route path.
 *
 * Navigation in RN: navigation.navigate('ScreenName', { id: '123' })
 * vs web: navigate('/dream/123')
 */

// ─── Screen name constants ───────────────────────────────────────
export var SCREENS = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  CHECK_EMAIL: 'CheckEmail',
  VERIFY_EMAIL: 'VerifyEmail',
  RESET_PASSWORD: 'ResetPassword',
  EMAIL_GATE: 'EmailGate',
  PERSONALITY_QUIZ: 'PersonalityQuiz',
  CHANGE_PASSWORD: 'ChangePassword',

  // Main tabs
  HOME: 'Home',
  HOME_MAIN: 'HomeMain',
  DREAMS: 'Dreams',
  CALENDAR: 'Calendar',
  SOCIAL: 'Social',
  PROFILE: 'Profile',

  // Chat
  CONVERSATIONS: 'Conversations',
  CHAT: 'Chat',
  NEW_CHAT: 'NewChat',
  NEW_CONVERSATION: 'NewConversation',
  AI_CHAT: 'AIChat',
  BUDDY_CHAT: 'BuddyChat',
  CIRCLE_CHAT: 'CircleChat',
  VOICE_CALL: 'VoiceCall',
  VIDEO_CALL: 'VideoCall',
  CALL_HISTORY: 'CallHistory',

  // Dreams
  DREAMS_LIST: 'DreamsList',
  DREAM_CREATE: 'DreamCreate',
  DREAM_EDIT: 'DreamEdit',
  DREAM_DETAIL: 'DreamDetail',
  DREAM_TEMPLATES: 'DreamTemplates',
  CALIBRATION: 'Calibration',
  VISION_BOARD: 'VisionBoard',
  MICRO_START: 'MicroStart',
  SHARED_DREAMS: 'SharedDreams',
  EXPLORE_DREAMS: 'ExploreDreams',
  CHECK_IN: 'CheckIn',
  DREAM_SHARE: 'DreamShare',
  DREAM_JOURNAL: 'DreamJournal',
  FOCUS_TIMER: 'FocusTimer',

  // Social
  SOCIAL_HUB: 'SocialHub',
  EXPLORE: 'Explore',
  FIND_BUDDY: 'FindBuddy',
  LEADERBOARD: 'Leaderboard',
  USER_SEARCH: 'UserSearch',
  FRIEND_REQUESTS: 'FriendRequests',
  ONLINE_FRIENDS: 'OnlineFriends',
  USER_PROFILE: 'UserProfile',
  CIRCLES: 'Circles',
  CIRCLE_DETAIL: 'CircleDetail',
  CIRCLE_CREATE: 'CircleCreate',
  CIRCLE_CHALLENGES: 'CircleChallenges',
  BUDDY_REQUESTS: 'BuddyRequests',
  ACCOUNTABILITY_CONTRACT: 'AccountabilityContract',
  SAVED_POSTS: 'SavedPosts',
  POST_DETAIL: 'PostDetail',

  // Calendar
  CALENDAR_MAIN: 'CalendarMain',
  GOOGLE_CALENDAR_CONNECT: 'GoogleCalendarConnect',
  CALENDAR_CONNECT: 'CalendarConnect',
  TIME_BLOCKS: 'TimeBlocks',
  GOOGLE_SYNC_SETTINGS: 'GoogleSyncSettings',
  SHARED_CALENDAR_VIEW: 'SharedCalendarView',
  TIME_BLOCK_TEMPLATES: 'TimeBlockTemplates',

  // Profile
  PROFILE_MAIN: 'ProfileMain',
  SETTINGS: 'Settings',
  EDIT_PROFILE: 'EditProfile',
  ACHIEVEMENTS: 'Achievements',
  TERMS_OF_SERVICE: 'TermsOfService',
  PRIVACY_POLICY: 'PrivacyPolicy',
  APP_VERSION: 'AppVersion',
  TWO_FACTOR: 'TwoFactor',
  TWO_FACTOR_AUTH: 'TwoFactorAuth',
  DATA_EXPORT: 'DataExport',
  BLOCKED_USERS: 'BlockedUsers',
  PERSONA: 'Persona',

  // Store
  STORE: 'Store',
  SUBSCRIPTION: 'Subscription',
  GIFTING: 'Gifting',
  REFERRAL: 'Referral',

  // Leagues
  SEASON_DETAIL: 'SeasonDetail',
  GROUP_LEADERBOARD: 'GroupLeaderboard',

  // Other
  NOTIFICATIONS: 'Notifications',
  NOTIFICATION_SETTINGS: 'NotificationSettings',
  ONBOARDING: 'Onboarding',
  ONBOARDING_SUBSCRIPTION: 'OnboardingSubscription',
};

/**
 * Mapping from web route paths to RN screen names.
 * Useful for deep linking and reference during porting.
 */
export var WEB_TO_RN_MAP = {
  '/': SCREENS.HOME,
  '/login': SCREENS.LOGIN,
  '/register': SCREENS.REGISTER,
  '/forgot-password': SCREENS.FORGOT_PASSWORD,
  '/check-email': SCREENS.CHECK_EMAIL,
  '/verify-email/:key': SCREENS.VERIFY_EMAIL,
  '/verify-email-required': SCREENS.EMAIL_GATE,
  '/personality-quiz': SCREENS.PERSONALITY_QUIZ,
  '/reset-password/:key': SCREENS.RESET_PASSWORD,
  '/change-password': SCREENS.CHANGE_PASSWORD,
  '/onboarding': SCREENS.ONBOARDING,
  '/onboarding/subscription': SCREENS.ONBOARDING_SUBSCRIPTION,
  '/terms': SCREENS.TERMS_OF_SERVICE,
  '/privacy': SCREENS.PRIVACY_POLICY,
  '/conversations': SCREENS.CONVERSATIONS,
  '/chat': SCREENS.NEW_CHAT,
  '/chat/:id': SCREENS.AI_CHAT,
  '/buddy-chat/:id': SCREENS.BUDDY_CHAT,
  '/voice-call/:id': SCREENS.VOICE_CALL,
  '/video-call/:id': SCREENS.VIDEO_CALL,
  '/calls/history': SCREENS.CALL_HISTORY,
  '/dreams': SCREENS.DREAMS_LIST,
  '/dream/create': SCREENS.DREAM_CREATE,
  '/dream/templates': SCREENS.DREAM_TEMPLATES,
  '/dream/:id': SCREENS.DREAM_DETAIL,
  '/dream/:id/edit': SCREENS.DREAM_EDIT,
  '/dream/:id/calibration': SCREENS.CALIBRATION,
  '/dream/:dreamId/checkin/:checkinId': SCREENS.CHECK_IN,
  '/vision-board': SCREENS.VISION_BOARD,
  '/micro-start/:dreamId': SCREENS.MICRO_START,
  '/dreams/shared': SCREENS.SHARED_DREAMS,
  '/explore': SCREENS.EXPLORE_DREAMS,
  '/dream/:id/journal': SCREENS.DREAM_JOURNAL,
  '/focus-timer': SCREENS.FOCUS_TIMER,
  '/social': SCREENS.SOCIAL_HUB,
  '/find-buddy': SCREENS.FIND_BUDDY,
  '/leaderboard': SCREENS.LEADERBOARD,
  '/search': SCREENS.USER_SEARCH,
  '/friend-requests': SCREENS.FRIEND_REQUESTS,
  '/online-friends': SCREENS.ONLINE_FRIENDS,
  '/user/:id': SCREENS.USER_PROFILE,
  '/circles': SCREENS.CIRCLES,
  '/circle/:id': SCREENS.CIRCLE_DETAIL,
  '/circles/create': SCREENS.CIRCLE_CREATE,
  '/circle/:id/challenges': SCREENS.CIRCLE_CHALLENGES,
  '/circle-chat/:id': SCREENS.CIRCLE_CHAT,
  '/buddy-requests': SCREENS.BUDDY_REQUESTS,
  '/buddy/:id/contract': SCREENS.ACCOUNTABILITY_CONTRACT,
  '/social/saved': SCREENS.SAVED_POSTS,
  '/post/:id': SCREENS.POST_DETAIL,
  '/calendar': SCREENS.CALENDAR_MAIN,
  '/calendar-connect': SCREENS.GOOGLE_CALENDAR_CONNECT,
  '/calendar/timeblocks': SCREENS.TIME_BLOCKS,
  '/calendar/sync-settings': SCREENS.GOOGLE_SYNC_SETTINGS,
  '/calendar/shared/:id': SCREENS.SHARED_CALENDAR_VIEW,
  '/calendar/timeblock-templates': SCREENS.TIME_BLOCK_TEMPLATES,
  '/profile': SCREENS.PROFILE_MAIN,
  '/settings': SCREENS.SETTINGS,
  '/edit-profile': SCREENS.EDIT_PROFILE,
  '/achievements': SCREENS.ACHIEVEMENTS,
  '/app-version': SCREENS.APP_VERSION,
  '/settings/2fa': SCREENS.TWO_FACTOR,
  '/settings/export': SCREENS.DATA_EXPORT,
  '/settings/blocked': SCREENS.BLOCKED_USERS,
  '/persona': SCREENS.PERSONA,
  '/league/season/:id': SCREENS.SEASON_DETAIL,
  '/leagues/group/:groupId': SCREENS.GROUP_LEADERBOARD,
  '/store': SCREENS.STORE,
  '/subscription': SCREENS.SUBSCRIPTION,
  '/store/gifts': SCREENS.GIFTING,
  '/referral': SCREENS.REFERRAL,
  '/notifications': SCREENS.NOTIFICATIONS,
};

/**
 * Deep linking configuration for React Navigation.
 * Enables opening screens from URLs (e.g., push notification deep links).
 */
export var LINKING_CONFIG = {
  prefixes: ['stepora://', 'https://stepora.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
          CheckEmail: 'check-email',
          VerifyEmail: 'verify-email/:key',
          ResetPassword: 'reset-password/:key',
        },
      },
      MainTabs: {
        screens: {
          Home: {
            screens: {
              HomeMain: '',
              DreamsList: 'dreams',
            },
          },
          Calendar: {
            screens: {
              CalendarMain: 'calendar',
            },
          },
          Social: {
            screens: {
              SocialHub: 'social',
            },
          },
          Messages: {
            screens: {
              Conversations: 'conversations',
            },
          },
          Profile: {
            screens: {
              ProfileMain: 'profile',
            },
          },
        },
      },
      Chat: 'chat/:id',
      DreamDetail: 'dream/:id',
      DreamCreate: 'dream/create',
      DreamEdit: 'dream/:id/edit',
      DreamShare: 'dream/:id/share',
      Calibration: 'dream/:id/calibration',
      CheckIn: 'dream/:dreamId/checkin/:checkinId',
      AIChat: 'chat/:id',
      BuddyChat: 'buddy-chat/:id',
      CircleChat: 'circle-chat/:id',
      UserProfile: 'user/:id',
      CircleDetail: 'circle/:id',
      Explore: 'explore',
      Leaderboard: 'leaderboard',
      FriendRequests: 'friend-requests',
      Settings: 'settings',
      EditProfile: 'edit-profile',
      Store: 'store',
      Subscription: 'subscription',
      Notifications: 'notifications',
      NotificationSettings: 'notification-settings',
    },
  },
};
