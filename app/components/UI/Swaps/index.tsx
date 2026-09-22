import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Dispatch } from 'redux';
import PropTypes from 'prop-types';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  TouchableOpacity,
  InteractionManager,
} from 'react-native';
import { connect } from 'react-redux';
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { View as AnimatableView } from 'react-native-animatable';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import Logger from '../../../util/Logger';
import {
  balanceToFiat,
  fromTokenMinimalUnitString,
  renderFromTokenMinimalUnit,
  toTokenMinimalUnit,
  weiToFiat,
  safeNumberToBN,
} from '../../../util/number';
import { safeToChecksumAddress } from '../../../util/address';
import { swapsUtils } from '@metamask/swaps-controller';
import { MetaMetricsEvents } from '../../../core/Analytics';

import {
  getFeatureFlagChainId,
  setSwapsLiveness,
  swapsControllerTokens,
  swapsTokensSelector,
  swapsTokensWithBalanceSelector,
  swapsTopAssetsSelector,
} from '../../../reducers/swaps';
import Device from '../../../util/device';
import Engine from '../../../core/Engine';
import AppConstants from '../../../core/AppConstants';

import { strings } from '../../../../locales/i18n';
import {
  setQuotesNavigationsParams,
  isSwapsNativeAsset,
  isDynamicToken,
  shouldShowMaxBalanceLink,
} from './utils';
import { getSwapsAmountNavbar } from '../Navbar';

import useModalHandler from '../../Base/hooks/useModalHandler';
import Text from '../../Base/Text';
import Keypad from '../../Base/Keypad';
import StyledButton from '../StyledButton';
import ScreenView from '../../Base/ScreenView';
import ActionAlert from './components/ActionAlert';
import TokenSelectButton from './components/TokenSelectButton';
import TokenSelectModal from './components/TokenSelectModal';
import SlippageModal from './components/SlippageModal';
import useBalance from './utils/useBalance';
import useBlockExplorer from './utils/useBlockExplorer';
import InfoModal from './components/InfoModal';
import { toLowerCaseEquals } from '../../../util/general';
import { AlertType } from '../../Base/Alert';
import { isZero, gte } from '../../../util/lodash';
import { useTheme } from '../../../util/theme';
import {
  selectEvmChainId,
  selectEvmNetworkConfigurationsByChainId,
  selectSelectedNetworkClientId,
} from '../../../selectors/networkController';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../selectors/currencyRateController';
import { selectContractExchangeRates } from '../../../selectors/tokenRatesController';
import { selectAccountsByChainId } from '../../../selectors/accountTrackerController';
import { selectContractBalances } from '../../../selectors/tokenBalancesController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import AccountSelector from '../Ramp/components/AccountSelector';
import { QuoteViewSelectorIDs } from '../../../../e2e/selectors/swaps/QuoteView.selectors';
import { getDecimalChainId } from '../../../util/networks';
import { useMetrics } from '../../../components/hooks/useMetrics';
import { getSwapsLiveness } from '../../../reducers/swaps/utils';
import { selectShouldUseSmartTransaction } from '../../../selectors/smartTransactionsController';
import { useStablecoinsDefaultSlippage } from './useStablecoinsDefaultSlippage';
import { Theme } from '@metamask/design-tokens';
import type { RootState } from '../../../reducers';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { backgroundColor: colors.background.default },
    screen: {
      flexGrow: 1,
      justifyContent: 'space-between',
      backgroundColor: colors.background.default,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    accountSelector: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 16,
    },
    keypad: {
      flexGrow: 1,
      justifyContent: 'space-around',
    },
    tokenButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      margin: Device.isIphone5() ? 5 : 10,
    },
    amountContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 25,
    },
    amount: {
      textAlignVertical: 'center',
      fontSize: Device.isIphone5() ? 30 : 40,
      height: Device.isIphone5() ? 40 : 50,
    },
    amountInvalid: {
      color: colors.error.default,
    },
    verifyToken: {
      marginHorizontal: 40,
    },
    tokenAlert: {
      marginTop: 10,
      marginHorizontal: 30,
    },
    linkText: {
      color: colors.primary.default,
    },
    horizontalRuleContainer: {
      flexDirection: 'row',
      paddingHorizontal: 30,
      marginVertical: Device.isIphone5() ? 5 : 10,
      alignItems: 'center',
    },
    horizontalRule: {
      flex: 1,
      borderBottomWidth: StyleSheet.hairlineWidth,
      height: 1,
      borderBottomColor: colors.border.muted,
    },
    arrowDown: {
      color: colors.primary.default,
      fontSize: 25,
      marginHorizontal: 15,
    },
    buttonsContainer: {
      marginTop: Device.isIphone5() ? 10 : 30,
      marginBottom: 5,
      paddingHorizontal: 30,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    column: {
      flex: 1,
    },
    ctaContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    cta: {
      paddingHorizontal: Device.isIphone5() ? 10 : 20,
    },
    disabled: {
      opacity: 0.4,
    },
  });

const SWAPS_NATIVE_ADDRESS = swapsUtils.NATIVE_SWAPS_TOKEN_ADDRESS;
const TOKEN_MINIMUM_SOURCES = 1;
const MAX_TOP_ASSETS = 20;

interface SwapToken {
  address: string;
  symbol: string;
  decimals: number;
  iconUrl?: string;
  name?: string;
  occurrences: number;
  occurances?: number;
  aggregators?: string[];
}

interface NetworkConfiguration {
  nativeCurrency?: string;
}

interface SwapsStateProps {
  swapsTokens: SwapToken[];
  swapsControllerTokens: SwapToken[];
  accountsByChainId: Record<string, unknown>;
  selectedAddress: string;
  chainId: string;
  selectedNetworkClientId: string;
  networkConfigurations: Record<string, NetworkConfiguration>;
  balances: Record<string, unknown>;
  tokensWithBalance: SwapToken[];
  tokensTopAssets: SwapToken[];
  conversionRate: number;
  tokenExchangeRates: Record<string, { price?: number }>;
  currentCurrency: string;
  shouldUseSmartTransaction: boolean;
}

interface SwapsDispatchProps {
  setLiveness: (chainId: string, featureFlags: unknown) => void;
}

type SwapsAmountViewProps = SwapsStateProps & {
  setLiveness?: SwapsDispatchProps['setLiveness'];
};

function SwapsAmountView({
  swapsTokens,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  swapsControllerTokens,
  accountsByChainId,
  selectedAddress,
  chainId,
  selectedNetworkClientId,
  networkConfigurations,
  balances,
  tokensWithBalance,
  tokensTopAssets,
  conversionRate,
  tokenExchangeRates,
  currentCurrency,
  setLiveness,
  shouldUseSmartTransaction,
}: SwapsAmountViewProps) {
  const accounts = accountsByChainId[chainId];
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute<{
    key: string;
    name: string;
    params?: {
      sourceToken?: string;
      destinationToken?: string;
      sourcePage?: string;
    };
  }>();
  const { colors } = useTheme();
  const { trackEvent, createEventBuilder } = useMetrics();
  const styles = createStyles(colors);

  const previousSelectedAddress = useRef<string>();

  const explorer = useBlockExplorer(networkConfigurations);
  const initialSource = route.params?.sourceToken ?? SWAPS_NATIVE_ADDRESS;
  const initialDestination = route.params?.destinationToken;

  const [amount, setAmount] = useState('0');
  const [slippage, setSlippage] = useState<number>(
    AppConstants.SWAPS.DEFAULT_SLIPPAGE,
  );
  const [isInitialLoadingTokens, setInitialLoadingTokens] = useState(false);
  const [, setLoadingTokens] = useState(false);
  const [isSourceSet, setIsSourceSet] = useState(() =>
    Boolean(
      swapsTokens?.find((token) =>
        toLowerCaseEquals(token.address, initialSource),
      ),
    ),
  );
  const [isDestinationSet, setIsDestinationSet] = useState(false);

  const [sourceToken, setSourceToken] = useState<SwapToken | undefined>(() =>
    swapsTokens?.find((token) =>
      toLowerCaseEquals(token.address, initialSource),
    ),
  );
  const [destinationToken, setDestinationToken] = useState<
    SwapToken | null | undefined
  >(
    swapsTokens?.find((token) =>
      toLowerCaseEquals(token.address, initialDestination),
    ),
  );

  useStablecoinsDefaultSlippage({
    sourceTokenAddress: sourceToken?.address,
    destTokenAddress: destinationToken?.address,
    chainId: chainId as `0x${string}`,
    setSlippage: setSlippage as (slippage: number) => void,
  });

  const [hasDismissedTokenAlert, setHasDismissedTokenAlert] = useState(true);
  const [contractBalance, setContractBalance] = useState<unknown>(null);
  const [contractBalanceAsUnits, setContractBalanceAsUnits] = useState<unknown>(
    safeNumberToBN(0),
  );
  const [isDirectWrapping, setIsDirectWrapping] = useState(false);

  const [isSourceModalVisible, toggleSourceModal] = useModalHandler(false);
  const [isDestinationModalVisible, toggleDestinationModal] =
    useModalHandler(false);
  const [isSlippageModalVisible, toggleSlippageModal] = useModalHandler(false);
  const [
    isTokenVerificationModalVisisble,
    toggleTokenVerificationModal,
    ,
    hideTokenVerificationModal,
  ] = useModalHandler(false);

  useEffect(() => {
    navigation.setOptions(getSwapsAmountNavbar(navigation, route, colors));
  }, [navigation, route, colors]);

  useEffect(() => {
    (async () => {
      try {
        const featureFlags = await swapsUtils.fetchSwapsFeatureFlags(
          getFeatureFlagChainId(chainId),
          AppConstants.SWAPS.CLIENT_ID,
        );

        const liveness = getSwapsLiveness(
          featureFlags as Parameters<typeof getSwapsLiveness>[0],
          chainId as `0x${string}`,
        );
        // @ts-expect-error Preserve the legacy injected liveness callback.
        setLiveness(chainId, featureFlags);

        if (liveness) {
          // Triggered when a user enters the MetaMask Swap feature
          InteractionManager.runAfterInteractions(() => {
            const parameters = {
              source: route.params?.sourcePage,
              activeCurrency: swapsTokens?.find((token) =>
                toLowerCaseEquals(token.address, initialSource),
              )?.symbol,
              chain_id: getDecimalChainId(chainId),
            };

            trackEvent(
              createEventBuilder(MetaMetricsEvents.SWAPS_OPENED)
                .addProperties(parameters)
                .build(),
            );
          });
        } else {
          // @ts-expect-error Legacy navigation exposes pop at runtime.
          navigation.pop();
        }
      } catch (error) {
        Logger.error(
          error as Error,
          'Swaps: error while fetching swaps liveness',
        );
        // @ts-expect-error Preserve the legacy injected liveness callback.
        setLiveness(chainId, null);
        // @ts-expect-error Legacy navigation exposes pop at runtime.
        navigation.pop();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSource, chainId, navigation, setLiveness]);

  const keypadViewRef = useRef<{ shake?: () => void } | null>(null);

  useEffect(() => {
    (async () => {
      const { SwapsController } = Engine.context;
      try {
        await SwapsController.fetchAggregatorMetadataWithCache({
          networkClientId: selectedNetworkClientId,
        });
        await SwapsController.fetchTopAssetsWithCache({
          networkClientId: selectedNetworkClientId,
        });
      } catch (error) {
        Logger.error(
          error as Error,
          'Swaps: Error while updating agg metadata and top assets in amount view',
        );
      }
    })();
  }, [selectedNetworkClientId]);

  useEffect(() => {
    (async () => {
      const { SwapsController } = Engine.context;
      try {
        if (
          !swapsControllerTokens ||
          !swapsTokens ||
          swapsTokens?.length === 0
        ) {
          setInitialLoadingTokens(true);
        }
        setLoadingTokens(true);
        await SwapsController.fetchTokenWithCache({
          networkClientId: selectedNetworkClientId,
        });
        setLoadingTokens(false);
        setInitialLoadingTokens(false);
      } catch (error) {
        Logger.error(
          error as Error,
          'Swaps: Error while fetching tokens in amount view',
        );
      } finally {
        setLoadingTokens(false);
        setInitialLoadingTokens(false);
      }
    })();
  }, [swapsControllerTokens, swapsTokens, selectedNetworkClientId]);

  const canSetAnInitialSourceToken =
    !isSourceSet &&
    initialSource &&
    swapsControllerTokens &&
    swapsTokens?.length > 0 &&
    !sourceToken;

  useEffect(() => {
    if (canSetAnInitialSourceToken) {
      setIsSourceSet(true);
      setSourceToken(
        swapsTokens.find((token) =>
          toLowerCaseEquals(token.address, initialSource),
        ),
      );
    }
  }, [canSetAnInitialSourceToken, initialSource, swapsTokens]);

  const canSetAnInitialTokenDestination =
    !isDestinationSet &&
    initialDestination &&
    swapsControllerTokens &&
    swapsTokens?.length > 0 &&
    !destinationToken;

  useEffect(() => {
    if (canSetAnInitialTokenDestination) {
      setIsDestinationSet(true);
      setDestinationToken(
        swapsTokens.find((token) =>
          toLowerCaseEquals(token.address, initialDestination),
        ),
      );
    }
  }, [canSetAnInitialTokenDestination, initialDestination, swapsTokens]);

  useEffect(() => {
    setHasDismissedTokenAlert(false);
  }, [destinationToken]);

  const isTokenInBalances =
    sourceToken && !isSwapsNativeAsset(sourceToken)
      ? (safeToChecksumAddress(sourceToken.address) as string) in balances
      : false;

  useEffect(() => {
    (async () => {
      if (
        sourceToken &&
        !isSwapsNativeAsset(sourceToken) &&
        !isTokenInBalances
      ) {
        setContractBalance(null);
        setContractBalanceAsUnits(safeNumberToBN(0));
        const { AssetsContractController } = Engine.context;
        try {
          const balance = await AssetsContractController.getERC20BalanceOf(
            sourceToken.address,
            selectedAddress,
          );
          setContractBalanceAsUnits(balance);
          setContractBalance(
            renderFromTokenMinimalUnit(
              // @ts-expect-error Preserve the legacy BN-like balance value.
              balance,
              sourceToken.decimals,
            ),
          );
        } catch (e) {
          // Don't validate balance if error
        }
      }
    })();
  }, [isTokenInBalances, selectedAddress, sourceToken]);

  /**
   * Reset the state when account changes
   */
  useEffect(() => {
    if (selectedAddress !== previousSelectedAddress.current) {
      setAmount('0');
      setSourceToken(
        swapsTokens?.find((token) =>
          toLowerCaseEquals(token.address, initialSource),
        ),
      );
      setDestinationToken(null);
      setSlippage(AppConstants.SWAPS.DEFAULT_SLIPPAGE);
      previousSelectedAddress.current = selectedAddress;
    }
  }, [selectedAddress, swapsTokens, initialSource]);

  const hasInvalidDecimals = useMemo(() => {
    if (sourceToken) {
      return amount?.split('.')[1]?.length > sourceToken.decimals;
    }
    return false;
  }, [amount, sourceToken]);

  const amountAsUnits = useMemo(
    () =>
      toTokenMinimalUnit(
        hasInvalidDecimals ? '0' : amount,
        sourceToken?.decimals as number,
      ),
    [amount, hasInvalidDecimals, sourceToken],
  );
  const controllerBalance = useBalance(
    accounts,
    balances,
    selectedAddress,
    sourceToken,
  );
  const controllerBalanceAsUnits = useBalance(
    accounts,
    balances,
    selectedAddress,
    sourceToken,
    { asUnits: true },
  );

  const balance =
    isSwapsNativeAsset(sourceToken) || isTokenInBalances
      ? controllerBalance
      : contractBalance;
  const balanceAsUnits =
    isSwapsNativeAsset(sourceToken) || isTokenInBalances
      ? controllerBalanceAsUnits
      : contractBalanceAsUnits;

  const isBalanceZero = isZero(balanceAsUnits);
  const isAmountZero = isZero(amountAsUnits);

  const hasBalance = useMemo(() => {
    if (!balanceAsUnits || !sourceToken) {
      return false;
    }

    return !(isBalanceZero ?? true);
  }, [balanceAsUnits, sourceToken, isBalanceZero]);

  const hasEnoughBalance = useMemo(() => {
    if (hasInvalidDecimals || !hasBalance || !balanceAsUnits) {
      return false;
    }

    // TODO: Cannot call .gte on balanceAsUnits since it isn't always guaranteed to be type BN. Should consolidate into one type.
    return gte(balanceAsUnits, amountAsUnits) ?? false;
  }, [amountAsUnits, balanceAsUnits, hasBalance, hasInvalidDecimals]);

  const currencyAmount = useMemo(() => {
    if (!sourceToken || hasInvalidDecimals) {
      return undefined;
    }
    let balanceFiat;
    if (isSwapsNativeAsset(sourceToken)) {
      balanceFiat = weiToFiat(
        toTokenMinimalUnit(amount, sourceToken?.decimals),
        conversionRate,
        currentCurrency,
      );
    } else {
      const sourceAddress = safeToChecksumAddress(
        sourceToken.address,
      ) as string;
      const exchangeRate =
        tokenExchangeRates && sourceAddress in tokenExchangeRates
          ? tokenExchangeRates[sourceAddress]?.price
          : undefined;
      balanceFiat = balanceToFiat(
        amount,
        conversionRate,
        exchangeRate,
        currentCurrency,
      );
    }
    return balanceFiat;
  }, [
    amount,
    conversionRate,
    currentCurrency,
    hasInvalidDecimals,
    sourceToken,
    tokenExchangeRates,
  ]);

  const destinationTokenHasEnoughOcurrances = useMemo(() => {
    if (!destinationToken || isSwapsNativeAsset(destinationToken)) {
      return true;
    }
    return destinationToken?.occurrences > TOKEN_MINIMUM_SOURCES;
  }, [destinationToken]);

  /* Navigation handler */
  const handleGetQuotesPress = useCallback(async () => {
    if (hasInvalidDecimals) {
      return;
    }
    if (
      !isSwapsNativeAsset(sourceToken) &&
      !isTokenInBalances &&
      !isBalanceZero
    ) {
      const { TokensController } = Engine.context;
      const { address, symbol, decimals, name } = sourceToken as SwapToken;
      await TokensController.addToken({
        address,
        symbol,
        decimals,
        name,
        networkClientId: selectedNetworkClientId,
      });
    }
    return navigation.navigate(
      'SwapsQuotesView',
      setQuotesNavigationsParams(
        sourceToken?.address as string,
        destinationToken?.address as string,
        toTokenMinimalUnit(amount, sourceToken?.decimals as number).toString(
          10,
        ),
        slippage,
        [sourceToken, destinationToken],
      ),
    );
  }, [
    amount,
    destinationToken,
    hasInvalidDecimals,
    isTokenInBalances,
    navigation,
    slippage,
    sourceToken,
    isBalanceZero,
    selectedNetworkClientId,
  ]);

  /* Keypad Handlers */
  const handleKeypadChange = useCallback(
    ({ value }: { value: string }) => {
      if (value === amount) {
        return;
      }

      setAmount(value);
    },
    [amount],
  );

  const setSlippageAfterTokenPress = useCallback(
    (sourceTokenAddress: string, destinationTokenAddress?: string) => {
      const enableDirectWrapping = swapsUtils.shouldEnableDirectWrapping(
        chainId as `0x${string}`,
        sourceTokenAddress as `0x${string}`,
        destinationTokenAddress as `0x${string}`,
      );
      if (enableDirectWrapping && !isDirectWrapping) {
        // ETH <> WETH, set slippage to 0
        setSlippage(0);
        setIsDirectWrapping(true);
      } else if (isDirectWrapping && !enableDirectWrapping) {
        // Coming out of ETH <> WETH to a non (ETH <> WETH) pair, reset slippage
        setSlippage(AppConstants.SWAPS.DEFAULT_SLIPPAGE);
        setIsDirectWrapping(false);
      }
    },
    [setSlippage, chainId, isDirectWrapping],
  );

  const handleSourceTokenPress = useCallback(
    (item: SwapToken) => {
      toggleSourceModal();
      setSourceToken(item);
      setSlippageAfterTokenPress(item.address, destinationToken?.address);
    },
    [toggleSourceModal, setSlippageAfterTokenPress, destinationToken],
  );

  const handleDestinationTokenPress = useCallback(
    (item: SwapToken) => {
      toggleDestinationModal();
      setDestinationToken(item);
      setSlippageAfterTokenPress(sourceToken?.address as string, item.address);
    },
    [toggleDestinationModal, setSlippageAfterTokenPress, sourceToken],
  );

  const handleUseMax = useCallback(() => {
    if (!sourceToken || !balanceAsUnits) {
      return;
    }
    setAmount(
      fromTokenMinimalUnitString(
        balanceAsUnits.toString(10),
        sourceToken.decimals,
      ),
    );
  }, [balanceAsUnits, sourceToken]);

  const handleSlippageChange = useCallback((value: number) => {
    setSlippage(value);
  }, []);

  const handleDimissTokenAlert = useCallback(() => {
    setHasDismissedTokenAlert(true);
  }, []);

  const handleVerifyPress = useCallback(() => {
    if (!destinationToken) {
      return;
    }
    hideTokenVerificationModal();
    navigation.navigate('Webview', {
      screen: 'SimpleWebview',
      params: {
        url: explorer.token(destinationToken.address),
        title: strings('swaps.verify'),
      },
    });
  }, [explorer, destinationToken, hideTokenVerificationModal, navigation]);

  const handleAmountPress = useCallback(
    () => keypadViewRef?.current?.shake?.(),
    [],
  );

  const handleFlipTokens = useCallback(() => {
    setSourceToken(destinationToken as SwapToken);
    setDestinationToken(sourceToken);
  }, [destinationToken, sourceToken]);

  const disabledView =
    !destinationTokenHasEnoughOcurrances && !hasDismissedTokenAlert;

  const showMaxBalanceLink = shouldShowMaxBalanceLink({
    sourceToken: sourceToken as SwapToken,
    shouldUseSmartTransaction,
    hasBalance,
  });
  const destinationTokenValue = destinationToken as SwapToken;

  return (
    <ScreenView
      // @ts-expect-error Preserve the legacy ScrollView props.
      style={styles.container}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <View style={styles.accountSelector}>
          <AccountSelector />
        </View>
        <View
          style={[styles.tokenButtonContainer, disabledView && styles.disabled]}
          pointerEvents={disabledView ? 'none' : 'auto'}
          testID={QuoteViewSelectorIDs.SOURCE_TOKEN}
        >
          {isInitialLoadingTokens ? (
            <ActivityIndicator size="small" />
          ) : (
            <TokenSelectButton
              label={strings('swaps.select_a_token')}
              onPress={toggleSourceModal}
              icon={sourceToken?.iconUrl}
              symbol={sourceToken?.symbol}
            />
          )}

          <TokenSelectModal
            isVisible={isSourceModalVisible}
            dismiss={toggleSourceModal}
            title={strings('swaps.convert_from')}
            tokens={swapsTokens}
            initialTokens={tokensWithBalance}
            onItemPress={handleSourceTokenPress}
            excludeAddresses={[destinationToken?.address]}
          />
        </View>
        <View
          style={[styles.amountContainer, disabledView && styles.disabled]}
          pointerEvents={disabledView ? 'none' : 'auto'}
        >
          <TouchableOpacity onPress={handleAmountPress}>
            <Text
              primary
              style={styles.amount}
              numberOfLines={1}
              adjustsFontSizeToFit
              allowFontScaling
            >
              {amount}
            </Text>
          </TouchableOpacity>
          {!!sourceToken &&
            (hasInvalidDecimals || (!isAmountZero && !hasEnoughBalance) ? (
              <Text style={styles.amountInvalid}>
                {hasInvalidDecimals
                  ? strings('swaps.allows_up_to_decimals', {
                      symbol: sourceToken.symbol,
                      decimals: sourceToken.decimals,
                      // eslint-disable-next-line no-mixed-spaces-and-tabs
                    })
                  : strings('swaps.not_enough', { symbol: sourceToken.symbol })}
              </Text>
            ) : isAmountZero ? (
              <Text>
                {!!sourceToken &&
                  balance !== null &&
                  strings('swaps.available_to_swap', {
                    asset: `${balance} ${sourceToken.symbol}`,
                  })}
                {showMaxBalanceLink && (
                  <Text style={styles.linkText} onPress={handleUseMax}>
                    {' '}
                    {strings('swaps.use_max')}
                  </Text>
                )}
              </Text>
            ) : (
              <Text upper>{currencyAmount ? `~${currencyAmount}` : ''}</Text>
            ))}
          {!sourceToken && <Text> </Text>}
        </View>
        <View
          style={[
            styles.horizontalRuleContainer,
            disabledView && styles.disabled,
          ]}
          pointerEvents={disabledView ? 'none' : 'auto'}
        >
          <View style={styles.horizontalRule} />
          <TouchableOpacity onPress={handleFlipTokens}>
            <IonicIcon style={styles.arrowDown} name="arrow-down" />
          </TouchableOpacity>
          <View style={styles.horizontalRule} />
        </View>
        <View
          style={styles.tokenButtonContainer}
          testID={QuoteViewSelectorIDs.DEST_TOKEN}
        >
          {isInitialLoadingTokens ? (
            <ActivityIndicator size="small" />
          ) : (
            <TokenSelectButton
              label={strings('swaps.select_a_token')}
              onPress={toggleDestinationModal}
              icon={destinationToken?.iconUrl}
              symbol={destinationToken?.symbol}
            />
          )}
          <TokenSelectModal
            isVisible={isDestinationModalVisible}
            dismiss={toggleDestinationModal}
            title={strings('swaps.convert_to')}
            tokens={swapsTokens}
            initialTokens={[
              swapsUtils.getNativeSwapsToken(chainId as `0x${string}`),
              ...tokensTopAssets
                .slice(0, MAX_TOP_ASSETS)
                .filter(
                  (asset) =>
                    asset.address !==
                    swapsUtils.getNativeSwapsToken(chainId as `0x${string}`)
                      .address,
                ),
            ]}
            onItemPress={handleDestinationTokenPress}
            excludeAddresses={[sourceToken?.address]}
          />
        </View>
        <View>
          {Boolean(destinationToken) &&
          !isSwapsNativeAsset(destinationToken) ? (
            destinationTokenHasEnoughOcurrances ? (
              <TouchableOpacity
                onPress={explorer.isValid ? handleVerifyPress : undefined}
                style={styles.verifyToken}
              >
                <Text small centered>
                  <Text reset bold>
                    {strings('swaps.verified_on_sources', {
                      sources: destinationTokenValue.occurrences,
                    })}
                  </Text>
                  {` ${strings('swaps.verify_on')} `}
                  {explorer.isValid ? (
                    <Text reset link>
                      {explorer.name}
                    </Text>
                  ) : (
                    strings('swaps.a_block_explorer')
                  )}
                  .
                </Text>
              </TouchableOpacity>
            ) : (
              <ActionAlert
                type={
                  !destinationTokenValue.occurances ||
                  isDynamicToken(destinationToken)
                    ? AlertType.Error
                    : AlertType.Warning
                }
                style={styles.tokenAlert}
                action={
                  hasDismissedTokenAlert ? null : strings('swaps.continue')
                }
                onPress={handleDimissTokenAlert}
                onInfoPress={toggleTokenVerificationModal}
              >
                {(textStyle) => (
                  <TouchableOpacity
                    onPress={explorer.isValid ? handleVerifyPress : undefined}
                  >
                    <Text style={textStyle} bold centered>
                      {!destinationTokenValue.occurrences ||
                      isDynamicToken(destinationToken)
                        ? strings('swaps.added_manually', {
                            symbol: destinationTokenValue.symbol,
                            // eslint-disable-next-line no-mixed-spaces-and-tabs
                          })
                        : strings('swaps.only_verified_on', {
                            symbol: destinationTokenValue.symbol,
                            occurrences: destinationTokenValue.occurrences,
                            // eslint-disable-next-line no-mixed-spaces-and-tabs
                          })}
                    </Text>
                    {!destinationTokenValue.occurrences ||
                    isDynamicToken(destinationToken) ? (
                      <Text style={textStyle} centered>
                        {`${strings('swaps.verify_this_token_on')} `}
                        {explorer.isValid ? (
                          <Text reset link>
                            {explorer.name}
                          </Text>
                        ) : (
                          strings('swaps.a_block_explorer')
                        )}
                        {` ${strings('swaps.make_sure_trade')}`}
                      </Text>
                    ) : (
                      <Text style={textStyle} centered>
                        {`${strings('swaps.verify_address_on')} `}
                        {explorer.isValid ? (
                          <Text reset link>
                            {explorer.name}
                          </Text>
                        ) : (
                          strings('swaps.a_block_explorer')
                        )}
                        .
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </ActionAlert>
            )
          ) : (
            <Text> </Text>
          )}
        </View>
      </View>
      <View
        style={[styles.keypad, disabledView && styles.disabled]}
        pointerEvents={disabledView ? 'none' : 'auto'}
      >
        <AnimatableView
          // @ts-expect-error Preserve the legacy animation ref.
          ref={keypadViewRef}
        >
          <Keypad
            onChange={handleKeypadChange}
            value={amount}
            currency="native"
          />
        </AnimatableView>
        <View style={styles.buttonsContainer}>
          <View style={styles.column}>
            <TouchableOpacity
              onPress={toggleSlippageModal}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              disabled={isDirectWrapping}
            >
              <Text
                bold
                link={!isDirectWrapping}
                testID={QuoteViewSelectorIDs.MAX_SLIPPAGE}
              >
                {strings('swaps.max_slippage_amount', {
                  slippage: `${slippage}%`,
                })}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.column}>
            <View style={styles.ctaContainer}>
              <StyledButton
                type="blue"
                onPress={handleGetQuotesPress}
                containerStyle={styles.cta}
                disabled={
                  isInitialLoadingTokens ||
                  !sourceToken ||
                  !destinationToken ||
                  hasInvalidDecimals ||
                  isAmountZero
                }
              >
                {strings('swaps.get_quotes')}
              </StyledButton>
            </View>
          </View>
        </View>
      </View>
      <InfoModal
        isVisible={isTokenVerificationModalVisisble}
        toggleModal={toggleTokenVerificationModal}
        title={strings('swaps.token_verification')}
        body={
          <Text>
            {strings('swaps.token_multiple')}
            {` ${strings('swaps.token_check')} `}
            {explorer.isValid ? (
              <Text reset link onPress={handleVerifyPress}>
                {explorer.name}
              </Text>
            ) : (
              strings('swaps.a_block_explorer')
            )}
            {` ${strings('swaps.token_to_verify')}`}
          </Text>
        }
      />
      <SlippageModal
        isVisible={isSlippageModalVisible}
        dismiss={toggleSlippageModal}
        onChange={handleSlippageChange}
        slippage={slippage}
      />
    </ScreenView>
  );
}

SwapsAmountView.propTypes = {
  swapsTokens: PropTypes.arrayOf(PropTypes.object),
  swapsControllerTokens: PropTypes.arrayOf(PropTypes.object),
  tokensWithBalance: PropTypes.arrayOf(PropTypes.object),
  tokensTopAssets: PropTypes.arrayOf(PropTypes.object),
  /**
   * Map of chainId to accounts to information objects including balances
   */
  accountsByChainId: PropTypes.object,
  /**
   * A string that represents the selected address
   */
  selectedAddress: PropTypes.string,
  /**
   * An object containing token balances for current account and network in the format address => balance
   */
  balances: PropTypes.object,
  /**
   * ETH to current currency conversion rate
   */
  conversionRate: PropTypes.number,
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency: PropTypes.string,
  /**
   * An object containing token exchange rates in the format address => exchangeRate
   */
  tokenExchangeRates: PropTypes.object,
  /**
   * Chain Id
   */
  chainId: PropTypes.string,
  /**
   * Selected network client ID
   */
  selectedNetworkClientId: PropTypes.string,
  /**
   * Network configurations
   */
  networkConfigurations: PropTypes.object,
  /**
   * Function to set liveness
   */
  setLiveness: PropTypes.func,
  /**
   * Whether to use smart transactions
   */
  shouldUseSmartTransaction: PropTypes.bool,
} as React.WeakValidationMap<SwapsAmountViewProps>;

const mapStateToProps = (state: RootState): SwapsStateProps => ({
  swapsTokens: swapsTokensSelector(state) as SwapToken[],
  swapsControllerTokens: swapsControllerTokens(state) as SwapToken[],
  accountsByChainId: selectAccountsByChainId(state) as Record<string, unknown>,
  balances: selectContractBalances(state) as Record<string, unknown>,
  selectedAddress: selectSelectedInternalAccountFormattedAddress(
    state,
  ) as string,
  conversionRate: selectConversionRate(state) as number,
  currentCurrency: selectCurrentCurrency(state) as string,
  tokenExchangeRates: selectContractExchangeRates(state) as Record<
    string,
    { price?: number }
  >,
  networkConfigurations: selectEvmNetworkConfigurationsByChainId(
    state,
  ) as Record<string, NetworkConfiguration>,
  chainId: selectEvmChainId(state) as string,
  selectedNetworkClientId: selectSelectedNetworkClientId(state) as string,
  tokensWithBalance: swapsTokensWithBalanceSelector(state) as SwapToken[],
  tokensTopAssets: swapsTopAssetsSelector(state) as SwapToken[],
  shouldUseSmartTransaction: selectShouldUseSmartTransaction(
    state,
    selectEvmChainId(state),
  ),
});

const mapDispatchToProps = (dispatch: Dispatch): SwapsDispatchProps => ({
  setLiveness: (chainId: string, featureFlags: unknown) =>
    dispatch(setSwapsLiveness(chainId, featureFlags)),
});

export default connect<
  SwapsStateProps,
  SwapsDispatchProps,
  Record<string, never>,
  RootState
>(
  mapStateToProps,
  mapDispatchToProps,
)(SwapsAmountView);
