# Stepora Mobile (React Native + Expo)

Native iOS + Android client for **Stepora**, the AI-powered goal achievement platform. This is the React Native port of the Capacitor web app in [stepora-frontend](https://github.com/kingoftech-v01/stepora-frontend), reusing the same backend API contract and the same `endpoints.js` / i18n keys.

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | React Native **0.83.4**, React **19.2.0** |
| Managed workflow | **Expo SDK 55** (`expo run:android` / `expo run:ios`) |
| Navigation | `@react-navigation/native` v7 (Native Stack + Bottom Tabs) |
| Data fetching | `@tanstack/react-query` v5 |
| Storage | `@react-native-async-storage/async-storage` |
| Push | `@react-native-firebase/messaging` + `@notifee/react-native` |
| Real-time calls | `react-native-agora` |
| Animations | `react-native-reanimated` 4, `react-native-worklets` |
| Biometrics | `react-native-biometrics` |
| Observability | `@sentry/react-native` |
| Localization | `react-native-localize`, 16 JSON locales |

## Prerequisites

- Node.js >= 18
- Expo CLI (`npx expo` is used, no global install required)
- Android Studio + Android SDK (for Android)
- Xcode + CocoaPods (for iOS, macOS only)

## Setup

```bash
git clone https://github.com/kingoftech-v01/stepora-mobile.git
cd stepora-mobile
npm install

# (Optional) Sync i18n translations from the web app
bash scripts/copy-i18n.sh

# iOS only - install native pods
cd ios && pod install && cd ..
```

## Running

```bash
# Start Metro bundler
npm start

# Build + run on Android
npm run android    # runs "expo run:android"

# Build + run on iOS (macOS only)
npm run ios        # runs "expo run:ios"
```

## Configuration

Edit `src/config.js` to change the API base URL:

- **Development**: your local backend IP, e.g. `http://192.168.1.X:8000`
- **Preprod**: `https://dpapi.jhpetitfrere.com`
- **Production**: `https://api.stepora.app`

## Project structure

```
src/
  App.jsx                 # Root component with all providers
  config.js               # API base URL + app config
  config/                 # Additional runtime config
  context/                # AuthContext, ThemeContext, I18nContext, ToastContext
  navigation/             # RootNavigator, AuthStack, MainTabs, routes.js
  screens/                # Screen implementations (210+ files across 11 domains)
    auth/                 # Login, Register, ForgotPassword, 2FA
    home/                 # Dashboard
    dreams/               # Dream list / detail / create / check-in
    calendar/             # Calendar views + Google Calendar sync
    conversations/        # AI chat + buddy chat (WebSocket)
    social/               # Feed, profile, leaderboard
    community/            # Circles, discovery
    store/                # Cosmetics, gifting, purchases
    subscription/         # Tiers, Stripe checkout
    notifications/        # Notification center
    profile/              # Settings, achievements, data export
  services/
    api.js                # Fetch wrapper with JWT refresh + case transforms
    endpoints.js          # All backend URLs (kept in sync with stepora-frontend)
    transforms.js         # snake_case <-> camelCase deep converters
    websocket.js          # WebSocket with auto-reconnect + heartbeat
  components/             # Shared RN components
  hooks/                  # Custom hooks
  theme/ + styles/        # Colors, tokens
  i18n/                   # 16 language JSON files
  utils/                  # Error mapping, helpers

android/                  # Native Android project (Kotlin MainActivity/MainApplication)
ios/                      # Native iOS project
assets/universal-links/   # apple-app-site-association + assetlinks.json
APP_STORE_METADATA.md     # App Store listing content
APPLE_PRIVACY_LABELS.md   # App Store privacy labels
```

## Architecture notes

### Auth: body tokens, not cookies

React Native cannot use httpOnly cookies. The app always sends an `X-Client-Platform: native` header; the Django backend detects this and returns the refresh token in the response body instead of `Set-Cookie`. Tokens are persisted in `AsyncStorage` and refreshed transparently by `services/api.js`.

### Navigation

- **Auth flow** (unauthenticated): `AuthStack` - Login, Register, ForgotPassword, 2FA, etc.
- **Main flow** (authenticated): `MainTabs` (Bottom Tabs) over a Native Stack for screen-to-screen navigation.
- `src/navigation/routes.js` contains screen-name constants and a `WEB_TO_RN_MAP` that maps stepora-frontend web routes to their RN equivalents for shared deep-link handling.

### API parity with the web app

`services/endpoints.js` is kept in sync with the web app so screen logic can be ported with minimal changes. The same helper functions are exposed (`apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`, `apiUpload`), with the web-specific bits (CSRF, localStorage, window events) swapped out for `AsyncStorage` and a listener pattern.

### i18n

Same flat JSON structure and `t("key", { param: value })` pattern as the web app. Device language detection uses `react-native-localize` with a NativeModules fallback. RTL is handled via `I18nManager.forceRTL()`.

### Theme

The web app has complex Twilight/Cosmos themes with cinematic transitions. The RN version simplifies this to dark/light modes with the same accent color system, exposed as a `colors` object (no CSS variables).

## Porting a screen from the web app

1. Look up the web route in `src/navigation/routes.js` (`WEB_TO_RN_MAP`) to get the RN screen name.
2. Find the original at `stepora-frontend/src/pages/<domain>/<ScreenName>.jsx`.
3. Copy state, API calls and effects verbatim.
4. Replace HTML with RN components (`div` to `View`, `span`/`p` to `Text`, etc.).
5. Replace CSS / inline styles with `StyleSheet.create()`.
6. Replace `useNavigate()` with `useNavigation()` from React Navigation.
7. Replace `useParams()` with `route.params`.
8. API calls work identically, no changes needed.

## Code style

Following the web app conventions:
- `var` rather than `const`/`let`
- Function expressions
- React Context + `@tanstack/react-query` for state and data fetching
- No Redux, no MobX

## Contributing

Contributions are welcome, especially for screen-porting work, accessibility fixes and platform-specific polish. Please open an issue before starting a large change so we can coordinate with the web team.

## License

See the repository root for licensing.
