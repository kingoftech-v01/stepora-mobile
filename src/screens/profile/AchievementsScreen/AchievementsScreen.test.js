var React = require('react');
var { render } = require('@testing-library/react-native');
jest.mock('./useAchievementsScreen', function () {
  return function () { return {
    navigation: { goBack: jest.fn() }, t: function (k) { return k; }, loading: false,
    achievements: [], allAchievements: [], CATEGORIES: [{ key: 'all', label: 'All' }],
    selectedCategory: 'all', setSelectedCategory: jest.fn(), selectedAchievement: null, showDetail: false,
    error: null, totalXp: 100, level: 5, xpToNext: 200, levelProgress: 0.5,
    unlockedCount: 3, totalCount: 10, streak: 5,
    fetchAchievements: jest.fn(), handleSelectAchievement: jest.fn(), handleCloseDetail: jest.fn(),
    getProgressPercent: function () { return 50; }, formatDate: function () { return 'Jan 1'; },
    adaptColor: function () { return '#8B5CF6'; }, BRAND: { purple: '#8B5CF6' },
  }; };
});
jest.mock('../../../styles/colors', function () { return { BRAND: { bgDeep: '#000', purple: '#8B5CF6', redSolid: '#EF4444', greenSolid: '#10B981', yellow: '#FCD34D' } }; });
jest.mock('../../../styles/theme', function () { return { dark: { text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc', glassBg: '#111', glassBorder: '#222' } }; });
var Screen = require('./AchievementsScreen');
describe('AchievementsScreen', function () {
  it('renders without crash', function () { var { getByText } = render(React.createElement(Screen)); expect(getByText('Achievements')).toBeTruthy(); });
  it('shows XP summary', function () { var { getByText } = render(React.createElement(Screen)); expect(getByText('100 XP')).toBeTruthy(); });
});
