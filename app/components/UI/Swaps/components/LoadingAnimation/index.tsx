import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { Animated, View, StyleSheet, Image } from 'react-native';
import { WebView } from '@metamask/react-native-webview';
import { selectSelectedNetworkClientId } from '../../../../../selectors/networkController';
import Engine from '../../../../../core/Engine';
import Logger from '../../../../../util/Logger';
import Device from '../../../../../util/device';
import { strings } from '../../../../../../locales/i18n';
import Text from '../../../../Base/Text';
import Title from '../../../../Base/Title';
import { useTheme } from '../../../../../util/theme';
import { Colors } from '../../../../../util/theme/models';
import foxImage from '../../../../../images/branding/fox.png';
import ShapesBackgroundAnimation from './ShapesBackgroundAnimation';
import type { RootState } from '../../../../../reducers';

interface Props {
  /**
   * Whether to execute the "Finalizing" animation after the main sequence
   */
  finish?: boolean;
  /**
   * Function callback executed once both the main sequence and the finalizing animation ends
   */
  onAnimationEnd?: () => void;
  /**
   * Aggregator metadata from Swaps controller API
   */
  aggregatorMetadata?: Record<string, unknown>;
  /**
   * Whether to show head panning animation with aggregators logos
   */
  headPan?: boolean;
}

const createStyles = (colors: Colors, _shadows: Record<string, unknown>) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    foxWrapper: {
      width: Device.getDeviceWidth(),
      height: Device.getDeviceHeight(),
      position: 'absolute',
      top: 0,
      left: 0,
    },
    fox: {
      width: Device.getDeviceWidth(),
      height: Device.getDeviceHeight(),
      position: 'absolute',
      top: 0,
      left: 0,
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Device.getDeviceHeight() / 2.5,
      marginHorizontal: 50,
    },
    title: {
      fontSize: 24,
      color: colors.text.default,
      textAlign: 'center',
      marginBottom: 15,
    },
    text: {
      fontSize: 14,
      color: colors.text.alternative,
      textAlign: 'center',
      lineHeight: 20,
    },
    progressBarWrapper: {
      marginTop: 50,
      marginBottom: 20,
      width: Device.getDeviceWidth() - 100,
      height: 10,
      borderRadius: 10,
      backgroundColor: colors.border.muted,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    progressBar: {
      height: 10,
      borderRadius: 10,
      backgroundColor: colors.primary.default,
    },
    aggregatorImage: {
      width: 20,
      height: 20,
    },
    aggregatorContainer: {
      position: 'absolute',
    },
    foxImage: {
      width: 50,
      height: 50,
      position: 'absolute',
    },
    shapesWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: Device.getDeviceWidth(),
      height: Device.getDeviceHeight(),
    },
  });

function LoadingAnimation({
  finish,
  onAnimationEnd,
  aggregatorMetadata,
  headPan = true,
}: Props): React.ReactElement {
  const { colors, shadows } = useTheme();
  const styles = createStyles(colors, shadows);

  const [metadata, setMetadata] = useState<{ key: string; [key: string]: unknown }[]>([]);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [finalizingAnimationFinished, setFinalizingAnimationFinished] = useState(false);

  const selectedNetworkClientId = useSelector((state: RootState) =>
    selectSelectedNetworkClientId(state)
  );

  /* References */
  const foxRef = useRef<WebView>(null);
  const foxHeadPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const progressWidth = progressValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const foxImageOpacity = useRef(new Animated.Value(0)).current;
  const foxImageScale = useRef(new Animated.Value(0.8)).current;

  const getMetadata = useCallback(async () => {
    const { SwapsController } = Engine.context;
    try {
      await SwapsController.fetchAggregatorMetadataWithCache({
        networkClientId: selectedNetworkClientId,
      });
    } catch (error) {
      Logger.error(error as Error, 'Swaps: error while fetching aggregator metadata');
    }
  }, [selectedNetworkClientId]);

  const positions = useMemo(
    (): Record<string, [number, number, number, number]> =>
      headPan
        ? metadata.reduce((acc, curr, index) => {
            const deviceWidth = Device.getDeviceWidth();
            const deviceHeight = Device.getDeviceHeight();
            const centerX = deviceWidth / 2;
            const centerY = deviceHeight / 2.5;
            const radius = 100;
            const angle = (index / metadata.length) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            const panRadioX = x - 10;
            const panRadioY = y - 10;
            const radioX = x - 10;
            const radioY = y - 10;

            return {
              ...acc,
              [curr.key]: [panRadioX, panRadioY, radioX, radioY],
            };
          }, {} as Record<string, [number, number, number, number]>)
        : {},
    [metadata, headPan],
  );

  const opacities = useMemo(
    (): Record<string, Animated.Value> =>
      headPan
        ? metadata.reduce(
            (acc, curr) => ({
              ...acc,
              [curr.key]: new Animated.Value(0),
            }),
            {} as Record<string, Animated.Value>,
          )
        : {},
    [metadata, headPan],
  );

  const scales = useMemo(
    (): Record<string, Animated.Value> =>
      headPan
        ? metadata.reduce(
            (acc, curr) => ({
              ...acc,
              [curr.key]: new Animated.Value(0.5),
            }),
            {} as Record<string, Animated.Value>,
          )
        : {},
    [metadata, headPan],
  );

  const animateProgressBar = useCallback(() => {
    Animated.timing(progressValue, {
      toValue: 100,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      setAnimationFinished(true);
    });
  }, [progressValue]);

  const animateFoxImage = useCallback(() => {
    Animated.parallel([
      Animated.timing(foxImageOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(foxImageScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [foxImageOpacity, foxImageScale]);

  const animateAggregators = useCallback(() => {
    if (!headPan || metadata.length === 0) return;

    const animations = metadata.map((item, index) => {
      const delay = index * 200;
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacities[item.key], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scales[item.key], {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start();
  }, [headPan, metadata, opacities, scales]);

  const animateHeadPan = useCallback(() => {
    if (!headPan || metadata.length === 0) return;

    const animations = metadata.map((item, index) => {
      const [panX, panY] = positions[item.key] || [0, 0];
      const delay = index * 100;

      return Animated.sequence([
        Animated.delay(delay),
        Animated.timing(foxHeadPan, {
          toValue: { x: panX, y: panY },
          duration: 500,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.sequence(animations).start();
  }, [headPan, metadata, positions, foxHeadPan]);

  const animateFinalizingSequence = useCallback(() => {
    Animated.sequence([
      Animated.timing(foxHeadPan, {
        toValue: { x: 0, y: 0 },
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(progressValue, {
        toValue: 100,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setFinalizingAnimationFinished(true);
    });
  }, [foxHeadPan, progressValue]);

  const startAnimation = useCallback(() => {
    animateFoxImage();
    animateProgressBar();

    setTimeout(() => {
      animateAggregators();
      animateHeadPan();
    }, 1000);
  }, [animateFoxImage, animateProgressBar, animateAggregators, animateHeadPan]);

  useEffect(() => {
    if (aggregatorMetadata) {
      const metadataArray = Object.keys(aggregatorMetadata).map(key => ({
        key,
        ...(aggregatorMetadata[key] as Record<string, unknown>),
      }));
      setMetadata(metadataArray);
    }
  }, [aggregatorMetadata]);

  useEffect(() => {
    getMetadata();
  }, [getMetadata]);

  useEffect(() => {
    if (metadata.length > 0) {
      startAnimation();
    }
  }, [metadata, startAnimation]);

  useEffect(() => {
    if (finish && animationFinished) {
      animateFinalizingSequence();
    }
  }, [finish, animationFinished, animateFinalizingSequence]);

  useEffect(() => {
    if (finalizingAnimationFinished && onAnimationEnd) {
      onAnimationEnd();
    }
  }, [finalizingAnimationFinished, onAnimationEnd]);

  const injectJavaScript = useCallback((script: string) => {
    if (foxRef.current) {
      foxRef.current.injectJavaScript(script);
    }
  }, []);

  const handleWebViewLoad = useCallback(() => {
    const script = `
      window.updateFoxPosition = function(x, y) {
        const fox = document.getElementById('fox');
        if (fox) {
          fox.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
        }
      };
      true;
    `;
    injectJavaScript(script);
  }, [injectJavaScript]);

  useEffect(() => {
    const listener = foxHeadPan.addListener(({ x, y }) => {
      const script = `window.updateFoxPosition && window.updateFoxPosition(${x}, ${y}); true;`;
      injectJavaScript(script);
    });

    return () => {
      foxHeadPan.removeListener(listener);
    };
  }, [foxHeadPan, injectJavaScript]);

  const renderAggregatorLogos = () => {
    if (!headPan || metadata.length === 0) return null;

    return metadata.map((item) => {
      const [, , x, y] = positions[item.key] || [0, 0, 0, 0];
      const opacity = opacities[item.key];
      const scale = scales[item.key];
      const iconUri = typeof item.icon === 'string' ? item.icon : null;

      return (
        <Animated.View
          key={item.key}
          style={[
            styles.aggregatorContainer,
            {
              left: x,
              top: y,
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          {iconUri && (
            <Image
              source={{ uri: iconUri }}
              style={styles.aggregatorImage}
              resizeMode="contain"
            />
          )}
        </Animated.View>
      );
    });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.shapesWrapper}>
        <ShapesBackgroundAnimation
          width={Device.getDeviceWidth()}
          height={Device.getDeviceHeight()}
        />
      </View>

      <View style={styles.foxWrapper}>
        <WebView
          ref={foxRef}
          style={styles.fox}
          source={{
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body {
                      margin: 0;
                      padding: 0;
                      background: transparent;
                      overflow: hidden;
                    }
                    #fox {
                      position: absolute;
                      top: 50%;
                      left: 50%;
                      transform: translate(-50%, -50%);
                      transition: transform 0.3s ease;
                      width: 50px;
                      height: 50px;
                      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23FF6B35"/></svg>');
                      background-size: contain;
                      background-repeat: no-repeat;
                    }
                  </style>
                </head>
                <body>
                  <div id="fox"></div>
                </body>
              </html>
            `,
          }}
          onLoadEnd={handleWebViewLoad}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled
        />
      </View>

      {renderAggregatorLogos()}

      <Animated.View
        style={[
          styles.foxImage,
          {
            left: Device.getDeviceWidth() / 2 - 25,
            top: Device.getDeviceHeight() / 2.5 - 25,
            opacity: foxImageOpacity,
            transform: [{ scale: foxImageScale }],
          },
        ]}
      >
        <Image source={foxImage} style={styles.aggregatorImage} />
      </Animated.View>

      <View style={styles.content}>
        <Title style={styles.title}>
          {finish
            ? strings('swaps.finalizing_swap')
            : strings('swaps.fetching_quotes')}
        </Title>
        <Text style={styles.text}>
          {finish
            ? strings('swaps.finalizing_swap_description')
            : strings('swaps.fetching_quotes_description')}
        </Text>
        <View style={styles.progressBarWrapper}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export default LoadingAnimation;
