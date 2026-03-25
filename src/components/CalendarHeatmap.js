/**
 * CalendarHeatmap -- GitHub-style productivity heatmap for React Native.
 *
 * Props:
 *   data       - Array of { date, count, level } (from /api/users/streaks/calendar)
 *   startDate  - Date object (first day, default: 365 days ago)
 *   endDate    - Date object (last day, default: today)
 *   onDayPress - function(dateString) called when a cell is pressed
 *   days       - Number of days to show (default 365)
 *
 * Displays a horizontally scrollable grid of small colored cells.
 * Color intensity based on activity level (0-3) using purple gradient.
 */
var React = require('react');
var { useState, useMemo, useRef, useCallback, useEffect } = React;
var {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  Modal,
} = require('react-native');
var { useQuery } = require('@tanstack/react-query');
var { apiGet } = require('../services/api');
var { USERS } = require('../services/endpoints');
var { COLORS, SPACING, RADIUS } = require('../theme/tokens');
var { BRAND } = require('../styles/colors');
var Icon = require('react-native-vector-icons/Feather').default;

var SCREEN_WIDTH = Dimensions.get('window').width;
var CELL_SIZE = 13;
var CELL_GAP = 3;
var DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];
var DAY_LABEL_WIDTH = 22;

var SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ── Level -> color mapping (purple gradient) ──
var levelColor = function (level) {
  if (level <= 0) return 'rgba(255,255,255,0.04)';
  if (level === 1) return 'rgba(139,92,246,0.2)';
  if (level === 2) return 'rgba(139,92,246,0.45)';
  return BRAND.purple; // level 3
};

var levelBorder = function (level) {
  if (level <= 0) return 'rgba(255,255,255,0.04)';
  return 'rgba(139,92,246,0.12)';
};

// ── Date helpers ──
var formatDateISO = function (d) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
};

var addDays = function (d, n) {
  var r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

var getMonday = function (d) {
  var date = new Date(d);
  var day = date.getDay();
  var diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

// ── Tooltip modal for day details ──
var DayTooltip = function (props) {
  var info = props.info;
  var visible = props.visible;
  var onClose = props.onClose;

  if (!info || !visible) return null;

  var dateObj = new Date(info.date + 'T00:00:00');
  var dateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  var levelLabel = ['No activity', 'Light', 'Moderate', 'High'][info.level || 0];

  return React.createElement(Modal, {
    transparent: true,
    visible: visible,
    animationType: 'fade',
    onRequestClose: onClose,
  },
    React.createElement(TouchableOpacity, {
      style: tooltipStyles.backdrop,
      activeOpacity: 1,
      onPress: onClose,
    },
      React.createElement(View, { style: tooltipStyles.container },
        React.createElement(Text, { style: tooltipStyles.dateText }, dateLabel),
        React.createElement(View, { style: tooltipStyles.divider }),
        React.createElement(View, { style: tooltipStyles.row },
          React.createElement(Text, { style: tooltipStyles.label }, 'Activity'),
          React.createElement(View, { style: tooltipStyles.levelRow },
            React.createElement(View, {
              style: [tooltipStyles.levelDot, { backgroundColor: levelColor(info.level || 0) }],
            }),
            React.createElement(Text, { style: tooltipStyles.value }, levelLabel)
          )
        ),
        React.createElement(View, { style: tooltipStyles.row },
          React.createElement(Text, { style: tooltipStyles.label }, 'Tasks'),
          React.createElement(Text, {
            style: [tooltipStyles.value, { color: BRAND.green }],
          }, String(info.count || 0))
        )
      )
    )
  );
};

// ── Main Component ──
var CalendarHeatmap = function (props) {
  var days = props.days || 365;
  var onDayPress = props.onDayPress;
  var fadeAnim = useRef(new Animated.Value(0)).current;
  var scrollRef = useRef(null);
  var [tooltipInfo, setTooltipInfo] = useState(null);
  var [tooltipVisible, setTooltipVisible] = useState(false);

  // ── API Query ──
  var heatmapQuery = useQuery({
    queryKey: ['streak-calendar', days],
    queryFn: function () {
      return apiGet(USERS.STREAKS_CALENDAR + '?days=' + days);
    },
    staleTime: 1000 * 60 * 10,
  });

  var rawData = (heatmapQuery.data && heatmapQuery.data.heatmap) || [];

  // Build lookup: date string -> data row
  var dataMap = useMemo(function () {
    var map = {};
    for (var i = 0; i < rawData.length; i++) {
      map[rawData[i].date] = rawData[i];
    }
    return map;
  }, [rawData]);

  // Compute date range
  var dateRange = useMemo(function () {
    var end = new Date();
    end.setHours(0, 0, 0, 0);
    var start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    return { start: start, end: end };
  }, [days]);

  // Build weeks grid
  var grid = useMemo(function () {
    var monday = getMonday(dateRange.start);
    var weeks = [];
    var current = new Date(monday);

    while (current <= dateRange.end || current.getDay() !== 1) {
      var week = [];
      for (var d = 0; d < 7; d++) {
        var dateStr = formatDateISO(current);
        var inRange = current >= dateRange.start && current <= dateRange.end;
        week.push({
          date: dateStr,
          inRange: inRange,
          month: current.getMonth(),
          year: current.getFullYear(),
        });
        current = addDays(current, 1);
      }
      weeks.push(week);
      if (current > addDays(dateRange.end, 7)) break;
    }
    return weeks;
  }, [dateRange]);

  // Month labels with positions
  var monthLabels = useMemo(function () {
    var labels = [];
    var lastMonth = -1;
    for (var w = 0; w < grid.length; w++) {
      for (var d = 0; d < 7; d++) {
        var cell = grid[w][d];
        if (cell.inRange && cell.month !== lastMonth) {
          labels.push({ label: SHORT_MONTHS[cell.month], weekIdx: w });
          lastMonth = cell.month;
          break;
        }
      }
    }
    return labels;
  }, [grid]);

  var gridWidth = grid.length * (CELL_SIZE + CELL_GAP);

  // ── Fade in ──
  useEffect(function () {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Scroll to end (most recent) on mount
  useEffect(function () {
    if (scrollRef.current && grid.length > 0) {
      var timer = setTimeout(function () {
        if (scrollRef.current) {
          scrollRef.current.scrollToEnd({ animated: false });
        }
      }, 100);
      return function () { clearTimeout(timer); };
    }
  }, [grid.length]);

  var handleCellPress = useCallback(function (cell) {
    var info = dataMap[cell.date] || {
      date: cell.date,
      count: 0,
      level: 0,
    };
    setTooltipInfo(info);
    setTooltipVisible(true);
    if (onDayPress) onDayPress(cell.date);
  }, [dataMap, onDayPress]);

  var handleCloseTooltip = useCallback(function () {
    setTooltipVisible(false);
  }, []);

  // ── Legend items ──
  var legendLevels = [0, 1, 2, 3];

  // ── Summary stats ──
  var totalActive = useMemo(function () {
    var count = 0;
    for (var i = 0; i < rawData.length; i++) {
      if (rawData[i].count > 0) count++;
    }
    return count;
  }, [rawData]);

  if (heatmapQuery.isLoading) {
    return React.createElement(View, { style: styles.container },
      React.createElement(View, { style: styles.loadingPlaceholder },
        React.createElement(Text, { style: styles.loadingText }, 'Loading activity...')
      )
    );
  }

  if (heatmapQuery.isError) return null;

  return React.createElement(Animated.View, { style: [styles.container, { opacity: fadeAnim }] },

    // Title + summary
    React.createElement(View, { style: styles.header },
      React.createElement(View, null,
        React.createElement(Text, {
          style: styles.title,
          accessibilityRole: 'header',
        }, 'Activity'),
        React.createElement(Text, { style: styles.subtitle },
          totalActive + ' active day' + (totalActive !== 1 ? 's' : '') +
          ' in the last ' + days + ' days'
        )
      ),
      React.createElement(View, { style: styles.calendarIcon },
        React.createElement(Icon, { name: 'calendar', size: 16, color: COLORS.purple })
      )
    ),

    // Month labels
    React.createElement(View, { style: styles.monthLabelsContainer },
      React.createElement(View, { style: { width: DAY_LABEL_WIDTH } }),
      React.createElement(ScrollView, {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        scrollEnabled: false,
        style: { flex: 1 },
      },
        React.createElement(View, { style: [styles.monthLabelsRow, { width: gridWidth }] },
          monthLabels.map(function (ml, i) {
            return React.createElement(Text, {
              key: i,
              style: [styles.monthLabel, {
                position: 'absolute',
                left: ml.weekIdx * (CELL_SIZE + CELL_GAP),
              }],
            }, ml.label);
          })
        )
      )
    ),

    // Grid area
    React.createElement(View, { style: styles.gridArea },
      // Day-of-week labels
      React.createElement(View, { style: styles.dayLabels },
        DAY_LABELS.map(function (label, i) {
          return React.createElement(View, {
            key: i,
            style: styles.dayLabelCell,
          },
            React.createElement(Text, { style: styles.dayLabelText }, label)
          );
        })
      ),

      // Scrollable heatmap
      React.createElement(ScrollView, {
        ref: scrollRef,
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        style: { flex: 1 },
        contentContainerStyle: { paddingRight: 4 },
      },
        React.createElement(View, { style: [styles.weeksContainer, { width: gridWidth }] },
          grid.map(function (week, wi) {
            return React.createElement(View, {
              key: wi,
              style: styles.weekColumn,
            },
              week.map(function (cell, di) {
                if (!cell.inRange) {
                  return React.createElement(View, {
                    key: di,
                    style: styles.emptyCell,
                  });
                }

                var info = dataMap[cell.date];
                var level = info ? info.level : 0;
                var bg = levelColor(level);
                var border = levelBorder(level);

                return React.createElement(TouchableOpacity, {
                  key: di,
                  style: [styles.cell, {
                    backgroundColor: bg,
                    borderColor: border,
                  }],
                  activeOpacity: 0.6,
                  onPress: function () { handleCellPress(cell); },
                  accessible: true,
                  accessibilityLabel: cell.date + ', activity level ' + level,
                });
              })
            );
          })
        )
      )
    ),

    // Legend
    React.createElement(View, { style: styles.legend },
      React.createElement(Text, { style: styles.legendText }, 'Less'),
      legendLevels.map(function (l, i) {
        return React.createElement(View, {
          key: i,
          style: [styles.legendCell, {
            backgroundColor: levelColor(l),
            borderColor: levelBorder(l),
          }],
        });
      }),
      React.createElement(Text, { style: styles.legendText }, 'More')
    ),

    // Tooltip
    React.createElement(DayTooltip, {
      info: tooltipInfo,
      visible: tooltipVisible,
      onClose: handleCloseTooltip,
    })
  );
};

// ─── Styles ─────────────────────────────────────────────────
var styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
  },
  loadingPlaceholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  calendarIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Month labels
  monthLabelsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    overflow: 'hidden',
  },
  monthLabelsRow: {
    position: 'relative',
    height: 16,
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Grid
  gridArea: {
    flexDirection: 'row',
    gap: 0,
  },
  dayLabels: {
    width: DAY_LABEL_WIDTH,
    flexShrink: 0,
    gap: CELL_GAP,
  },
  dayLabelCell: {
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  dayLabelText: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // Weeks
  weeksContainer: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekColumn: {
    flexDirection: 'column',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
    borderWidth: 1,
  },
  emptyCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginHorizontal: 2,
  },
  legendCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
    borderWidth: 1,
  },
});

// ── Tooltip styles ──
var tooltipStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'rgba(10,6,20,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    borderRadius: 14,
    padding: 16,
    minWidth: 200,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(139,92,246,0.15)',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.purple,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

module.exports = CalendarHeatmap;
