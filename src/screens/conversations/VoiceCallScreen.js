/**
 * VoiceCallScreen — Audio-only call using Agora SDK (react-native-agora).
 *
 * Initializes the Agora RTC engine in audio-only mode, fetches a token
 * from the backend, joins a channel, and manages call state.
 * Controls: mute, speaker toggle, end call.
 */
var React = require('react');
var { useState, useEffect, useCallback, useRef } = React;
var {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} = require('react-native');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { apiGet, apiPost } = require('../../services/api');
var { CONVERSATIONS } = require('../../services/endpoints');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING } = require('../../theme/tokens');

// Agora SDK imports
var {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} = require('react-native-agora');

var AGORA_APP_ID = 'b67aeb35dbff4cb8a70278fb8e3edf46';

/**
 * Request microphone permission on Android.
 * iOS permissions are handled via Info.plist at the OS level.
 */
var requestAudioPermission = function () {
  if (Platform.OS === 'android') {
    return PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    ).then(function (result) {
      return result === PermissionsAndroid.RESULTS.GRANTED;
    });
  }
  return Promise.resolve(true);
};

var VoiceCallScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var conversationId = route.params && route.params.conversationId;
  var callTitle = (route.params && route.params.title) || 'Voice Call';
  var [callState, setCallState] = useState('connecting');
  var [duration, setDuration] = useState(0);
  var [isMuted, setIsMuted] = useState(false);
  var [isSpeaker, setIsSpeaker] = useState(false);
  var [remoteUid, setRemoteUid] = useState(null);
  var durationRef = useRef(null);
  var callIdRef = useRef(null);
  var engineRef = useRef(null);

  useEffect(function () {
    var cancelled = false;

    // 1. Request audio permission
    requestAudioPermission()
      .then(function (granted) {
        if (cancelled) return;
        if (!granted) {
          console.error('[VoiceCall] Microphone permission denied');
          setCallState('ended');
          return Promise.reject(new Error('Permission denied'));
        }

        // 2. Initiate call on backend
        return apiPost(CONVERSATIONS.CALLS.INITIATE, {
          conversation_id: conversationId,
          call_type: 'audio',
        });
      })
      .then(function (data) {
        if (cancelled || !data) return;
        callIdRef.current = data.id || data.callId;
        setCallState('ringing');

        // 3. Get Agora RTC token from backend
        var channelName = data.channelName || conversationId;
        return apiGet(
          CONVERSATIONS.AGORA.RTC_TOKEN + '?channel=' + channelName
        ).then(function (agoraData) {
          if (cancelled) return;
          return { agoraData: agoraData, channelName: channelName };
        });
      })
      .then(function (result) {
        if (cancelled || !result) return;
        var agoraData = result.agoraData;
        var channelName = result.channelName;

        // 4. Create and initialize Agora engine (audio only)
        var engine = createAgoraRtcEngine();
        engine.initialize({
          appId: agoraData.appId || AGORA_APP_ID,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });

        // Register event handlers
        engine.registerEventHandler({
          onJoinChannelSuccess: function (_connection, _elapsed) {
            if (!cancelled) {
              setCallState('active');
              durationRef.current = setInterval(function () {
                setDuration(function (prev) {
                  return prev + 1;
                });
              }, 1000);
            }
          },
          onUserJoined: function (_connection, uid, _elapsed) {
            if (!cancelled) {
              setRemoteUid(uid);
            }
          },
          onUserOffline: function (_connection, uid, _reason) {
            if (!cancelled) {
              setRemoteUid(function (prev) {
                return prev === uid ? null : prev;
              });
            }
          },
          onError: function (err, msg) {
            console.error('[VoiceCall] Agora error:', err, msg);
          },
        });

        // Enable audio only (no video)
        engine.enableAudio();
        engine.disableVideo();

        // Set default speaker mode (earpiece for voice calls)
        engine.setEnableSpeakerphone(false);

        // Join channel
        var token = agoraData.token || '';
        var uid = agoraData.uid || 0;
        engine.joinChannel(token, channelName, uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        });

        engineRef.current = engine;
      })
      .catch(function (err) {
        if (!cancelled) {
          console.error('[VoiceCall] init error:', err);
          setCallState('ended');
        }
      });

    return function () {
      cancelled = true;
      if (durationRef.current) clearInterval(durationRef.current);
      if (engineRef.current) {
        try {
          engineRef.current.leaveChannel();
          engineRef.current.release();
        } catch (e) {
          console.warn('[VoiceCall] cleanup error:', e);
        }
        engineRef.current = null;
      }
      if (callIdRef.current) {
        apiPost(CONVERSATIONS.CALLS.END(callIdRef.current)).catch(function () {});
      }
    };
  }, [conversationId]);

  var formatDuration = function (s) {
    var mins = Math.floor(s / 60);
    var secs = s % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  };

  var handleEndCall = useCallback(
    function () {
      if (durationRef.current) clearInterval(durationRef.current);
      setCallState('ended');
      if (callIdRef.current) {
        apiPost(CONVERSATIONS.CALLS.END(callIdRef.current)).catch(function () {});
      }
      if (engineRef.current) {
        try {
          engineRef.current.leaveChannel();
          engineRef.current.release();
        } catch (e) {
          console.warn('[VoiceCall] end call cleanup error:', e);
        }
        engineRef.current = null;
      }
      setTimeout(function () {
        navigation.goBack();
      }, 500);
    },
    [navigation]
  );

  var handleToggleMute = useCallback(function () {
    setIsMuted(function (prev) {
      var newVal = !prev;
      if (engineRef.current) {
        engineRef.current.muteLocalAudioStream(newVal);
      }
      return newVal;
    });
  }, []);

  var handleToggleSpeaker = useCallback(function () {
    setIsSpeaker(function (prev) {
      var newVal = !prev;
      if (engineRef.current) {
        engineRef.current.setEnableSpeakerphone(newVal);
      }
      return newVal;
    });
  }, []);

  return React.createElement(
    View,
    { style: styles.container },
    // Top area with avatar and status
    React.createElement(
      View,
      { style: styles.topArea },
      // Decorative rings
      React.createElement(View, { style: styles.ring3 }),
      React.createElement(View, { style: styles.ring2 }),
      React.createElement(View, { style: styles.ring1 }),
      React.createElement(Avatar, { name: callTitle, size: 100, color: COLORS.purple }),
      React.createElement(Text, { style: styles.callerName }, callTitle),
      callState === 'connecting'
        ? React.createElement(
            View,
            { style: styles.statusRow },
            React.createElement(ActivityIndicator, { size: 'small', color: COLORS.purple }),
            React.createElement(Text, { style: styles.statusText }, 'Connecting...')
          )
        : callState === 'ringing'
          ? React.createElement(Text, { style: styles.statusText }, 'Ringing...')
          : callState === 'active'
            ? React.createElement(
                View,
                { style: styles.activeInfo },
                React.createElement(
                  Text,
                  { style: styles.durationText },
                  formatDuration(duration)
                ),
                remoteUid === null
                  ? React.createElement(
                      Text,
                      { style: styles.waitingText },
                      'Waiting for other participant...'
                    )
                  : null
              )
            : React.createElement(Text, { style: styles.statusText }, 'Call ended')
    ),

    // Controls
    React.createElement(
      View,
      { style: styles.controls },
      React.createElement(
        TouchableOpacity,
        {
          style: [styles.controlBtn, isMuted && styles.controlBtnActive],
          onPress: handleToggleMute,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: isMuted ? 'Unmute microphone' : 'Mute microphone',
          accessibilityState: { selected: isMuted },
        },
        React.createElement(Icon, {
          name: isMuted ? 'mic-off' : 'mic',
          size: 24,
          color: isMuted ? COLORS.red : '#FFFFFF',
        }),
        React.createElement(
          Text,
          { style: styles.controlLabel, accessible: false },
          isMuted ? 'Unmute' : 'Mute'
        )
      ),
      React.createElement(
        TouchableOpacity,
        {
          style: [styles.controlBtn, styles.endCallBtn],
          onPress: handleEndCall,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'End call',
        },
        React.createElement(Icon, { name: 'phone-off', size: 28, color: '#FFFFFF' })
      ),
      React.createElement(
        TouchableOpacity,
        {
          style: [styles.controlBtn, isSpeaker && styles.controlBtnActive],
          onPress: handleToggleSpeaker,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: isSpeaker ? 'Turn off speaker' : 'Turn on speaker',
          accessibilityState: { selected: isSpeaker },
        },
        React.createElement(Icon, {
          name: 'volume-2',
          size: 24,
          color: isSpeaker ? COLORS.purple : '#FFFFFF',
        }),
        React.createElement(Text, { style: styles.controlLabel, accessible: false }, 'Speaker')
      )
    )
  );
};

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
    justifyContent: 'space-between',
  },
  topArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring3: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.08)',
  },
  ring2: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.12)',
  },
  ring1: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.18)',
  },
  callerName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginLeft: 8,
  },
  activeInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  durationText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  waitingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 24,
    paddingBottom: 60,
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.red,
  },
  controlLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 6,
    position: 'absolute',
    bottom: -18,
  },
});

module.exports = VoiceCallScreen;
