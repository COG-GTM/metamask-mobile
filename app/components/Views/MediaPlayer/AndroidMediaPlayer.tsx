import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Video, { OnLoadData, OnProgressData, OnSeekData } from 'react-native-video';
import {
  PanResponder,
  StyleSheet,
  Animated,
  SafeAreaView,
  Easing,
  Image,
  View,
  Text,
  TouchableNativeFeedback,
  TouchableHighlight,
  ViewStyle,
  TextStyle,
  ImageStyle,
  GestureResponderEvent,
  PanResponderGestureState,
  LayoutChangeEvent,
  StyleProp,
} from 'react-native';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import AntIcon from 'react-native-vector-icons/AntDesign';
import { baseStyles, colors as importedColors } from '../../../styles/common';
import { useTheme } from '../../../util/theme';
import { Theme } from '../../../util/theme/models';

interface Styles {
  playerContainer: ViewStyle;
  playerVideo: ViewStyle;
  errorContainer: ViewStyle;
  errorIcon: ImageStyle;
  errorText: TextStyle;
  loaderContainer: ViewStyle;
  controlsRow: ViewStyle;
  controlsColumn: ViewStyle;
  controlsControl: ViewStyle;
  controlsTop: ViewStyle;
  controlsBottom: ViewStyle;
  controlsTopControlGroup: ViewStyle;
  controlsBottomControlGroup: ViewStyle;
  controlsPlayPause: ViewStyle;
  controlsMuteUnmute: ViewStyle;
  seekbarContainer: ViewStyle;
  seekbarTrack: ViewStyle;
  seekbarFill: ViewStyle;
  seekbarPermanentFill: ViewStyle;
  seekbarHandle: ViewStyle;
  seekbarCircle: ViewStyle;
  actionButton: ViewStyle;
  actionSeeker: ViewStyle;
  actionButtons: TextStyle;
}

const createStyles = (theme: Theme): Styles =>
  StyleSheet.create({
    playerContainer: {
      flex: 0,
      overflow: 'hidden',
      zIndex: 99999,
      elevation: 99999,
    },
    playerVideo: {
      flex: 1,
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: theme.colors.background.alternative,
      borderRadius: 12,
    },
    errorContainer: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorIcon: {
      marginBottom: 16,
    },
    errorText: {},
    loaderContainer: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    controlsColumn: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    controlsControl: {
      padding: 14,
    },
    controlsTop: {
      flex: 1,
      justifyContent: 'flex-start',
      padding: 4,
    },
    controlsBottom: {
      flex: 1,
      justifyContent: 'flex-end',
      padding: 4,
    },
    controlsTopControlGroup: {
      alignSelf: 'flex-end',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    controlsBottomControlGroup: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    controlsPlayPause: {
      left: 1,
    },
    controlsMuteUnmute: {
      left: -1,
      top: -1,
      width: '110%',
    },
    seekbarContainer: {
      alignSelf: 'stretch',
      height: 44,
      marginLeft: 20,
      marginRight: 20,
    },
    seekbarTrack: {
      height: 1,
      position: 'relative',
      top: 20,
      width: '100%',
    },
    seekbarFill: {
      height: 4,
      width: '100%',
      borderRadius: 2,
      backgroundColor: theme.brandColors.white,
    },
    seekbarPermanentFill: {
      width: '100%',
      backgroundColor: importedColors.blackTransparent,
    },
    seekbarHandle: {
      marginLeft: -10,
      height: 28,
      width: 28,
    },
    seekbarCircle: {
      borderRadius: 14,
      top: 14,
      height: 14,
      width: 14,
      backgroundColor: theme.brandColors.white,
    },
    actionButton: {
      width: 44,
      height: 44,
      backgroundColor: importedColors.blackTransparent,
      borderRadius: 8,
    },
    actionSeeker: {
      flex: 1,
      marginHorizontal: 8,
    },
    actionButtons: {
      color: theme.brandColors.white,
    },
  });

interface TextTrack {
  title: string;
  language: string;
  type: string;
  uri: string;
}

interface SelectedTextTrack {
  type: string;
  value?: string | number;
}

interface VideoPlayerProps {
  controlsAnimationTiming?: number;
  controlsToggleTiming?: number;
  source: { uri: string } | number;
  displayTopControls?: boolean;
  displayBottomControls?: boolean;
  onClose?: () => void;
  onLoad?: () => void;
  onError?: (error: unknown) => void;
  textTracks?: TextTrack[];
  selectedTextTrack?: SelectedTextTrack;
  style?: StyleProp<ViewStyle>;
}

export default function VideoPlayer({
  controlsAnimationTiming = 500,
  controlsToggleTiming = 5000,
  source,
  displayTopControls = true,
  displayBottomControls = true,
  onClose,
  onError,
  textTracks,
  selectedTextTrack,
  onLoad: propsOnLoad,
  style,
}: VideoPlayerProps): React.ReactElement {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [seekerFillWidth, setSeekerFillWidth] = useState(0);
  const [seekerPosition, setSeekerPosition] = useState(0);
  const [seekerOffset, setSeekerOffset] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [originallyPaused, setOriginallyPaused] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [seekerWidth, setSeekerWidth] = useState(0);

  const videoRef = useRef<Video>(null);

  const controlsTimeout = useRef<NodeJS.Timeout>();

  const theme = useTheme();
  const styles = createStyles(theme);

  const animations = {
    bottomControl: {
      marginBottom: useRef(new Animated.Value(0)).current,
      opacity: useRef(new Animated.Value(0)).current,
    },
    topControl: {
      marginTop: useRef(new Animated.Value(0)).current,
      opacity: useRef(new Animated.Value(0)).current,
    },
    video: {
      opacity: useRef(new Animated.Value(1)).current,
    },
    loader: {
      rotate: useRef(new Animated.Value(0)).current,
      MAX_VALUE: 360,
    },
  };

  const hideControlAnimation = useCallback((): void => {
    Animated.parallel([
      Animated.timing(animations.topControl.opacity, {
        toValue: 0,
        duration: controlsAnimationTiming,
        useNativeDriver: false,
      }),
      Animated.timing(animations.bottomControl.opacity, {
        toValue: 0,
        duration: controlsAnimationTiming,
        useNativeDriver: false,
      }),
    ]).start();
  }, [
    controlsAnimationTiming,
    animations.bottomControl.opacity,
    animations.topControl.opacity,
  ]);

  const hideControls = useCallback((): void => {
    setShowControls(true);
    hideControlAnimation();
  }, [hideControlAnimation]);

  const resetControlsTimeout = useCallback((): void => {
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      hideControls();
    }, controlsToggleTiming);
  }, [controlsToggleTiming, hideControls]);

  const showControlAnimation = useCallback((): void => {
    Animated.parallel([
      Animated.timing(animations.topControl.opacity, {
        toValue: 1,
        useNativeDriver: false,
        duration: controlsAnimationTiming,
      }),
      Animated.timing(animations.bottomControl.opacity, {
        toValue: 1,
        useNativeDriver: false,
        duration: controlsAnimationTiming,
      }),
    ]).start(() => resetControlsTimeout());
  }, [
    controlsAnimationTiming,
    animations.bottomControl.opacity,
    animations.topControl.opacity,
    resetControlsTimeout,
  ]);

  const toggleControls = (): void => {
    if (showControls) {
      showControlAnimation();
    }
    setShowControls(!showControls);
  };

  const togglePlayPause = useCallback((): void => setPaused(!paused), [paused]);

  const toggleMuted = useCallback((): void => setMuted(!muted), [muted]);

  const constrainToSeekerMinMax = useCallback(
    (val = 0): number => {
      if (val <= 0) {
        return 0;
      } else if (val >= seekerWidth) {
        return seekerWidth;
      }
      return val;
    },
    [seekerWidth],
  );

  const updateSeekerPosition = useCallback(
    (position: number): void => {
      if (!position) return;
      position = constrainToSeekerMinMax(position);
      setSeekerFillWidth(position);
      setSeekerPosition(position);
      setSeekerOffset(position);
    },
    [constrainToSeekerMinMax],
  );

  const loadAnimation = (): void => {
    if (loading) {
      Animated.sequence([
        Animated.timing(animations.loader.rotate, {
          toValue: animations.loader.MAX_VALUE,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: false,
          isInteraction: false,
        }),
        Animated.timing(animations.loader.rotate, {
          toValue: 0,
          duration: 0,
          easing: Easing.linear,
          useNativeDriver: false,
          isInteraction: false,
        }),
      ]).start(loadAnimation);
    }
  };

  const onLoadStart = (): void => {
    loadAnimation();
    setLoading(true);
  };

  const onLoad = (data: OnLoadData): void => {
    propsOnLoad?.();
    setDuration(data.duration);
    setLoading(false);
  };

  const onProgress = (data: OnProgressData): void => {
    if (!scrubbing && !seeking && data?.seekableDuration > 0) {
      const position = data.currentTime / data.seekableDuration;
      updateSeekerPosition(position * seekerWidth);
    }
  };

  const onSeek = (data: OnSeekData): void => {
    if (scrubbing) {
      if (!seeking) {
        setPaused(originallyPaused);
      }
      setScrubbing(false);
    }
  };

  const onScreenTouch = (): void => {
    if (showControls) {
      toggleControls();
    } else {
      resetControlsTimeout();
    }
  };

  const calculateTimeFromSeekerPosition = useCallback((): number => {
    const percent = seekerPosition / seekerWidth;
    return duration * percent;
  }, [seekerPosition, seekerWidth, duration]);

  const seekTo = (time = 0): void => {
    videoRef.current?.seek(time);
  };

  const seekPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (
          evt: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ): boolean => true,
        onMoveShouldSetPanResponder: (
          evt: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ): boolean => true,

        onPanResponderGrant: (
          evt: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ): void => {
          const position = evt.nativeEvent.locationX;
          updateSeekerPosition(position);
          setPaused(false);
          setSeeking(true);
          setOriginallyPaused(paused);
          setScrubbing(false);
        },

        onPanResponderMove: (
          evt: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ): void => {
          const position = seekerOffset + gestureState.dx;
          updateSeekerPosition(position);

          if (!loading && !scrubbing) {
            const time = calculateTimeFromSeekerPosition();

            if (time < duration) {
              setScrubbing(true);
              setTimeout(() => {
                seekTo(time);
              }, 1);
            }
          }
        },

        onPanResponderRelease: (
          evt: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ): void => {
          const time = calculateTimeFromSeekerPosition();
          if (time >= duration && !loading) {
            setPaused(true);
          } else if (scrubbing) {
            setSeeking(false);
          } else {
            seekTo(time);
            setPaused(originallyPaused);
            setSeeking(false);
          }
        },
      }),
    [
      updateSeekerPosition,
      calculateTimeFromSeekerPosition,
      duration,
      loading,
      originallyPaused,
      paused,
      scrubbing,
      seekerOffset,
    ],
  );

  const renderControl = useCallback(
    (
      children: React.ReactNode,
      callback: () => void,
      controlStyle: ViewStyle = {},
    ): React.ReactElement => (
      <TouchableHighlight
        underlayColor="transparent"
        onPress={callback}
        style={[styles.controlsControl, controlStyle]}
      >
        {children as React.ReactElement}
      </TouchableHighlight>
    ),
    [styles],
  );

  const renderMuteUnmuteControl = useCallback(
    (): React.ReactElement =>
      renderControl(
        <FA5Icon
          color={styles.actionButtons.color}
          size={18}
          name={`volume-${muted ? 'mute' : 'up'}`}
        />,
        toggleMuted,
        styles.controlsMuteUnmute,
      ),
    [muted, toggleMuted, styles, renderControl],
  );

  const onLayoutSeekerWidth = useCallback(
    (event: LayoutChangeEvent): void =>
      setSeekerWidth(event.nativeEvent.layout.width),
    [],
  );

  useEffect(() => clearTimeout(controlsTimeout.current), []);

  const renderSeekbar = useCallback(
    (): React.ReactElement => (
      <View
        style={styles.seekbarContainer}
        collapsable={false}
        {...seekPanResponder.panHandlers}
      >
        <View style={styles.seekbarTrack}>
          <View style={[styles.seekbarFill, styles.seekbarPermanentFill]} />
        </View>
        <View
          style={styles.seekbarTrack}
          onLayout={onLayoutSeekerWidth}
          pointerEvents={'none'}
        >
          <View
            style={[
              styles.seekbarFill,
              {
                width: seekerFillWidth,
              },
            ]}
            pointerEvents={'none'}
          />
        </View>

        <View
          style={[styles.seekbarHandle, { left: seekerPosition }]}
          pointerEvents={'none'}
        >
          <View style={styles.seekbarCircle} pointerEvents={'none'} />
        </View>
      </View>
    ),
    [
      seekerPosition,
      seekPanResponder.panHandlers,
      seekerFillWidth,
      onLayoutSeekerWidth,
      styles,
    ],
  );

  const renderPlayPause = useCallback(
    (): React.ReactElement =>
      renderControl(
        <FA5Icon
          color={styles.actionButtons.color}
          size={16}
          name={paused ? 'play' : 'pause'}
        />,
        togglePlayPause,
        styles.controlsPlayPause,
      ),
    [paused, togglePlayPause, styles, renderControl],
  );

  const renderLoader = useCallback((): React.ReactElement | undefined => {
    if (!loading) return;
    return (
      <View style={styles.loaderContainer}>
        <Animated.Image
          style={{
            transform: [
              {
                rotate: animations.loader.rotate.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }}
        />
      </View>
    );
  }, [loading, animations.loader.rotate, styles]);

  const renderError = (): React.ReactElement | undefined => {
    if (!error) return;
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Image style={styles.errorIcon} />
          <Text style={styles.errorText}>Video unavailable</Text>
        </View>
      );
    }
  };

  const renderClose = useCallback(
    (): React.ReactElement =>
      renderControl(
        <AntIcon color={styles.actionButtons.color} size={16} name={'close'} />,
        onClose || (() => {}),
        {},
      ),
    [onClose, renderControl, styles],
  );

  const renderTopControls = (): React.ReactElement => (
    <Animated.View
      style={[
        styles.controlsTop,
        {
          opacity: animations.bottomControl.opacity,
        },
      ]}
    >
      <View style={[styles.controlsColumn]}>
        <SafeAreaView
          style={[styles.controlsRow, styles.controlsTopControlGroup]}
        >
          <View style={styles.actionButton}>{renderClose()}</View>
        </SafeAreaView>
      </View>
    </Animated.View>
  );

  const renderBottomControls = (): React.ReactElement => (
    <Animated.View
      style={[
        styles.controlsBottom,
        {
          opacity: animations.bottomControl.opacity,
        },
      ]}
    >
      <View style={[styles.controlsColumn]}>
        <SafeAreaView
          style={[styles.controlsRow, styles.controlsBottomControlGroup]}
        >
          <View style={styles.actionButton}>{renderPlayPause()}</View>
          <View style={[styles.actionButton, styles.actionSeeker]}>
            {renderSeekbar()}
          </View>
          <View style={styles.actionButton}>{renderMuteUnmuteControl()}</View>
        </SafeAreaView>
      </View>
    </Animated.View>
  );
  return (
    <TouchableNativeFeedback
      onPress={onScreenTouch}
      style={[styles.playerContainer, style]}
    >
      <View style={baseStyles.flexGrow}>
        <Video
          ref={videoRef}
          paused={paused}
          muted={muted}
          onLoad={onLoad}
          onError={onError}
          onSeek={onSeek}
          onLoadStart={onLoadStart}
          onProgress={onProgress}
          style={styles.playerVideo}
          textTracks={textTracks}
          selectedTextTrack={selectedTextTrack}
          source={source}
          resizeMode="contain"
          repeat
        />
        {renderError()}
        {renderLoader()}
        {onClose && displayTopControls && renderTopControls()}
        {displayBottomControls && renderBottomControls()}
      </View>
    </TouchableNativeFeedback>
  );
}
