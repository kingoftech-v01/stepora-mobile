var React = require('react');
var { render } = require('@testing-library/react-native');

jest.mock('@react-navigation/native', function () {
  return {
    useNavigation: function () { return { navigate: jest.fn(), goBack: jest.fn() }; },
    useRoute: function () { return { params: {} }; },
  };
});
jest.mock('@tanstack/react-query', function () {
  return {
    useQuery: function () { return { data: null, isLoading: false }; },
    useInfiniteQuery: function () { return { data: { pages: [] }, isLoading: false, refetch: jest.fn() }; },
    useQueryClient: function () { return { invalidateQueries: jest.fn(), cancelQueries: jest.fn(), getQueryData: jest.fn(), setQueryData: jest.fn() }; },
    useMutation: function () { return { mutate: jest.fn(), isPending: false, isLoading: false }; },
  };
});
jest.mock("../../services/api", function () { return { apiGet: jest.fn(), apiPost: jest.fn(), apiDelete: jest.fn(), apiPatch: jest.fn(), apiPut: jest.fn() }; });
jest.mock("../../services/endpoints", function () {
  var handler = { get: function (t, p) { if (typeof p === "symbol") return undefined; return function () { return "/mock/" + p; }; } };
  var deepProxy = function () { return new Proxy(function () { return "/mock/"; }, handler); };
  return new Proxy({}, { get: function (t, p) { if (typeof p === "symbol") return undefined; var inner = new Proxy(function () { return "/mock/" + p; }, handler); return inner; } });
});
jest.mock("../../hooks/useInfiniteList", function () { return function () { return { items: [], isLoading: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn(function () { return Promise.resolve(); }) }; }; });
jest.mock("../../hooks/useChatSocket", function () { return function () { return { connected: false, sendMessage: jest.fn() }; }; });
jest.mock("../../hooks/useSocialFeedSocket", function () { return function () { return {}; }; });
jest.mock("../../hooks/useSubscriptionError", function () { return function () { return {}; }; });
jest.mock("../../components/shared/ScreenShell", function () { var R = require("react"); return function (p) { return R.createElement(require("react-native").View, null, p.children); }; });
jest.mock("../../components/shared/GlassHeader", function () { var R = require("react"); return function (p) { return R.createElement(require("react-native").View, null, R.createElement(require("react-native").Text, null, p.title)); }; });
jest.mock("../../components/shared/GlassCard", function () { var R = require("react"); return function (p) { return R.createElement(require("react-native").View, null, p.children); }; });
jest.mock("../../components/shared/Avatar", function () { var R = require("react"); return function () { return R.createElement(require("react-native").View, { testID: "avatar" }); }; });
jest.mock("../../components/shared/OfflineBanner", function () { var R = require("react"); return { OfflineDataBanner: function () { return null; } }; });
jest.mock("../../components/GlassCard", function () { var R = require("react"); return function (p) { return R.createElement(require("react-native").View, null, p.children); }; });
jest.mock("../../components/GlassButton", function () { var R = require("react"); return function (p) { return R.createElement(require("react-native").TouchableOpacity, { onPress: p.onPress }, R.createElement(require("react-native").Text, null, p.children)); }; });
jest.mock("../../components/PillTabs", function () { var R = require("react"); return function (p) { return R.createElement(require("react-native").View, { testID: "pill-tabs" }, (p.tabs || []).map(function (t) { return R.createElement(require("react-native").Text, { key: t.key }, t.label); })); }; });
jest.mock("../../components/ScreenHeader", function () { var R = require("react"); return { ScreenHeader: function (p) { return R.createElement(require("react-native").View, null, R.createElement(require("react-native").Text, null, p.title), p.left); }, BackButton: function (p) { return R.createElement(require("react-native").TouchableOpacity, { onPress: p.onPress, accessibilityLabel: "Go back" }); }, HeaderIconButton: function () { return null; } }; });
jest.mock("../../components/SubscriptionBanner", function () { var R = require("react"); return function () { return null; }; });
jest.mock("../../components/SubscriptionGate", function () { var R = require("react"); return function (p) { return R.createElement(require("react-native").View, null, p.children); }; });
jest.mock("../../components/OnboardingTooltip", function () { var R = require("react"); return function () { return null; }; });
jest.mock("../../config/onboardingTooltips", function () { return { getTooltipConfig: function () { return null; }, getTooltipCount: function () { return 0; } }; });
jest.mock("../../components/RecurrencePicker", function () { var R = require("react"); return function () { return null; }; });
jest.mock("../../components/StreakWidget", function () { var R = require("react"); return function () { return null; }; });
jest.mock("../../components/CalendarHeatmap", function () { var R = require("react"); return function () { return null; }; });
jest.mock("../../context/AuthContext", function () { return { useAuth: function () { return { user: { id: 1, subscription: "free" }, isAuthenticated: true, isFreeTier: true, subscriptionTier: "free", hasSubscription: function () { return false; } }; } }; });
jest.mock("../../context/ToastContext", function () { return { useToast: function () { return { showToast: jest.fn(), dismissToast: jest.fn() }; } }; });
jest.mock("../../context/NetworkContext", function () { return { useNetwork: function () { return { isOnline: true }; } }; });
jest.mock("../../theme/tokens", function () { return { COLORS: { bodyBg: "#000", glassBg: "#111", glassBorder: "#222", text: "#fff", textPrimary: "#fff", textSecondary: "#ccc", textMuted: "#888", textTertiary: "#aaa", accent: "#8B5CF6", purple: "#8B5CF6", red: "#EF4444", green: "#22C55E" }, SPACING: { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 }, RADIUS: { md: 14, lg: 16, xl: 20, full: 999 }, CONTACT_COLORS: ["#8B5CF6", "#10B981", "#EC4899"] }; });
jest.mock("../../styles/colors", function () { return { BRAND: { purple: "#8B5CF6", purpleLight: "#C4B5FD", greenSolid: "#10B981", redSolid: "#EF4444", yellow: "#FCD34D" }, catSolid: function () { return "#8B5CF6"; }, CATEGORIES: {}, adaptColor: function () { return "#8B5CF6"; } }; });
jest.mock("../../styles/theme", function () { return { dark: { text: "#fff", textMuted: "#888", textTertiary: "#aaa", textSecondary: "#ccc", glassBg: "#111", glassBorder: "#222", surface: "#333", inputBorder: "#444" } }; });
jest.mock("../../styles/tokens", function () { return { SPACING: { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 }, FONT_SIZES: { sm: 13, md: 15, lg: 17, xl: 20 }, FONT_WEIGHTS: { medium: "500", semibold: "600", bold: "700" }, RADIUS: { md: 14, lg: 16, xl: 20 }, SHADOWS: {} }; });
jest.mock("../../services/pushNotifications", function () { return { registerTokenWithBackend: jest.fn() }; });
jest.mock("../../services/stripe", function () { return {}; });
jest.mock("../../services/biometrics", function () { return jest.fn(function () { return { isSensorAvailable: jest.fn(), simplePrompt: jest.fn() }; }); });

var Screen = require('./ConversationListScreen');

describe('ConversationListScreen', function () {
  it('renders without crash', function () {
    render(React.createElement(Screen));
  });
  it('shows expected content', function () {
    var { getByText } = render(React.createElement(Screen));
    expect(getByText('Messages')).toBeTruthy();
  });
});
