import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { strings } from '../../../../../locales/i18n';
import Device from '../../../../util/device';
import Text from '../../../Base/Text';
import StyledButton from '../../StyledButton';
import { useTheme, useAssetFromTheme } from '../../../../util/theme';
import { Theme } from '../../../../util/theme/models';

/* eslint-disable import/no-commonjs */
const onboardingDeviceImage = require('../../../../images/swaps_onboard_device.png');
const swapsAggregatorsLight = require('../../../../images/swaps_aggs-light.png');
const swapsAggregatorsDark = require('../../../../images/swaps_aggs-dark.png');
/* eslint-enable import/no-commonjs */

interface Styles {
  screen: ViewStyle;
  content: ViewStyle;
  images: ViewStyle;
  title: TextStyle;
  aggregatorsImage: ImageStyle;
  learnMore: ViewStyle;
  learnMoreLink: ViewStyle;
  actionButtonWrapper: ViewStyle;
  actionButton: ViewStyle;
}

const createStyles = (colors: Theme['colors'], bottomInset: number): Styles =>
  StyleSheet.create({
    screen: {
      flex: 1,
      paddingHorizontal: 25,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      marginVertical: 14,
    },
    images: {
      alignItems: 'center',
    },
    title: {
      fontSize: Device.isSmallDevice() ? 20 : 24,
      marginHorizontal: 15,
      marginBottom: Device.isSmallDevice() ? 16 : 24,
      color: colors.text.default,
    },
    aggregatorsImage: {
      marginVertical: 14,
      width: Device.isSmallDevice() ? 230 : 300,
      height: Device.isSmallDevice() ? 85 : 110,
    },
    learnMore: {
      marginVertical: 14,
    },
    learnMoreLink: {
      paddingVertical: Device.isSmallDevice() ? 4 : 8,
    },
    actionButtonWrapper: {
      width: '100%',
      paddingBottom: bottomInset,
    },
    actionButton: {
      marginVertical: 10,
    },
  });

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface OnboardingProps {
  setHasOnboarded?: (value: boolean) => void;
}

function Onboarding({ setHasOnboarded }: OnboardingProps) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const styles = createStyles(colors, bottomInset);
  const swapsAggregators = useAssetFromTheme(
    swapsAggregatorsLight,
    swapsAggregatorsDark,
  );

  const handleStartSwapping = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHasOnboarded?.(true);
  }, [setHasOnboarded]);

  const handleReviewAuditsPress = useCallback(() => {
    navigation.navigate('Webview' as never, {
      screen: 'SimpleWebview',
      params: {
        url: 'https://consensys.net/diligence/audits/2020/08/metaswap/',
      },
    } as never);
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.images}>
          <Image source={onboardingDeviceImage} />
          <Text centered primary style={styles.title}>
            {`${strings('swaps.onboarding.get_the')} `}
            <Text reset bold>
              {strings('swaps.onboarding.best_price')}
            </Text>
            {` ${strings('swaps.onboarding.from_the')} `}
            <Text reset bold>
              {strings('swaps.onboarding.top_liquidity')}
            </Text>
            {` ${strings('swaps.onboarding.sources')}`}
          </Text>
          <Text centered primary>
            {`${strings('swaps.onboarding.find_the')} `}
            <Text reset bold>
              {strings('swaps.onboarding.best_swap')}
            </Text>{' '}
            {strings('swaps.onboarding.across')}
          </Text>
          <Image source={swapsAggregators} style={styles.aggregatorsImage} />
        </View>
        <View style={styles.learnMore}>
          <TouchableOpacity
            style={styles.learnMoreLink}
            onPress={handleReviewAuditsPress}
          >
            <Text link centered>
              {strings('swaps.onboarding.review_audits')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.actionButtonWrapper}>
        <StyledButton
          type="confirm"
          containerStyle={styles.actionButton}
          onPress={handleStartSwapping}
        >
          {strings('swaps.onboarding.start_swapping')}
        </StyledButton>
      </View>
    </View>
  );
}

export default Onboarding;
