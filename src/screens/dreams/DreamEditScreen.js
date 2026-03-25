/**
 * DreamEditScreen — Edit an existing dream's title, description, category, and target date.
 */
var React = require('react');
var { useState, useEffect } = require('react');
var {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQuery, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPatch } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { catSolid, BRAND } = require('../../styles/colors');

var CATEGORIES = [
  { id: 'career', label: 'Career', icon: 'briefcase', color: catSolid('career') },
  { id: 'health', label: 'Health', icon: 'heart', color: catSolid('health') },
  { id: 'finance', label: 'Finance', icon: 'dollar-sign', color: catSolid('finance') },
  { id: 'hobbies', label: 'Hobbies', icon: 'edit-3', color: catSolid('hobbies') },
  { id: 'personal', label: 'Growth', icon: 'trending-up', color: catSolid('personal') },
  { id: 'relationships', label: 'Social', icon: 'users', color: catSolid('relationships') },
];

var DreamEditScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var id = route.params && route.params.id;
  var queryClient = useQueryClient();

  var dreamQuery = useQuery({
    queryKey: ['dream', id],
    queryFn: function () { return apiGet(DREAMS.DETAIL(id)); },
    enabled: !!id,
  });

  var [title, setTitle] = useState('');
  var [description, setDescription] = useState('');
  var [category, setCategory] = useState(null);
  var [targetDate, setTargetDate] = useState('');
  var [saving, setSaving] = useState(false);
  var [initialized, setInitialized] = useState(false);

  useEffect(function () {
    if (dreamQuery.data && !initialized) {
      setTitle(dreamQuery.data.title || '');
      setDescription(dreamQuery.data.description || '');
      setCategory(dreamQuery.data.category || null);
      setTargetDate(dreamQuery.data.targetDate || '');
      setInitialized(true);
    }
  }, [dreamQuery.data, initialized]);

  var handleSave = function () {
    if (saving || !title.trim()) return;
    setSaving(true);
    apiPatch(DREAMS.DETAIL(id), {
      title: title.trim(),
      description: description.trim(),
      category: category,
      target_date: targetDate || null,
    })
      .then(function () {
        setSaving(false);
        queryClient.invalidateQueries({ queryKey: ['dream', id] });
        queryClient.invalidateQueries({ queryKey: ['dreams'] });
        navigation.goBack();
      })
      .catch(function () {
        setSaving(false);
      });
  };

  if (dreamQuery.isLoading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent })
      )
    );
  }

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(ScrollView, {
      contentContainerStyle: styles.scrollContent,
      keyboardShouldPersistTaps: 'handled',
    },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(TouchableOpacity, {
          style: styles.headerBtn,
          onPress: function () { navigation.goBack(); },
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Close',
          hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
        },
          React.createElement(Icon, { name: 'x', size: 22, color: COLORS.text })
        ),
        React.createElement(Text, { style: styles.headerTitle, accessibilityRole: 'header' }, 'Edit Dream'),
        React.createElement(TouchableOpacity, {
          style: [styles.saveBtn, (!title.trim() || saving) && { opacity: 0.5 }],
          onPress: handleSave,
          disabled: !title.trim() || saving,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Save changes',
          accessibilityState: { disabled: !title.trim() || !!saving, busy: !!saving },
        },
          saving
            ? React.createElement(ActivityIndicator, { size: 'small', color: '#fff' })
            : React.createElement(Text, { style: styles.saveBtnText }, 'Save')
        )
      ),
      // Title
      React.createElement(Text, { style: styles.label }, 'Title'),
      React.createElement(TextInput, {
        style: [styles.input, { fontSize: 18, fontWeight: '600' }],
        value: title,
        onChangeText: setTitle,
        placeholder: 'Dream title',
        placeholderTextColor: COLORS.textMuted,
        accessible: true,
        accessibilityLabel: 'Dream title',
      }),
      // Description
      React.createElement(Text, { style: [styles.label, { marginTop: 20 }] }, 'Description'),
      React.createElement(TextInput, {
        style: [styles.input, { minHeight: 120, textAlignVertical: 'top' }],
        value: description,
        onChangeText: setDescription,
        placeholder: 'Describe your dream...',
        placeholderTextColor: COLORS.textMuted,
        multiline: true,
        accessible: true,
        accessibilityLabel: 'Dream description',
      }),
      // Category
      React.createElement(Text, { style: [styles.label, { marginTop: 20 }] }, 'Category'),
      React.createElement(View, { style: styles.categoryGrid },
        CATEGORIES.map(function (cat) {
          var isSelected = category === cat.id;
          return React.createElement(TouchableOpacity, {
            key: cat.id,
            style: [styles.catPill, isSelected && { backgroundColor: cat.color + '20', borderColor: cat.color + '55' }],
            onPress: function () { setCategory(cat.id); },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: cat.label + (isSelected ? ', selected' : ''),
            accessibilityState: { selected: isSelected },
          },
            React.createElement(Icon, { name: cat.icon, size: 14, color: isSelected ? cat.color : COLORS.textSecondary }),
            React.createElement(Text, {
              style: [styles.catPillText, isSelected && { color: cat.color, fontWeight: '700' }],
            }, cat.label)
          );
        })
      ),
      // Target Date
      React.createElement(Text, { style: [styles.label, { marginTop: 20 }] }, 'Target Date'),
      React.createElement(TextInput, {
        style: styles.input,
        value: targetDate,
        onChangeText: setTargetDate,
        placeholder: 'YYYY-MM-DD',
        placeholderTextColor: COLORS.textMuted,
        accessible: true,
        accessibilityLabel: 'Target date',
        accessibilityHint: 'Format: year-month-day',
      })
    )
  );
};

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: 12 },
  headerBtn: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: RADIUS.md, backgroundColor: COLORS.accent },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.lg, padding: 14, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.glassBorder },
  catPillText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
});

module.exports = DreamEditScreen;
