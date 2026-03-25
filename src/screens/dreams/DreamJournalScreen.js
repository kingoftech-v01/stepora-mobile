/**
 * DreamJournalScreen — Daily journal entries with mood tracking.
 * List of entries sorted by date, FAB to create, inline mood selector.
 */
var React = require('react');
var {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useDreamJournalScreen = require('./useDreamJournalScreen');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');

var DreamJournalScreen = function () {
  var h = useDreamJournalScreen();

  // ─── Header ──────────────────────────────────────────────────

  var renderHeader = function () {
    return React.createElement(View, { style: styles.header },
      React.createElement(TouchableOpacity, {
        style: styles.headerBtn,
        onPress: function () { h.navigation.goBack(); },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Go back',
        hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
      },
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(Text, { style: styles.headerTitle, accessibilityRole: 'header' }, 'Dream Journal'),
      React.createElement(View, { style: { width: 36 } })
    );
  };

  // ─── Stats summary ──────────────────────────────────────────

  var renderStats = function () {
    var total = h.entries.length;
    var thisWeek = h.entries.filter(function (e) {
      var d = new Date(e.createdAt || e.date);
      return (Date.now() - d.getTime()) < 7 * 86400000;
    }).length;
    var streakDays = 0;
    var today = new Date().toISOString().split('T')[0];
    var checkDate = new Date();
    for (var i = 0; i < 365; i++) {
      var dateStr = checkDate.toISOString().split('T')[0];
      var hasEntry = h.entries.some(function (e) {
        return (e.createdAt || e.date || '').split('T')[0] === dateStr;
      });
      if (hasEntry) {
        streakDays++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    return React.createElement(View, { style: styles.statsRow },
      React.createElement(View, { style: styles.statCard },
        React.createElement(Text, { style: styles.statValue }, String(total)),
        React.createElement(Text, { style: styles.statLabel }, 'Entries')
      ),
      React.createElement(View, { style: styles.statCard },
        React.createElement(Text, { style: styles.statValue }, String(thisWeek)),
        React.createElement(Text, { style: styles.statLabel }, 'This Week')
      ),
      React.createElement(View, { style: styles.statCard },
        React.createElement(Text, { style: [styles.statValue, { color: BRAND.purple }] }, String(streakDays)),
        React.createElement(Text, { style: styles.statLabel }, 'Day Streak')
      )
    );
  };

  // ─── Journal entry card ─────────────────────────────────────

  var renderEntryCard = function (entry) {
    var mood = h.MOOD_OPTIONS.find(function (m) { return m.key === entry.mood; });
    var moodEmoji = mood ? mood.emoji : '\uD83D\uDE42';
    var moodColor = h.MOOD_COLORS[entry.mood] || COLORS.accent;
    var textPreview = entry.content || entry.text || '';
    var time = h.formatTime(entry.createdAt || entry.date);
    var imageUrl = entry.image || entry.imageUrl;

    return React.createElement(TouchableOpacity, {
      key: entry.id,
      style: styles.entryCard,
      onPress: function () { h.openEditEntry(entry); },
      onLongPress: function () { h.handleDelete(entry.id); },
      activeOpacity: 0.7,
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: (mood ? mood.label : 'Neutral') + ' mood, ' + time + (textPreview ? ', ' + textPreview.slice(0, 80) : ''),
      accessibilityHint: 'Tap to edit, long press to delete',
    },
      // Mood indicator
      React.createElement(View, { style: [styles.moodStrip, { backgroundColor: moodColor }] }),
      React.createElement(View, { style: styles.entryContent },
        // Top row: mood + time
        React.createElement(View, { style: styles.entryTopRow },
          React.createElement(View, { style: styles.moodBadge },
            React.createElement(Text, { style: styles.moodEmoji }, moodEmoji),
            React.createElement(Text, { style: [styles.moodLabel, { color: moodColor }] },
              mood ? mood.label : 'Neutral'
            )
          ),
          React.createElement(Text, { style: styles.entryTime }, time)
        ),
        // Text preview
        textPreview
          ? React.createElement(Text, { style: styles.entryText, numberOfLines: 3 }, textPreview)
          : null,
        // Image thumbnail
        imageUrl
          ? React.createElement(Image, {
              source: { uri: imageUrl },
              style: styles.entryImage,
              resizeMode: 'cover',
            })
          : null
      )
    );
  };

  // ─── Date section ───────────────────────────────────────────

  var renderDateSection = function (info) {
    var group = info.item;
    return React.createElement(View, { style: styles.dateSection },
      React.createElement(Text, { style: styles.dateHeader, accessibilityRole: 'header' }, h.formatDate(group.date)),
      group.entries.map(function (entry) {
        return renderEntryCard(entry);
      })
    );
  };

  // ─── New Entry Form Modal ───────────────────────────────────

  var renderFormModal = function () {
    if (!h.showForm) return null;
    var isSaving = h.createMut.isPending || h.updateMut.isPending;
    var isEdit = !!h.editingId;
    var error = h.createMut.isError
      ? (h.createMut.error && (h.createMut.error.userMessage || h.createMut.error.message))
      : h.updateMut.isError
        ? (h.updateMut.error && (h.updateMut.error.userMessage || h.updateMut.error.message))
        : null;

    return React.createElement(Modal, {
      visible: true,
      animationType: 'slide',
      transparent: true,
      onRequestClose: h.resetForm,
    },
      React.createElement(KeyboardAvoidingView, {
        style: styles.formOverlay,
        behavior: Platform.OS === 'ios' ? 'padding' : undefined,
      },
        React.createElement(View, { style: styles.formContent, accessibilityViewIsModal: true },
          // Header
          React.createElement(View, { style: styles.formHeader },
            React.createElement(TouchableOpacity, { onPress: h.resetForm, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel' },
              React.createElement(Text, { style: styles.formCancel }, 'Cancel')
            ),
            React.createElement(Text, { style: styles.formTitle, accessibilityRole: 'header' },
              isEdit ? 'Edit Entry' : 'New Entry'
            ),
            React.createElement(TouchableOpacity, {
              onPress: h.handleSubmit,
              disabled: isSaving,
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Save entry',
              accessibilityState: { disabled: isSaving },
            },
              isSaving
                ? React.createElement(ActivityIndicator, { size: 'small', color: BRAND.purple })
                : React.createElement(Text, { style: styles.formSave }, 'Save')
            )
          ),
          React.createElement(ScrollView, {
            showsVerticalScrollIndicator: false,
            keyboardShouldPersistTaps: 'handled',
          },
            // Mood selector
            React.createElement(Text, { style: styles.formSectionLabel }, 'How are you feeling?'),
            React.createElement(View, { style: styles.moodGrid },
              h.MOOD_OPTIONS.map(function (mood) {
                var isSelected = h.formMood === mood.key;
                var moodColor = h.MOOD_COLORS[mood.key];
                return React.createElement(TouchableOpacity, {
                  key: mood.key,
                  style: [
                    styles.moodOption,
                    isSelected && { backgroundColor: moodColor + '20', borderColor: moodColor + '50' },
                  ],
                  onPress: function () { h.setFormMood(mood.key); },
                  activeOpacity: 0.7,
                  accessible: true,
                  accessibilityRole: 'button',
                  accessibilityLabel: mood.label + (isSelected ? ', selected' : ''),
                  accessibilityState: { selected: isSelected },
                },
                  React.createElement(Text, { style: styles.moodOptionEmoji }, mood.emoji),
                  React.createElement(Text, {
                    style: [
                      styles.moodOptionLabel,
                      isSelected && { color: moodColor, fontWeight: '600' },
                    ],
                  }, mood.label)
                );
              })
            ),
            // Text input
            React.createElement(Text, { style: styles.formSectionLabel }, 'Write your thoughts...'),
            React.createElement(TextInput, {
              style: styles.formTextInput,
              value: h.formText,
              onChangeText: h.setFormText,
              placeholder: 'What\'s on your mind today? How are you progressing toward your dreams?',
              placeholderTextColor: COLORS.textMuted,
              multiline: true,
              textAlignVertical: 'top',
              accessible: true,
              accessibilityLabel: 'Write your thoughts',
            }),
            // Image attachment
            React.createElement(View, { style: styles.attachRow },
              React.createElement(TouchableOpacity, {
                style: styles.attachBtn,
                onPress: h.handlePickImage,
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: 'Add photo',
              },
                React.createElement(Icon, { name: 'image', size: 18, color: COLORS.textMuted }),
                React.createElement(Text, { style: styles.attachText }, 'Add Photo')
              ),
              h.formImageUri
                ? React.createElement(View, { style: styles.attachPreview },
                    React.createElement(Image, {
                      source: { uri: h.formImageUri },
                      style: styles.attachThumb,
                    }),
                    React.createElement(Icon, { name: 'check', size: 12, color: BRAND.greenSolid })
                  )
                : null
            ),
            // Error
            error
              ? React.createElement(Text, { style: styles.formError, accessibilityLiveRegion: 'assertive', accessibilityRole: 'alert' }, error)
              : null
          )
        )
      )
    );
  };

  // ─── Empty state ─────────────────────────────────────────────

  var renderEmpty = function () {
    return React.createElement(View, { style: styles.emptyWrap },
      React.createElement(View, { style: styles.emptyIcon },
        React.createElement(Icon, { name: 'book-open', size: 36, color: COLORS.textMuted })
      ),
      React.createElement(Text, { style: styles.emptyTitle }, 'Start Your Journal'),
      React.createElement(Text, { style: styles.emptyDesc },
        'Record your daily thoughts, track your mood, and reflect on your dream journey.'
      ),
      React.createElement(TouchableOpacity, {
        style: styles.emptyBtn,
        onPress: h.openNewEntry,
        activeOpacity: 0.8,
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Write your first journal entry',
      },
        React.createElement(Icon, { name: 'edit-3', size: 18, color: '#fff' }),
        React.createElement(Text, { style: styles.emptyBtnText }, 'Write First Entry')
      )
    );
  };

  // ─── Loading / Error ─────────────────────────────────────────

  if (h.journalQuery.isLoading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent })
      )
    );
  }

  if (h.journalQuery.isError) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(Text, { style: { color: COLORS.red, fontSize: 14, marginBottom: 12 } },
          'Failed to load journal'
        ),
        React.createElement(TouchableOpacity, {
          style: styles.retryBtn,
          onPress: h.journalQuery.refetch,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Retry loading journal',
        },
          React.createElement(Text, { style: styles.retryText }, 'Retry')
        )
      )
    );
  }

  // ─── Main render ─────────────────────────────────────────────

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(FlatList, {
      data: h.groupedEntries,
      keyExtractor: function (item) { return item.date; },
      renderItem: renderDateSection,
      ListHeaderComponent: React.createElement(View, null,
        renderHeader(),
        h.entries.length > 0 ? renderStats() : null
      ),
      ListEmptyComponent: renderEmpty,
      contentContainerStyle: styles.listContent,
      showsVerticalScrollIndicator: false,
    }),
    // FAB
    h.entries.length > 0
      ? React.createElement(TouchableOpacity, {
          style: styles.fab,
          onPress: h.openNewEntry,
          activeOpacity: 0.8,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Write new journal entry',
        },
          React.createElement(Icon, { name: 'edit-3', size: 22, color: '#fff' })
        )
      : null,
    renderFormModal()
  );
};

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Date section
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Entry card
  entryCard: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 10,
  },
  moodStrip: {
    height: 3,
  },
  entryContent: {
    padding: 14,
  },
  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  entryTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  entryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  entryImage: {
    width: '100%',
    height: 120,
    borderRadius: RADIUS.sm,
    marginTop: 10,
  },

  // Form modal
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  formContent: {
    backgroundColor: COLORS.bodyBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  formCancel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  formSave: {
    fontSize: 14,
    color: BRAND.purple,
    fontWeight: '700',
  },
  formSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },

  // Mood grid
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  moodOption: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    minWidth: 72,
  },
  moodOptionEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodOptionLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Text input
  formTextInput: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 120,
    lineHeight: 21,
    marginBottom: 16,
  },

  // Attach
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  attachText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  attachPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },

  // Form error
  formError: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: 8,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.purple,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  // Center
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Retry
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

module.exports = DreamJournalScreen;
