/**
 * EmailGateScreen — Shows when user email is not yet verified.
 * Displays email address, resend button, check-now button,
 * auto-polling indicator, and logout option.
 */
var React = require('react');
var {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} = require('react-native');
var { SafeAreaView } = require('react-native-safe-area-context');
var Icon = require('react-native-vector-icons/Feather').default;
var useEmailGateScreen = require('./useEmailGateScreen');
var { COLORS, SPACING, RADIUS } = require('../../../theme/tokens');
var { BRAND } = require('../../../styles/colors');

var EmailGateScreen = function () {
  var h = useEmailGateScreen();

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(View, { style: styles.content },
      // Glass card
      React.createElement(View, { style: styles.card },
        // Mail icon
        React.createElement(View, { style: styles.iconWrap },
          React.createElement(Icon, { name: 'mail', size: 36, color: BRAND.purpleLight })
        ),

        // Title
        React.createElement(Text, { style: styles.title, accessibilityRole: 'header' }, 'Verify Your Email'),

        // Description
        React.createElement(Text, { style: styles.description },
          "We've sent a verification link to your email. Please check your inbox and click the link to activate your account."
        ),

        // Email address
        h.email
          ? React.createElement(Text, { style: styles.emailText }, h.email)
          : null,

        // Auto-polling indicator
        React.createElement(View, { style: styles.pollingRow },
          React.createElement(View, { style: styles.pollingDot }),
          React.createElement(Text, { style: styles.pollingText },
            'Auto-checking verification status...'
          )
        ),

        // Error
        h.error
          ? React.createElement(View, { style: styles.errorBox, accessibilityLiveRegion: 'assertive', accessibilityRole: 'alert' },
              React.createElement(Text, { style: styles.errorText }, h.error)
            )
          : null,

        // "I've Verified" button
        React.createElement(TouchableOpacity, {
          style: styles.primaryBtn,
          onPress: h.handleCheckNow,
          activeOpacity: 0.8,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: "I've Verified My Email",
          accessibilityHint: 'Checks if your email has been verified',
        },
          React.createElement(View, { style: styles.btnContent },
            React.createElement(Icon, { name: 'check-circle', size: 18, color: '#fff' }),
            React.createElement(Text, { style: styles.primaryBtnText }, "I've Verified My Email")
          )
        ),

        // Resend button
        React.createElement(TouchableOpacity, {
          style: styles.resendBtn,
          onPress: h.handleResend,
          disabled: h.resending || h.resent,
          activeOpacity: 0.7,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: h.resent ? 'Verification Email Resent' : 'Resend Verification Email',
          accessibilityState: { disabled: !!(h.resending || h.resent) },
        },
          h.resending
            ? React.createElement(ActivityIndicator, { size: 'small', color: BRAND.purple })
            : React.createElement(View, { style: styles.btnContent },
                React.createElement(Icon, {
                  name: 'refresh-cw',
                  size: 14,
                  color: h.resent ? BRAND.greenSolid : BRAND.purple,
                }),
                React.createElement(Text, {
                  style: [
                    styles.resendText,
                    h.resent && styles.resendTextSent,
                  ],
                }, h.resent ? 'Verification Email Resent!' : 'Resend Verification Email')
              )
        ),

        // Divider
        React.createElement(View, { style: styles.divider }),

        // Logout button
        React.createElement(TouchableOpacity, {
          style: styles.logoutBtn,
          onPress: h.handleLogout,
          activeOpacity: 0.7,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Logout and Try Again',
        },
          React.createElement(View, { style: styles.btnContent },
            React.createElement(Icon, { name: 'log-out', size: 14, color: COLORS.textMuted }),
            React.createElement(Text, { style: styles.logoutText }, 'Logout and Try Again')
          )
        )
      )
    )
  );
};

// ─── Styles ─────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.xl,
    padding: 28,
    alignItems: 'center',
  },

  // Icon
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  // Text
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: COLORS.textTertiary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.purple,
    marginBottom: 24,
  },

  // Polling
  pollingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  pollingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  pollingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Buttons
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendBtn: {
    paddingVertical: 10,
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND.purple,
  },
  resendTextSent: {
    color: BRAND.greenSolid,
  },

  // Divider
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 20,
  },

  // Logout
  logoutBtn: {
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },
});

module.exports = EmailGateScreen;
