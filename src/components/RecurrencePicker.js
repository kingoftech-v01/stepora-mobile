/**
 * RecurrencePicker — React Native component for selecting task recurrence.
 * Supports: none, daily, weekly, monthly, custom days.
 * Glass morphism dark purple theme.
 */
var React = require('react');
var { useState } = require('react');
var {
  View, Text, TouchableOpacity, StyleSheet, Modal, Platform,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS } = require('../theme/tokens');
var { BRAND } = require('../styles/colors');

var RECURRENCE_TYPES = [
  { id: 'none', label: 'No repeat', labelKey: 'recurrence.none' },
  { id: 'daily', label: 'Daily', labelKey: 'recurrence.daily' },
  { id: 'weekly', label: 'Weekly', labelKey: 'recurrence.weekly' },
  { id: 'monthly', label: 'Monthly', labelKey: 'recurrence.monthly' },
  { id: 'custom', label: 'Custom days', labelKey: 'recurrence.custom' },
];

var WEEK_DAYS = [
  { id: 'mon', label: 'Mon', labelKey: 'recurrence.dayMon' },
  { id: 'tue', label: 'Tue', labelKey: 'recurrence.dayTue' },
  { id: 'wed', label: 'Wed', labelKey: 'recurrence.dayWed' },
  { id: 'thu', label: 'Thu', labelKey: 'recurrence.dayThu' },
  { id: 'fri', label: 'Fri', labelKey: 'recurrence.dayFri' },
  { id: 'sat', label: 'Sat', labelKey: 'recurrence.daySat' },
  { id: 'sun', label: 'Sun', labelKey: 'recurrence.daySun' },
];

var RecurrencePicker = function (props) {
  var recurrenceType = props.recurrenceType || 'none';
  var recurrenceDays = props.recurrenceDays || [];
  var recurrenceEndDate = props.recurrenceEndDate || null;
  var onRecurrenceTypeChange = props.onRecurrenceTypeChange;
  var onRecurrenceDaysChange = props.onRecurrenceDaysChange;
  var onRecurrenceEndDateChange = props.onRecurrenceEndDateChange;
  var t = props.t;

  var [sheetOpen, setSheetOpen] = useState(false);

  var selectedType = RECURRENCE_TYPES.find(function (rt) {
    return rt.id === recurrenceType;
  }) || RECURRENCE_TYPES[0];

  var isActive = recurrenceType && recurrenceType !== 'none';
  var showDayPicker = recurrenceType === 'weekly' || recurrenceType === 'custom';

  function getLabel(key, fallback) {
    if (t) {
      var val = t(key);
      return val && val !== key ? val : fallback;
    }
    return fallback;
  }

  function handleTypeSelect(typeId) {
    onRecurrenceTypeChange(typeId);
    setSheetOpen(false);
    if (typeId === 'none') {
      onRecurrenceDaysChange([]);
      if (onRecurrenceEndDateChange) onRecurrenceEndDateChange(null);
    }
    if ((typeId === 'weekly' || typeId === 'custom') && recurrenceDays.length === 0) {
      onRecurrenceDaysChange([]);
    }
  }

  function handleDayToggle(dayId) {
    var current = recurrenceDays || [];
    var idx = current.indexOf(dayId);
    if (idx >= 0) {
      onRecurrenceDaysChange(current.filter(function (d) { return d !== dayId; }));
    } else {
      onRecurrenceDaysChange(current.concat([dayId]));
    }
  }

  // Label row
  var labelRow = React.createElement(View, { style: styles.labelRow },
    React.createElement(Icon, { name: 'repeat', size: 14, color: BRAND.purpleLight }),
    React.createElement(Text, { style: styles.labelText },
      getLabel('recurrence.label', 'Recurrence')
    ),
    isActive
      ? React.createElement(View, { style: styles.activeBadge },
          React.createElement(Text, { style: styles.activeBadgeText },
            getLabel(selectedType.labelKey, selectedType.label)
          )
        )
      : null
  );

  // Type selector button
  var typeButton = React.createElement(TouchableOpacity, {
    style: [styles.typeButton, isActive && styles.typeButtonActive],
    onPress: function () { setSheetOpen(true); },
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: 'Select recurrence type: ' + selectedType.label,
  },
    React.createElement(Text, {
      style: [styles.typeButtonText, isActive && styles.typeButtonTextActive],
    }, getLabel(selectedType.labelKey, selectedType.label)),
    React.createElement(Icon, {
      name: 'chevron-down',
      size: 14,
      color: isActive ? BRAND.purpleLight : COLORS.textMuted,
    })
  );

  // Bottom sheet modal for type selection
  var bottomSheet = React.createElement(Modal, {
    visible: sheetOpen,
    transparent: true,
    animationType: 'slide',
    onRequestClose: function () { setSheetOpen(false); },
  },
    React.createElement(TouchableOpacity, {
      style: styles.sheetOverlay,
      activeOpacity: 1,
      onPress: function () { setSheetOpen(false); },
    },
      React.createElement(View, { style: styles.sheetContainer },
        React.createElement(View, { style: styles.sheetHandle }),
        React.createElement(Text, { style: styles.sheetTitle },
          getLabel('recurrence.label', 'Recurrence')
        ),
        RECURRENCE_TYPES.map(function (rt) {
          var isSel = rt.id === recurrenceType;
          return React.createElement(TouchableOpacity, {
            key: rt.id,
            style: [styles.sheetItem, isSel && styles.sheetItemActive],
            onPress: function () { handleTypeSelect(rt.id); },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityState: { selected: isSel },
          },
            React.createElement(Text, {
              style: [styles.sheetItemText, isSel && styles.sheetItemTextActive],
            }, getLabel(rt.labelKey, rt.label)),
            isSel
              ? React.createElement(Icon, { name: 'check', size: 16, color: BRAND.purpleLight })
              : null
          );
        })
      )
    )
  );

  // Day chips for weekly/custom
  var dayPicker = showDayPicker
    ? React.createElement(View, { style: styles.dayPickerContainer },
        React.createElement(Text, { style: styles.dayPickerLabel },
          getLabel('recurrence.selectDays', 'Select days')
        ),
        React.createElement(View, { style: styles.dayChipsRow },
          WEEK_DAYS.map(function (day) {
            var isSelected = recurrenceDays.indexOf(day.id) >= 0;
            return React.createElement(TouchableOpacity, {
              key: day.id,
              style: [styles.dayChip, isSelected && styles.dayChipActive],
              onPress: function () { handleDayToggle(day.id); },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: day.label + (isSelected ? ', selected' : ''),
              accessibilityState: { selected: isSelected },
            },
              React.createElement(Text, {
                style: [styles.dayChipText, isSelected && styles.dayChipTextActive],
              }, getLabel(day.labelKey, day.label))
            );
          })
        )
      )
    : null;

  return React.createElement(View, { style: [styles.container, props.style] },
    labelRow,
    typeButton,
    dayPicker,
    bottomSheet
  );
};

var styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: BRAND.purpleLight,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  typeButtonActive: {
    borderColor: 'rgba(139,92,246,0.35)',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  typeButtonTextActive: {
    color: BRAND.purpleLight,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    backgroundColor: '#1A1030',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    marginBottom: 4,
  },
  sheetItemActive: {
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  sheetItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  sheetItemTextActive: {
    fontWeight: '600',
    color: BRAND.purpleLight,
  },
  dayPickerContainer: {
    gap: 8,
  },
  dayPickerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    width: 42,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  dayChipActive: {
    backgroundColor: BRAND.purple,
    borderColor: 'rgba(139,92,246,0.5)',
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayChipTextActive: {
    color: '#fff',
  },
});

module.exports = RecurrencePicker;
