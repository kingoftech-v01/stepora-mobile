# Apple App Store Privacy Nutrition Labels — Stepora

> **Last updated:** 2026-03-15
> **App name:** Stepora
> **Bundle ID:** com.stepora.app
>
> This document maps every data type collected by the Stepora iOS app to
> Apple's privacy label categories. Follow the "App Store Connect
> Step-by-Step" section at the bottom to enter the declarations.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Third-Party SDKs and Their Data Collection](#2-third-party-sdks-and-their-data-collection)
3. [Privacy Label Declarations by Category](#3-privacy-label-declarations-by-category)
4. [Data NOT Collected](#4-data-not-collected)
5. [App Store Connect Step-by-Step Guide](#5-app-store-connect-step-by-step-guide)
6. [Recommendations for Minimizing Declarations](#6-recommendations-for-minimizing-declarations)

---

## 1. Overview

Stepora is a goal-tracking and productivity app with AI coaching, social
features, in-app purchases, push notifications, video/voice calling, and
advertising for free-tier users. The app collects data through:

- **First-party collection** (account creation, user-generated content, usage tracking)
- **Third-party SDKs** (Google AdMob, Firebase Cloud Messaging, Agora.io, Stripe)

**Key principle:** Apple requires you to declare ALL data collected by your
app AND by any third-party SDKs embedded in your app, regardless of whether
the data leaves the device.

---

## 2. Third-Party SDKs and Their Data Collection

### 2.1 Google AdMob (`react-native-google-mobile-ads` v14.11.0)

| Data Type (Apple Category)     | Specifics                                      |
| ------------------------------ | ---------------------------------------------- |
| Device ID                      | IDFA (Identifier for Advertisers), IDFV        |
| Coarse Location                | IP-based approximate location                  |
| Product Interaction            | Ad views, taps, impressions                     |
| Advertising Data               | Ad campaign identifiers, ad interaction data    |
| Diagnostics (Performance Data) | SDK crash/error logs, latency metrics           |

- **Used for Tracking:** Yes (cross-app advertising when ATT consent granted)
- **Linked to User:** No (AdMob uses device-level identifiers, not your user ID)
- **Note:** AdMob is currently toggled OFF (`admobEnabled: false` in `adConfig.js`) but the SDK is bundled. Apple requires disclosure if the SDK is present in the binary, even if not active.

### 2.2 Firebase Cloud Messaging (`@react-native-firebase/messaging` v21.6.1)

| Data Type (Apple Category) | Specifics                                    |
| -------------------------- | -------------------------------------------- |
| Device ID                  | FCM registration token (per-device)          |
| Product Interaction        | Notification open/dismiss events             |
| Diagnostics                | SDK crash data, delivery receipts            |

- **Used for Tracking:** No
- **Linked to User:** Yes (FCM token stored in `UserDevice` model linked to user account)

### 2.3 Agora.io (`react-native-agora` v4.3.2)

| Data Type (Apple Category) | Specifics                                        |
| -------------------------- | ------------------------------------------------ |
| Audio Data                 | Microphone input during voice/video calls        |
| User ID                    | Agora channel UID (mapped to Stepora user ID)    |
| Diagnostics                | Call quality metrics, SDK performance data        |

- **Used for Tracking:** No
- **Linked to User:** Yes (call sessions tied to user accounts)
- **Note:** Audio/video data is processed in real-time and not stored by Agora. No recordings are made.

### 2.4 Stripe (via redirect-based checkout, no native SDK in app)

| Data Type (Apple Category) | Specifics                              |
| -------------------------- | -------------------------------------- |
| Payment Info               | Card details handled by Stripe Checkout page |
| Purchase History           | Subscription plan, start/end dates     |

- **Used for Tracking:** No
- **Linked to User:** Yes (StripeCustomer model linked to user)
- **Note:** Payment info is entered on Stripe's hosted checkout page and never touches the app. Only subscription status is stored in the backend.

### 2.5 Firebase App (`@react-native-firebase/app` v21.6.1)

| Data Type (Apple Category) | Specifics                    |
| -------------------------- | ---------------------------- |
| Device ID                  | Firebase Installation ID     |
| Diagnostics                | App launch, crash metadata   |

- **Used for Tracking:** No
- **Linked to User:** No (unless Firebase Analytics is enabled — it is NOT currently enabled)

---

## 3. Privacy Label Declarations by Category

For each data type below, declare the following in App Store Connect.

---

### 3.1 Contact Info

#### Email Address

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| User email for account creation and login         |
| **Purpose**          | App Functionality                                |
| **Linked to User**   | Yes                                              |
| **Used for Tracking**| No                                               |
| **Source**           | First-party (registration form)                   |
| **Backend field**    | `User.email` (plain text, indexed)                |

#### Name

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| Display name (public profile name)                |
| **Purpose**          | App Functionality, Product Personalization        |
| **Linked to User**   | Yes                                              |
| **Used for Tracking**| No                                               |
| **Source**           | First-party (profile setup/edit)                  |
| **Backend field**    | `User.display_name` (encrypted at rest)           |

---

### 3.2 User Content

#### Photos or Videos

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| Avatar image uploads, vision board images         |
| **Purpose**          | App Functionality                                |
| **Linked to User**   | Yes                                              |
| **Used for Tracking**| No                                               |
| **Source**           | First-party (camera/photo library)                |
| **Backend field**    | `User.avatar_image` (S3), `Dream.vision_image_url` |
| **Permissions**      | Camera (also used for video calls)                |

#### Audio Data

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| Microphone input during voice/video calls (Agora) |
| **Purpose**          | App Functionality                                |
| **Linked to User**   | Yes                                              |
| **Used for Tracking**| No                                               |
| **Source**           | Third-party (Agora SDK, real-time only, not stored)|
| **Permissions**      | Microphone (`RECORD_AUDIO`)                       |

#### Other User Content

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| Dreams/goals (title, description), tasks, milestones, journal entries, AI chat messages, social posts, circle posts/messages, comments, bio, persona questionnaire responses |
| **Purpose**          | App Functionality, Product Personalization        |
| **Linked to User**   | Yes                                              |
| **Used for Tracking**| No                                               |
| **Source**           | First-party (in-app creation)                     |
| **Backend fields**   | `Dream.title/description` (encrypted), `Goal`, `Task`, `DreamJournal.content`, `Message.content`, `DreamPost`, `CirclePost`, `CircleMessage`, `User.bio` (encrypted), `User.persona` |

---

### 3.3 Identifiers

#### User ID

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| UUID account identifier                           |
| **Purpose**          | App Functionality                                |
| **Linked to User**   | Yes                                              |
| **Used for Tracking**| No                                               |
| **Source**           | First-party (auto-generated at registration)      |
| **Backend field**    | `User.id` (UUIDField)                             |

#### Device ID

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| FCM registration token, Firebase Installation ID, IDFA/IDFV (via AdMob if ATT granted) |
| **Purpose**          | App Functionality (push notifications), Advertising (AdMob) |
| **Linked to User**   | Yes (FCM token linked to user account via `UserDevice` model) |
| **Used for Tracking**| Yes (AdMob may use IDFA for cross-app advertising)|
| **Source**           | Third-party (Firebase, AdMob)                     |
| **Backend field**    | `UserDevice.fcm_token`                            |

---

### 3.4 Usage Data

#### Product Interaction

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| Dream progress %, tasks completed count, XP earned, minutes active, streak days, check-in completions, level, achievements unlocked, gamification category XP (health, career, relationships, personal growth, finance, hobbies) |
| **Purpose**          | App Functionality, Product Personalization        |
| **Linked to User**   | Yes                                              |
| **Used for Tracking**| No                                               |
| **Source**           | First-party (computed from user actions)          |
| **Backend fields**   | `User.xp`, `User.level`, `User.streak_days`, `DailyActivity`, `HabitChain`, `GamificationProfile`, `DreamProgressSnapshot` |

#### Other Usage Data

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| Last activity timestamp, online status, last seen, notification preferences, energy profile, work schedule preferences, calendar preferences |
| **Purpose**          | App Functionality, Product Personalization        |
| **Linked to User**   | Yes                                              |
| **Used for Tracking**| No                                               |
| **Backend fields**   | `User.last_activity`, `User.is_online`, `User.last_seen`, `User.notification_prefs`, `User.energy_profile`, `User.work_schedule`, `User.calendar_preferences` |

---

### 3.5 Purchases

#### Purchase History

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| Subscription plan (free/premium/pro), subscription start/end dates, Stripe customer ID, promotion redemptions |
| **Purpose**          | App Functionality                                |
| **Linked to User**   | Yes                                              |
| **Used for Tracking**| No                                               |
| **Source**           | First-party + third-party (Stripe)                |
| **Backend fields**   | `Subscription`, `StripeCustomer`, `PromotionRedemption`, `User.subscription`, `User.subscription_ends` |

---

### 3.6 Financial Info

#### Payment Info

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes (by Stripe, not by the app directly)         |
| **What specifically**| Credit/debit card details entered on Stripe Checkout |
| **Purpose**          | App Functionality (subscription payments)        |
| **Linked to User**   | Yes (Stripe Customer linked to user)             |
| **Used for Tracking**| No                                               |
| **Source**           | Third-party (Stripe hosted checkout)              |
| **Note**            | Card data never enters or is stored in the app. Stripe handles PCI compliance. However, Apple still requires disclosure because the purchase flow is initiated from within the app. **Important: If you use Apple In-App Purchases instead of Stripe for iOS, you do NOT need to declare Payment Info — Apple handles it.** |

---

### 3.7 Search History

#### Search Queries

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| Global search queries (searching dreams, users, circles, posts) |
| **Purpose**          | App Functionality                                |
| **Linked to User**   | Yes (searches are authenticated API requests)    |
| **Used for Tracking**| No                                               |
| **Source**           | First-party (search bar input)                    |
| **Backend**          | `GlobalSearchView` — queries are processed server-side but not persisted in a search history table |

---

### 3.8 Diagnostics

#### Crash Data

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| JavaScript error boundaries, uncaught exceptions, Firebase SDK crash metadata |
| **Purpose**          | App Functionality (error recovery)               |
| **Linked to User**   | No                                               |
| **Used for Tracking**| No                                               |
| **Source**           | First-party (ErrorBoundary) + third-party (Firebase) |

#### Performance Data

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| API response times (implicit in network layer), AdMob SDK performance metrics |
| **Purpose**          | App Functionality                                |
| **Linked to User**   | No                                               |
| **Used for Tracking**| No                                               |
| **Source**           | First-party + third-party (AdMob, Firebase)       |

---

### 3.9 Sensitive Info

#### Biometric Data

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | No                                               |
| **Note**            | The app uses `react-native-biometrics` for local device authentication (Face ID / Touch ID). Biometric data never leaves the device and is handled entirely by the OS Secure Enclave. Apple does NOT require disclosure of on-device biometric authentication. |

---

### 3.10 Location

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | No (first-party)                                 |
| **Note on AdMob**   | Google AdMob derives **coarse location** from IP address. This is AdMob's collection, not yours. You must still declare it. |

#### Coarse Location (AdMob only)

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Collected**        | Yes                                              |
| **What specifically**| IP-derived approximate location (city/region level) |
| **Purpose**          | Third-Party Advertising                          |
| **Linked to User**   | No                                               |
| **Used for Tracking**| Yes (AdMob cross-app ad targeting)               |
| **Source**           | Third-party (Google AdMob SDK)                    |

---

### 3.11 Contacts

| Field               | Value |
| ------------------- | ----- |
| **Collected**        | No   |

The app has a friends/buddy system but uses in-app search by display name, not device contacts.

---

### 3.12 Browsing History

| Field               | Value |
| ------------------- | ----- |
| **Collected**        | No   |

---

### 3.13 Health & Fitness

| Field               | Value |
| ------------------- | ----- |
| **Collected**        | No   |

The gamification system tracks "health XP" as a goal category label, not actual health/fitness data from HealthKit or similar.

---

## 4. Data NOT Collected

The following Apple privacy label categories do **not** apply to Stepora:

| Category                | Reason                                                    |
| ----------------------- | --------------------------------------------------------- |
| Precise Location        | No GPS/location services used                             |
| Physical Address        | Not collected (user `location` is a freeform text field)  |
| Phone Number            | Not collected                                             |
| Contacts                | Device contact list is never accessed                     |
| Emails or Text Messages | Not collected (app email is for account, not email content)|
| Browsing History        | No web browsing tracked                                   |
| Health & Fitness        | No HealthKit or health sensor data                        |
| Fitness                 | No fitness tracking                                       |
| Gameplay Content        | Not a game                                                |
| Sensitive Info          | No ethnic, political, religious, sexual orientation, or biometric data collected |
| Environment Scanning    | No AR/scanning features                                   |
| Body                    | No body measurement data                                  |
| Hands                   | No hand tracking                                          |
| Head                    | No head tracking                                          |

---

## 5. App Store Connect Step-by-Step Guide

### Prerequisites

1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **My Apps** > **Stepora** > **App Privacy**
3. Click **Get Started** (or **Edit** if already started)

### Step 1: "Does your app collect data?"

Select: **Yes, we collect data**

### Step 2: Select all data types collected

Check the following categories. Apple presents them as a checklist:

#### Contact Info
- [x] **Name** (display name)
- [x] **Email Address** (account email)

#### Financial Info
- [x] **Payment Info** (Stripe checkout — skip this if using Apple In-App Purchase exclusively on iOS)

#### Location
- [x] **Coarse Location** (AdMob IP-based geolocation)

#### Sensitive Info
- [ ] *(none)*

#### Contacts
- [ ] *(none)*

#### User Content
- [x] **Photos or Videos** (avatar uploads, vision board images)
- [x] **Audio Data** (voice/video calls via Agora)
- [x] **Other User Content** (dreams, goals, tasks, journal entries, chat messages, posts, comments)

#### Browsing History
- [ ] *(none)*

#### Search History
- [x] **Search Queries** (global in-app search)

#### Identifiers
- [x] **User ID** (UUID account identifier)
- [x] **Device ID** (FCM token, IDFA via AdMob)

#### Purchases
- [x] **Purchase History** (subscription plan and dates)

#### Usage Data
- [x] **Product Interaction** (task completions, XP, streaks, progress)
- [x] **Other Usage Data** (activity timestamps, preferences)

#### Diagnostics
- [x] **Crash Data** (error boundaries, Firebase crash metadata)
- [x] **Performance Data** (SDK metrics)

### Step 3: For each selected data type, answer three questions

Apple will ask, for each data type:

**Question A: "Is this data used for tracking?"**
Tracking = combining collected data with third-party data for advertising,
or sharing collected data with a data broker.

| Data Type             | Used for Tracking? |
| --------------------- | ------------------ |
| Name                  | No                 |
| Email Address         | No                 |
| Payment Info          | No                 |
| Coarse Location       | **Yes** (AdMob)    |
| Photos or Videos      | No                 |
| Audio Data            | No                 |
| Other User Content    | No                 |
| Search Queries        | No                 |
| User ID               | No                 |
| Device ID             | **Yes** (AdMob IDFA) |
| Purchase History      | No                 |
| Product Interaction   | No                 |
| Other Usage Data      | No                 |
| Crash Data            | No                 |
| Performance Data      | No                 |

**Question B: "Is this data linked to the user's identity?"**

| Data Type             | Linked to User? |
| --------------------- | --------------- |
| Name                  | Yes             |
| Email Address         | Yes             |
| Payment Info          | Yes             |
| Coarse Location       | No              |
| Photos or Videos      | Yes             |
| Audio Data            | Yes             |
| Other User Content    | Yes             |
| Search Queries        | Yes             |
| User ID               | Yes             |
| Device ID             | Yes             |
| Purchase History      | Yes             |
| Product Interaction   | Yes             |
| Other Usage Data      | Yes             |
| Crash Data            | No              |
| Performance Data      | No              |

**Question C: "What are the purposes for collecting this data?"**
Select all that apply from Apple's list.

| Data Type             | App Functionality | Analytics | Third-Party Advertising | Product Personalization | Other |
| --------------------- | :---------------: | :-------: | :---------------------: | :---------------------: | :---: |
| Name                  | x                 |           |                         | x                       |       |
| Email Address         | x                 |           |                         |                         |       |
| Payment Info          | x                 |           |                         |                         |       |
| Coarse Location       |                   |           | x                       |                         |       |
| Photos or Videos      | x                 |           |                         |                         |       |
| Audio Data            | x                 |           |                         |                         |       |
| Other User Content    | x                 |           |                         | x                       |       |
| Search Queries        | x                 |           |                         |                         |       |
| User ID               | x                 |           |                         |                         |       |
| Device ID             | x                 |           | x                       |                         |       |
| Purchase History      | x                 |           |                         |                         |       |
| Product Interaction   | x                 |           |                         | x                       |       |
| Other Usage Data      | x                 |           |                         | x                       |       |
| Crash Data            | x                 |           |                         |                         |       |
| Performance Data      | x                 |           |                         |                         |       |

### Step 4: Review and Publish

1. Apple will generate a summary card showing your privacy labels
2. Review each section carefully
3. Click **Publish** to make the labels visible on your App Store listing

---

## 6. Recommendations for Minimizing Declarations

### High Impact (reduces "Tracking" labels)

1. **Remove AdMob SDK from the iOS binary if not using it.**
   Currently `admobEnabled: false` in `adConfig.js`, but the SDK is still bundled. If you remove `react-native-google-mobile-ads` from the iOS build entirely (keep it for Android only, or remove altogether until ready), you can eliminate:
   - Coarse Location declaration
   - Device ID "Used for Tracking" = Yes
   - Third-Party Advertising purpose
   This removes the red "USED TO TRACK YOU" section from your App Store listing entirely.

2. **Use Apple In-App Purchase for iOS instead of Stripe.**
   Apple requires Stripe payment declarations even though card data never touches your app. IAP is handled by Apple and is explicitly excluded from privacy labels. This eliminates the **Payment Info** declaration. (Note: Apple's App Store guidelines may require IAP for digital subscriptions anyway.)

### Medium Impact (reduces linked data)

3. **Do not persist search queries on the server.**
   Currently `GlobalSearchView` processes but does not store search queries. If you can confirm no server-side logging captures query strings, you could argue Search Queries are not "collected." However, if queries appear in any server access logs, they are technically collected.

4. **Make crash data truly anonymous.**
   Ensure error boundaries and any crash reporting never include user IDs, emails, or other PII. If crash data cannot be tied back to a specific user, declare it as "Not Linked to User."

### Lower Impact (good practice)

5. **Implement ATT (App Tracking Transparency) prompt.**
   Required by Apple if any SDK uses IDFA. Add the `NSUserTrackingUsageDescription` key to `Info.plist` and prompt users before AdMob initializes. If a user declines, AdMob cannot use IDFA, but you must still declare it because some users will consent.

6. **Document data retention periods.**
   Apple does not currently require retention periods in privacy labels, but this is good practice. Key periods:
   - Account data: retained until account deletion (30-day grace period, then hard delete)
   - FCM tokens: auto-cleaned after 60 days of inactivity (`cleanup_stale_fcm_tokens` task)
   - Chat messages: retained indefinitely
   - Dreams/goals: retained until user deletes or account is deleted

7. **Add a Privacy Policy URL in App Store Connect.**
   Required for apps that collect any data. The URL should be publicly accessible and detail all data practices described in this document.

---

## Appendix A: iOS-Specific Permissions (Info.plist Keys)

Ensure these keys are present in `ios/Stepora/Info.plist` with user-facing descriptions:

| Key                                    | Description (user-facing string)                        | Required For     |
| -------------------------------------- | ------------------------------------------------------- | ---------------- |
| `NSCameraUsageDescription`             | "Stepora needs camera access to take profile photos and for video calls." | Avatar upload, Agora video |
| `NSMicrophoneUsageDescription`         | "Stepora needs microphone access for voice and video calls." | Agora calls |
| `NSPhotoLibraryUsageDescription`       | "Stepora needs photo library access to choose a profile photo." | Avatar upload |
| `NSUserTrackingUsageDescription`       | "Stepora uses this identifier to show you relevant ads." | AdMob IDFA (ATT prompt) |
| `NSFaceIDUsageDescription`             | "Stepora uses Face ID to securely unlock the app."      | Biometric unlock |
| `UIBackgroundModes`                    | `fetch`, `remote-notification`                           | FCM push, background refresh |

---

## Appendix B: Summary Card Preview

After completing the declarations, your App Store privacy label will show:

### Data Used to Track You
- Location (Coarse Location)
- Identifiers (Device ID)

### Data Linked to You
- Contact Info (Name, Email Address)
- Financial Info (Payment Info)
- User Content (Photos or Videos, Audio Data, Other User Content)
- Search History
- Identifiers (User ID, Device ID)
- Purchases (Purchase History)
- Usage Data (Product Interaction, Other Usage Data)

### Data Not Linked to You
- Diagnostics (Crash Data, Performance Data)

> **If you remove AdMob from the iOS build**, the "Data Used to Track You"
> section disappears entirely, which significantly improves the perceived
> privacy posture of the app on the App Store listing page.
