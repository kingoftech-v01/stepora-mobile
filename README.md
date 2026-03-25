# Stepora Mobile (React Native)

React Native app for Stepora, ported from the web app at `/root/stepora-frontend`.

## Prerequisites

- Node.js >= 18
- React Native CLI (not Expo)
- Android Studio + Android SDK (for Android)
- Xcode (for iOS, macOS only)
- CocoaPods (`gem install cocoapods`, iOS only)

## Setup

```bash
# 1. Install dependencies
cd /root/stepora-mobile
npm install

# 2. Copy i18n translation files from the web app
bash scripts/copy-i18n.sh

# 3. Install iOS pods (macOS only)
cd ios && pod install && cd ..
```

## Running

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

## Configuration

Edit `src/config.js` to change the API base URL:

- **Development**: Point to your local backend IP (e.g., `http://192.168.1.X:8000`)
- **Preprod**: `https://dpapi.jhpetitfrere.com`
- **Production**: `https://api.stepora.app`

## Project Structure

```
src/
  App.jsx                    # Root component with all providers
  config.js                  # API base URL and app config
  context/
    AuthContext.jsx           # JWT auth (AsyncStorage tokens)
    ThemeContext.jsx           # Dark/light theme + accent colors
    I18nContext.jsx            # 16-language i18n system
    ToastContext.jsx           # Toast notifications
  navigation/
    RootNavigator.jsx         # Auth vs Main flow switching
    AuthStack.jsx             # Login, Register, ForgotPassword, etc.
    MainTabs.jsx              # Bottom tabs: Home, Dreams, Calendar, Social, Profile
    routes.js                 # Screen name constants + web-to-RN route mapping
  services/
    api.js                    # Fetch wrapper with JWT, refresh, case transforms
    endpoints.js              # ALL backend API URL constants (synced with web app)
    transforms.js             # snake_case <-> camelCase deep converters
    websocket.js              # WebSocket with auto-reconnect + heartbeat
  i18n/
    en.json, fr.json, ...     # 16 translation files (run copy-i18n.sh for full versions)
  utils/
    errorMessages.js          # User-friendly error message mapper
  screens/                    # Screen implementations (placeholder stubs)
    auth/
    home/
    dreams/
    chat/
    social/
    calendar/
    profile/
    store/
    notifications/
    onboarding/
    leagues/
    buddies/
    circles/
```

## Architecture Decisions

### Auth: Body Tokens (not cookies)
React Native cannot use httpOnly cookies. The app always sends `X-Client-Platform: native` header, which tells the Django backend to return the refresh token in the response body instead of setting a cookie. Tokens are stored in AsyncStorage.

### Navigation: React Navigation
The web app uses `react-router-dom` with `HashRouter`. The RN app uses `@react-navigation/native` with:
- **Native Stack** for screen-to-screen transitions
- **Bottom Tabs** for the 5 main sections (Home, Dreams, Calendar, Social, Profile)
- Auth flow is separated: unauthenticated users see AuthStack, authenticated users see MainTabs

### API Layer: Same Interface
The `api.js` service exports the same functions as the web app (`apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`, `apiUpload`). This means screen code can be ported with minimal changes to API calls.

Key differences from web version:
- Uses `AsyncStorage` instead of `localStorage` / Capacitor Preferences
- No cookies or CSRF tokens
- Auth events use a listener pattern instead of `window.dispatchEvent`
- Offline queue uses `AsyncStorage` instead of `localStorage`

### Endpoints: Exact Copy
`endpoints.js` is a verbatim copy from the web app. All endpoint URLs are identical.

### i18n: Same System
Same flat JSON files and `t("key", { param: value })` pattern. Device language detection uses `react-native-localize` (with NativeModules fallback). RTL support via `I18nManager.forceRTL()`.

### Theme: Simplified
The web app has complex Twilight/Cosmos themes with cinematic transitions. The RN version simplifies to dark/light modes with the same accent color system. Theme colors are provided as a `colors` object (not CSS variables).

## Porting Screens

When porting a screen from the web app:

1. Look up the web route in `src/navigation/routes.js` (`WEB_TO_RN_MAP`) to find the RN screen name
2. The web screen is at `stepora-frontend/src/pages/<domain>/<ScreenName>.jsx`
3. Copy the mobile variant's logic (state, API calls, effects)
4. Replace HTML elements with RN components (`div` -> `View`, `span` -> `Text`, etc.)
5. Replace CSS/inline styles with `StyleSheet.create()`
6. Replace `useNavigate()` with `useNavigation()` from React Navigation
7. Replace route params: `useParams()` -> `route.params`
8. API calls (`apiGet`, `apiPost`, etc.) work identically — no changes needed

## Code Style

Following the web app's conventions:
- Use `var` (not `const`/`let`)
- Use function expressions
- Same React patterns (Context, hooks, @tanstack/react-query)
