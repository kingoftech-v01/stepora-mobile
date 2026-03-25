/**
 * Root Navigator — handles auth flow vs main app flow.
 *
 * If user is not authenticated, shows AuthStack (login, register, etc.).
 * If user is authenticated but hasn't onboarded, shows OnboardingStack.
 * Otherwise, shows MainTabs + nested stacks.
 */

import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

var AdInterstitial = require('../components/AdInterstitial');

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

// ─── Screen imports ─────────────────────────────────────────────

// Chat / Conversations
var ChatScreen = require('../screens/conversations/ChatScreen');
var ConversationListScreen = require('../screens/conversations/ConversationListScreen');
var GroupChatScreen = require('../screens/conversations/GroupChatScreen');
var VoiceCallScreen = require('../screens/conversations/VoiceCallScreen');
var VideoCallScreen = require('../screens/conversations/VideoCallScreen');
var NewConversationScreen = require('../screens/conversations/NewConversationScreen');
var CallHistoryScreen = require('../screens/conversations/CallHistoryScreen');

// Dreams
var DreamsListScreen = require('../screens/dreams/DreamsListScreen');
var DreamCreateScreen = require('../screens/dreams/DreamCreateScreen');
var DreamEditScreen = require('../screens/dreams/DreamEditScreen');
var DreamDetailScreen = require('../screens/dreams/DreamDetailScreen');
var DreamShareScreen = require('../screens/dreams/DreamShareScreen');
var CalibrationScreen = require('../screens/dreams/CalibrationScreen');
var CheckInScreen = require('../screens/dreams/CheckInScreen');

// Social
var CommunityScreen = require('../screens/social/CommunityScreen');
var ExploreScreen = require('../screens/social/ExploreScreen');
var LeaderboardScreen = require('../screens/social/LeaderboardScreen');
var FriendListScreen = require('../screens/social/FriendListScreen');
var FriendRequestsScreen = require('../screens/social/FriendRequestsScreen');
var CircleListScreen = require('../screens/social/CircleListScreen');
var CircleDetailScreen = require('../screens/social/CircleDetailScreen');
var UserProfileScreen = require('../screens/social/UserProfileScreen');
var CircleCreateScreen = require('../screens/social/CircleCreateScreen');
var CircleChallengesScreen = require('../screens/social/CircleChallengesScreen');
var SavedPostsScreen = require('../screens/social/SavedPostsScreen');
var PostDetailScreen = require('../screens/social/PostDetailScreen');

// Community
var BuddyScreen = require('../screens/community/BuddyScreen');
var BuddyRequestsScreen = require('../screens/community/BuddyRequestsScreen');
var AccountabilityContractScreen = require('../screens/community/AccountabilityContractScreen');

// Calendar
var CalendarScreen = require('../screens/calendar/CalendarScreen');
var GoogleCalendarConnectScreen = require('../screens/calendar/GoogleCalendarConnectScreen');
var GoogleSyncSettingsScreen = require('../screens/calendar/GoogleSyncSettingsScreen');
var TimeBlockScreen = require('../screens/calendar/TimeBlockScreen');
var TimeBlockTemplatesScreen = require('../screens/calendar/TimeBlockTemplatesScreen');
var SharedCalendarViewScreen = require('../screens/calendar/SharedCalendarViewScreen');

// Profile
var ProfileScreen = require('../screens/profile/ProfileScreen');
var EditProfileScreen = require('../screens/profile/EditProfileScreen');
var SettingsScreen = require('../screens/profile/SettingsScreen');
var TermsOfServiceScreen = require('../screens/profile/TermsOfServiceScreen');
var PrivacyPolicyScreen = require('../screens/profile/PrivacyPolicyScreen');
var TwoFactorScreen = require('../screens/profile/TwoFactorScreen');
var DataExportScreen = require('../screens/profile/DataExportScreen');
var BlockedUsersScreen = require('../screens/profile/BlockedUsersScreen');
var AppVersionScreen = require('../screens/profile/AppVersionScreen');
var PersonaScreen = require('../screens/profile/PersonaScreen');
var AchievementsScreen = require('../screens/profile/AchievementsScreen');

// Store
var StoreScreen = require('../screens/store/StoreScreen');
var GiftingScreen = require('../screens/store/GiftingScreen');

// Subscription
var SubscriptionScreen = require('../screens/subscription/SubscriptionScreen');
var OnboardingSubscriptionScreen = require('../screens/subscription/OnboardingSubscriptionScreen');

// Notifications
var NotificationsScreen = require('../screens/notifications/NotificationsScreen');
var NotificationSettingsScreen = require('../screens/notifications/NotificationSettingsScreen');

// Profile (additional)
var ReferralScreen = require('../screens/profile/ReferralScreen');

// Auth (ChangePassword is also accessible from the main app)
var ChangePasswordScreen = require('../screens/auth/ChangePasswordScreen');

// Social (additional)
var SeasonDetailScreen = require('../screens/social/SeasonDetailScreen');
var GroupLeaderboardScreen = require('../screens/social/GroupLeaderboardScreen');

// Dreams (additional)
var SharedDreamsScreen = require('../screens/dreams/SharedDreamsScreen');
var DreamTemplatesScreen = require('../screens/dreams/DreamTemplatesScreen');
var VisionBoardScreen = require('../screens/dreams/VisionBoardScreen');
var MicroStartScreen = require('../screens/dreams/MicroStartScreen');
var DreamJournalScreen = require('../screens/dreams/DreamJournalScreen');
var FocusTimerScreen = require('../screens/dreams/FocusTimerScreen');
var GoalRefineScreen = require('../screens/dreams/GoalRefineScreen');

// Onboarding
var OnboardingScreen = require('../screens/auth/OnboardingScreen');
var PersonalityQuizScreen = require('../screens/auth/PersonalityQuizScreen');

// Email Gate (verification required)
var EmailGateScreen = require('../screens/auth/EmailGateScreen');

// Home (dashboard)
var HomeScreen = require('../screens/home/HomeScreen');

// Social (FindBuddy — dedicated screen)
var FindBuddyScreen = require('../screens/social/FindBuddyScreen');

var RootStack = createNativeStackNavigator();

export default function RootNavigator() {
  var { isAuthenticated, isLoading, user } = useAuth();
  var { colors, isReady: themeReady } = useTheme();
  var adInterstitialRef = React.useRef(null);

  var onNavigationStateChange = React.useCallback(function () {
    if (adInterstitialRef.current && adInterstitialRef.current.onNavigate) {
      adInterstitialRef.current.onNavigate();
    }
  }, []);

  // Show loading spinner while auth/theme initializes
  if (isLoading || !themeReady) {
    return (
      <View style={[styles.loading, { backgroundColor: '#0F0A1E' }]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  var navigationTheme = {
    dark: true,
    colors: {
      primary: '#8B5CF6',
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.surfaceBorder,
      notification: '#EF4444',
    },
  };

  return (
    <NavigationContainer theme={navigationTheme} onStateChange={onNavigationStateChange}>
      <AdInterstitial ref={adInterstitialRef} frequency={5} />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // ─── Auth Flow ────────────────────────────────────
          <RootStack.Screen name="Auth" component={AuthStack} />
        ) : user && user.emailVerified === false ? (
          // ─── Email Verification Gate ──────────────────────
          <RootStack.Screen name="EmailGate" component={EmailGateScreen} />
        ) : user && !user.onboardingCompleted ? (
          // ─── Onboarding Flow ──────────────────────────────
          <RootStack.Group>
            <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
            <RootStack.Screen name="OnboardingSubscription" component={OnboardingSubscriptionScreen} />
            <RootStack.Screen name="PersonalityQuiz" component={PersonalityQuizScreen} />
          </RootStack.Group>
        ) : (
          // ─── Main App ─────────────────────────────────────
          <RootStack.Group>
            <RootStack.Screen name="MainTabs" component={MainTabs} />

            {/* ── Chat screens (full-screen over tabs) ──── */}
            <RootStack.Screen name="Chat" component={ChatScreen} />
            <RootStack.Screen name="NewConversation" component={NewConversationScreen} />
            <RootStack.Screen name="AIChat" component={ChatScreen} />
            <RootStack.Screen name="BuddyChat" component={GroupChatScreen} />
            <RootStack.Screen name="CircleChat" component={GroupChatScreen} />
            <RootStack.Screen name="VoiceCall" component={VoiceCallScreen} />
            <RootStack.Screen name="VideoCall" component={VideoCallScreen} />
            <RootStack.Screen name="CallHistory" component={CallHistoryScreen} />

            {/* ── Dream screens ──────────────────────────── */}
            <RootStack.Screen name="DreamCreate" component={DreamCreateScreen} />
            <RootStack.Screen name="DreamEdit" component={DreamEditScreen} />
            <RootStack.Screen name="DreamDetail" component={DreamDetailScreen} />
            <RootStack.Screen name="DreamShare" component={DreamShareScreen} />
            <RootStack.Screen name="DreamTemplates" component={DreamTemplatesScreen} />
            <RootStack.Screen name="Calibration" component={CalibrationScreen} />
            <RootStack.Screen name="VisionBoard" component={VisionBoardScreen} />
            <RootStack.Screen name="MicroStart" component={MicroStartScreen} />
            <RootStack.Screen name="SharedDreams" component={SharedDreamsScreen} />
            <RootStack.Screen name="ExploreDreams" component={ExploreScreen} />
            <RootStack.Screen name="CheckIn" component={CheckInScreen} />
            <RootStack.Screen name="DreamJournal" component={DreamJournalScreen} />
            <RootStack.Screen name="FocusTimer" component={FocusTimerScreen} />
            <RootStack.Screen name="GoalRefine" component={GoalRefineScreen} />

            {/* ── Social screens ──────────────────────────── */}
            <RootStack.Screen name="FindBuddy" component={FindBuddyScreen} />
            <RootStack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <RootStack.Screen name="UserSearch" component={ExploreScreen} />
            <RootStack.Screen name="Explore" component={ExploreScreen} />
            <RootStack.Screen name="FriendRequests" component={FriendRequestsScreen} />
            <RootStack.Screen name="OnlineFriends" component={FriendListScreen} />
            <RootStack.Screen name="UserProfile" component={UserProfileScreen} />
            <RootStack.Screen name="Circles" component={CircleListScreen} />
            <RootStack.Screen name="CircleDetail" component={CircleDetailScreen} />
            <RootStack.Screen name="CircleCreate" component={CircleCreateScreen} />
            <RootStack.Screen name="CircleChallenges" component={CircleChallengesScreen} />
            <RootStack.Screen name="BuddyRequests" component={BuddyRequestsScreen} />
            <RootStack.Screen name="AccountabilityContract" component={AccountabilityContractScreen} />
            <RootStack.Screen name="SavedPosts" component={SavedPostsScreen} />
            <RootStack.Screen name="PostDetail" component={PostDetailScreen} />

            {/* ── Calendar screens ────────────────────────── */}
            <RootStack.Screen name="GoogleCalendarConnect" component={GoogleCalendarConnectScreen} />
            <RootStack.Screen name="CalendarConnect" component={GoogleCalendarConnectScreen} />
            <RootStack.Screen name="TimeBlocks" component={TimeBlockScreen} />
            <RootStack.Screen name="GoogleSyncSettings" component={GoogleSyncSettingsScreen} />
            <RootStack.Screen name="SharedCalendarView" component={SharedCalendarViewScreen} />
            <RootStack.Screen name="TimeBlockTemplates" component={TimeBlockTemplatesScreen} />

            {/* ── Profile screens ──────────────────────────── */}
            <RootStack.Screen name="Settings" component={SettingsScreen} />
            <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
            <RootStack.Screen name="Achievements" component={AchievementsScreen} />
            <RootStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <RootStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <RootStack.Screen name="AppVersion" component={AppVersionScreen} />
            <RootStack.Screen name="TwoFactor" component={TwoFactorScreen} />
            <RootStack.Screen name="TwoFactorAuth" component={TwoFactorScreen} />
            <RootStack.Screen name="DataExport" component={DataExportScreen} />
            <RootStack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
            <RootStack.Screen name="Persona" component={PersonaScreen} />
            <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} />

            {/* ── Store screens ────────────────────────────── */}
            <RootStack.Screen name="Store" component={StoreScreen} />
            <RootStack.Screen name="Subscription" component={SubscriptionScreen} />
            <RootStack.Screen name="Gifting" component={GiftingScreen} />
            <RootStack.Screen name="Referral" component={ReferralScreen} />

            {/* ── League screens ───────────────────────────── */}
            <RootStack.Screen name="SeasonDetail" component={SeasonDetailScreen} />
            <RootStack.Screen name="GroupLeaderboard" component={GroupLeaderboardScreen} />

            {/* ── Notifications ─────────────────────────────── */}
            <RootStack.Screen name="Notifications" component={NotificationsScreen} />
            <RootStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          </RootStack.Group>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

var styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
