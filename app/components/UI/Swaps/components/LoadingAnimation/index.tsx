import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import {
  Animated,
  View,
  StyleSheet,
  Image,
  ImageStyle,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { selectSelectedNetworkClientId } from '../../../../../selectors/networkController';
import Engine from '../../../../../core/Engine';
import Logger from '../../../../../util/Logger';
import Device from '../../../../../util/device';
import { strings } from '../../../../../../locales/i18n';

import Text from '../../../../Base/Text';
import Title from '../../../../Base/Title';
import { useTheme } from '../../../../../util/theme';
import foxImage from '../../../../../images/branding/fox.png';
import ShapesBackgroundAnimation from './ShapesBackgroundAnimation';
import { Theme } from '../../../../../util/theme/models';

const ANIM_MULTIPLIER = 0.67;
const INITIAL_DELAY = 1000 * ANIM_MULTIPLIER;
const DELAY = 1000 * ANIM_MULTIPLIER;
const PAN_DURATION = 500 * ANIM_MULTIPLIER;
const FINISH_DURATION = 750 * ANIM_MULTIPLIER;

const IS_NARROW = Device.getDeviceWidth() <= 320;
const STAGE_SIZE = IS_NARROW ? 240 : 260;
const AGG_RADIO = STAGE_SIZE * (IS_NARROW ? 0.2 : 0.25);
const PAN_RADIO = STAGE_SIZE * 0.6;

const FINALIZING_PERCENTAGE = 80;

interface Styles {
  screen: ViewStyle;
  content: ViewStyle;
  progressWrapper: ViewStyle;
  progressBar: ViewStyle;
  aggContainer: ViewStyle;
  aggImage: ImageStyle;
  foxContainer: ViewStyle;
  text: TextStyle;
  foxWrapper: ViewStyle;
  foxImage: ImageStyle;
  backgroundShapes: ViewStyle;
}

const createStyles = (colors: Theme['colors'], shadows: Theme['shadows']) =>
  StyleSheet.create<Styles>({
    screen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.default,
    },
    content: {
      width: '100%',
      paddingHorizontal: 60,
      marginVertical: 15,
    },
    progressWrapper: {
      backgroundColor: colors.primary.muted,
      height: 3,
      borderRadius: 3,
      marginVertical: 15,
    },
    progressBar: {
      backgroundColor: colors.primary.default,
      height: 3,
      width: 3,
      borderRadius: 3,
      flex: 1,
    },
    aggContainer: {
      position: 'absolute',
      backgroundColor: colors.background.default,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      opacity: 0,
      top: '50%',
      left: '50%',
      ...shadows.size.sm,
      elevation: 15,
    },
    aggImage: {
      width: 75,
      height: 30,
    },
    foxContainer: {
      width: STAGE_SIZE,
      height: STAGE_SIZE,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: colors.text.default,
    },
    foxWrapper: {
      position: 'relative',
      width: STAGE_SIZE,
      height: STAGE_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    foxImage: {
      width: 100,
      height: 100,
      zIndex: 2,
    },
    backgroundShapes: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

function round(value: number, decimals: number): number {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
}

interface AggregatorMetadataItem {
  key: string;
  title?: string;
  color?: string;
  iconPng?: string;
}

interface AggregatorMetadata {
  [key: string]: {
    title?: string;
    color?: string;
    iconPng?: string;
  };
}

interface LoadingAnimationProps {
  finish?: boolean;
  onAnimationEnd?: () => void;
  aggregatorMetadata?: AggregatorMetadata;
  headPan?: boolean;
}

interface WebViewRef {
  injectJavaScript?: (js: string) => void;
  reload?: () => void;
}

function LoadingAnimation({
  finish,
  onAnimationEnd,
  aggregatorMetadata,
  headPan = true,
}: LoadingAnimationProps) {
  const [metadata, setMetadata] = useState<AggregatorMetadataItem[]>([]);
  const [shouldStart, setShouldStart] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [hasStartedFinishing, setHasStartedFinishing] = useState(false);
  const [renderLogos, setRenderLogos] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const selectedNetworkClientId = useSelector(selectSelectedNetworkClientId);

  const foxRef = useRef<WebViewRef>();
  const foxHeadPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const currentQuoteIndexValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const progressWidth = progressValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const { colors, shadows } = useTheme();
  const styles = createStyles(colors, shadows);

  const positions = useMemo(
    () =>
      headPan
        ? metadata.reduce<Record<string, [number, number, number, number]>>(
            (acc, curr, index) => {
              const y = Math.random() * 0.6 * (Math.random() < 0.5 ? -1 : 1);
              const isNegativeY = y < 0;

              const isNegativeX =
                Math.random() < 0.7 ? index % 2 === 0 : Math.random() < 0.5;
              const x = isNegativeX ? -1 : 1;

              const panRadioX = (x + (0.8 * Math.random() - 0.8)) * PAN_RADIO;
              const panRadioY = y * PAN_RADIO;

              const radioY = AGG_RADIO * y - (isNegativeY ? 40 : 0);
              const radioX =
                Math.sqrt(1 - Math.pow(y, 2)) * x * AGG_RADIO -
                (isNegativeX ? 95 : 0);

              return {
                ...acc,
                [curr.key]: [panRadioX, panRadioY, radioX, radioY],
              };
            },
            {},
          )
        : {},
    [metadata, headPan],
  );

  const opacities = useMemo(
    () =>
      headPan
        ? metadata.reduce<Record<string, Animated.Value>>(
            (acc, curr) => ({
              ...acc,
              [curr.key]: new Animated.Value(0),
            }),
            {},
          )
        : {},
    [metadata, headPan],
  );

  const animationSequence = useMemo(
    () =>
      headPan
        ? [
            ...metadata.reduce<Animated.CompositeAnimation[]>(
              (acc, cur, index, array) => [
                ...acc,
                Animated.delay(index > 0 ? DELAY : 0),
                Animated.timing(currentQuoteIndexValue, {
                  toValue: index,
                  duration: 0,
                  useNativeDriver: true,
                }),
                Animated.parallel(
                  [
                    index > 0 &&
                      Animated.timing(opacities[array[index - 1].key], {
                        toValue: 0,
                        duration: PAN_DURATION,
                        useNativeDriver: true,
                      }),
                    Animated.timing(opacities[cur.key], {
                      toValue: 1,
                      duration: PAN_DURATION,
                      useNativeDriver: true,
                    }),
                    Animated.timing(progressValue, {
                      toValue:
                        (FINALIZING_PERCENTAGE / array.length) * (index + 1),
                      duration: PAN_DURATION,
                      useNativeDriver: false,
                    }),
                    !Device.isAndroid() &&
                      Animated.timing(foxHeadPan, {
                        toValue: {
                          x: positions[cur.key][0],
                          y: positions[cur.key][1],
                        },
                        duration: PAN_DURATION,
                        useNativeDriver: true,
                      }),
                  ].filter(Boolean) as Animated.CompositeAnimation[],
                ),
              ],
              [],
            ),
            Animated.delay(DELAY),
            Animated.parallel(
              [
                Animated.timing(opacities[[...metadata].pop()?.key ?? ''], {
                  toValue: 0,
                  duration: PAN_DURATION,
                  useNativeDriver: true,
                }),
                !Device.isAndroid() &&
                  Animated.timing(foxHeadPan, {
                    toValue: { x: 0, y: 0 },
                    duration: PAN_DURATION,
                    useNativeDriver: true,
                  }),
              ].filter(Boolean) as Animated.CompositeAnimation[],
            ),
          ]
        : [],
    [
      currentQuoteIndexValue,
      foxHeadPan,
      headPan,
      metadata,
      opacities,
      positions,
      progressValue,
    ],
  );

  const startAnimation = useCallback(() => {
    setHasStarted(true);
    Animated.sequence(animationSequence).start(() => {
      setHasFinished(true);
    });
  }, [animationSequence]);

  const endAnimation = useCallback(() => {
    setHasStartedFinishing(true);
    Animated.timing(progressValue, {
      toValue: 100,
      duration: FINISH_DURATION,
      useNativeDriver: false,
    }).start(() => {
      if (onAnimationEnd) {
        onAnimationEnd();
      }
    });
  }, [onAnimationEnd, progressValue]);

  useEffect(() => {
    (async () => {
      if (hasStarted) {
        return;
      }
      if (!aggregatorMetadata) {
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { SwapsController } = Engine.context as any;
        try {
          await SwapsController.fetchAggregatorMetadataWithCache({
            networkClientId: selectedNetworkClientId,
          });
        } catch (error) {
          Logger.error(
            error as Error,
            'Swaps: Error fetching agg metadata in animation',
          );
        }
      } else {
        const metadataArray = Object.entries(aggregatorMetadata).map(
          ([key, value]) => ({
            key,
            ...value,
          }),
        );
        setMetadata(metadataArray);
        setShouldStart(true);
      }
    })();
  }, [aggregatorMetadata, hasStarted, selectedNetworkClientId]);

  useEffect(() => {
    if (!renderLogos) {
      const timeout = setTimeout(() => {
        setRenderLogos(true);
      }, INITIAL_DELAY);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [renderLogos]);

  useEffect(() => {
    if (!(shouldStart && renderLogos) || hasStarted) {
      return;
    }
    startAnimation();
  }, [hasStarted, renderLogos, shouldStart, startAnimation]);

  useEffect(() => {
    if (hasFinished && finish && !hasStartedFinishing) {
      endAnimation();
    }
  }, [endAnimation, finish, hasFinished, hasStartedFinishing]);

  useEffect(() => {
    const listener = currentQuoteIndexValue.addListener(({ value }) => {
      setCurrentQuoteIndex(Math.ceil(value));
    });

    return () => {
      currentQuoteIndexValue.removeListener(listener);
    };
  });

  useEffect(() => {
    const listener = foxHeadPan.addListener(({ x, y }) => {
      requestAnimationFrame(() => {
        if (foxRef?.current?.injectJavaScript) {
          const JS = `window.dispatchEvent(new CustomEvent('nativedeviceorientation', {
                  detail: {
                    alpha: 0,
                    beta: ${round(-y, 4)},
                    gamma: ${round(-x, 4)}
                  }
                }));
                `;
          foxRef.current.injectJavaScript(JS);
        }
      });
    });

    if (foxRef?.current?.reload && Device.isAndroid()) {
      foxRef.current.reload();
    }

    return () => {
      foxHeadPan.removeListener(listener);
    };
  }, [foxHeadPan]);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {headPan ? (
          <>
            <Text style={styles.text} small centered>
              {hasStarted ? (
                <>
                  {strings('swaps.quote')}{' '}
                  <Text reset bold>
                    {currentQuoteIndex + 1} {strings('swaps.of')}{' '}
                    {metadata?.length}
                  </Text>
                </>
              ) : (
                ''
              )}
            </Text>
            {!hasStarted && (
              <Title style={styles.text} centered>
                {strings('swaps.starting')}
              </Title>
            )}
            {hasStarted && !hasFinished && (
              <Title style={styles.text} centered>
                {strings('swaps.checking')} {metadata[currentQuoteIndex]?.title}
                ...
              </Title>
            )}
            {hasFinished && (
              <Title style={styles.text} centered>
                {strings('swaps.finalizing')}
              </Title>
            )}
          </>
        ) : (
          <>
            <Title style={styles.text} centered>
              {strings('swaps.fetching_quotes')}
            </Title>
          </>
        )}

        <View style={styles.progressWrapper}>
          <Animated.View
            style={[styles.progressBar, { width: progressWidth }]}
          />
        </View>
      </View>
      <View style={styles.foxContainer} pointerEvents="none">
        <View style={styles.foxWrapper}>
          <Image
            source={foxImage}
            style={styles.foxImage}
            resizeMethod={'auto'}
          />
          <View style={styles.backgroundShapes} pointerEvents="none">
            <ShapesBackgroundAnimation
              width={STAGE_SIZE * 0.8}
              height={STAGE_SIZE * 0.8}
            />
          </View>
        </View>
        {renderLogos &&
          headPan &&
          metadata &&
          metadata.map((agg) => (
            <Animated.View
              key={agg.key}
              style={[
                styles.aggContainer,
                {
                  backgroundColor: agg.color,
                  shadowColor: agg.color,
                  opacity: opacities[agg.key],
                  transform: [
                    { translateX: positions[agg.key][2] },
                    { translateY: positions[agg.key][3] },
                  ],
                },
              ]}
            >
              <Image
                style={styles.aggImage}
                resizeMode="contain"
                source={{ uri: agg.iconPng }}
              />
            </Animated.View>
          ))}
      </View>
    </View>
  );
}

export default LoadingAnimation;
