/**
 * FindBuddyScreen — User discovery for buddy matching.
 * Shows current buddy details or AI-matched suggestions with
 * compatibility scores, shared interests, and request buttons.
 */
var React = require('react');
var {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  StyleSheet,
} = require('react-native');
var { SafeAreaView } = require('react-native-safe-area-context');
var Icon = require('react-native-vector-icons/Feather').default;
var useFindBuddyScreen = require('./useFindBuddyScreen');
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');

var FindBuddyScreen = function () {
  var h = useFindBuddyScreen();

  // ─── Header ──────────────────────────────────────────
  var renderHeader = function () {
    return React.createElement(View, { style: styles.header },
      React.createElement(TouchableOpacity, {
        style: styles.backBtn,
        onPress: function () { h.navigation.goBack(); },
        activeOpacity: 0.7,
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back',
      },
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(View, { style: styles.headerTitleWrap },
        React.createElement(Icon, { name: 'target', size: 18, color: BRAND.teal }),
        React.createElement(Text, { style: styles.headerTitle }, 'Dream Buddy')
      ),
      React.createElement(TouchableOpacity, {
        style: styles.refreshBtn,
        onPress: h.refresh,
        activeOpacity: 0.7,
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Refresh buddy matches',
      },
        React.createElement(Icon, { name: 'refresh-cw', size: 18, color: COLORS.textSecondary })
      )
    );
  };

  // ─── Loading ─────────────────────────────────────────
  if (h.isLoading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.loadingWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple })
      )
    );
  }

  // ─── Error state ─────────────────────────────────────
  if (h.isError) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.loadingWrap },
        React.createElement(Icon, { name: 'alert-circle', size: 32, color: BRAND.redSolid }),
        React.createElement(Text, { style: styles.errorText }, 'Failed to load buddy data'),
        React.createElement(TouchableOpacity, {
          style: styles.retryBtn,
          onPress: h.refresh,
          activeOpacity: 0.8,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Retry loading buddy data',
        },
          React.createElement(Text, { style: styles.retryText }, 'Retry')
        )
      )
    );
  }

  // ─── What is Dream Buddy? info card ──────────────────
  var renderInfoCard = function () {
    return React.createElement(View, { style: styles.infoCard },
      React.createElement(View, { style: styles.infoIconWrap },
        React.createElement(Text, { style: { fontSize: 24 } }, '\uD83E\uDD1D')
      ),
      React.createElement(Text, { style: styles.infoTitle }, 'What is a Dream Buddy?'),
      React.createElement(Text, { style: styles.infoDesc },
        'A dream buddy is someone who shares similar goals. You can motivate each other, check in on progress, and celebrate wins together.'
      )
    );
  };

  // ─── Current buddy card ──────────────────────────────
  var renderCurrentBuddy = function () {
    if (!h.hasBuddy) return null;
    var b = h.buddy;

    return React.createElement(View, { style: styles.buddyCard },
      React.createElement(View, { style: styles.buddyHeader },
        React.createElement(Text, { style: styles.sectionTitle }, 'Your Buddy'),
        React.createElement(View, { style: styles.compatBadge },
          React.createElement(Icon, { name: 'heart', size: 12, color: BRAND.pink }),
          React.createElement(Text, { style: styles.compatText }, b.compatibility + '% match')
        )
      ),
      React.createElement(View, { style: styles.buddyProfile },
        b.avatar
          ? React.createElement(Image, {
              source: { uri: b.avatar },
              style: styles.buddyAvatar,
            })
          : React.createElement(View, { style: [styles.buddyAvatarPlaceholder, { backgroundColor: '#14B8A6' + '25' }] },
              React.createElement(Text, { style: styles.buddyInitial }, b.initial)
            ),
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: styles.buddyName }, b.name),
          React.createElement(View, { style: styles.buddyMeta },
            React.createElement(Icon, { name: 'zap', size: 12, color: BRAND.yellow }),
            React.createElement(Text, { style: styles.buddyMetaText }, 'Level ' + b.level),
            React.createElement(View, { style: styles.metaDot }),
            React.createElement(Icon, { name: 'activity', size: 12, color: BRAND.teal }),
            React.createElement(Text, { style: styles.buddyMetaText }, b.streak + ' streak')
          )
        )
      ),
      // Action buttons
      React.createElement(View, { style: styles.buddyActions },
        React.createElement(TouchableOpacity, {
          style: styles.buddyActionBtn,
          onPress: function () {
            if (h.CURRENT_BUDDY) {
              h.navigation.navigate('BuddyChat', { id: h.CURRENT_BUDDY.id });
            }
          },
          activeOpacity: 0.7,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Chat with buddy',
        },
          React.createElement(Icon, { name: 'message-circle', size: 16, color: BRAND.purple }),
          React.createElement(Text, { style: styles.buddyActionText }, 'Chat')
        ),
        React.createElement(TouchableOpacity, {
          style: styles.buddyActionBtn,
          onPress: function () { h.setEncourage(true); },
          activeOpacity: 0.7,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Send encouragement to buddy',
        },
          React.createElement(Icon, { name: 'heart', size: 16, color: BRAND.pink }),
          React.createElement(Text, { style: styles.buddyActionText }, 'Encourage')
        ),
        React.createElement(TouchableOpacity, {
          style: styles.buddyActionBtn,
          onPress: function () {
            if (b.id) h.navigation.navigate('UserProfile', { id: b.id });
          },
          activeOpacity: 0.7,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'View buddy profile',
        },
          React.createElement(Icon, { name: 'user', size: 16, color: BRAND.teal }),
          React.createElement(Text, { style: styles.buddyActionText }, 'Profile')
        )
      ),
      // Encourage modal inline
      h.encourage
        ? React.createElement(View, { style: styles.encourageWrap },
            React.createElement(Text, { style: styles.encourageLabel }, 'Send encouragement'),
            React.createElement(View, { style: styles.presetRow },
              h.ENCOURAGE_PRESETS.map(function (msg, idx) {
                var isActive = h.encourageMsg === msg;
                return React.createElement(TouchableOpacity, {
                  key: idx,
                  style: [styles.presetChip, isActive && styles.presetChipActive],
                  onPress: function () { h.setEncourageMsg(msg); },
                  activeOpacity: 0.7,
                  accessible: true, accessibilityRole: 'button', accessibilityLabel: msg, accessibilityState: { selected: isActive },
                },
                  React.createElement(Text, {
                    style: [styles.presetText, isActive && styles.presetTextActive],
                    numberOfLines: 2,
                  }, msg)
                );
              })
            ),
            React.createElement(View, { style: styles.encourageActions },
              React.createElement(TouchableOpacity, {
                style: styles.cancelBtn,
                onPress: function () { h.setEncourage(false); },
                activeOpacity: 0.7,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel encouragement',
              },
                React.createElement(Text, { style: styles.cancelText }, 'Cancel')
              ),
              React.createElement(TouchableOpacity, {
                style: [styles.sendBtn, h.sentEncourage && styles.sendBtnSent],
                onPress: h.sendEncourageMsg,
                disabled: h.sentEncourage,
                activeOpacity: 0.8,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: h.sentEncourage ? 'Encouragement sent' : 'Send encouragement', accessibilityState: { disabled: h.sentEncourage },
              },
                h.sentEncourage
                  ? React.createElement(Icon, { name: 'check', size: 16, color: '#fff' })
                  : React.createElement(View, { style: styles.sendBtnContent },
                      React.createElement(Icon, { name: 'send', size: 14, color: '#fff' }),
                      React.createElement(Text, { style: styles.sendBtnText }, 'Send')
                    )
              )
            )
          )
        : null
    );
  };

  // ─── Suggestions list ─────────────────────────────────
  var renderSuggestions = function () {
    if (h.hasBuddy) return null;

    if (h.suggestions.length === 0) {
      return React.createElement(View, { style: styles.emptyCard },
        React.createElement(Icon, { name: 'users', size: 28, color: COLORS.textMuted }),
        React.createElement(Text, { style: styles.emptyTitle }, 'No matches yet'),
        React.createElement(Text, { style: styles.emptyDesc },
          'We\'re searching for the perfect buddy match based on your dreams and interests. Check back soon!'
        ),
        React.createElement(TouchableOpacity, {
          style: styles.refreshMatchBtn,
          onPress: h.refresh,
          activeOpacity: 0.8,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Find buddy matches',
        },
          React.createElement(Icon, { name: 'refresh-cw', size: 16, color: '#fff' }),
          React.createElement(Text, { style: styles.refreshMatchText }, 'Find Matches')
        )
      );
    }

    return React.createElement(View, null,
      React.createElement(Text, { style: styles.sectionTitle }, 'Suggested Buddies'),
      React.createElement(Text, { style: styles.sectionDesc },
        'AI-matched based on your dreams and interests'
      ),
      h.suggestions.map(function (user) {
        var isSent = sent[user.id];
        return React.createElement(View, {
          key: user.id,
          style: styles.suggestionCard,
        },
          // User info row
          React.createElement(View, { style: styles.suggestionHeader },
            user.avatar
              ? React.createElement(Image, {
                  source: { uri: user.avatar },
                  style: styles.suggAvatar,
                })
              : React.createElement(View, {
                  style: [styles.suggAvatarPlaceholder, { backgroundColor: user.color + '25' }],
                },
                  React.createElement(Text, {
                    style: [styles.suggInitial, { color: user.color }],
                  }, user.initial)
                ),
            React.createElement(View, { style: { flex: 1 } },
              React.createElement(Text, { style: styles.suggName }, user.name),
              React.createElement(View, { style: styles.suggMeta },
                React.createElement(Icon, { name: 'zap', size: 11, color: BRAND.yellow }),
                React.createElement(Text, { style: styles.suggMetaText }, 'Lvl ' + user.level),
                user.streak > 0
                  ? React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4 } },
                      React.createElement(View, { style: styles.metaDot }),
                      React.createElement(Text, { style: styles.suggMetaText }, user.streak + '\uD83D\uDD25')
                    )
                  : null
              )
            ),
            user.compatibility > 0
              ? React.createElement(View, { style: styles.compatPill },
                  React.createElement(Text, { style: styles.compatPillText },
                    user.compatibility + '%'
                  )
                )
              : null
          ),
          // Bio
          user.bio
            ? React.createElement(Text, { style: styles.suggBio, numberOfLines: 2 }, user.bio)
            : null,
          // Shared interests
          user.sharedDreams.length > 0
            ? React.createElement(View, { style: styles.sharedRow },
                React.createElement(Icon, { name: 'link', size: 12, color: COLORS.textMuted }),
                React.createElement(Text, { style: styles.sharedText },
                  user.sharedDreams.slice(0, 3).join(', ')
                )
              )
            : null,
          // Request button
          React.createElement(TouchableOpacity, {
            style: [
              styles.requestBtn,
              isSent && styles.requestBtnSent,
            ],
            onPress: function () { if (!isSent) h.sendRequest(user.id); },
            disabled: isSent,
            activeOpacity: 0.8,
            accessible: true, accessibilityRole: 'button', accessibilityLabel: isSent ? 'Buddy request sent to ' + user.name : 'Send buddy request to ' + user.name, accessibilityState: { disabled: isSent },
          },
            isSent
              ? React.createElement(View, { style: styles.requestBtnContent },
                  React.createElement(Icon, { name: 'check', size: 16, color: '#fff' }),
                  React.createElement(Text, { style: styles.requestBtnText }, 'Request Sent')
                )
              : React.createElement(View, { style: styles.requestBtnContent },
                  React.createElement(Icon, { name: 'user-plus', size: 16, color: '#fff' }),
                  React.createElement(Text, { style: styles.requestBtnText }, 'Send Request')
                )
          )
        );
      })
    );
  };

  var sent = h.sent;

  // ─── Error banner ────────────────────────────────────
  var renderError = function () {
    if (!h.error) return null;
    return React.createElement(View, { style: styles.errorBanner },
      React.createElement(Text, { style: styles.errorBannerText }, h.error)
    );
  };

  // ─── Main render ─────────────────────────────────────

  return React.createElement(SafeAreaView, { style: styles.container },
    renderHeader(),
    React.createElement(ScrollView, {
      style: styles.scroll,
      contentContainerStyle: styles.scrollContent,
      showsVerticalScrollIndicator: false,
      refreshControl: React.createElement(RefreshControl, {
        refreshing: false,
        onRefresh: h.refresh,
        tintColor: BRAND.purple,
        colors: [BRAND.purple],
      }),
    },
      renderError(),
      renderInfoCard(),
      renderCurrentBuddy(),
      renderSuggestions()
    )
  );
};

// ─── Styles ─────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info card
  infoCard: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Current buddy
  buddyCard: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.2)',
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 20,
  },
  buddyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  compatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236,72,153,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.2)',
  },
  compatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EC4899',
  },
  buddyProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  buddyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(20,184,166,0.3)',
  },
  buddyAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(20,184,166,0.3)',
  },
  buddyInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#14B8A6',
  },
  buddyName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  buddyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  buddyMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 4,
  },

  // Buddy actions
  buddyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  buddyActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  buddyActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // Encourage
  encourageWrap: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  encourageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  presetRow: {
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  presetChipActive: {
    backgroundColor: BRAND.purple + '20',
    borderColor: BRAND.purple + '40',
  },
  presetText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  presetTextActive: {
    color: COLORS.text,
  },
  encourageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  sendBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnSent: {
    backgroundColor: '#10B981',
  },
  sendBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // Suggestions
  emptyCard: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshMatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND.purple,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    marginTop: 8,
  },
  refreshMatchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Suggestion cards
  suggestionCard: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  suggAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  suggAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  suggName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  suggMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  suggMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  compatPill: {
    backgroundColor: 'rgba(236,72,153,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.2)',
  },
  compatPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EC4899',
  },
  suggBio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sharedText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  requestBtn: {
    backgroundColor: BRAND.purple,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBtnSent: {
    backgroundColor: '#10B981',
  },
  requestBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Error
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: BRAND.purple,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#EF4444',
  },
});

module.exports = FindBuddyScreen;
