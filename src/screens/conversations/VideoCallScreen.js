/**
 * VideoCallScreen — Video call using Agora SDK (react-native-agora).
 *
 * Initializes the Agora RTC engine, fetches a token from the backend,
 * joins a channel, and renders local + remote video views.
 * Controls: mute audio, mute video, switch camera, end call.
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
var { CONVERSATIONS } = require('../../services/endpoints');
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
var SCREEN_W = Dimensions.get('window').width;
var SCREEN_H = Dimensions.get('window').height;

/**
 * Request camera + microphone permissions on Android.
 * iOS permissions are handled via Info.plist at the OS level.
 */
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
  // iOS: permissions requested automatically by the system
  return Promise.resolve(true);
};

var VideoCallScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var conversationId = route.params && route.params.conversationId;
  var callTitle = (route.params && route.params.title) || 'Video Call';
  var [callState, setCallState] = useState('connecting'); // connecting | ringing | active | ended
  var [duration, setDuration] = useState(0);
  var [isMuted, setIsMuted] = useState(false);
  var [isVideoOff, setIsVideoOff] = useState(false);
  var [isSpeaker, setIsSpeaker] = useState(true);
  var [remoteUid, setRemoteUid] = useState(null);
  var durationRef = useRef(null);
  var callIdRef = useRef(null);
  var engineRef = useRef(null);

  // Initialize call
  useEffect(function () {
    var cancelled = false;

    var initCall = function () {
      // 1. Request device permissions
      requestPermissions()
        .then(function (granted) {
          if (cancelled) return;
          if (!granted) {
            console.error('[VideoCall] Camera/microphone permissions denied');
            setCallState('ended');
            return Promise.reject(new Error('Permissions denied'));
          }

          // 2. Initiate call on backend
          return apiPost(CONVERSATIONS.CALLS.INITIATE, {
            conversation_id: conversationId,
            call_type: 'video',
          });
        })
        .then(function (data) {
          if (cancelled || !data) return;
          callIdRef.current = data.id || data.callId;
          setCallState('ringing');

          // 3. Get Agora RTC token from backend
          var channelName = data.channelName || conversationId;
          return apiGet(CONVERSATIONS.AGORA.RTC_TOKEN + '?channel=' + channelName).then(
            function (agoraData) {
              if (cancelled) return;
              return { agoraData: agoraData, channelName: channelName };
            }
          );
        })
        .then(function (result) {
          if (cancelled || !result) return;
          var agoraData = result.agoraData;
          var channelName = result.channelName;

          // 4. Create and initialize Agora engine
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
                startDurationTimer();
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
              console.error('[VideoCall] Agora error:', err, msg);
            },
          });

          // Enable video
          engine.enableVideo();
          engine.startPreview();

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
            console.error('[VideoCall] init error:', err);
            setCallState('ended');
          }
        });
    };

    initCall();

    return function () {
      cancelled = true;
      if (durationRef.current) clearInterval(durationRef.current);
      if (engineRef.current) {
        try {
          engineRef.current.leaveChannel();
          engineRef.current.release();
        } catch (e) {
          console.warn('[VideoCall] cleanup error:', e);
        }
        engineRef.current = null;
      }
      if (callIdRef.current) {
        apiPost(CONVERSATIONS.CALLS.END(callIdRef.current)).catch(function () {});
      }
    };
  }, [conversationId]);

  var startDurationTimer = function () {
    durationRef.current = setInterval(function () {
      setDuration(function (prev) {
        return prev + 1;
      });
    }, 1000);
  };

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
          console.warn('[VideoCall] end call cleanup error:', e);
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

  // Render remote video area
  var renderRemoteVideo = function () {
    if (callState === 'connecting') {
      return React.createElement(
        View,
        { style: styles.centerWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple, accessibilityLabel: 'Connecting call' }),
        React.createElement(Text, { style: styles.statusText, accessibilityLiveRegion: 'polite' }, 'Connecting...')
      );
    }
    if (callState === 'ringing') {
      return React.createElement(
        View,
        { style: styles.centerWrap },
        React.createElement(Avatar, { name: callTitle, size: 80, color: COLORS.purple }),
        React.createElement(Text, { style: styles.callerName }, callTitle),
        React.createElement(Text, { style: styles.statusText }, 'Ringing...')
      );
    }
    if (callState === 'active') {
      if (remoteUid !== null) {
        // Render remote user's video via Agora RtcSurfaceView
        return React.createElement(RtcSurfaceView, {
          style: styles.remoteVideoSurface,
          canvas: { uid: remoteUid },
        });
      }
      // Remote user not yet joined — show avatar placeholder
      return React.createElement(
        View,
        { style: styles.centerWrap },
        React.createElement(Avatar, { name: callTitle, size: 100, color: COLORS.purple }),
        React.createElement(Text, { style: styles.callerName }, callTitle),
        React.createElement(Text, { style: styles.durationText }, formatDuration(duration)),
        React.createElement(Text, { style: styles.waitingText }, 'Waiting for other participant...')
      );
    }
    // ended
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
    callState === 'active' && remoteUid !== null
      ? React.createElement(
          View,
          { style: styles.durationOverlay },
          React.createElement(Text, { style: styles.durationOverlayText }, formatDuration(duration))
        )
      : null,

    // Local video PIP (shows own camera feed)
    callState === 'active' && !isVideoOff
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
          accessibilityState: { selected: isMuted },
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
          accessibilityState: { selected: isVideoOff },
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
          onPress: handleEndCall,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'End call',
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
  localVideoText: {
    fontSize: 12,
    color: COLORS.textMuted,
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
