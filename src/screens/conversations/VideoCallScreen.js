/**
 * VideoCallScreen — Video call using Agora SDK (react-native-agora).
 *
 * Uses FRIEND_CHAT.CALLS endpoints (not CONVERSATIONS.CALLS).
 * Supports both CALLER and CALLEE flows.
 * Synced with web: useVideoCallScreen.js pattern.
 */
var React = require('react');
var { useState, useEffect, useCallback, useRef } = React;
var {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
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
  RtcSurfaceView,
  VideoSourceType,
} = require('react-native-agora');

var AGORA_APP_ID = 'b67aeb35dbff4cb8a70278fb8e3edf46';

var requestPermissions = function () {
  if (Platform.OS === 'android') {
    return PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]).then(function (results) {
      var cameraGranted =
        results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      var audioGranted =
        results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      return cameraGranted && audioGranted;
    });
  }
  return Promise.resolve(true);
};

var formatDuration = function (s) {
  var mins = Math.floor(s / 60);
  var secs = s % 60;
  return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
};

var VideoCallScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();

  // Route params from web pattern: callId, friendName, answering
  var callId = (route.params && route.params.callId) || (route.params && route.params.conversationId);
  var friendName = (route.params && route.params.friendName) || (route.params && route.params.title) || 'Video Call';
  var answering = (route.params && route.params.answering) || false;

  var [callStatus, setCallStatus] = useState(answering ? 'connecting' : 'ringing');
  var [duration, setDuration] = useState(0);
  var [isMuted, setIsMuted] = useState(false);
  var [isVideoOff, setIsVideoOff] = useState(false);
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
            console.error('[VideoCall] poll:', err);
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

    requestPermissions()
      .then(function (granted) {
        if (!granted) {
          setError('Camera/microphone permission denied');
          setCallStatus('ended');
          return Promise.reject(new Error('Permissions denied'));
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
            console.error('[VideoCall] Agora error:', err, msg);
          },
        });

        engine.enableVideo();
        engine.startPreview();

        var token = agoraData.token || '';
        var uid = agoraData.uid || 0;
        engine.joinChannel(token, String(callId), uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        });

        engineRef.current = engine;
      })
      .catch(function (err) {
        console.error('[VideoCall] join error:', err);
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
          console.warn('[VideoCall] cleanup error:', e);
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
          console.warn('[VideoCall] cleanup error:', e);
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

  var handleToggleVideo = useCallback(function () {
    setIsVideoOff(function (prev) {
      var newVal = !prev;
      if (engineRef.current) {
        engineRef.current.muteLocalVideoStream(newVal);
      }
      return newVal;
    });
  }, []);

  var handleFlipCamera = useCallback(function () {
    if (engineRef.current) {
      engineRef.current.switchCamera();
    }
  }, []);

  var statusText = error
    ? error
    : callStatus === 'ringing' ? 'Calling...'
    : callStatus === 'connecting' ? 'Connecting...'
    : callStatus === 'active' ? formatDuration(duration)
    : callStatus === 'ended' ? 'Call ended'
    : '...';

  // Render remote video area
  var renderRemoteVideo = function () {
    if (callStatus === 'connecting') {
      return React.createElement(
        View,
        { style: styles.centerWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
        React.createElement(Text, { style: styles.statusText }, 'Connecting...')
      );
    }
    if (callStatus === 'ringing') {
      return React.createElement(
        View,
        { style: styles.centerWrap },
        React.createElement(Avatar, { name: friendName, size: 80, color: COLORS.purple }),
        React.createElement(Text, { style: styles.callerName }, friendName),
        React.createElement(Text, { style: styles.statusText }, 'Ringing...')
      );
    }
    if (callStatus === 'active') {
      if (remoteUid !== null) {
        return React.createElement(RtcSurfaceView, {
          style: styles.remoteVideoSurface,
          canvas: { uid: remoteUid },
        });
      }
      return React.createElement(
        View,
        { style: styles.centerWrap },
        React.createElement(Avatar, { name: friendName, size: 100, color: COLORS.purple }),
        React.createElement(Text, { style: styles.callerName }, friendName),
        React.createElement(Text, { style: styles.durationText }, formatDuration(duration)),
        React.createElement(Text, { style: styles.waitingText }, 'Waiting for other participant...')
      );
    }
    return React.createElement(
      View,
      { style: styles.centerWrap },
      React.createElement(Text, { style: styles.statusText }, 'Call ended')
    );
  };

  return React.createElement(
    View,
    { style: styles.container },
    // Remote video area
    React.createElement(View, { style: styles.remoteVideo }, renderRemoteVideo()),

    // Duration overlay when remote video is showing
    callStatus === 'active' && remoteUid !== null
      ? React.createElement(
          View,
          { style: styles.durationOverlay },
          React.createElement(Text, { style: styles.durationOverlayText }, formatDuration(duration))
        )
      : null,

    // Local video PIP
    callStatus === 'active' && !isVideoOff
      ? React.createElement(
          View,
          { style: styles.localVideo },
          React.createElement(RtcSurfaceView, {
            style: styles.localVideoSurface,
            canvas: { uid: 0, sourceType: VideoSourceType.VideoSourceCamera },
            zOrderMediaOverlay: true,
          })
        )
      : null,

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
        },
        React.createElement(Icon, {
          name: isMuted ? 'mic-off' : 'mic',
          size: 22,
          color: isMuted ? COLORS.red : '#FFFFFF',
        })
      ),
      React.createElement(
        TouchableOpacity,
        {
          style: [styles.controlBtn, isVideoOff && styles.controlBtnActive],
          onPress: handleToggleVideo,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: isVideoOff ? 'Turn on camera' : 'Turn off camera',
        },
        React.createElement(Icon, {
          name: isVideoOff ? 'video-off' : 'video',
          size: 22,
          color: isVideoOff ? COLORS.red : '#FFFFFF',
        })
      ),
      React.createElement(
        TouchableOpacity,
        { style: styles.controlBtn, onPress: handleFlipCamera, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Switch camera' },
        React.createElement(Icon, { name: 'refresh-cw', size: 22, color: '#FFFFFF' })
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
        React.createElement(Icon, { name: 'phone-off', size: 22, color: '#FFFFFF' })
      )
    )
  );
};

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remoteVideoSurface: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centerWrap: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  callerName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  durationText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  waitingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  durationOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  durationOverlayText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  localVideo: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  localVideoSurface: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingBottom: 48,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  endCallBtn: {
    backgroundColor: COLORS.red,
  },
});

module.exports = VideoCallScreen;
