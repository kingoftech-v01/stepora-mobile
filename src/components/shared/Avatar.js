/**
 * Avatar — User avatar component with initials fallback.
 */
var React = require('react');
var { View, Text, Image, StyleSheet } = require('react-native');

var Avatar = function (props) {
  var name = props.name || '';
  var src = props.src || null;
  var size = props.size || 40;
  var color = props.color || '#8B5CF6';
  var style = props.style;

  var initial = (name[0] || '?').toUpperCase();

  var containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  var a11yLabel = (name ? name + ' avatar' : 'User avatar');

  if (src) {
    return React.createElement(
      View,
      {
        accessible: true,
        accessibilityRole: 'image',
        accessibilityLabel: a11yLabel,
        style: [containerStyle, style],
      },
      React.createElement(Image, {
        source: { uri: src },
        style: { width: size, height: size, borderRadius: size / 2 },
        accessible: false,
      }),
    );
  }

  return React.createElement(
    View,
    {
      accessible: true,
      accessibilityRole: 'image',
      accessibilityLabel: a11yLabel,
      style: [containerStyle, style],
    },
    React.createElement(
      Text,
      {
        accessible: false,
        style: {
          color: '#FFFFFF',
          fontSize: size * 0.4,
          fontWeight: '700',
        },
      },
      initial,
    ),
  );
};

module.exports = Avatar;
