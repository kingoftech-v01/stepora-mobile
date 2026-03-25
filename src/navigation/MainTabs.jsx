/**
 * Main Bottom Tab Navigator — the primary navigation after authentication.
 *
 * 5 tabs matching the web app's BottomNav:
 * 1. Home (DreamsList as main screen)
 * 2. Calendar
 * 3. Social
 * 4. Conversations
 * 5. Profile
 *
 * Each tab has its own stack navigator for internal navigation.
 */

import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

// ─── Screen imports ─────────────────────────────────────────────
// Home (dashboard screen)
var HomeScreen = require('../screens/home/HomeScreen');

// Dreams
var DreamsListScreen = require('../screens/dreams/DreamsListScreen');

// Calendar
var CalendarScreen = require('../screens/calendar/CalendarScreen');

// Social
var CommunityScreen = require('../screens/social/CommunityScreen');

// Conversations
var ConversationListScreen = require('../screens/conversations/ConversationListScreen');

// Profile
var ProfileScreen = require('../screens/profile/ProfileScreen');

// ─── Tab Stack Navigators ────────────────────────────────────────
// Each tab gets its own stack so that navigation within a tab
// preserves back button behavior and doesn't interfere with other tabs.

var HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="DreamsList" component={DreamsListScreen} />
    </HomeStack.Navigator>
  );
}

var CalendarStack = createNativeStackNavigator();
function CalendarStackScreen() {
  return (
    <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStack.Screen name="CalendarMain" component={CalendarScreen} />
    </CalendarStack.Navigator>
  );
}

var SocialStack = createNativeStackNavigator();
function SocialStackScreen() {
  return (
    <SocialStack.Navigator screenOptions={{ headerShown: false }}>
      <SocialStack.Screen name="SocialHub" component={CommunityScreen} />
    </SocialStack.Navigator>
  );
}

var ConversationsStack = createNativeStackNavigator();
function ConversationsStackScreen() {
  return (
    <ConversationsStack.Navigator screenOptions={{ headerShown: false }}>
      <ConversationsStack.Screen name="Conversations" component={ConversationListScreen} />
    </ConversationsStack.Navigator>
  );
}

var ProfileStack = createNativeStackNavigator();
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Simple Tab Icon Component ───────────────────────────────────
// Uses Unicode symbols as temporary icons until react-native-vector-icons
// is properly linked. Replace with actual icon components later.
function TabIcon({ label, focused, color }) {
  var icons = {
    Home: focused ? '\u25C9' : '\u25CB',
    Calendar: focused ? '\u25A0' : '\u25A1',
    Social: focused ? '\u2764' : '\u2661',
    Messages: focused ? '\u2709' : '\u2709',
    Profile: focused ? '\u25CF' : '\u25CB',
  };
  return <Text style={{ fontSize: 22, color: color }}>{icons[label] || '\u25CB'}</Text>;
}

// ─── Bottom Tabs ─────────────────────────────────────────────────
var Tab = createBottomTabNavigator();

export default function MainTabs() {
  var { colors, accentColor } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 4,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: function ({ focused, color }) {
            return <TabIcon label="Home" focused={focused} color={color} />;
          },
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarStackScreen}
        options={{
          tabBarAccessibilityLabel: 'Calendar tab',
          tabBarIcon: function ({ focused, color }) {
            return <TabIcon label="Calendar" focused={focused} color={color} />;
          },
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialStackScreen}
        options={{
          tabBarAccessibilityLabel: 'Social tab',
          tabBarIcon: function ({ focused, color }) {
            return <TabIcon label="Social" focused={focused} color={color} />;
          },
        }}
      />
      <Tab.Screen
        name="Messages"
        component={ConversationsStackScreen}
        options={{
          tabBarAccessibilityLabel: 'Messages tab',
          tabBarIcon: function ({ focused, color }) {
            return <TabIcon label="Messages" focused={focused} color={color} />;
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarIcon: function ({ focused, color }) {
            return <TabIcon label="Profile" focused={focused} color={color} />;
          },
        }}
      />
    </Tab.Navigator>
  );
}

var styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: '#0F0A1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  placeholderSubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
});
