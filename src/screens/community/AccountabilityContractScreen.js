/**
 * AccountabilityContractScreen — Contract between accountability buddies.
 * Display terms, goals, check-in frequency, consequences.
 * Both parties must agree (sign). Status management.
 */
var React = require('react');
var { useState, useCallback } = React;
var {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
} = require('react-native');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost, apiPut } = require('../../services/api');
var { BUDDIES } = require('../../services/endpoints');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var GlassCard = require('../../components/shared/GlassCard');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

var avatarColor = function (name) {
  var h = 0;
  for (var i = 0; i < (name || '').length; i++) {
    h = (name.charCodeAt(i) + ((h << 5) - h)) | 0;
  }
  return CONTACT_COLORS[Math.abs(h) % CONTACT_COLORS.length];
};

var STATUS_CONFIG = {
  draft: { label: 'Draft', color: COLORS.yellow, icon: 'edit-3', bg: 'rgba(252,211,77,0.12)' },
  active: { label: 'Active', color: COLORS.green, icon: 'check-circle', bg: 'rgba(34,197,94,0.12)' },
  completed: { label: 'Completed', color: COLORS.purple, icon: 'award', bg: 'rgba(139,92,246,0.12)' },
  broken: { label: 'Broken', color: COLORS.red, icon: 'alert-triangle', bg: 'rgba(239,68,68,0.12)' },
};

var FREQUENCY_OPTIONS = [
  { key: 'daily', label: 'Daily' },
  { key: 'every_2_days', label: 'Every 2 Days' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'biweekly', label: 'Bi-weekly' },
];

var AccountabilityContractScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var contractId = route.params && route.params.contractId;
  var buddyId = route.params && route.params.buddyId;
  var qc = useQueryClient();

  var [showEditModal, setShowEditModal] = useState(false);

  // ── Edit form state ──
  var [formGoals, setFormGoals] = useState('');
  var [formFrequency, setFormFrequency] = useState('weekly');
  var [formConsequences, setFormConsequences] = useState('');
  var [formTerms, setFormTerms] = useState('');

  // ── Fetch contracts ──
  var contractsQuery = useQuery({
    queryKey: ['buddy-contracts'],
    queryFn: function () {
      return apiGet(BUDDIES.CONTRACTS.LIST);
    },
  });
  var contracts = (function () {
    var d = contractsQuery.data;
    var list = (d && d.results) || d || [];
    if (!Array.isArray(list)) return [];
    return list;
  })();

  // Find current contract (by contractId or the active one with buddyId)
  var contract = (function () {
    if (contractId) {
      return contracts.find(function (c) { return c.id === contractId; }) || null;
    }
    if (buddyId) {
      return contracts.find(function (c) {
        return (c.buddyPairingId === buddyId || c.buddyId === buddyId) &&
          (c.status === 'active' || c.status === 'draft');
      }) || null;
    }
    // Return the most recent active/draft contract
    return contracts.find(function (c) {
      return c.status === 'active' || c.status === 'draft';
    }) || (contracts.length > 0 ? contracts[0] : null);
  })();

  var status = contract ? (STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft) : STATUS_CONFIG.draft;
  var mySignature = contract ? (contract.mySignature || contract.signedByMe || false) : false;
  var buddySignature = contract ? (contract.buddySignature || contract.signedByBuddy || false) : false;
  var buddy = contract ? (contract.buddy || contract.otherUser || contract.partner || {}) : {};
  var buddyName = buddy.displayName || buddy.display_name || buddy.username || 'Buddy';

  var goals = contract ? (contract.goals || []) : [];
  var frequency = contract ? (contract.checkInFrequency || contract.frequency || 'weekly') : 'weekly';
  var consequences = contract ? (contract.consequences || '') : '';
  var terms = contract ? (contract.terms || contract.additionalTerms || '') : '';

  // ── Mutations ──
  var createMut = useMutation({
    mutationFn: function (data) {
      return apiPost(BUDDIES.CONTRACTS.CREATE, data);
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['buddy-contracts'] });
      setShowEditModal(false);
      Alert.alert('Success', 'Contract created! Waiting for buddy to sign.');
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to create contract');
    },
  });

  var signMut = useMutation({
    mutationFn: function (id) {
      return apiPost(BUDDIES.CONTRACTS.ACCEPT(id));
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['buddy-contracts'] });
      Alert.alert('Signed!', 'You have signed the contract.');
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to sign contract');
    },
  });

  var checkInMut = useMutation({
    mutationFn: function (id) {
      return apiPost(BUDDIES.CONTRACTS.CHECK_IN(id));
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['buddy-contracts'] });
      Alert.alert('Checked In', 'Your check-in has been recorded.');
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to check in');
    },
  });

  var handleOpenEdit = useCallback(function () {
    if (contract) {
      setFormGoals(
        Array.isArray(goals)
          ? goals.join('\n')
          : (typeof goals === 'string' ? goals : ''),
      );
      setFormFrequency(frequency);
      setFormConsequences(consequences);
      setFormTerms(terms);
    } else {
      setFormGoals('');
      setFormFrequency('weekly');
      setFormConsequences('');
      setFormTerms('');
    }
    setShowEditModal(true);
  }, [contract, goals, frequency, consequences, terms]);

  var handleSave = useCallback(function () {
    if (!formGoals.trim()) {
      Alert.alert('Required', 'Please enter at least one goal');
      return;
    }
    var goalsArray = formGoals
      .split('\n')
      .map(function (g) { return g.trim(); })
      .filter(function (g) { return g.length > 0; });

    var payload = {
      goals: goalsArray,
      checkInFrequency: formFrequency,
      consequences: formConsequences.trim(),
      terms: formTerms.trim(),
    };
    if (buddyId) payload.buddyPairingId = buddyId;

    createMut.mutate(payload);
  }, [formGoals, formFrequency, formConsequences, formTerms, buddyId, createMut]);

  // ── Render contract card ──
  var renderContractCard = function () {
    if (!contract) {
      return React.createElement(
        View,
        { style: styles.noContractWrap },
        React.createElement(
          View,
          { style: styles.noContractIconWrap },
          React.createElement(Icon, { name: 'file-text', size: 48, color: COLORS.textMuted }),
        ),
        React.createElement(Text, { style: styles.noContractTitle }, 'No Contract Yet'),
        React.createElement(
          Text,
          { style: styles.noContractDesc },
          'Create an accountability contract with your buddy to set goals and check-in commitments.',
        ),
        React.createElement(
          TouchableOpacity,
          { style: styles.createContractBtn, onPress: handleOpenEdit, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Create Contract' },
          React.createElement(Icon, { name: 'plus', size: 18, color: '#FFFFFF' }),
          React.createElement(Text, { style: styles.createContractBtnText }, 'Create Contract'),
        ),
      );
    }

    return React.createElement(
      ScrollView,
      {
        contentContainerStyle: { paddingBottom: 120 },
        showsVerticalScrollIndicator: false,
      },

      // Status banner
      React.createElement(
        View,
        { style: [styles.statusBanner, { backgroundColor: status.bg }] },
        React.createElement(Icon, { name: status.icon, size: 20, color: status.color }),
        React.createElement(
          Text,
          { style: [styles.statusLabel, { color: status.color }] },
          status.label + ' Contract',
        ),
      ),

      // ── Visual Contract Card ──
      React.createElement(
        View,
        { style: styles.contractCard },
        // Contract header
        React.createElement(
          View,
          { style: styles.contractHeader },
          React.createElement(
            Text,
            { style: styles.contractTitle },
            'Accountability Contract',
          ),
          React.createElement(
            View,
            { style: styles.contractDivider },
          ),
        ),

        // ── Goals Section ──
        React.createElement(
          View,
          { style: styles.contractSection },
          React.createElement(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 } },
            React.createElement(Icon, { name: 'target', size: 16, color: COLORS.purple }),
            React.createElement(Text, { style: styles.sectionTitle }, 'Goals'),
          ),
          Array.isArray(goals) && goals.length > 0
            ? goals.map(function (goal, idx) {
                return React.createElement(
                  View,
                  { key: idx, style: styles.goalRow },
                  React.createElement(
                    View,
                    { style: styles.goalBullet },
                    React.createElement(Text, { style: styles.goalBulletText }, String(idx + 1)),
                  ),
                  React.createElement(Text, { style: styles.goalText }, goal),
                );
              })
            : React.createElement(
                Text,
                { style: styles.emptyFieldText },
                typeof goals === 'string' && goals ? goals : 'No goals defined',
              ),
        ),

        // ── Check-in Frequency ──
        React.createElement(
          View,
          { style: styles.contractSection },
          React.createElement(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 } },
            React.createElement(Icon, { name: 'clock', size: 16, color: COLORS.teal }),
            React.createElement(Text, { style: styles.sectionTitle }, 'Check-in Frequency'),
          ),
          React.createElement(
            View,
            { style: styles.frequencyBadge },
            React.createElement(
              Text,
              { style: styles.frequencyText },
              (function () {
                var found = FREQUENCY_OPTIONS.find(function (f) { return f.key === frequency; });
                return found ? found.label : frequency;
              })(),
            ),
          ),
        ),

        // ── Consequences ──
        consequences
          ? React.createElement(
              View,
              { style: styles.contractSection },
              React.createElement(
                View,
                { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 } },
                React.createElement(Icon, { name: 'alert-circle', size: 16, color: COLORS.yellow }),
                React.createElement(Text, { style: styles.sectionTitle }, 'Consequences'),
              ),
              React.createElement(Text, { style: styles.consequencesText }, consequences),
            )
          : null,

        // ── Additional Terms ──
        terms
          ? React.createElement(
              View,
              { style: styles.contractSection },
              React.createElement(
                View,
                { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 } },
                React.createElement(Icon, { name: 'file-text', size: 16, color: COLORS.indigo }),
                React.createElement(Text, { style: styles.sectionTitle }, 'Additional Terms'),
              ),
              React.createElement(Text, { style: styles.termsText }, terms),
            )
          : null,

        // ── Signatures ──
        React.createElement(View, { style: styles.contractDivider }),
        React.createElement(
          View,
          { style: styles.signaturesSection },
          React.createElement(Text, { style: styles.signaturesTitle }, 'Signatures'),
          // My signature
          React.createElement(
            View,
            { style: styles.signatureRow },
            React.createElement(Avatar, { name: 'You', size: 32, color: COLORS.purple }),
            React.createElement(
              View,
              { style: { flex: 1, marginLeft: 10 } },
              React.createElement(Text, { style: styles.signatureName }, 'You'),
            ),
            mySignature
              ? React.createElement(
                  View,
                  { style: styles.signedBadge },
                  React.createElement(Icon, { name: 'check', size: 14, color: COLORS.green }),
                  React.createElement(Text, { style: styles.signedText }, 'Signed'),
                )
              : React.createElement(
                  View,
                  { style: styles.unsignedBadge },
                  React.createElement(Text, { style: styles.unsignedText }, 'Pending'),
                ),
          ),
          // Buddy signature
          React.createElement(
            View,
            { style: styles.signatureRow },
            React.createElement(Avatar, {
              name: buddyName,
              src: buddy.avatar,
              size: 32,
              color: avatarColor(buddyName),
            }),
            React.createElement(
              View,
              { style: { flex: 1, marginLeft: 10 } },
              React.createElement(Text, { style: styles.signatureName }, buddyName),
            ),
            buddySignature
              ? React.createElement(
                  View,
                  { style: styles.signedBadge },
                  React.createElement(Icon, { name: 'check', size: 14, color: COLORS.green }),
                  React.createElement(Text, { style: styles.signedText }, 'Signed'),
                )
              : React.createElement(
                  View,
                  { style: styles.unsignedBadge },
                  React.createElement(Text, { style: styles.unsignedText }, 'Pending'),
                ),
          ),
        ),
      ),

      // ── Action buttons ──
      React.createElement(
        View,
        { style: styles.bottomActions },
        // Sign button (if not signed yet and contract is draft)
        !mySignature && contract.status === 'draft'
          ? React.createElement(
              TouchableOpacity,
              {
                style: styles.signBtn,
                onPress: function () { signMut.mutate(contract.id); },
                disabled: signMut.isPending,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Sign Contract', accessibilityState: { disabled: signMut.isPending },
              },
              signMut.isPending
                ? React.createElement(ActivityIndicator, { size: 'small', color: '#FFFFFF' })
                : React.createElement(
                    View,
                    { style: { flexDirection: 'row', alignItems: 'center' } },
                    React.createElement(Icon, { name: 'edit-2', size: 16, color: '#FFFFFF' }),
                    React.createElement(Text, { style: styles.signBtnText }, 'Sign Contract'),
                  ),
            )
          : null,

        // Check-in button (if active)
        contract.status === 'active'
          ? React.createElement(
              TouchableOpacity,
              {
                style: styles.checkInBtn,
                onPress: function () { checkInMut.mutate(contract.id); },
                disabled: checkInMut.isPending,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Check In', accessibilityState: { disabled: checkInMut.isPending },
              },
              checkInMut.isPending
                ? React.createElement(ActivityIndicator, { size: 'small', color: '#FFFFFF' })
                : React.createElement(
                    View,
                    { style: { flexDirection: 'row', alignItems: 'center' } },
                    React.createElement(Icon, { name: 'check-square', size: 16, color: '#FFFFFF' }),
                    React.createElement(Text, { style: styles.checkInBtnText }, 'Check In'),
                  ),
            )
          : null,

        // Edit button (if draft)
        contract.status === 'draft'
          ? React.createElement(
              TouchableOpacity,
              { style: styles.editBtn, onPress: handleOpenEdit, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Edit contract' },
              React.createElement(Icon, { name: 'edit-3', size: 16, color: COLORS.purple }),
              React.createElement(Text, { style: styles.editBtnText }, 'Edit'),
            )
          : null,
      ),

      // ── Progress section (if active) ──
      contract.status === 'active' && contract.progress
        ? React.createElement(
            GlassCard,
            { style: { marginHorizontal: SPACING.lg, marginTop: SPACING.lg } },
            React.createElement(Text, { style: styles.progressTitle }, 'Check-in Progress'),
            React.createElement(
              View,
              { style: styles.progressGrid },
              React.createElement(
                View,
                { style: styles.progressItem },
                React.createElement(
                  Text,
                  { style: styles.progressNumber },
                  String(contract.progress.myCheckIns || 0),
                ),
                React.createElement(Text, { style: styles.progressItemLabel }, 'Your check-ins'),
              ),
              React.createElement(
                View,
                { style: styles.progressItem },
                React.createElement(
                  Text,
                  { style: styles.progressNumber },
                  String(contract.progress.buddyCheckIns || 0),
                ),
                React.createElement(Text, { style: styles.progressItemLabel }, 'Buddy check-ins'),
              ),
              React.createElement(
                View,
                { style: styles.progressItem },
                React.createElement(
                  Text,
                  { style: styles.progressNumber },
                  String(contract.progress.streak || 0),
                ),
                React.createElement(Text, { style: styles.progressItemLabel }, 'Streak'),
              ),
            ),
          )
        : null,
    );
  };

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Contract',
      onBack: function () { navigation.goBack(); },
    }),

    contractsQuery.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
        )
      : renderContractCard(),

    // ── Edit/Create Modal ──
    React.createElement(
      Modal,
      {
        visible: showEditModal,
        animationType: 'slide',
        transparent: false,
        onRequestClose: function () { setShowEditModal(false); },
      },
      React.createElement(
        ScreenShell,
        null,
        React.createElement(GlassHeader, {
          title: contract ? 'Edit Contract' : 'New Contract',
          onBack: function () { setShowEditModal(false); },
        }),
        React.createElement(
          ScrollView,
          {
            contentContainerStyle: { paddingBottom: 60 },
            keyboardShouldPersistTaps: 'handled',
          },
          // Goals
          React.createElement(
            View,
            { style: styles.formField },
            React.createElement(Text, { style: styles.formLabel }, 'Goals * (one per line)'),
            React.createElement(TextInput, {
              style: [styles.formInput, { minHeight: 100 }],
              placeholder: 'e.g.,\nExercise 3x per week\nRead 20 pages daily\nMeditate every morning',
              placeholderTextColor: COLORS.textMuted,
              value: formGoals,
              onChangeText: setFormGoals,
              multiline: true,
              textAlignVertical: 'top',
              accessibilityLabel: 'Goals, one per line',
            }),
          ),
          // Check-in frequency
          React.createElement(
            View,
            { style: styles.formField },
            React.createElement(Text, { style: styles.formLabel }, 'Check-in Frequency'),
            React.createElement(
              View,
              { style: styles.freqRow },
              FREQUENCY_OPTIONS.map(function (opt) {
                var isActive = formFrequency === opt.key;
                return React.createElement(
                  TouchableOpacity,
                  {
                    key: opt.key,
                    style: [styles.freqPill, isActive && styles.freqPillActive],
                    onPress: function () { setFormFrequency(opt.key); },
                    accessible: true, accessibilityRole: 'button', accessibilityLabel: opt.label, accessibilityState: { selected: isActive },
                  },
                  React.createElement(
                    Text,
                    { style: [styles.freqPillText, isActive && styles.freqPillTextActive] },
                    opt.label,
                  ),
                );
              }),
            ),
          ),
          // Consequences
          React.createElement(
            View,
            { style: styles.formField },
            React.createElement(Text, { style: styles.formLabel }, 'Consequences (optional)'),
            React.createElement(TextInput, {
              style: styles.formInput,
              placeholder: 'e.g., Donate $10 to charity if missed',
              placeholderTextColor: COLORS.textMuted,
              value: formConsequences,
              onChangeText: setFormConsequences,
              maxLength: 300,
              accessibilityLabel: 'Consequences',
            }),
          ),
          // Additional terms
          React.createElement(
            View,
            { style: styles.formField },
            React.createElement(Text, { style: styles.formLabel }, 'Additional Terms (optional)'),
            React.createElement(TextInput, {
              style: [styles.formInput, { minHeight: 70 }],
              placeholder: 'Any additional agreements...',
              placeholderTextColor: COLORS.textMuted,
              value: formTerms,
              onChangeText: setFormTerms,
              multiline: true,
              maxLength: 500,
              textAlignVertical: 'top',
              accessibilityLabel: 'Additional terms',
            }),
          ),
          // Save
          React.createElement(
            TouchableOpacity,
            {
              style: [styles.saveBtn, !formGoals.trim() && { opacity: 0.4 }],
              onPress: handleSave,
              disabled: createMut.isPending || !formGoals.trim(),
              accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Save Contract', accessibilityState: { disabled: createMut.isPending || !formGoals.trim() },
            },
            createMut.isPending
              ? React.createElement(ActivityIndicator, { size: 'small', color: '#FFFFFF' })
              : React.createElement(Text, { style: styles.saveBtnText }, 'Save Contract'),
          ),
        ),
      ),
    ),
  );
};

var styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noContractWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  noContractIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noContractTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  noContractDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createContractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.purple,
    borderRadius: 12,
  },
  createContractBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  contractCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.xl,
  },
  contractHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  contractTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  contractDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 16,
  },
  contractSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  goalBulletText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  goalText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  emptyFieldText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  frequencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.teal + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.teal + '30',
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.teal,
  },
  consequencesText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  termsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  signaturesSection: {
    marginTop: 4,
  },
  signaturesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  signatureName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  signedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 8,
  },
  signedText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.green,
    marginLeft: 4,
  },
  unsignedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(252,211,77,0.12)',
    borderRadius: 8,
  },
  unsignedText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.yellow,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  signBtn: {
    flex: 1,
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  signBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  checkInBtn: {
    flex: 1,
    backgroundColor: COLORS.green,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkInBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.purple + '15',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.purple + '30',
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.purple,
    marginLeft: 6,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  progressGrid: {
    flexDirection: 'row',
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.purple,
  },
  progressItemLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  // Edit modal form
  formField: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  freqRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  freqPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 8,
    marginBottom: 8,
  },
  freqPillActive: {
    backgroundColor: COLORS.purple + '20',
    borderColor: COLORS.purple + '40',
  },
  freqPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  freqPillTextActive: {
    color: COLORS.purple,
  },
  saveBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

module.exports = AccountabilityContractScreen;
