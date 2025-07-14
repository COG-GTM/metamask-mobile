import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { connect, ConnectedProps } from 'react-redux';
import StyledButton from '../../UI/StyledButton';
import { baseStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import FadeOutOverlay from '../../UI/FadeOutOverlay';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import { getTransparentOnboardingNavbarOptions } from '../../UI/Navbar';
import OnboardingScreenWithBg from '../../UI/OnboardingScreenWithBg';
import Text from '../../Base/Text/Text';
import Device from '../../../util/device';
import { useTheme } from '../../../util/theme';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import AppConstants from '../../../core/AppConstants';
import { decGWEIToHexWEI } from '../../../util/conversions';
import { BNToHex, hexToBN } from '../../../util/number';
import {
  calculateEIP1559GasFeeHexes,
  getTicker,
} from '../../../util/transactions';
import Engine from '../../../core/Engine';
import TransactionTypes from '../../../core/TransactionTypes';
import { formatCurrency, getTransactionFee } from '../../../util/confirm-tx';
import Logger from '../../../util/Logger';
import { selectEvmTicker } from '../../../selectors/networkController';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../selectors/currencyRateController';
import { RootState } from '../../../reducers';

interface GasEducationCarouselProps {
  navigation: NavigationProp<any>;
  route?: RouteProp<any, any>;
  conversionRate?: number;
  currentCurrency?: string;
  ticker?: string;
}

interface StateProps {
  conversionRate?: number;
  currentCurrency?: string;
  ticker?: string;
}

const { width } = Dimensions.get('window');

const createStyles = (colors: any) => StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  scrollWrapper: {
    flexGrow: 1,
  },
  loader: {
    backgroundColor: colors.background.default,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    ...baseStyles.flexGrow,
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 100,
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
    color: colors.text.default,
    justifyContent: 'center',
    textAlign: 'center',
    ...Device.isAndroid() ? {} : { fontWeight: '600' },
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 25,
    color: colors.text.default,
    justifyContent: 'center',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  carouselContainer: {},
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  carouselImageWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  carouselImage: {
    width: width - 80,
    height: 215,
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 8 / 2,
    backgroundColor: colors.icon.muted,
    opacity: 0.4,
    marginHorizontal: 8,
  },
  solidCircle: {
    opacity: 1,
    backgroundColor: colors.primary.default,
  },
  progessContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginVertical: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 250,
  },
  currentGas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  gasBottle: {
    marginHorizontal: 10,
  },
  buttonWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 50,
    paddingBottom: Device.isIphoneX() ? 20 : 40,
  },
});

const carousel_images = [
  require('../../../images/gas-education-1.png'),
  require('../../../images/gas-education-2.png'),
  require('../../../images/gas-education-3.png'),
];

/**
 * View that is displayed to first time (new) users
 */
const GasEducationCarousel: React.FC<GasEducationCarouselProps> = ({
  navigation,
  route,
  conversionRate,
  currentCurrency,
  ticker,
}) => {
  const [currentTab, setCurrentTab] = useState<number>(1);
  const [gasFiat, setGasFiat] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    navigation.setOptions(getTransparentOnboardingNavbarOptions(colors));
  }, [navigation, colors]);

  useEffect(() => {
    const setGasEstimates = async (): Promise<void> => {
      const { GasFeeController } = Engine.context;
      const gas = hexToBN(TransactionTypes.CUSTOM_GAS.DEFAULT_GAS_LIMIT);
      let estimatedTotalGas: string = '';
      try {
        const gasEstimates = await GasFeeController.fetchGasFeeEstimates({
          shouldUpdateState: false,
        });

        if (gasEstimates.gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
          const gasFeeEstimates =
            gasEstimates.gasFeeEstimates[AppConstants.GAS_OPTIONS.MEDIUM];
          const estimatedBaseFeeHex = decGWEIToHexWEI(
            gasFeeEstimates.suggestedMaxFeePerGas,
          );
          const estimatedPriorityFeeHex = decGWEIToHexWEI(
            gasFeeEstimates.suggestedMaxPriorityFeePerGas,
          );
          const estimatedGasLimitHex = BNToHex(gas);
          const gasHexes = calculateEIP1559GasFeeHexes({
            gasLimitHex: estimatedGasLimitHex,
            estimatedGasLimitHex: estimatedGasLimitHex,
            estimatedBaseFeeHex: estimatedBaseFeeHex,
            suggestedMaxFeePerGasHex: estimatedBaseFeeHex,
            suggestedMaxPriorityFeePerGasHex: estimatedPriorityFeeHex,
          });
          estimatedTotalGas = gasHexes.gasFeeMaxHex as string;
        } else if (
          gasEstimates.gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY
        ) {
          const gasFeeEstimates =
            gasEstimates.gasFeeEstimates[AppConstants.GAS_OPTIONS.MEDIUM];
          const estimatedGasPriceHex = decGWEIToHexWEI(gasFeeEstimates);
          const estimatedGasLimitHex = BNToHex(gas);
          estimatedTotalGas = BNToHex(
            hexToBN(estimatedGasPriceHex).mul(hexToBN(estimatedGasLimitHex)),
          );
        } else if (
          gasEstimates.gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE
        ) {
          const estimatedGasPriceHex = decGWEIToHexWEI(
            gasEstimates.gasFeeEstimates.gasPrice,
          );
          const estimatedGasLimitHex = BNToHex(gas);
          estimatedTotalGas = BNToHex(
            hexToBN(estimatedGasPriceHex).mul(hexToBN(estimatedGasLimitHex)),
          );
        }
        const transactionFee = getTransactionFee({
          value: estimatedTotalGas,
          fromCurrency: getTicker(ticker),
          toCurrency: currentCurrency,
          conversionRate,
          numberOfDecimals: 5,
        });
        const transactionFeeFiat = formatCurrency(transactionFee, currentCurrency);
        setGasFiat(transactionFeeFiat);
        setIsLoading(false);
      } catch (error) {
        Logger.error(error as Error, 'Error while trying to get gas estimates');
        setIsLoading(false);
      }
    };
    setGasEstimates();
  }, [conversionRate, currentCurrency, ticker]);

  const renderTabBar = (): React.ReactElement => <View />;

  const onPressGotIt = (): void => navigation.goBack();

  const renderLoader = (): React.ReactElement => (
    <View style={styles.loader}>
      <Text>{strings('gas_education_carousel.loading')}</Text>
    </View>
  );

  const renderTabContent = (image: any, title: string, subtitle: string): React.ReactElement => (
    <View style={styles.tab}>
      <View style={styles.tabContent}>
        <View style={styles.carouselImageWrapper}>
          <Image source={image} style={styles.carouselImage} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  const onChangeTab = (obj: { i: number }): void => {
    setCurrentTab(obj.i + 1);
  };

  const renderProgress = (): React.ReactElement => (
    <View style={styles.progessContainer}>
      <View style={[styles.circle, currentTab === 1 && styles.solidCircle]} />
      <View style={[styles.circle, currentTab === 2 && styles.solidCircle]} />
      <View style={[styles.circle, currentTab === 3 && styles.solidCircle]} />
    </View>
  );

  if (isLoading) return renderLoader();

  return (
    <OnboardingScreenWithBg screen="a">
      <ScrollView
        style={baseStyles.flexGrow}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.wrapper}>
          <ScrollView
            style={styles.scrollWrapper}
            contentContainerStyle={styles.content}
          >
            <View style={styles.carouselContainer}>
              <ScrollableTabView
                renderTabBar={renderTabBar}
                onChangeTab={onChangeTab}
              >
                {renderTabContent(
                  carousel_images[0],
                  strings('gas_education_carousel.title_1'),
                  strings('gas_education_carousel.subtitle_1'),
                )}
                {renderTabContent(
                  carousel_images[1],
                  strings('gas_education_carousel.title_2'),
                  strings('gas_education_carousel.subtitle_2'),
                )}
                {renderTabContent(
                  carousel_images[2],
                  strings('gas_education_carousel.title_3'),
                  strings('gas_education_carousel.subtitle_3'),
                )}
              </ScrollableTabView>
            </View>
            {renderProgress()}
            <View style={styles.currentGas}>
              <Text>{strings('gas_education_carousel.current_base_fee')}</Text>
              <Image
                source={require('../../../images/gas-bottle.png')}
                style={styles.gasBottle}
              />
              <Text>{gasFiat}</Text>
            </View>
          </ScrollView>
          <View style={styles.buttonWrapper}>
            <StyledButton
              type={'confirm'}
              onPress={onPressGotIt}
              testID={'gas-education-got-it-button'}
            >
              {strings('gas_education_carousel.got_it')}
            </StyledButton>
          </View>
        </View>
      </ScrollView>
      <FadeOutOverlay />
    </OnboardingScreenWithBg>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  conversionRate: selectConversionRate(state) || undefined,
  currentCurrency: selectCurrentCurrency(state) || undefined,
  ticker: selectEvmTicker(state) || undefined,
});

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(GasEducationCarousel);
