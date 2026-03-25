/**
 * Auth Stack — screens visible when user is NOT authenticated.
 *
 * Maps to the web app's GuestRoute-wrapped routes + public routes.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ─── Auth screens ─────────────────────────────────────────────────
var LoginScreen = require('../screens/auth/LoginScreen');
var RegisterScreen = require('../screens/auth/RegisterScreen');
var ForgotPasswordScreen = require('../screens/auth/ForgotPasswordScreen');
var CheckEmailScreen = require('../screens/auth/CheckEmailScreen');
var VerifyEmailScreen = require('../screens/auth/VerifyEmailScreen');
var ResetPasswordScreen = require('../screens/auth/ResetPasswordScreen');
var ChangePasswordScreen = require('../screens/auth/ChangePasswordScreen');

// ─── Legal screens (accessible from auth flow) ───────────────────
var TermsOfServiceScreen = require('../screens/profile/TermsOfServiceScreen');
var PrivacyPolicyScreen = require('../screens/profile/PrivacyPolicyScreen');

var Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0F0A1E' },
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}
