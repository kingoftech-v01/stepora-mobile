/**
 * CircleCreateScreen — Create a new circle/group.
 * Form: name, description, category picker, privacy toggle, cover image upload.
 * Member invite: search users, add from friends list.
 */
var React = require('react');
var { useState, useCallback, useEffect, useRef } = React;
var {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Switch,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost, apiUpload } = require('../../services/api');
var { CIRCLES, SOCIAL } = require('../../services/endpoints');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var GlassCard = require('../../components/shared/GlassCard');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');
var { BRAND, catSolid } = require('../../styles/colors');

var launchImageLibrary;
try {
  launchImageLibrary = require('react-native-image-picker').launchImageLibrary;
} catch (e) {
  launchImageLibrary = null;
}

var EXTRA_CAT_COLORS = {
  fitness: '#3B82F6',
  education: '#6366F1',
  creativity: '#EC4899',
  personal_growth: '#6366F1',
  other: '#9CA3AF',
};

var getCatColor = function (key) {
  if (!key) return BRAND.purple;
  var k = key.toLowerCase().replace(/\s+/g, '_');
  return catSolid(k) || EXTRA_CAT_COLORS[k] || BRAND.purple;
};

var avatarColor = function (name) {
  var h = 0;
  for (var i = 0; i < (name || '').length; i++) {
    h = (name.charCodeAt(i) + ((h << 5) - h)) | 0;
  }
  return CONTACT_COLORS[Math.abs(h) % CONTACT_COLORS.length];
};

var CATEGORY_OPTIONS = [
  { key: 'career', label: 'Career' },
  { key: 'health', label: 'Health' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'education', label: 'Education' },
  { key: 'finance', label: 'Finance' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'relationships', label: 'Social' },
  { key: 'personal_growth', label: 'Growth' },
  { key: 'hobbies', label: 'Hobbies' },
  { key: 'other', label: 'Other' },
];

var CircleCreateScreen = function () {
  var navigation = useNavigation();
  var qc = useQueryClient();

  // ── Form state ──
  var [name, setName] = useState('');
  var [description, setDescription] = useState('');
  var [category, setCategory] = useState('');
  var [isPrivate, setIsPrivate] = useState(false);
  var [coverImage, setCoverImage] = useState(null);
  var [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // ── Member invite state ──
  var [showInvite, setShowInvite] = useState(false);
  var [searchText, setSearchText] = useState('');
  var [debouncedSearch, setDebouncedSearch] = useState('');
  var [invitedUsers, setInvitedUsers] = useState([]);
  var debounceRef = useRef(null);

  useEffect(function () {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(function () {
      setDebouncedSearch(searchText.trim());
    }, 300);
    return function () {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]);

  // ── Fetch friends list ──
  var friendsQuery = useQuery({
    queryKey: ['friends-list'],
    queryFn: function () {
      return apiGet(SOCIAL.FRIENDS.LIST);
    },
  });
  var friends = (function () {
    var d = friendsQuery.data;
    var list = (d && d.results) || d || [];
    if (!Array.isArray(list)) return [];
    return list;
  })();

  // ── Search users ──
  var searchQuery = useQuery({
    queryKey: ['user-search', debouncedSearch],
    queryFn: function () {
      return apiGet(SOCIAL.USER_SEARCH + '?q=' + encodeURIComponent(debouncedSearch));
    },
    enabled: debouncedSearch.length >= 2,
  });
  var searchResults = (function () {
    var d = searchQuery.data;
    var list = (d && d.results) || d || [];
    if (!Array.isArray(list)) return [];
    return list;
  })();

  // ── Create mutation ──
  var createMut = useMutation({
    mutationFn: function (data) {
      if (coverImage) {
        var formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('category', data.category);
        formData.append('is_private', data.isPrivate ? 'true' : 'false');
        if (data.invitedUserIds && data.invitedUserIds.length > 0) {
          data.invitedUserIds.forEach(function (uid) {
            formData.append('invited_user_ids', uid);
          });
        }
        formData.append('cover_image', {
          uri: coverImage.uri,
          type: coverImage.type || 'image/jpeg',
          name: coverImage.fileName || 'cover.jpg',
        });
        return apiUpload(CIRCLES.LIST, formData);
      }
      return apiPost(CIRCLES.LIST, data);
    },
    onSuccess: function (response) {
      qc.invalidateQueries({ queryKey: ['circles'] });
      Alert.alert('Success', 'Circle created!', [
        {
          text: 'OK',
          onPress: function () {
            if (response && response.id) {
              navigation.replace('CircleDetail', { circleId: response.id });
            } else {
              navigation.goBack();
            }
          },
        },
      ]);
    },
    onError: function (err) {
      Alert.alert('Error', err.userMessage || err.message || 'Failed to create circle');
    },
  });

  var handlePickImage = useCallback(function () {
    if (!launchImageLibrary) {
      Alert.alert('Unavailable', 'Image picker not available');
      return;
    }
    launchImageLibrary(
      { mediaType: 'photo', maxWidth: 1200, maxHeight: 800, quality: 0.8 },
      function (result) {
        if (result && !result.didCancel && result.assets && result.assets.length > 0) {
          setCoverImage(result.assets[0]);
        }
      },
    );
  }, []);

  var handleToggleInvite = useCallback(function (user) {
    setInvitedUsers(function (prev) {
      var exists = prev.find(function (u) { return u.id === user.id; });
      if (exists) {
        return prev.filter(function (u) { return u.id !== user.id; });
      }
      return prev.concat([user]);
    });
  }, []);

  var isInvited = useCallback(function (userId) {
    return invitedUsers.some(function (u) { return u.id === userId; });
  }, [invitedUsers]);

  var handleSubmit = useCallback(function () {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a circle name');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category');
      return;
    }
    var invitedUserIds = invitedUsers.map(function (u) { return u.id; });
    createMut.mutate({
      name: name.trim(),
      description: description.trim(),
      category: category,
      isPrivate: isPrivate,
      invitedUserIds: invitedUserIds,
    });
  }, [name, description, category, isPrivate, invitedUsers, createMut]);

  // ── List to show for inviting ──
  var inviteList = debouncedSearch.length >= 2 ? searchResults : friends;

  var renderInviteUser = useCallback(function (info) {
    var user = info.item;
    var userName = user.displayName || user.display_name || user.username || 'User';
    var invited = isInvited(user.id);

    return React.createElement(
      TouchableOpacity,
      {
        style: styles.inviteRow,
        onPress: function () { handleToggleInvite(user); },
        accessible: true, accessibilityRole: 'checkbox', accessibilityLabel: userName, accessibilityState: { checked: invited },
      },
      React.createElement(Avatar, {
        name: userName,
        src: user.avatar,
        size: 40,
        color: avatarColor(userName),
      }),
      React.createElement(
        View,
        { style: { flex: 1, marginLeft: 12 } },
        React.createElement(Text, { style: styles.inviteUserName }, userName),
        user.level
          ? React.createElement(Text, { style: styles.inviteUserMeta }, 'Level ' + user.level)
          : null,
      ),
      React.createElement(
        View,
        { style: [styles.inviteCheck, invited && styles.inviteCheckActive] },
        invited
          ? React.createElement(Icon, { name: 'check', size: 14, color: '#FFFFFF' })
          : null,
      ),
    );
  }, [isInvited, handleToggleInvite]);

  var selectedCatLabel = (function () {
    var found = CATEGORY_OPTIONS.find(function (c) { return c.key === category; });
    return found ? found.label : 'Select category';
  })();

  var catColor = getCatColor(category);

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Create Circle',
      onBack: function () { navigation.goBack(); },
    }),

    React.createElement(
      ScrollView,
      {
        contentContainerStyle: { paddingBottom: 120 },
        keyboardShouldPersistTaps: 'handled',
        showsVerticalScrollIndicator: false,
      },

      // ── Cover Image ──
      React.createElement(
        TouchableOpacity,
        { style: styles.coverWrap, onPress: handlePickImage, accessible: true, accessibilityRole: 'button', accessibilityLabel: coverImage ? 'Change cover image' : 'Add cover image', accessibilityHint: 'Opens image picker' },
        coverImage
          ? React.createElement(Image, {
              source: { uri: coverImage.uri },
              style: styles.coverImage,
              resizeMode: 'cover',
            })
          : React.createElement(
              View,
              { style: styles.coverPlaceholder },
              React.createElement(Icon, { name: 'camera', size: 28, color: COLORS.textMuted }),
              React.createElement(Text, { style: styles.coverPlaceholderText }, 'Add cover image'),
            ),
      ),

      // ── Circle Name ──
      React.createElement(
        View,
        { style: styles.fieldWrap },
        React.createElement(Text, { style: styles.label }, 'Circle Name *'),
        React.createElement(TextInput, {
          style: styles.input,
          placeholder: 'Enter circle name...',
          placeholderTextColor: COLORS.textMuted,
          value: name,
          onChangeText: setName,
          maxLength: 100,
          accessibilityLabel: 'Circle name',
          accessibilityHint: 'Enter the name for your new circle',
        }),
      ),

      // ── Description ──
      React.createElement(
        View,
        { style: styles.fieldWrap },
        React.createElement(Text, { style: styles.label }, 'Description'),
        React.createElement(TextInput, {
          style: [styles.input, styles.textArea],
          placeholder: 'What is this circle about?',
          placeholderTextColor: COLORS.textMuted,
          value: description,
          onChangeText: setDescription,
          multiline: true,
          maxLength: 500,
          textAlignVertical: 'top',
          accessibilityLabel: 'Circle description',
          accessibilityHint: 'Describe what this circle is about',
        }),
        React.createElement(
          Text,
          { style: styles.charCount },
          description.length + '/500',
        ),
      ),

      // ── Category Picker ──
      React.createElement(
        View,
        { style: styles.fieldWrap },
        React.createElement(Text, { style: styles.label }, 'Category *'),
        React.createElement(
          TouchableOpacity,
          {
            style: styles.pickerBtn,
            onPress: function () { setShowCategoryPicker(!showCategoryPicker); },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Category: ' + selectedCatLabel, accessibilityHint: 'Opens category picker', accessibilityState: { expanded: showCategoryPicker },
          },
          category
            ? React.createElement(
                View,
                { style: [styles.catDot, { backgroundColor: catColor }] },
              )
            : null,
          React.createElement(
            Text,
            { style: [styles.pickerText, !category && { color: COLORS.textMuted }] },
            selectedCatLabel,
          ),
          React.createElement(Icon, {
            name: showCategoryPicker ? 'chevron-up' : 'chevron-down',
            size: 18,
            color: COLORS.textMuted,
          }),
        ),
        showCategoryPicker
          ? React.createElement(
              View,
              { style: styles.categoryGrid },
              CATEGORY_OPTIONS.map(function (cat) {
                var isActive = category === cat.key;
                var color = getCatColor(cat.key);
                return React.createElement(
                  TouchableOpacity,
                  {
                    key: cat.key,
                    style: [
                      styles.categoryChip,
                      isActive && { backgroundColor: color + '20', borderColor: color + '40' },
                    ],
                    onPress: function () {
                      setCategory(cat.key);
                      setShowCategoryPicker(false);
                    },
                    accessible: true, accessibilityRole: 'button', accessibilityLabel: cat.label + ' category', accessibilityState: { selected: isActive },
                  },
                  React.createElement(
                    View,
                    { style: [styles.catChipDot, { backgroundColor: color }] },
                  ),
                  React.createElement(
                    Text,
                    { style: [styles.categoryChipText, isActive && { color: color }] },
                    cat.label,
                  ),
                );
              }),
            )
          : null,
      ),

      // ── Privacy Toggle ──
      React.createElement(
        GlassCard,
        { style: { marginHorizontal: SPACING.lg } },
        React.createElement(
          View,
          { style: styles.toggleRow },
          React.createElement(
            View,
            { style: { flex: 1 } },
            React.createElement(
              View,
              { style: { flexDirection: 'row', alignItems: 'center' } },
              React.createElement(Icon, {
                name: isPrivate ? 'lock' : 'globe',
                size: 18,
                color: isPrivate ? COLORS.yellow : COLORS.green,
              }),
              React.createElement(
                Text,
                { style: [styles.toggleLabel, { marginLeft: 8 }] },
                isPrivate ? 'Private Circle' : 'Public Circle',
              ),
            ),
            React.createElement(
              Text,
              { style: styles.toggleDesc },
              isPrivate
                ? 'Only invited members can join and see content'
                : 'Anyone can discover and join this circle',
            ),
          ),
          React.createElement(Switch, {
            value: isPrivate,
            onValueChange: setIsPrivate,
            trackColor: { false: COLORS.glassBg, true: COLORS.purple + '60' },
            thumbColor: isPrivate ? COLORS.purple : COLORS.textMuted,
            accessibilityLabel: isPrivate ? 'Private circle' : 'Public circle',
            accessibilityRole: 'switch',
            accessibilityState: { checked: isPrivate },
            accessibilityHint: 'Toggle between public and private circle',
          }),
        ),
      ),

      // ── Invite Members ──
      React.createElement(
        View,
        { style: styles.fieldWrap },
        React.createElement(
          TouchableOpacity,
          {
            style: styles.inviteToggle,
            onPress: function () { setShowInvite(!showInvite); },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Invite Members' + (invitedUsers.length > 0 ? ', ' + invitedUsers.length + ' selected' : ''), accessibilityState: { expanded: showInvite },
          },
          React.createElement(Icon, { name: 'user-plus', size: 18, color: COLORS.purple }),
          React.createElement(
            Text,
            { style: styles.inviteToggleText },
            'Invite Members' + (invitedUsers.length > 0 ? ' (' + invitedUsers.length + ')' : ''),
          ),
          React.createElement(Icon, {
            name: showInvite ? 'chevron-up' : 'chevron-down',
            size: 18,
            color: COLORS.textMuted,
          }),
        ),
      ),

      // Invited users chips
      invitedUsers.length > 0
        ? React.createElement(
            View,
            { style: styles.invitedChipsWrap },
            invitedUsers.map(function (user) {
              var userName = user.displayName || user.display_name || user.username || 'User';
              return React.createElement(
                TouchableOpacity,
                {
                  key: user.id,
                  style: styles.invitedChip,
                  onPress: function () { handleToggleInvite(user); },
                  accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Remove ' + userName + ' from invite list',
                },
                React.createElement(Avatar, {
                  name: userName,
                  src: user.avatar,
                  size: 24,
                  color: avatarColor(userName),
                }),
                React.createElement(Text, { style: styles.invitedChipText }, userName),
                React.createElement(Icon, { name: 'x', size: 12, color: COLORS.textMuted }),
              );
            }),
          )
        : null,

      showInvite
        ? React.createElement(
            View,
            { style: styles.inviteSection },
            // Search
            React.createElement(
              View,
              { style: styles.inviteSearchWrap },
              React.createElement(Icon, { name: 'search', size: 16, color: COLORS.textMuted }),
              React.createElement(TextInput, {
                style: styles.inviteSearchInput,
                placeholder: 'Search users...',
                placeholderTextColor: COLORS.textMuted,
                value: searchText,
                onChangeText: setSearchText,
                accessibilityLabel: 'Search users to invite',
                accessibilityRole: 'search',
              }),
            ),
            // List
            inviteList.length > 0
              ? inviteList.slice(0, 20).map(function (user) {
                  return renderInviteUser({ item: user, index: 0 });
                })
              : React.createElement(
                  View,
                  { style: { alignItems: 'center', paddingVertical: 20 } },
                  React.createElement(
                    Text,
                    { style: styles.inviteEmptyText },
                    debouncedSearch.length >= 2 && searchQuery.isLoading
                      ? 'Searching...'
                      : debouncedSearch.length >= 2
                        ? 'No users found'
                        : 'Search for users or add from friends',
                  ),
                ),
          )
        : null,

      // ── Submit Button ──
      React.createElement(
        View,
        { style: styles.submitWrap },
        React.createElement(
          TouchableOpacity,
          {
            style: [styles.submitBtn, (!name.trim() || !category) && styles.submitBtnDisabled],
            onPress: handleSubmit,
            disabled: createMut.isPending || !name.trim() || !category,
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Create Circle', accessibilityState: { disabled: createMut.isPending || !name.trim() || !category },
          },
          createMut.isPending
            ? React.createElement(ActivityIndicator, { size: 'small', color: '#FFFFFF' })
            : React.createElement(
                View,
                { style: { flexDirection: 'row', alignItems: 'center' } },
                React.createElement(Icon, { name: 'plus-circle', size: 18, color: '#FFFFFF' }),
                React.createElement(Text, { style: styles.submitBtnText }, 'Create Circle'),
              ),
        ),
      ),
    ),
  );
};

var styles = StyleSheet.create({
  coverWrap: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    height: 160,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderStyle: 'dashed',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  fieldWrap: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 90,
    maxHeight: 150,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 8,
    marginBottom: 8,
  },
  catChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  inviteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inviteToggleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 10,
  },
  invitedChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  invitedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purple + '15',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 6,
  },
  invitedChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: 6,
  },
  inviteSection: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    maxHeight: 300,
  },
  inviteSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  inviteSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    padding: 0,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  inviteUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  inviteUserMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  inviteCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.glassBorderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCheckActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  inviteEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  submitWrap: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xxl,
  },
  submitBtn: {
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

module.exports = CircleCreateScreen;
