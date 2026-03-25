/**
 * TimeBlockTemplatesScreen — Browse preset and user templates, apply/delete/save.
 * Template cards with block type badges, day dots, and action buttons.
 */
var React = require('react');
var {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useTimeBlockTemplatesScreen = require('./useTimeBlockTemplatesScreen');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');

// Block summary sub-component
var BlockSummary = function (props) {
  var blocks = props.blocks;
  var h = props.h;
  if (!blocks || !blocks.length) return null;

  var byDay = {};
  for (var b = 0; b < blocks.length; b++) {
    var dow = blocks[b].day_of_week;
    if (!byDay[dow]) byDay[dow] = [];
    byDay[dow].push(blocks[b]);
  }
  var typeCounts = {};
  for (var t = 0; t < blocks.length; t++) {
    var bt = blocks[t].block_type;
    typeCounts[bt] = (typeCounts[bt] || 0) + 1;
  }

  return React.createElement(View, { style: bsStyles.wrap },
    // Type badges
    React.createElement(View, { style: bsStyles.badgeRow },
      Object.keys(typeCounts).map(function (type) {
        var meta = h.BLOCK_TYPE_META[type] || h.BLOCK_TYPE_META.blocked;
        return React.createElement(View, {
          key: type,
          style: [bsStyles.badge, { backgroundColor: meta.color + '15', borderColor: meta.color + '25' }],
        },
          React.createElement(Icon, { name: meta.icon, size: 10, color: meta.color }),
          React.createElement(Text, { style: [bsStyles.badgeText, { color: meta.color }] },
            meta.label + ' x' + typeCounts[type]
          )
        );
      })
    ),
    // Day dots
    React.createElement(View, { style: bsStyles.dayRow },
      h.DAY_NAMES.map(function (name, idx) {
        var hasBlocks = !!byDay[idx];
        return React.createElement(View, {
          key: idx,
          style: [
            bsStyles.dayDot,
            hasBlocks && { backgroundColor: BRAND.purple + '20', borderColor: BRAND.purple + '40' },
          ],
        },
          React.createElement(Text, {
            style: [bsStyles.dayText, hasBlocks && { color: BRAND.purple }],
          }, name.charAt(0))
        );
      })
    )
  );
};

var bsStyles = StyleSheet.create({
  wrap: { marginTop: 10, gap: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  dayRow: { flexDirection: 'row', gap: 4 },
  dayDot: {
    width: 28, height: 28, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  dayText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
});

// Template card
var TemplateCard = function (props) {
  var template = props.template;
  var h = props.h;
  var isPreset = template.is_preset;
  var blockCount = template.block_count || (template.blocks ? template.blocks.length : 0);

  return React.createElement(View, { style: tcStyles.card },
    React.createElement(View, { style: tcStyles.inner },
      React.createElement(View, { style: tcStyles.topRow },
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(View, { style: tcStyles.nameRow },
            isPreset
              ? React.createElement(View, { style: tcStyles.presetBadge },
                  React.createElement(Icon, { name: 'zap', size: 9, color: BRAND.purple }),
                  React.createElement(Text, { style: tcStyles.presetText }, 'PRESET')
                )
              : null,
            React.createElement(Text, { style: tcStyles.name }, template.name)
          ),
          template.description
            ? React.createElement(Text, { style: tcStyles.desc, numberOfLines: 2 }, template.description)
            : null,
          React.createElement(View, { style: tcStyles.countRow },
            React.createElement(Icon, { name: 'clock', size: 12, color: COLORS.textMuted }),
            React.createElement(Text, { style: tcStyles.countText },
              blockCount + ' block' + (blockCount !== 1 ? 's' : '')
            )
          )
        ),
        React.createElement(View, { style: tcStyles.actions },
          React.createElement(TouchableOpacity, {
            style: tcStyles.applyBtn,
            onPress: function () { h.setShowApplyConfirm(template); },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Apply template ' + template.name, accessibilityHint: 'Replaces current time blocks with this template',
          },
            React.createElement(Icon, { name: 'play', size: 14, color: BRAND.purple })
          ),
          !isPreset
            ? React.createElement(TouchableOpacity, {
                style: tcStyles.delBtn,
                onPress: function () { h.setShowDeleteConfirm(template); },
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Delete template ' + template.name,
              },
                React.createElement(Icon, { name: 'trash-2', size: 13, color: 'rgba(239,68,68,0.7)' })
              )
            : null
        )
      ),
      React.createElement(BlockSummary, { blocks: template.blocks, h: h })
    )
  );
};

var tcStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder, overflow: 'hidden', marginBottom: 10,
  },
  inner: { padding: SPACING.lg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  presetBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6,
    backgroundColor: BRAND.purple + '20', borderWidth: 1, borderColor: BRAND.purple + '30',
  },
  presetText: { fontSize: 10, fontWeight: '700', color: BRAND.purple, letterSpacing: 0.3 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  desc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, marginBottom: 2 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  countText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  actions: { flexDirection: 'row', gap: 4, marginLeft: 8 },
  applyBtn: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    backgroundColor: BRAND.purple + '12', borderWidth: 1, borderColor: BRAND.purple + '25',
    alignItems: 'center', justifyContent: 'center',
  },
  delBtn: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(239,68,68,0.06)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
});

// Main screen
var TimeBlockTemplatesScreen = function () {
  var h = useTimeBlockTemplatesScreen();

  var header = React.createElement(View, { style: styles.header },
    React.createElement(TouchableOpacity, {
      style: styles.headerBtn,
      onPress: function () { h.navigation.goBack(); },
      accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back',
    },
      React.createElement(Icon, { name: 'arrow-left', size: 20, color: COLORS.text })
    ),
    React.createElement(Text, { style: styles.headerTitle }, 'Templates'),
    React.createElement(TouchableOpacity, {
      style: styles.saveHeaderBtn,
      onPress: function () { h.setShowSaveModal(true); },
      accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Save current schedule as template',
    },
      React.createElement(Icon, { name: 'save', size: 18, color: COLORS.accent })
    )
  );

  // Error
  if (h.templatesQuery.isError) {
    return React.createElement(SafeAreaView, { style: styles.container },
      header,
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(Text, { style: styles.errorText }, 'Failed to load templates'),
        React.createElement(TouchableOpacity, {
          style: styles.retryBtn,
          onPress: function () { h.templatesQuery.refetch(); },
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Retry loading templates',
        },
          React.createElement(Text, { style: styles.retryBtnText }, 'Retry')
        )
      )
    );
  }

  // Loading
  if (h.templatesQuery.isLoading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      header,
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent })
      )
    );
  }

  // Apply confirmation modal
  var applyModal = React.createElement(Modal, {
    visible: !!h.showApplyConfirm,
    transparent: true,
    animationType: 'fade',
    onRequestClose: function () { h.setShowApplyConfirm(null); },
  },
    React.createElement(View, { style: styles.modalOverlay },
      React.createElement(View, { style: styles.modalContent },
        React.createElement(Text, { style: styles.modalTitle }, 'Apply Template'),
        React.createElement(Text, { style: styles.modalDesc },
          'Are you sure you want to apply "' +
          (h.showApplyConfirm ? h.showApplyConfirm.name : '') + '"?'
        ),
        React.createElement(View, { style: styles.warningBox },
          React.createElement(Text, { style: styles.warningText },
            'This will replace all your current time blocks with the template pattern.'
          )
        ),
        React.createElement(View, { style: styles.modalBtns },
          React.createElement(TouchableOpacity, {
            style: styles.cancelBtn,
            onPress: function () { h.setShowApplyConfirm(null); },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel',
          },
            React.createElement(Text, { style: styles.cancelBtnText }, 'Cancel')
          ),
          React.createElement(TouchableOpacity, {
            style: [styles.applyConfirmBtn, h.applyMut.isPending && { opacity: 0.7 }],
            onPress: function () { if (h.showApplyConfirm) h.applyMut.mutate(h.showApplyConfirm.id); },
            disabled: h.applyMut.isPending,
            accessible: true, accessibilityRole: 'button', accessibilityLabel: h.applyMut.isPending ? 'Applying template' : 'Apply template', accessibilityState: { disabled: h.applyMut.isPending },
          },
            React.createElement(Text, { style: styles.applyConfirmText },
              h.applyMut.isPending ? 'Applying...' : 'Apply'
            )
          )
        )
      )
    )
  );

  // Delete confirmation modal
  var deleteModal = React.createElement(Modal, {
    visible: !!h.showDeleteConfirm,
    transparent: true,
    animationType: 'fade',
    onRequestClose: function () { h.setShowDeleteConfirm(null); },
  },
    React.createElement(View, { style: styles.modalOverlay },
      React.createElement(View, { style: styles.modalContent },
        React.createElement(Text, { style: styles.modalTitle }, 'Delete Template'),
        React.createElement(Text, { style: styles.modalDesc },
          'Delete "' + (h.showDeleteConfirm ? h.showDeleteConfirm.name : '') +
          '"? This cannot be undone.'
        ),
        React.createElement(View, { style: styles.modalBtns },
          React.createElement(TouchableOpacity, {
            style: styles.cancelBtn,
            onPress: function () { h.setShowDeleteConfirm(null); },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel',
          },
            React.createElement(Text, { style: styles.cancelBtnText }, 'Cancel')
          ),
          React.createElement(TouchableOpacity, {
            style: [styles.deletConfirmBtn, h.deleteMut.isPending && { opacity: 0.7 }],
            onPress: function () { if (h.showDeleteConfirm) h.deleteMut.mutate(h.showDeleteConfirm.id); },
            disabled: h.deleteMut.isPending,
            accessible: true, accessibilityRole: 'button', accessibilityLabel: h.deleteMut.isPending ? 'Deleting template' : 'Delete template', accessibilityState: { disabled: h.deleteMut.isPending },
          },
            React.createElement(Text, { style: styles.deletConfirmText },
              h.deleteMut.isPending ? 'Deleting...' : 'Delete'
            )
          )
        )
      )
    )
  );

  // Save modal
  var saveModal = React.createElement(Modal, {
    visible: h.showSaveModal,
    transparent: true,
    animationType: 'slide',
    onRequestClose: h.closeSaveModal,
  },
    React.createElement(View, { style: styles.modalOverlay },
      React.createElement(View, { style: styles.modalContent },
        React.createElement(View, { style: styles.saveHeader },
          React.createElement(Text, { style: styles.modalTitle }, 'Save Schedule'),
          React.createElement(TouchableOpacity, { onPress: h.closeSaveModal, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Close save modal' },
            React.createElement(Icon, { name: 'x', size: 20, color: COLORS.textMuted })
          )
        ),
        React.createElement(Text, { style: styles.saveHint },
          'Save your current active time blocks as a reusable template.'
        ),
        React.createElement(Text, { style: styles.formLabel }, 'Template Name'),
        React.createElement(TextInput, {
          style: styles.formInput,
          value: h.saveName,
          onChangeText: h.setSaveName,
          placeholder: 'e.g. Productive Weekday',
          placeholderTextColor: COLORS.textMuted,
          accessible: true, accessibilityLabel: 'Template name',
        }),
        React.createElement(Text, { style: styles.formLabel }, 'Description (optional)'),
        React.createElement(TextInput, {
          style: styles.formInput,
          value: h.saveDescription,
          onChangeText: h.setSaveDescription,
          placeholder: 'Briefly describe this schedule...',
          placeholderTextColor: COLORS.textMuted,
          accessible: true, accessibilityLabel: 'Template description',
        }),
        React.createElement(TouchableOpacity, {
          style: [styles.saveConfirmBtn, h.saveMut.isPending && { opacity: 0.7 }],
          onPress: h.handleSave,
          disabled: h.saveMut.isPending,
          activeOpacity: 0.7,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: h.saveMut.isPending ? 'Saving template' : 'Save template', accessibilityState: { disabled: h.saveMut.isPending },
        },
          h.saveMut.isPending
            ? React.createElement(ActivityIndicator, { size: 'small', color: '#fff' })
            : React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
                React.createElement(Icon, { name: 'save', size: 16, color: '#fff' }),
                React.createElement(Text, { style: styles.saveConfirmText }, ' Save Template')
              )
        )
      )
    )
  );

  return React.createElement(SafeAreaView, { style: styles.container },
    header,
    React.createElement(ScrollView, { contentContainerStyle: styles.scroll },
      // Presets
      h.presets.length > 0
        ? React.createElement(View, null,
            React.createElement(View, { style: styles.sectionRow },
              React.createElement(Icon, { name: 'zap', size: 14, color: BRAND.purple }),
              React.createElement(Text, { style: styles.sectionLabel }, 'PRESET TEMPLATES')
            ),
            h.presets.map(function (template) {
              return React.createElement(TemplateCard, { key: template.id, template: template, h: h });
            })
          )
        : null,
      // User templates
      React.createElement(View, null,
        React.createElement(View, { style: [styles.sectionRow, { marginTop: h.presets.length > 0 ? 12 : 4 }] },
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 } },
            React.createElement(Icon, { name: 'copy', size: 14, color: COLORS.accent }),
            React.createElement(Text, { style: styles.sectionLabel }, 'MY TEMPLATES')
          ),
          React.createElement(Text, { style: styles.savedCount }, h.userTemplates.length + ' saved')
        ),
        h.userTemplates.length > 0
          ? h.userTemplates.map(function (template) {
              return React.createElement(TemplateCard, { key: template.id, template: template, h: h });
            })
          : React.createElement(View, { style: styles.emptyWrap },
              React.createElement(View, { style: styles.emptyIcon },
                React.createElement(Icon, { name: 'copy', size: 28, color: COLORS.textMuted })
              ),
              React.createElement(Text, { style: styles.emptyTitle }, 'No saved templates yet'),
              React.createElement(Text, { style: styles.emptyDesc },
                'Save your current time blocks as a template to quickly reapply them later'
              ),
              React.createElement(TouchableOpacity, {
                style: styles.saveScheduleBtn,
                onPress: function () { h.setShowSaveModal(true); },
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Save current schedule as template',
              },
                React.createElement(Icon, { name: 'save', size: 16, color: '#fff' }),
                React.createElement(Text, { style: styles.saveScheduleText }, ' Save Current Schedule')
              )
            )
      )
    ),
    applyModal,
    deleteModal,
    saveModal
  );
};

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, gap: 8,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  saveHeaderBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center',
  },
  errorText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },
  retryBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: RADIUS.md, backgroundColor: COLORS.accent },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 8, marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 0.3, textTransform: 'uppercase',
  },
  savedCount: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  emptyDesc: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 18 },
  saveScheduleBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: RADIUS.md,
    backgroundColor: BRAND.purple,
  },
  saveScheduleText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    width: '100%', maxWidth: 380,
    backgroundColor: COLORS.bodyBg, borderRadius: RADIUS.xl, padding: SPACING.xl,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 8 },
  warningBox: {
    padding: 10, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    marginBottom: 20,
  },
  warningText: { fontSize: 12, color: 'rgba(245,158,11,0.9)', lineHeight: 18 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 11, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  applyConfirmBtn: {
    flex: 1, paddingVertical: 11, borderRadius: RADIUS.md,
    backgroundColor: BRAND.purple, alignItems: 'center',
  },
  applyConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  deletConfirmBtn: {
    flex: 1, paddingVertical: 11, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(239,68,68,0.85)', alignItems: 'center',
  },
  deletConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  saveHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  saveHint: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 16 },
  formLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  formInput: {
    backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md - 2, padding: 10, fontSize: 14, color: COLORS.text, marginBottom: 14,
  },
  saveConfirmBtn: {
    backgroundColor: BRAND.purple, borderRadius: RADIUS.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  saveConfirmText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

module.exports = TimeBlockTemplatesScreen;
