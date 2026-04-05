/**
 * Tests for src/components/SubscriptionGate.js
 */
var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');
var { Text } = require('react-native');

// ─── Controllable auth state ──────────────────────────────────
var mockHasSubscription = jest.fn(function () { return false; });

jest.mock('../context/AuthContext', function () {
  return {
    useAuth: function () {
      return {
        hasSubscription: mockHasSubscription,
      };
    },
  };
});

var mockNavigate = jest.fn();
jest.mock('@react-navigation/native', function () {
  return {
    useNavigation: function () {
      return {
        navigate: mockNavigate,
      };
    },
  };
});

// Override Feather mock for this test (SubscriptionGate uses Icon.default)
jest.mock('react-native-vector-icons/Feather', function () {
  var _React = require('react');
  return {
    default: function (props) {
      return _React.createElement('Text', { testID: 'icon-' + props.name }, props.name);
    },
  };
});

var SubscriptionGate = require('./SubscriptionGate');

beforeEach(function () {
  mockHasSubscription.mockClear();
  mockNavigate.mockClear();
});

// Helper: stringify the tree to check for text
function treeContainsText(json, text) {
  var str = JSON.stringify(json);
  return str.indexOf(text) !== -1;
}

describe('SubscriptionGate', function () {
  it('renders children when user has access', function () {
    mockHasSubscription.mockReturnValue(true);
    var { getByText } = render(React.createElement(SubscriptionGate, {
      required: 'premium',
    },
      React.createElement(Text, null, 'Premium content'),
    ));
    expect(getByText('Premium content')).toBeTruthy();
  });

  it('shows lock overlay when user lacks access (via accessibility label)', function () {
    mockHasSubscription.mockReturnValue(false);
    var { getByLabelText } = render(React.createElement(SubscriptionGate, {
      required: 'premium',
    },
      React.createElement(Text, null, 'Hidden content'),
    ));
    // The outer container has the full message as accessibilityLabel
    expect(getByLabelText(/Premium Plan Required/)).toBeTruthy();
  });

  it('includes feature name in accessibility label on overlay', function () {
    mockHasSubscription.mockReturnValue(false);
    var { getByLabelText } = render(React.createElement(SubscriptionGate, {
      required: 'premium',
      feature: 'AI Coaching',
    },
      React.createElement(Text, null, 'Hidden'),
    ));
    expect(getByLabelText(/AI Coaching is available on the Premium plan/)).toBeTruthy();
  });

  it('contains upgrade button in the tree', function () {
    mockHasSubscription.mockReturnValue(false);
    var { toJSON } = render(React.createElement(SubscriptionGate, {
      required: 'premium',
    },
      React.createElement(Text, null, 'Hidden'),
    ));
    // Check the rendered tree contains the upgrade button text
    expect(treeContainsText(toJSON(), 'Upgrade to Premium')).toBe(true);
  });

  it('renders compact variant when compact prop is true', function () {
    mockHasSubscription.mockReturnValue(false);
    var { getByLabelText } = render(React.createElement(SubscriptionGate, {
      required: 'pro',
      compact: true,
    },
      React.createElement(Text, null, 'Hidden'),
    ));
    expect(getByLabelText(/Pro plan required.*Tap to upgrade/)).toBeTruthy();
  });

  it('compact variant shows feature name', function () {
    mockHasSubscription.mockReturnValue(false);
    var { getByLabelText } = render(React.createElement(SubscriptionGate, {
      required: 'premium',
      feature: 'Focus Timer',
      compact: true,
    },
      React.createElement(Text, null, 'Hidden'),
    ));
    expect(getByLabelText(/Focus Timer requires Premium/)).toBeTruthy();
  });

  it('compact variant navigates on press', function () {
    mockHasSubscription.mockReturnValue(false);
    var { getByLabelText } = render(React.createElement(SubscriptionGate, {
      required: 'premium',
      compact: true,
    },
      React.createElement(Text, null, 'Hidden'),
    ));
    fireEvent.press(getByLabelText(/Tap to upgrade/));
    expect(mockNavigate).toHaveBeenCalledWith('Subscription');
  });

  it('supports legacy requiredPlan prop', function () {
    mockHasSubscription.mockReturnValue(false);
    var { getByLabelText } = render(React.createElement(SubscriptionGate, {
      requiredPlan: 'pro',
    },
      React.createElement(Text, null, 'Hidden'),
    ));
    expect(getByLabelText(/Pro Plan Required/)).toBeTruthy();
  });

  it('supports legacy featureName prop', function () {
    mockHasSubscription.mockReturnValue(false);
    var { getByLabelText } = render(React.createElement(SubscriptionGate, {
      required: 'premium',
      featureName: 'Custom Feature',
    },
      React.createElement(Text, null, 'Hidden'),
    ));
    expect(getByLabelText(/Custom Feature is available/)).toBeTruthy();
  });

  it('has alert accessibility role on overlay', function () {
    mockHasSubscription.mockReturnValue(false);
    var { getByRole } = render(React.createElement(SubscriptionGate, {
      required: 'premium',
    },
      React.createElement(Text, null, 'Hidden'),
    ));
    expect(getByRole('alert')).toBeTruthy();
  });

  it('passes requiredPlan to hasSubscription', function () {
    mockHasSubscription.mockReturnValue(false);
    render(React.createElement(SubscriptionGate, {
      required: 'pro',
    },
      React.createElement(Text, null, 'Hidden'),
    ));
    expect(mockHasSubscription).toHaveBeenCalledWith('pro');
  });
});
