/**
 * TimeBlockScreen — List, create, edit, delete time blocks.
 * Cards with color strips, time ranges, dream association. Add/edit modal.
 */
var React = require('react');
var {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  StyleSheet, ActivityIndicator, FlatList,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useTimeBlocksScreen = require('./useTimeBlocksScreen');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');

var TimeBlockScreen = function () {
  var h = useTimeBlocksScreen();

  var header = React.createElement(View, { style: styles.header },
    React.createElement(TouchableOpacity, {
      style: styles.headerBtn,
      onPress: function () { h.navigation.goBack(); },
      accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back',
    },
      React.createElement(Icon, { name: 'arrow-left', size: 20, color: COLORS.text })
    ),
    React.createElement(Text, { style: styles.headerTitle }, 'Time Blocks'),
    React.createElement(TouchableOpacity, {
      style: styles.addBtn,
      onPress: h.openAddModal,
      accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Add time block',
    },
      React.createElement(Icon, { name: 'plus', size: 20, color: '#fff' })
    )
  );

  // Error state
  if (h.blocksQuery.isError) {
    return React.createElement(SafeAreaView, { style: styles.container },
      header,
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(Text, { style: styles.errorText }, 'Failed to load time blocks'),
        React.createElement(TouchableOpacity, {
          style: styles.retryBtn,
          onPress: function () { h.blocksQuery.refetch(); },
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Retry loading time blocks',
        },
          React.createElement(Text, { style: styles.retryText }, 'Retry')
        )
      )
    );
  }

  // Loading
  if (h.blocksQuery.isLoading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      header,
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent })
      )
    );
  }

  var filteredBlocks = h.timeBlocks.filter(function (b) { return b.title || b.label; });

  // Empty state
  var emptyView = React.createElement(View, { style: styles.emptyWrap },
    React.createElement(View, { style: styles.emptyIconBox },
      React.createElement(Icon, { name: 'clock', size: 32, color: COLORS.textMuted })
    ),
    React.createElement(Text, { style: styles.emptyTitle }, 'No time blocks yet'),
    React.createElement(Text, { style: styles.emptyDesc }, 'Create time blocks to organize your day'),
    React.createElement(TouchableOpacity, { style: styles.emptyBtn, onPress: h.openAddModal, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Add time block' },
      React.createElement(Icon, { name: 'plus', size: 16, color: '#fff' }),
      React.createElement(Text, { style: styles.emptyBtnText }, ' Add Time Block')
    )
  );

  // Block card
  var renderBlock = function (block, index) {
    var blockColor = block.color || '#8B5CF6';
    var dreamTitle = block.dreamTitle || block.dream || '';
    if (typeof dreamTitle === 'object' && dreamTitle.title) dreamTitle = dreamTitle.title;

    return React.createElement(View, { key: block.id, style: styles.blockCard },
      // Color strip
      React.createElement(View, { style: [styles.colorStrip, { backgroundColor: blockColor }] }),
      // Content
      React.createElement(View, { style: styles.blockContent },
        React.createElement(View, { style: styles.blockTopRow },
          React.createElement(View, { style: { flex: 1 } },
            React.createElement(Text, { style: styles.blockTitle }, block.title || block.label),
            React.createElement(View, { style: styles.timeRow },
              React.createElement(Icon, { name: 'clock', size: 13, color: blockColor }),
              React.createElement(Text, { style: styles.timeText },
                h.formatTimeDisplay(block.startTime) + ' - ' + h.formatTimeDisplay(block.endTime)
              )
            ),
            // Block type + day of week badges
            React.createElement(View, { style: { flexDirection: 'row', gap: 6, marginTop: 4 } },
              (block.blockType || block.block_type)
                ? React.createElement(View, {
                    style: [styles.dreamBadge, { backgroundColor: blockColor + '15', borderColor: blockColor + '25' }],
                  },
                    React.createElement(Icon, { name: 'tag', size: 10, color: blockColor }),
                    React.createElement(Text, { style: [styles.dreamBadgeText, { color: blockColor }] },
                      (block.blockType || block.block_type || '').charAt(0).toUpperCase() +
                      (block.blockType || block.block_type || '').slice(1)
                    )
                  )
                : null,
              (block.dayOfWeek != null || block.day_of_week != null)
                ? React.createElement(View, {
                    style: [styles.dreamBadge, { backgroundColor: blockColor + '15', borderColor: blockColor + '25' }],
                  },
                    React.createElement(Icon, { name: 'calendar', size: 10, color: blockColor }),
                    React.createElement(Text, { style: [styles.dreamBadgeText, { color: blockColor }] },
                      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][
                        block.dayOfWeek != null ? block.dayOfWeek : block.day_of_week
                      ] || ''
                    )
                  )
                : null
            ),
            dreamTitle
              ? React.createElement(View, {
                  style: [styles.dreamBadge, { backgroundColor: blockColor + '15', borderColor: blockColor + '25' }],
                },
                  React.createElement(Icon, { name: 'target', size: 10, color: blockColor }),
                  React.createElement(Text, { style: [styles.dreamBadgeText, { color: blockColor }] }, dreamTitle)
                )
              : null
          ),
          // Actions
          React.createElement(View, { style: styles.blockActions },
            React.createElement(TouchableOpacity, {
              style: styles.editBtn,
              onPress: function () { h.openEditModal(block); },
              accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Edit ' + (block.title || block.label || 'time block'),
            },
              React.createElement(Icon, { name: 'edit-3', size: 13, color: COLORS.textSecondary })
            ),
            React.createElement(TouchableOpacity, {
              style: styles.deleteBtn,
              onPress: function () { h.setConfirmDelete(block.id); },
              accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Delete ' + (block.title || block.label || 'time block'),
            },
              React.createElement(Icon, { name: 'trash-2', size: 13, color: 'rgba(239,68,68,0.7)' })
            )
          )
        ),
        // Delete confirmation
        h.confirmDelete === block.id
          ? React.createElement(View, { style: styles.confirmRow },
              React.createElement(Text, { style: styles.confirmText }, 'Delete this block?'),
              React.createElement(View, { style: { flexDirection: 'row', gap: 6 } },
                React.createElement(TouchableOpacity, {
                  style: styles.confirmNo,
                  onPress: function () { h.setConfirmDelete(null); },
                  accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel delete',
                },
                  React.createElement(Text, { style: styles.confirmNoText }, 'No')
                ),
                React.createElement(TouchableOpacity, {
                  style: styles.confirmYes,
                  onPress: function () { h.handleDelete(block.id); },
                  disabled: h.deleteMut.isPending,
                  accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Confirm delete', accessibilityState: { disabled: h.deleteMut.isPending },
                },
                  React.createElement(Text, { style: styles.confirmYesText },
                    h.deleteMut.isPending ? '...' : 'Yes'
                  )
                )
              )
            )
          : null
      )
    );
  };

  // Add/Edit Modal
  var modal = React.createElement(Modal, {
    visible: h.showModal,
    transparent: true,
    animationType: 'slide',
    onRequestClose: h.resetFormAndClose,
  },
    React.createElement(View, { style: styles.modalOverlay },
      React.createElement(View, { style: styles.modalContent },
        React.createElement(View, { style: styles.modalHeader },
          React.createElement(Text, { style: styles.modalTitle },
            h.editingBlock ? 'Edit Time Block' : 'New Time Block'
          ),
          React.createElement(TouchableOpacity, { onPress: h.resetFormAndClose, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Close modal' },
            React.createElement(Icon, { name: 'x', size: 20, color: COLORS.textMuted })
          )
        ),
        // Title
        React.createElement(Text, { style: styles.formLabel }, 'Title'),
        React.createElement(TextInput, {
          style: styles.formInput,
          value: h.formTitle,
          onChangeText: h.setFormTitle,
          placeholder: 'e.g. Deep Work',
          placeholderTextColor: COLORS.textMuted,
          accessible: true, accessibilityLabel: 'Time block title',
        }),
        // Block Type
        React.createElement(Text, { style: styles.formLabel }, 'Block Type'),
        React.createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginBottom: 14 } },
          h.BLOCK_TYPE_OPTIONS.map(function (opt) {
            var active = h.formBlockType === opt.value;
            return React.createElement(TouchableOpacity, {
              key: opt.value,
              style: [styles.dreamPick, active && styles.dreamPickActive],
              onPress: function () { h.setFormBlockType(opt.value); },
              accessible: true, accessibilityRole: 'radio', accessibilityLabel: opt.value + ' block type', accessibilityState: { selected: active },
            },
              React.createElement(Text, {
                style: [styles.dreamPickText, active && { color: COLORS.accent }],
              }, opt.value.charAt(0).toUpperCase() + opt.value.slice(1))
            );
          })
        ),
        // Day of Week
        React.createElement(Text, { style: styles.formLabel }, 'Day of Week'),
        React.createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginBottom: 14 } },
          h.DAY_OF_WEEK_OPTIONS.map(function (opt) {
            var active = h.formDayOfWeek === opt.value;
            var dayLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][opt.value] || '';
            return React.createElement(TouchableOpacity, {
              key: opt.value,
              style: [styles.dreamPick, active && styles.dreamPickActive],
              onPress: function () { h.setFormDayOfWeek(opt.value); },
              accessible: true, accessibilityRole: 'radio', accessibilityLabel: dayLabel + ' day', accessibilityState: { selected: active },
            },
              React.createElement(Text, {
                style: [styles.dreamPickText, active && { color: COLORS.accent }],
              }, dayLabel)
            );
          })
        ),
        // Time row
        React.createElement(View, { style: styles.timeFormRow },
          React.createElement(View, { style: { flex: 1 } },
            React.createElement(Text, { style: styles.formLabel }, 'Start Time'),
            React.createElement(TextInput, {
              style: styles.formInput,
              value: h.formStartTime,
              onChangeText: h.setFormStartTime,
              placeholder: '09:00',
              placeholderTextColor: COLORS.textMuted,
              accessible: true, accessibilityLabel: 'Start time',
            })
          ),
          React.createElement(View, { style: { flex: 1 } },
            React.createElement(Text, { style: styles.formLabel }, 'End Time'),
            React.createElement(TextInput, {
              style: styles.formInput,
              value: h.formEndTime,
              onChangeText: h.setFormEndTime,
              placeholder: '10:00',
              placeholderTextColor: COLORS.textMuted,
              accessible: true, accessibilityLabel: 'End time',
            })
          )
        ),
        // Dream picker placeholder (simple text)
        h.dreams.length > 0
          ? React.createElement(View, null,
              React.createElement(Text, { style: styles.formLabel }, 'Associated Dream'),
              React.createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginBottom: 14 } },
                React.createElement(TouchableOpacity, {
                  style: [styles.dreamPick, !h.formDreamId && styles.dreamPickActive],
                  onPress: function () { h.setFormDreamId(''); },
                  accessible: true, accessibilityRole: 'radio', accessibilityLabel: 'No associated dream', accessibilityState: { selected: !h.formDreamId },
                },
                  React.createElement(Text, {
                    style: [styles.dreamPickText, !h.formDreamId && { color: COLORS.accent }],
                  }, 'None')
                ),
                h.dreams.map(function (dream) {
                  var active = h.formDreamId === String(dream.id);
                  return React.createElement(TouchableOpacity, {
                    key: dream.id,
                    style: [styles.dreamPick, active && styles.dreamPickActive],
                    onPress: function () { h.setFormDreamId(String(dream.id)); },
                    accessible: true, accessibilityRole: 'radio', accessibilityLabel: (dream.title || dream.name) + ' dream', accessibilityState: { selected: active },
                  },
                    React.createElement(Text, {
                      style: [styles.dreamPickText, active && { color: COLORS.accent }],
                      numberOfLines: 1,
                    }, dream.title || dream.name)
                  );
                })
              )
            )
          : null,
        // Color
        React.createElement(View, null,
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 } },
            React.createElement(Icon, { name: 'droplet', size: 13, color: COLORS.textSecondary }),
            React.createElement(Text, { style: styles.formLabel }, 'Color')
          ),
          React.createElement(View, { style: styles.colorRow },
            h.BLOCK_COLOR_KEYS.map(function (c) {
              var isSel = h.formColor === c.value;
              return React.createElement(TouchableOpacity, {
                key: c.value,
                style: [
                  styles.colorDot,
                  { backgroundColor: c.value },
                  isSel && { borderWidth: 2, borderColor: c.value },
                ],
                onPress: function () { h.setFormColor(c.value); },
                accessible: true, accessibilityRole: 'radio', accessibilityLabel: (c.label || 'Color') + ' color', accessibilityState: { selected: isSel },
              },
                isSel ? React.createElement(Icon, { name: 'check', size: 16, color: '#fff' }) : null
              );
            })
          )
        ),
        // Submit
        React.createElement(TouchableOpacity, {
          style: [styles.submitBtn, (h.createMut.isPending || h.updateMut.isPending) && { opacity: 0.6 }],
          onPress: h.handleSubmit,
          disabled: h.createMut.isPending || h.updateMut.isPending,
          activeOpacity: 0.7,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: h.editingBlock ? 'Update time block' : 'Create time block', accessibilityState: { disabled: h.createMut.isPending || h.updateMut.isPending },
        },
          (h.createMut.isPending || h.updateMut.isPending)
            ? React.createElement(ActivityIndicator, { size: 'small', color: '#fff' })
            : React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
                React.createElement(Icon, { name: 'check', size: 16, color: '#fff' }),
                React.createElement(Text, { style: styles.submitBtnText },
                  h.editingBlock ? ' Update Block' : ' Create Block'
                )
              )
        )
      )
    )
  );

  return React.createElement(SafeAreaView, { style: styles.container },
    header,
    filteredBlocks.length === 0
      ? emptyView
      : React.createElement(ScrollView, { contentContainerStyle: styles.scroll },
          filteredBlocks.map(renderBlock)
        ),
    modal
  );
};

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100, gap: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, gap: 8,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  addBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },
  errorText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },
  retryBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: RADIUS.md, backgroundColor: COLORS.accent },
  retryText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: RADIUS.md, backgroundColor: COLORS.accent,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  blockCard: {
    flexDirection: 'row', backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg - 4, borderWidth: 1, borderColor: COLORS.glassBorder, overflow: 'hidden',
  },
  colorStrip: { width: 5 },
  blockContent: { flex: 1, padding: SPACING.lg },
  blockTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  blockTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  timeText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  dreamBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1,
  },
  dreamBadgeText: { fontSize: 11, fontWeight: '500' },
  blockActions: { flexDirection: 'row', gap: 4, marginLeft: 8 },
  editBtn: {
    width: 32, height: 32, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 32, height: 32, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(239,68,68,0.06)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, padding: 10, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(239,68,68,0.06)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
  },
  confirmText: { fontSize: 13, fontWeight: '500', color: 'rgba(239,68,68,0.8)' },
  confirmNo: {
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  confirmNoText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  confirmYes: {
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.8)',
  },
  confirmYesText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bodyBg, borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  formLabel: {
    fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6,
  },
  formInput: {
    backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md - 2, padding: 10, fontSize: 14, color: COLORS.text, marginBottom: 14,
  },
  timeFormRow: { flexDirection: 'row', gap: 10 },
  dreamPick: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
    backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, marginRight: 8,
  },
  dreamPickActive: { backgroundColor: COLORS.accent + '15', borderColor: COLORS.accent + '40' },
  dreamPickText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  colorRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  colorDot: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtn: {
    backgroundColor: COLORS.accent, borderRadius: RADIUS.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

module.exports = TimeBlockScreen;
