# Stepora Mobile - Web App Sync Changelog

This document tracks all files synced from the Stepora web app (`stepora-frontend`),
security fixes applied, API endpoint updates, i18n updates, business logic changes,
and known remaining issues.

---

## Files Synced from Web App

### Services (src/services/)
- **endpoints.js** - All API endpoint constants synced from web app. Includes:
  - `AI_CHAT` (new) - AI coaching conversation endpoints at `/api/ai/conversations/`
  - `FRIEND_CHAT` (new) - Friend/buddy chat endpoints at `/api/chat/`
  - `CONVERSATIONS` - Now an alias for `AI_CHAT` (backward compat)
  - All endpoint groups: AUTH, USERS, DREAMS, CALENDAR, NOTIFICATIONS,
    SUBSCRIPTIONS, STORE, LEAGUES, CIRCLES, SOCIAL, BUDDIES, SEARCH, ADS,
    APP_UPDATES, WS
- **api.js** - Fetch wrapper with JWT auth, case transforms (camelCase <-> snake_case),
  offline queue, token refresh, auth event listeners. Uses ES module `import` syntax.
- **transforms.js** - Deep snake_case <-> camelCase conversion utilities
- **websocket.js** - WebSocket client with reconnection and auth token support

### Context Providers (src/context/)
- **AuthContext.jsx** - Custom auth context with login, logout, register, socialLogin,
  refreshUser, completeOnboarding, changeEmail, deleteAccount, subscription checks
- **ThemeContext.jsx** - Theme provider with dark/light modes, 10 accent color presets,
  AsyncStorage persistence
- **I18nContext.jsx** - Internationalization context with 16 language support
- **ToastContext.jsx** - Toast notification context

### Navigation (src/navigation/)
- **RootNavigator.jsx** - Root navigation with auth flow routing (Auth -> EmailGate ->
  Onboarding -> MainTabs), 60+ screen registrations
- **AuthStack.jsx** - Auth flow screens (Login, Register, ForgotPassword, etc.)
- **MainTabs.jsx** - Bottom tab navigator (Home, Dreams, Calendar, Community, Profile)
- **routes.js** - Route name constants

### i18n Translations (src/i18n/)
- 16 language files synced: ar, de, en, es, fr, hi, ht, it, ja, ko, nl, pl, pt, ru,
  tr, zh (flat JSON format, synced via `scripts/copy-i18n.sh`)

### Screens (src/screens/) - 27 screen families
- **auth/** - Login, Register, ForgotPassword, ResetPassword, VerifyEmail, CheckEmail,
  ChangePassword, EmailGate, Onboarding, PersonalityQuiz
- **home/** - HomeScreen with greeting, quick actions, tasks, dreams, events
- **dreams/** - DreamsList, DreamCreate, DreamDetail, DreamEdit, DreamShare,
  Calibration, CheckIn, DreamJournal, DreamTemplates, FocusTimer, GoalRefine,
  MicroStart, SharedDreams, VisionBoard
- **calendar/** - Calendar, GoogleCalendarConnect, GoogleSyncSettings,
  SharedCalendarView, TimeBlock, TimeBlockTemplates
- **conversations/** - Chat, ConversationList, GroupChat, VoiceCall, VideoCall,
  NewConversation, CallHistory
- **social/** - Community, Explore, Leaderboard, FriendList, FriendRequests,
  CircleList, CircleDetail, CircleCreate, CircleChallenges, UserProfile,
  FindBuddy, PostDetail, SavedPosts, SeasonDetail, GroupLeaderboard
- **community/** - Buddy, BuddyRequests, AccountabilityContract
- **notifications/** - Notifications, NotificationSettings
- **profile/** - Profile, EditProfile, Settings, TwoFactor, DataExport,
  BlockedUsers, TermsOfService, PrivacyPolicy, AppVersion, Persona,
  Achievements, Referral
- **store/** - Store, Gifting
- **subscription/** - Subscription, OnboardingSubscription

### Components (src/components/)
- AdBanner, AdInterstitial, AdNative (ad integration)
- CalendarHeatmap, GlassButton, GlassCard, OnboardingTooltip, PillTabs,
  RecurrencePicker, ScreenHeader, StreakWidget, SubscriptionBanner,
  SubscriptionGate
- shared/Avatar, shared/GlassCard, shared/GlassHeader, shared/ScreenShell

### Hooks (src/hooks/)
- useChatSocket, useInfiniteList, useOnboardingTooltip, useSocialFeedSocket,
  useSubscriptionError

### Utils (src/utils/)
- errorMessages.js - User-friendly error message mapping
- sanitize.js - Input validation (email, etc.)

---

## Security Fixes Applied

1. **X-Client-Platform header** - All API requests send `X-Client-Platform: native`
   so the backend returns refresh tokens in the response body (not httpOnly cookies).
2. **Token storage** - JWT access and refresh tokens stored in AsyncStorage
   (not cookies). Sensitive token keys: `dp-access-token`, `dp-refresh-token`.
3. **Offline queue filtering** - Sensitive endpoints (auth, 2fa, password,
   delete-account, conversations, users, social/report, export, checkout,
   subscription) are excluded from the offline mutation queue.
4. **Silent token refresh** - 401 responses trigger automatic token refresh with
   deduplication (concurrent requests share one refresh call).
5. **Session expiry** - Failed refresh clears all auth tokens and emits
   `session_expired` event for navigation redirect.
6. **IDOR protection** - Endpoint structure uses per-user scoping (backend enforces
   `perform_create` ownership validation).
7. **Input sanitization** - `sanitize.js` provides `isValidEmail` validation.
8. **Error message safety** - `errorMessages.js` maps HTTP errors to user-safe
   messages, never exposing raw API responses or stack traces.

---

## API Endpoint Updates

1. **Conversations restructured** - Moved from `/api/conversations/` to
   `/api/ai/conversations/` (AI coaching). Friend chat at `/api/chat/`.
   `CONVERSATIONS` export is a backward-compat alias for `AI_CHAT`.
2. **Friend chat endpoints** - New `FRIEND_CHAT` export with `/api/chat/` base,
   includes direct messages, group chats, calls (initiate, accept, reject),
   and Agora RTC token.
3. **AI chat additions** - Send voice, summarize voice, send image, pin/like/react
   messages, search, export, archive, branches, templates, memories.
4. **Password reset validation** - `AUTH.PASSWORD_RESET_VALIDATE` endpoint added.
5. **Gamification endpoints** - Streak freeze, heatmap, daily stats, leaderboard.
6. **User endpoints expanded** - Morning briefing, weekly report, energy profile,
   motivation, productivity insights, check-in, celebrate, notification timing,
   persona, profile completeness.
7. **Dream endpoints expanded** - Calibration (start, answer, skip), plan generation
   and status, two-minute start, vision board CRUD, progress photos with AI analysis,
   predict obstacles, conversation starters, similar dreams, export PDF.
8. **Calendar endpoints expanded** - Habits (CRUD, complete, stats), sharing
   (shared view, suggest), smart schedule, heatmap, focus blocks.
9. **Social endpoints expanded** - Stories, reports, blocks, search users.
10. **WebSocket endpoints** - AI_CHAT, BUDDY_CHAT, CIRCLE_CHAT, NOTIFICATIONS,
    SOCIAL_FEED, LEAGUE.

---

## i18n Updates

- 16 languages synced from web app: Arabic, German, English, Spanish, French,
  Hindi, Haitian Creole, Italian, Japanese, Korean, Dutch, Polish, Portuguese,
  Russian, Turkish, Chinese.
- Flat JSON format (e.g., `"auth.loginTitle": "Sign In"`).
- Synced via `scripts/copy-i18n.sh` from `/root/stepora-frontend/src/i18n/`.
- Translation keys used in components via `t("namespace.key")` pattern.

---

## Business Logic Changes

1. **Auth flow** - Login now uses `useAuth().login()` from AuthContext instead of
   direct `apiPost` calls. This ensures centralized token management and user
   state updates.
2. **Onboarding completion** - `completeOnboarding()` sends `{ hasOnboarded: true }`
   body to the API. User state updated to `{ onboardingCompleted: true }`.
3. **Subscription tier checks** - `hasSubscription(tier)` checks tier hierarchy
   (free < premium < pro). `isFreeTier` computed property.
4. **Theme system** - Cosmos (dark) as default theme. Light mode via "default" id.
   Accent color system with 10 presets and hex validation.
5. **Ad system** - AdBanner, AdInterstitial, AdNative components show ads only to
   free-tier users. Self-promo fallback when AdMob fails.
6. **Offline support** - Failed POST/PUT/PATCH/DELETE requests are queued in
   AsyncStorage and replayed when connectivity returns.
7. **Case transformation** - All outgoing request bodies auto-converted from
   camelCase to snake_case. All incoming responses auto-converted from snake_case
   to camelCase. Note: string VALUES are not converted (e.g.,
   `data.action === 'downgrade_scheduled'` stays snake_case).

---

## Test Configuration Updates

1. **Jest transform fix** - Added explicit `transform` config for `.jsx` files.
   The react-native preset only transforms `.js|.ts|.tsx` by default, missing `.jsx`.
   ```js
   transform: { '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest' }
   ```
2. **AsyncStorage mock + resetModules** - Fixed api.test.js to re-acquire
   AsyncStorage reference after `jest.resetModules()` to keep mock references
   in sync.
3. **ThemeContext test** - Removed `jest.resetModules()` pattern (breaks React
   context) in favor of fresh `renderHook` instances per test.
4. **RootNavigator test** - Fixed out-of-scope variable references in
   `jest.mock()` factories by using `require('react')` inside factories and
   `jest.fn()` for captured screen tracking.
5. **AuthContext test** - Updated `completeOnboarding` expectation to match
   new API call signature with body.
6. **Login hook test** - Updated to test against `useAuth().login()` instead
   of direct `apiPost` calls. TFA flow still uses `apiPost` directly.
7. **FeatherIcon mock** - Fixed for components that `require()` without `.default`.
8. **Multiple element queries** - Updated tests using `getByText`/`getByLabelText`
   to `getAllByText`/`getAllByLabelText` where UI has duplicate labels (e.g.,
   title in header + info card, toggle label + tile label).

---

## Known Remaining Issues

1. **Release signing** - `android/app/build.gradle` release signing config is
   commented out. Uses debug keystore for release builds. Must configure upload
   keystore before Google Play submission.
2. **Google Sign-In** - `handleGoogleLogin` is a stub that sets an error message.
   Needs `@react-native-google-signin/google-signin` integration.
3. **Apple Sign-In** - `handleAppleLogin` is a stub. Needs
   `@invertase/react-native-apple-authentication` integration.
4. **AdMob IDs** - `app.json` has placeholder AdMob app IDs
   (`ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`). Must replace with real IDs.
5. **Google Services** - `google-services.json` (Android) and
   `GoogleService-Info.plist` (iOS) need to be configured for Firebase.
6. **Deep linking** - `deepLinking.js` service exists but routing config
   may need testing with actual device deep links.
7. **Push notifications** - Firebase messaging configured but needs testing
   with real FCM tokens and backend webhook integration.
8. **Stripe** - `stripe.js` service exists but native Stripe SDK integration
   (react-native-stripe-sdk) is not in dependencies.
9. **Translation coverage** - Some components use `t()` function but the mock
   returns raw keys. Full i18n integration needs `I18nContext` wiring in tests.
10. **ESM vs CJS mix** - Some source files use ES module `import/export`
    (.jsx contexts, api.js, websocket.js) while others use `require/module.exports`.
    Both work via Babel transform but consistency would be ideal.
