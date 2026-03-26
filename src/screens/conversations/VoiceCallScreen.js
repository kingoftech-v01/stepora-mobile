/**
 * VoiceCallScreen — Audio-only call using Agora SDK (react-native-agora).
 *
 * Uses FRIEND_CHAT.CALLS endpoints (not CONVERSATIONS.CALLS).
 * Supports both CALLER and CALLEE flows.
 * Synced with web: useVoiceCallScreen.js pattern.
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
var { FRIEND_CHAT } = require('../../services/endpoints');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING } = require('../../theme/tokens');

// Agora SDK imports
var {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} = require('react-native-agora');

var Config = require('../../config').default;
var logger = require('../../utils/logger');

var AGORA_APP_ID = Config.AGORA_APP_ID;

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

var formatDuration = function (s) {
  var mins = Math.floor(s / 60);
  var secs = s % 60;
  return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
};

var VoiceCallScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();

  // Route params from web pattern: callId, friendName, answering
  var callId = (route.params && route.params.callId) || (route.params && route.params.conversationId);
  var friendName = (route.params && route.params.friendName) || (route.params && route.params.title) || 'Voice Call';
  var answering = (route.params && route.params.answering) || false;

  var [callStatus, setCallStatus] = useState(answering ? 'connecting' : 'ringing');
  var [duration, setDuration] = useState(0);
  var [isMuted, setIsMuted] = useState(false);
  var [isSpeaker, setIsSpeaker] = useState(false);
  var [error, setError] = useState(null);
  var [remoteUid, setRemoteUid] = useState(null);
  var durationRef = useRef(null);
  var engineRef = useRef(null);
  var pollRef = useRef(null);

  // CALLER flow: poll for acceptance
  useEffect(
    function () {
      if (answering || !callId) return;

      function checkStatus() {
        apiGet(FRIEND_CHAT.CALLS.STATUS(callId))
          .then(function (data) {
            var s = data.status;
            if (s === 'accepted') {
              if (pollRef.current) clearInterval(pollRef.current);
              setCallStatus('connecting');
              joinRTC();
            } else if (s === 'rejected' || s === 'cancelled' || s === 'missed' || s === 'completed') {
              if (pollRef.current) clearInterval(pollRef.current);
              setCallStatus('ended');
              setError(
                s === 'rejected' ? 'Call declined'
                  : s === 'missed' ? 'No answer'
                  : 'Call ended'
              );
              setTimeout(function () {
                navigation.goBack();
              }, 1500);
            }
          })
          .catch(function (err) {
            logger.error('[VoiceCall] poll:', err);
          });
      }

      checkStatus();
      pollRef.current = setInterval(checkStatus, 2000);

      return function () {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    },
    [callId, answering],
  );

  // CALLEE flow: accept call
  useEffect(
    function () {
      if (!answering || !callId) return;
      apiPost(FRIEND_CHAT.CALLS.ACCEPT(callId))
        .then(function () {
          setCallStatus('connecting');
          joinRTC();
        })
        .catch(function (err) {
          setError(err.userMessage || err.message || 'Failed to accept call');
        });
    },
    [callId, answering],
  );

  // Auto-timeout for ringing
  useEffect(
    function () {
      if (callStatus !== 'ringing') return;
      var timeout = setTimeout(function () {
        apiPost(FRIEND_CHAT.CALLS.CANCEL(callId)).catch(function () {});
        setError('No answer');
        setTimeout(function () {
          navigation.goBack();
        }, 1500);
      }, 30000);
      return function () {
        clearTimeout(timeout);
      };
    },
    [callStatus, callId],
  );

  // Timer
  useEffect(
    function () {
      if (callStatus === 'active') {
        durationRef.current = setInterval(function () {
          setDuration(function (prev) {
            return prev + 1;
          });
        }, 1000);
      }
      return function () {
        if (durationRef.current) clearInterval(durationRef.current);
      };
    },
    [callStatus],
  );

  var joinRTC = function () {
    if (engineRef.current) return;

    requestAudioPermission()
      .then(function (granted) {
        if (!granted) {
          setError('Microphone permission denied');
          setCallStatus('ended');
          return Promise.reject(new Error('Permission denied'));
        }

        return apiGet(FRIEND_CHAT.AGORA.RTC_TOKEN + '?channel=' + callId);
      })
      .then(function (agoraData) {
        if (!agoraData) return;

        var engine = createAgoraRtcEngine();
        engine.initialize({
          appId: agoraData.appId || AGORA_APP_ID,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });

        engine.registerEventHandler({
          onJoinChannelSuccess: function () {
            setCallStatus('active');
          },
          onUserJoined: function (_connection, uid) {
            setRemoteUid(uid);
          },
          onUserOffline: function (_connection, uid) {
            setRemoteUid(function (prev) {
              return prev === uid ? null : prev;
            });
            handleEndCall();
          },
          onError: function (err, msg) {
            logger.error('[VoiceCall] Agora error:', err, msg);
          },
        });

        engine.enableAudio();
        engine.disableVideo();
        engine.setEnableSpeakerphone(false);

        var token = agoraData.token || '';
        var uid = agoraData.uid || 0;
        engine.joinChannel(token, String(callId), uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        });

        engineRef.current = engine;
      })
      .catch(function (err) {
        logger.error('[VoiceCall] join error:', err);
        setError(err.userMessage || err.message || 'Could not connect');
        setCallStatus('ended');
      });
  };

  var handleEndCall = useCallback(
    function () {
      if (durationRef.current) clearInterval(durationRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      setCallStatus('ended');
      if (callId) {
        apiPost(FRIEND_CHAT.CALLS.END(callId)).catch(function () {});
      }
      if (engineRef.current) {
        try {
          engineRef.current.leaveChannel();
          engineRef.current.release();
        } catch (e) {
          logger.warn('[VoiceCall] cleanup error:', e);
        }
        engineRef.current = null;
      }
      setTimeout(function () {
        navigation.goBack();
      }, 500);
    },
    [navigation, callId],
  );

  var handleCancelCall = useCallback(
    function () {
      if (callId) {
        apiPost(FRIEND_CHAT.CALLS.CANCEL(callId)).catch(function () {});
      }
      if (pollRef.current) clearInterval(pollRef.current);
      navigation.goBack();
    },
    [navigation, callId],
  );

  // Cleanup on unmount
  useEffect(function () {
    return function () {
      if (durationRef.current) clearInterval(durationRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (engineRef.current) {
        try {
          engineRef.current.leaveChannel();
          engineRef.current.release();
        } catch (e) {
          logger.warn('[VoiceCall] cleanup error:', e);
        }
        engineRef.current = null;
      }
    };
  }, []);

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

  var statusText = error
    ? error
    : callStatus === 'ringing' ? 'Calling...'
    : callStatus === 'connecting' ? 'Connecting...'
    : callStatus === 'active' ? formatDuration(duration)
    : callStatus === 'ended' ? 'Call ended'
    : '...';

  return React.createElement(
    View,
    { style: styles.container },
    // Top area with avatar and status
    React.createElement(
      View,
      { style: styles.topArea },
      React.createElement(View, { style: styles.ring3 }),
      React.createElement(View, { style: styles.ring2 }),
      React.createElement(View, { style: styles.ring1 }),
      React.createElement(Avatar, { name: friendName, size: 100, color: COLORS.purple }),
      React.createElement(Text, { style: styles.callerName }, friendName),
      callStatus === 'connecting'
        ? React.createElement(
            View,
            { style: styles.statusRow },
            React.createElement(ActivityIndicator, { size: 'small', color: COLORS.purple }),
            React.createElement(Text, { style: styles.statusText }, statusText)
          )
        : React.createElement(Text, { style: styles.statusText }, statusText),
      callStatus === 'active' && remoteUid === null
        ? React.createElement(
            Text,
            { style: styles.waitingText },
            'Waiting for other participant...'
          )
        : null
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
          onPress: callStatus === 'ringing' ? handleCancelCall : handleEndCall,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: callStatus === 'ringing' ? 'Cancel call' : 'End call',
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
