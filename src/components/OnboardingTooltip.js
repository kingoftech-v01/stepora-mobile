/**
 * OnboardingTooltip — First-visit tooltip bubble with glass morphism style.
 *
 * Props:
 *   id         — Unique tooltip identifier (used as AsyncStorage key)
 *   message    — Text to display in the tooltip bubble
 *   position   — 'top' | 'bottom' (where the bubble appears relative to target)
 *   targetRef  — React ref to the element to point at (optional)
 *   targetY    — Manual Y position override (if targetRef is not used)
 *   targetX    — Manual X position override (if targetRef is not used)
 *   onSkip     — Optional callback when user taps Skip
 *   offsetY    — Extra vertical offset from the target element (default 8)
 *   skipLabel  — Custom label for the skip button (default 'Skip')
 *   visible    — External visibility control (overrides internal hook if provided)
 *   onDismiss  — External dismiss callback (used with external visible control)
 */
var React = require('react');
var { useRef, useState, useEffect, useCallback } = React;
var {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Dimensions,
  Modal,
  Platform,
} = require('react-native');
var useOnboardingTooltip = require('../hooks/useOnboardingTooltip');
var { COLORS, SPACING, RADIUS } = require('../theme/tokens');
var { BRAND } = require('../styles/colors');

var SCREEN = Dimensions.get('window');
var TOOLTIP_MAX_WIDTH = 250;
var TOOLTIP_MIN_WIDTH = 180;
var ARROW_SIZE = 8;
var EDGE_PADDING = 16;

var OnboardingTooltip = function (props) {
  var id = props.id;
  var message = props.message || '';
  var position = props.position || 'bottom';
  var targetRef = props.targetRef;
  var targetY = props.targetY;
  var targetX = props.targetX;
  var onSkip = props.onSkip;
  var offsetY = props.offsetY != null ? props.offsetY : 8;
  var skipLabel = props.skipLabel || 'Skip';
  var externalVisible = props.visible;
  var externalDismiss = props.onDismiss;

  // Internal visibility from hook (only used if external visible is not provided)
  var hook = useOnboardingTooltip(id);
  var isVisible = externalVisible != null ? externalVisible : hook.visible;
  var handleDismiss = externalDismiss || hook.dismiss;

  var fadeAnim = useRef(new Animated.Value(0)).current;
  var [measured, setMeasured] = useState(false);
  var [targetLayout, setTargetLayout] = useState(null);

  // Measure the target element position
  useEffect(function () {
    if (!isVisible) return;

    if (targetRef && targetRef.current) {
      // Small delay to ensure layout is complete
      var timer = setTimeout(function () {
        if (targetRef.current && targetRef.current.measureInWindow) {
          targetRef.current.measureInWindow(function (x, y, width, height) {
            if (width > 0 || height > 0) {
              setTargetLayout({ x: x, y: y, width: width, height: height });
              setMeasured(true);
            } else {
              // Fallback: element not yet measured, use center
              setTargetLayout(null);
              setMeasured(true);
            }
          });
        } else {
          setMeasured(true);
        }
      }, 300);

      return function () { clearTimeout(timer); };
    } else if (targetY != null) {
      setTargetLayout({
        x: targetX != null ? targetX : SCREEN.width / 2,
        y: targetY,
        width: 0,
        height: 0,
      });
      setMeasured(true);
    } else {
      // No target — show centered
      setMeasured(true);
    }
  }, [isVisible, targetRef, targetY, targetX]);

  // Fade-in animation
  useEffect(function () {
    if (isVisible && measured) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isVisible, measured, fadeAnim]);

  var handleSkip = useCallback(function () {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(function () {
      handleDismiss();
      if (onSkip) onSkip();
    });
  }, [fadeAnim, handleDismiss, onSkip]);

  var handleOverlayPress = useCallback(function () {
    handleSkip();
  }, [handleSkip]);

  if (!isVisible || !measured) return null;

  // Calculate tooltip position
  var tooltipStyle = {};
  var arrowStyle = {};
  var arrowPosition = 'none'; // 'top' or 'bottom' — indicates where the arrow points

  if (targetLayout) {
    var targetCenterX = targetLayout.x + targetLayout.width / 2;
    var tooltipLeft = Math.max(
      EDGE_PADDING,
      Math.min(
        targetCenterX - TOOLTIP_MAX_WIDTH / 2,
        SCREEN.width - TOOLTIP_MAX_WIDTH - EDGE_PADDING
      )
    );

    if (position === 'bottom') {
      // Tooltip below target — arrow on top of tooltip pointing up
      tooltipStyle.top = targetLayout.y + targetLayout.height + offsetY + ARROW_SIZE;
      tooltipStyle.left = tooltipLeft;
      arrowPosition = 'top';
      arrowStyle.top = targetLayout.y + targetLayout.height + offsetY;
      arrowStyle.left = Math.max(
        EDGE_PADDING + 12,
        Math.min(targetCenterX - ARROW_SIZE, SCREEN.width - EDGE_PADDING - 12 - ARROW_SIZE * 2)
      );
    } else {
      // Tooltip above target — arrow on bottom of tooltip pointing down
      tooltipStyle.left = tooltipLeft;
      arrowPosition = 'bottom';
      // We need to estimate tooltip height; set bottom relative to target top
      tooltipStyle.bottom = SCREEN.height - targetLayout.y + offsetY + ARROW_SIZE;
      arrowStyle.bottom = SCREEN.height - targetLayout.y + offsetY;
      arrowStyle.left = Math.max(
        EDGE_PADDING + 12,
        Math.min(targetCenterX - ARROW_SIZE, SCREEN.width - EDGE_PADDING - 12 - ARROW_SIZE * 2)
      );
    }
  } else {
    // Centered fallback
    tooltipStyle.top = SCREEN.height * 0.35;
    tooltipStyle.left = (SCREEN.width - TOOLTIP_MAX_WIDTH) / 2;
    arrowPosition = 'none';
  }

  // Arrow triangle
  var renderArrow = function () {
    if (arrowPosition === 'none') return null;

    var triangleStyle = arrowPosition === 'top'
      ? [styles.arrowUp, arrowStyle]
      : [styles.arrowDown, arrowStyle];

    return React.createElement(View, { style: triangleStyle });
  };

  return React.createElement(
    Modal,
    {
      visible: true,
      transparent: true,
      animationType: 'none',
      statusBarTranslucent: true,
      onRequestClose: handleSkip,
    },
    React.createElement(
      TouchableWithoutFeedback,
      { onPress: handleOverlayPress },
      React.createElement(
        View,
        { style: styles.overlay },
        // Arrow
        React.createElement(
          Animated.View,
          { style: { opacity: fadeAnim, position: 'absolute', zIndex: 11 } },
          renderArrow()
        ),
        // Tooltip bubble
        React.createElement(
          Animated.View,
          {
            style: [
              styles.tooltip,
              tooltipStyle,
              { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.92, 1],
              }) }] },
            ],
          },
          React.createElement(
            TouchableWithoutFeedback,
            { onPress: function () { /* prevent overlay dismiss when tapping tooltip */ } },
            React.createElement(
              View,
              { style: styles.tooltipInner },
              // Message
              React.createElement(
                Text,
                { style: styles.message },
                message
              ),
              // Skip button
              React.createElement(
                TouchableOpacity,
                {
                  onPress: handleSkip,
                  style: styles.skipBtn,
                  activeOpacity: 0.6,
                  hitSlop: { top: 8, bottom: 8, left: 12, right: 12 },
                  accessible: true,
                  accessibilityRole: 'button',
                  accessibilityLabel: skipLabel + ' tooltip',
                  accessibilityHint: 'Dismisses this onboarding tooltip',
                },
                React.createElement(
                  Text,
                  { style: styles.skipText },
                  skipLabel
                )
              )
            )
          )
        )
      )
    )
  );
};

var styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tooltip: {
    position: 'absolute',
    maxWidth: TOOLTIP_MAX_WIDTH,
    minWidth: TOOLTIP_MIN_WIDTH,
    zIndex: 10,
  },
  tooltipInner: {
    backgroundColor: 'rgba(20, 15, 40, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    // Glass glow effect
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(248, 250, 252, 0.9)',
    fontWeight: '400',
    marginBottom: SPACING.sm,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND.purpleLight,
    opacity: 0.8,
  },
  arrowUp: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(20, 15, 40, 0.92)',
  },
  arrowDown: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(20, 15, 40, 0.92)',
  },
});

module.exports = OnboardingTooltip;
