import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  type ScrollViewProps,
} from 'react-native';
import { connect, useSelector } from 'react-redux';
import type { Dispatch } from 'redux';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BigNumber from 'bignumber.js';
import {
  useNavigation,
  useRoute,
  type ParamListBase,
  type RouteProp,
} from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ThemeColors } from '@metamask/design-tokens';
import type { Hex } from '@metamask/utils';
import { swapsUtils } from '@metamask/swaps-controller';
import type {
  APIFetchQuotesParams,
  CustomEthGasPriceEstimate,
  CustomGasFee,
  Quote,
  QuoteValues,
} from '@metamask/swaps-controller/dist/types';
import {
  WalletDevice,
  TransactionStatus,
  CHAIN_IDS,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { ORIGIN_METAMASK, query } from '@metamask/controller-utils';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';

import {
  addHexPrefix,
  fromTokenMinimalUnit,
  fromTokenMinimalUnitString,
  hexToBN,
  renderFromTokenMinimalUnit,
  renderFromWei,
  toWei,
  weiToFiat,
  calculateEthFeeForMultiLayer,
} from '../../../util/number';
import {
  isMainnetByChainId,
  isMultiLayerFeeNetwork,
  getDecimalChainId,
} from '../../../util/networks';
import { fetchEstimatedMultiLayerL1Fee } from '../../../util/networks/engineNetworkUtils';
import {
  getErrorMessage,
  getFetchParams,
  getQuotesNavigationsParams,
  isSwapsNativeAsset,
  type QuotesNavigationParams,
  type SwapsToken,
} from './utils';
import { strings } from '../../../../locales/i18n';

import Engine from '../../../core/Engine';
import AppConstants from '../../../core/AppConstants';
import Device from '../../../util/device';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { getSwapsQuotesNavbar } from '../Navbar';
import BaseScreenView from '../../Base/ScreenView';
import Text from '../../Base/Text';
import Alert, { AlertType } from '../../Base/Alert';
import StyledButton from '../StyledButton';

import LoadingAnimation, {
  type AggregatorMetadata,
} from './components/LoadingAnimation';
import TokenIcon from './components/TokenIcon';
import QuotesSummary from './components/QuotesSummary';
import QuotesModal from './components/QuotesModal';
import Ratio from './components/Ratio';
import ActionAlert from './components/ActionAlert';
import ApprovalTransactionEditionModal, {
  asApprovalTransaction,
  type ApprovalTransaction,
} from './components/ApprovalTransactionEditionModal';
import GasEditModal, {
  type CustomGasEstimate,
  type GasFeeEstimatesShape,
  feeMarketEstimateForOption,
  legacyEstimateForOption,
} from './components/GasEditModal';
import InfoModal from './components/InfoModal';
import useModalHandler from '../../Base/hooks/useModalHandler';
import useBalance from './utils/useBalance';
import { decodeApproveData, getTicker } from '../../../util/transactions';
import { toLowerCaseEquals } from '../../../util/general';
import {
  selectSwapsAggregatorMetadata,
  selectSwapsApprovalTransaction,
  selectSwapsError,
  selectSwapsIsInPolling,
  selectSwapsPollingCyclesLeft,
  selectSwapsQuoteRefreshSeconds,
  selectSwapsQuoteValues,
  selectSwapsQuotes,
  selectSwapsQuotesLastFetched,
  selectSwapsTopAggId,
  selectSwapsUsedCustomGas,
  selectSwapsUsedGasEstimate,
  swapsTokensSelector,
} from '../../../reducers/swaps';
import { decGWEIToHexWEI } from '../../../util/conversions';
import FadeAnimationView from '../FadeAnimationView';
import Logger from '../../../util/Logger';
import { useTheme } from '../../../util/theme';
import {
  getAddressAccountType,
  isHardwareAccount,
} from '../../../util/address';
import {
  selectEvmChainId,
  selectIsEIP1559Network,
  selectSelectedNetworkClientId,
  selectEvmTicker,
} from '../../../selectors/networkController';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../selectors/currencyRateController';
import { selectAccounts } from '../../../selectors/accountTrackerController';
import { selectContractBalances } from '../../../selectors/tokenBalancesController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import {
  resetTransaction as resetTransactionAction,
  setRecipient as setRecipientAction,
} from '../../../actions/transaction';
import { createBuyNavigationDetails } from '../Ramp/routes/utils';
import { SwapsViewSelectors } from '../../../../e2e/selectors/swaps/SwapsView.selectors';
import { useMetrics } from '../../../components/hooks/useMetrics';
import { addTransaction } from '../../../util/transaction-controller';
import trackErrorAsAnalytics from '../../../util/metrics/TrackError/trackErrorAsAnalytics';
import { selectGasFeeEstimates } from '../../../selectors/confirmTransaction';
import { selectShouldUseSmartTransaction } from '../../../selectors/smartTransactionsController';
import { selectGasFeeControllerEstimateType } from '../../../selectors/gasFeeController';
import { addSwapsTransaction } from '../../../util/swaps/swaps-transactions';
import {
  DEFAULT_GAS_FEE_OPTION_FEE_MARKET,
  DEFAULT_GAS_FEE_OPTION_LEGACY,
  getGasFeeEstimatesForTransaction,
} from './utils/gas';
import { getGlobalEthQuery } from '../../../util/networks/global-network';
import SmartTransactionsMigrationBanner from '../../Views/confirmations/legacy/components/SmartTransactionsMigrationBanner/SmartTransactionsMigrationBanner';
import { useSwapsSmartTransaction } from './utils/useSwapsSmartTransaction';
import Routes from '../../../constants/navigation/Routes';
import { ApprovalTypes } from '../../../core/RPCMethods/RPCMethodMiddleware';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';
import {
  getTradeTxTokenFee,
  type GasIncludedQuote,
} from '../../../util/smart-transactions';
import { useFiatConversionRates } from './utils/useFiatConversionRates';
import { useGasTokenFiatAmount } from './utils/useGasTokenFiatAmount';
import type { RootState } from '../../../reducers';

/**
 * `ScreenView` forwards every prop to the `ScrollView` it renders, while its
 * own props only declare `children`.
 */
const ScreenView = BaseScreenView as React.ComponentType<
  ScrollViewProps & { children?: React.ReactNode }
>;

/**
 * `calculateEthFeeForMultiLayer` is untyped JavaScript; its `ethFee` parameter
 * is inferred as a number from its default value but it also handles the
 * decimal strings the Swaps controller produces.
 */
const multiLayerEthFee = (
  multiLayerL1FeeTotal: string,
  ethFee?: string | number,
): string | number =>
  calculateEthFeeForMultiLayer({
    multiLayerL1FeeTotal,
    ethFee: ethFee as number,
  });

const LOG_PREFIX = 'Swaps';
const POLLING_INTERVAL = 30000;
const SLIPPAGE_BUCKETS = {
  MEDIUM: AppConstants.GAS_OPTIONS.MEDIUM,
  HIGH: AppConstants.GAS_OPTIONS.HIGH,
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flexGrow: 1,
      justifyContent: 'space-between',
      backgroundColor: colors.background.default,
    },
    container: {
      backgroundColor: colors.background.default,
    },
    topBar: {
      alignItems: 'center',
      marginVertical: 12,
    },
    alertBar: {
      paddingHorizontal: 20,
      marginVertical: 10,
      width: '100%',
    },
    smartTransactionsMigrationBanner: {
      paddingHorizontal: 20,
      width: '100%',
    },
    timerWrapper: {
      backgroundColor: colors.background.alternative,
      borderRadius: 20,
      marginVertical: 12,
      paddingVertical: 4,
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
    timer: {
      fontVariant: ['tabular-nums'],
    },
    timerHiglight: {
      color: colors.error.default,
    },
    content: {
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    errorViewContent: {
      flex: 1,
      marginHorizontal: Device.isSmallDevice() ? 20 : 55,
      justifyContent: 'center',
    },
    errorTitle: {
      fontSize: 24,
      marginVertical: 10,
    },
    errorText: {
      fontSize: 14,
    },
    sourceTokenContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tokenIcon: {
      marginHorizontal: 5,
    },
    tokenText: {
      color: colors.text.alternative,
      fontSize: Device.isSmallDevice() ? 16 : 18,
    },
    tokenTextDestination: {
      color: colors.text.default,
    },
    arrowDown: {
      color: colors.icon.alternative,
      fontSize: Device.isSmallDevice() ? 22 : 25,
      marginHorizontal: 15,
      marginTop: Device.isSmallDevice() ? 2 : 4,
      marginBottom: Device.isSmallDevice() ? 0 : 2,
    },
    amount: {
      textAlignVertical: 'center',
      fontSize: Device.isSmallDevice() ? 45 : 60,
      marginBottom: Device.isSmallDevice() ? 8 : 24,
    },
    exchangeRate: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: Device.isSmallDevice() ? 1 : 1,
    },
    bottomSection: {
      marginBottom: 6,
      alignItems: 'stretch',
      paddingHorizontal: 20,
    },
    sliderButtonText: {
      fontSize: 16,
      color: colors.primary.inverse,
    },
    quotesSummary: {
      marginVertical: Device.isSmallDevice() ? 12 : 24,
    },
    quotesSummaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    bestQuoteText: {
      color: colors.text.default,
    },
    quotesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    quotesDescription: {
      flex: 1,
      flexWrap: 'wrap',
      flexDirection: 'row',
      marginRight: 3,
    },
    quotesLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginRight: 2,
      alignItems: 'center',
    },
    quotesFiatColumn: {
      flex: 1,
      marginLeft: 3,
      flexWrap: 'wrap',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    infoIcon: {
      fontSize: 12,
      margin: 3,
      color: colors.icon.alternative,
    },
    ctaButton: {
      width: '100%',
    },
    errorIcon: {
      fontSize: 46,
      marginVertical: 4,
      color: colors.error.default,
    },
    expiredIcon: {
      color: colors.icon.default,
    },
    disabled: {
      opacity: 0.4,
    },
    termsButton: {
      marginTop: 10,
      marginBottom: 6,
    },
    gasInfoContainer: {
      paddingHorizontal: 2,
    },
    gasInfoIcon: {
      color: colors.icon.alternative,
    },
    hitSlop: {
      top: 10,
      left: 10,
      bottom: 10,
      right: 10,
    },
    text: {
      lineHeight: 20,
      color: colors.text.default,
    },
    fetchingText: {
      color: colors.text.default,
    },
    included: {
      fontStyle: 'italic',
    },
  });

/**
 * Price impact information the Swaps API adds to every quote.
 */
interface PriceSlippage {
  bucket?: string;
  calculationError?: string;
  ratio?: number | string;
  sourceAmountInETH?: string;
  destinationAmountInETH?: string;
}

/**
 * Quote as stored by the Swaps controller, including the fields the API
 * returns that are missing from the controller type.
 */
type SwapsQuote = Quote &
  Partial<GasIncludedQuote> & {
    slippage?: number;
    priceSlippage?: PriceSlippage;
  };

/**
 * Token as listed by the Swaps API, with the fields this view always needs.
 */
interface QuotesToken extends SwapsToken {
  symbol: string;
  decimals: number;
}

interface SwapsQuotesError {
  key?: string | null;
  description?: string | null;
}

/**
 * Quote values of the selected quote. On multi layer fee networks the ETH fees
 * are recalculated, which yields decimal strings instead of the hex strings the
 * Swaps controller stores.
 */
type SelectedQuoteValue = Omit<QuoteValues, 'ethFee' | 'maxEthFee'> & {
  ethFee: string | number;
  maxEthFee: string | number;
};

/**
 * Gas estimates used to build the swap transactions, either the ones selected
 * by the user or the ones the Swaps controller last used.
 */
interface TransactionGasEstimates {
  gasPrice: string;
  medium: string;
}

type QuotesNavigation = StackNavigationProp<ParamListBase>;

/**
 * Params the quotes navbar reads and this view sets through `setParams`, in
 * addition to the ones the amount view navigates with.
 */
interface QuotesRouteParams extends QuotesNavigationParams {
  title?: string;
  leftAction?: string;
  requestedTrade?: {
    token_from?: string;
    token_to?: string;
    request_type?: string;
    custom_slippage?: number;
    chain_id?: string;
    token_from_amount?: string;
  };
  selectedQuote?: string;
  quoteBegin?: number;
}

type QuotesRoute = RouteProp<Record<string, QuotesRouteParams>, string>;

interface ResetAndStartPollingOptions {
  slippage: number;
  sourceToken?: QuotesToken;
  destinationToken?: QuotesToken;
  sourceAmount?: string;
  walletAddress?: string;
  networkClientId: string;
  enableGasIncludedQuotes: boolean;
}

async function resetAndStartPolling({
  slippage,
  sourceToken,
  destinationToken,
  sourceAmount,
  walletAddress,
  networkClientId,
  enableGasIncludedQuotes,
}: ResetAndStartPollingOptions) {
  if (!sourceToken || !destinationToken) {
    return;
  }
  const { SwapsController } = Engine.context;

  const fetchParams = getFetchParams({
    slippage,
    sourceToken,
    destinationToken,
    sourceAmount,
    walletAddress,
    networkClientId,
    enableGasIncludedQuotes,
  });
  await SwapsController.stopPollingAndResetState();
  await SwapsController.startFetchAndSetQuotes(
    // The controller types the source amount as a number, while the API and
    // this view both use the minimal unit amount as a string.
    fetchParams as unknown as APIFetchQuotesParams,
    { ...fetchParams.metaData, networkClientId },
  );
}

/**
 * Multiplies gasLimit by multiplier if both defined
 */
const gasLimitWithMultiplier = (
  gasLimit?: string | null,
  multiplier?: number,
): BigNumber | undefined => {
  if (!gasLimit || !multiplier) return;
  return new BigNumber(gasLimit).times(multiplier).integerValue();
};

async function addTokenToAssetsController(
  newToken: QuotesToken,
  networkClientId: string,
) {
  const { TokensController } = Engine.context;

  // The token list lookup this used to perform passed a predicate to
  // `Array.prototype.includes`, so it never matched. `addToken` overwrites an
  // existing entry, which keeps the resulting state the same.
  if (!isSwapsNativeAsset(newToken)) {
    const { address, symbol, decimals, name } = newToken;
    await TokensController.addToken({
      address,
      symbol,
      decimals,
      name,
      networkClientId,
    });
  }
}

interface StateProps {
  swapsTokens: QuotesToken[];
  /**
   * Map of accounts to information objects including balances
   */
  accounts: Record<string, { balance: string }>;
  /**
   * An object containing token balances for current account and network in the format address => balance
   */
  balances: Record<string, string>;
  /**
   * ETH to current currency conversion rate
   */
  conversionRate?: number | null;
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency: string;
  /**
   * A string that represents the selected address
   */
  selectedAddress?: string;
  /**
   * Chain Id
   */
  chainId: Hex;
  /**
   * ID of the global network client
   */
  networkClientId: string;
  /**
   * Native asset ticker
   */
  ticker: string;
  /**
   * Primary currency, either ETH or Fiat
   */
  primaryCurrency: string;
  isInPolling: boolean;
  quotesLastFetched: number | null;
  topAggId: string | null;
  /**
   * Aggregator metada from Swaps controller API
   */
  aggregatorMetadata?: Record<string, AggregatorMetadata> | null;
  pollingCyclesLeft: number;
  quotes: Record<string, SwapsQuote>;
  quoteValues: Record<string, QuoteValues> | null;
  approvalTransaction?: ApprovalTransaction | null;
  error?: SwapsQuotesError | null;
  quoteRefreshSeconds: number | null;
  gasEstimateType: string;
  gasFeeEstimates: GasFeeEstimatesShape;
  usedGasEstimate: CustomGasEstimate | null;
  usedCustomGas: CustomGasEstimate | null;
  shouldUseSmartTransaction: boolean;
  isEIP1559Network: boolean;
}

interface DispatchProps {
  setRecipient: (from: string) => void;
  resetTransaction: () => void;
}

type Props = StateProps & DispatchProps;

function SwapsQuotesView({
  swapsTokens,
  accounts,
  balances,
  selectedAddress,
  currentCurrency,
  conversionRate,
  chainId,
  networkClientId,
  ticker,
  primaryCurrency,
  isInPolling,
  quotesLastFetched,
  pollingCyclesLeft,
  approvalTransaction: originalApprovalTransaction,
  topAggId,
  aggregatorMetadata,
  quotes,
  quoteValues,
  error,
  quoteRefreshSeconds,
  gasEstimateType,
  gasFeeEstimates,
  usedGasEstimate,
  usedCustomGas,
  setRecipient,
  resetTransaction,
  shouldUseSmartTransaction,
  isEIP1559Network,
}: Props) {
  const navigation = useNavigation<QuotesNavigation>();
  /* Get params from navigation */
  const route = useRoute<QuotesRoute>();
  const { trackEvent, createEventBuilder } = useMetrics();

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const {
    sourceTokenAddress,
    destinationTokenAddress,
    sourceAmount = '0',
    slippage,
    tokens,
  } = useMemo(() => getQuotesNavigationsParams(route), [route]);

  /* Get tokens from the tokens list, both are always part of it */
  const sourceToken = [...swapsTokens, ...(tokens ?? [])].find((token) =>
    toLowerCaseEquals(token.address, sourceTokenAddress),
  ) as QuotesToken;
  const destinationToken = [...swapsTokens, ...(tokens ?? [])].find((token) =>
    toLowerCaseEquals(token.address, destinationTokenAddress),
  ) as QuotesToken;

  /* State */
  const isMainnet = isMainnetByChainId(chainId);
  const multiLayerFeeNetwork = isMultiLayerFeeNetwork(chainId);
  const [firstLoadTime, setFirstLoadTime] = useState(Date.now());
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [shouldFinishFirstLoad, setShouldFinishFirstLoad] = useState(false);
  const [remainingTime, setRemainingTime] = useState(POLLING_INTERVAL);

  const [allQuotesFetchTime, setAllQuotesFetchTime] = useState<number | null>(
    null,
  );
  const [trackedRequestedQuotes, setTrackedRequestedQuotes] = useState(false);
  const [trackedReceivedQuotes, setTrackedReceivedQuotes] = useState(false);
  const [trackedError, setTrackedError] = useState(false);
  const [animateOnGasChange, setAnimateOnGasChange] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHandlingSwap, setIsHandlingSwap] = useState(false);
  const [multiLayerL1ApprovalFeeTotal, setMultiLayerL1ApprovalFeeTotal] =
    useState<string | null>(null);

  /* Selected quote, initially topAggId (see effects) */
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  /* Slippage alert dismissed, values: false, 'high', medium, 'low' */
  const [hasDismissedSlippageAlert, setHasDismissedSlippageAlert] = useState<
    string | false
  >(false);

  const [editQuoteTransactionsVisible, setEditQuoteTransactionsVisible] =
    useState(false);

  const [customGasEstimate, setCustomGasEstimate] =
    useState<CustomGasEstimate | null>(null);
  const [customGasLimit, setCustomGasLimit] = useState<string | null>(null);

  // TODO: use this variable in the future when calculating savings
  const [isSaving] = useState(false);
  const [isInFetch, setIsInFetch] = useState(false);

  useEffect(() => {
    navigation.setOptions(getSwapsQuotesNavbar(navigation, route, colors));
  }, [navigation, route, colors]);

  const hasConversionRate = useMemo(
    () =>
      Boolean(destinationToken) &&
      (isSwapsNativeAsset(destinationToken) ||
        (Object.keys(quotes).length > 0 &&
          (Object.values(quotes)[0]?.destinationTokenRate ?? null) !== null)),
    [destinationToken, quotes],
  );

  /* Get quotes as an array sorted by overallValue */
  const allQuotes = useMemo(() => {
    if (
      !quotes ||
      !quoteValues ||
      Object.keys(quotes).length === 0 ||
      Object.keys(quoteValues).length === 0
    ) {
      return [];
    }

    const orderedAggregators = hasConversionRate
      ? Object.values(quoteValues).sort(
          (a, b) =>
            Number(b.overallValueOfQuote) - Number(a.overallValueOfQuote),
        )
      : Object.values(quotes).sort((a, b) => {
          const comparison = new BigNumber(b.destinationAmount).comparedTo(
            a.destinationAmount,
          );
          if (comparison === 0) {
            // If the  destination amount is the same, we sort by fees ascending
            return (
              Number(quoteValues[a.aggregator]?.ethFee) -
                Number(quoteValues[b.aggregator]?.ethFee) || 0
            );
          }
          return comparison;
          // eslint-disable-next-line no-mixed-spaces-and-tabs
        });

    return orderedAggregators.map(
      (quoteValue) => quotes[quoteValue.aggregator],
    );
  }, [hasConversionRate, quoteValues, quotes]);

  /* Get the selected quote, by default is topAggId */
  const selectedQuote = useMemo(
    () => allQuotes.find((quote) => quote?.aggregator === selectedQuoteId),
    [allQuotes, selectedQuoteId],
  );
  const tradeTxTokenFee = useMemo(
    () => getTradeTxTokenFee(selectedQuote as GasIncludedQuote),
    [selectedQuote],
  );
  const isGasIncludedTrade = useMemo(
    () => selectedQuote?.isGasIncludedTrade ?? false,
    [selectedQuote],
  );
  const canUseGasIncludedSwap = useMemo(
    () => isGasIncludedTrade && tradeTxTokenFee,
    [isGasIncludedTrade, tradeTxTokenFee],
  );
  const selectedQuoteValue = useMemo<SelectedQuoteValue | undefined>(() => {
    const quoteValue = quoteValues?.[selectedQuoteId ?? ''];
    if (!quoteValue || !multiLayerL1ApprovalFeeTotal) {
      return quoteValue;
    }
    const fees = {
      ethFee: multiLayerEthFee(multiLayerL1ApprovalFeeTotal, quoteValue.ethFee),
      maxEthFee: multiLayerEthFee(
        multiLayerL1ApprovalFeeTotal,
        quoteValue.maxEthFee,
      ),
    };
    return {
      ...quoteValue,
      ...fees,
    };
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    quoteValues?.[selectedQuoteId ?? ''],
    multiLayerL1ApprovalFeeTotal,
    quoteValues,
    selectedQuoteId,
  ]);

  const gasEstimates = useMemo(
    () =>
      (customGasEstimate || usedGasEstimate) as TransactionGasEstimates | null,
    [customGasEstimate, usedGasEstimate],
  );

  const { submitSwapsSmartTransaction } = useSwapsSmartTransaction({
    quote: selectedQuote,
    gasEstimates: gasEstimates as TransactionGasEstimates,
  });

  const initialGasLimit = useMemo(() => {
    if (!selectedQuote) {
      return '0';
    }
    return (
      selectedQuoteValue?.tradeMaxGasLimit ||
      gasLimitWithMultiplier(
        selectedQuote?.gasEstimate,
        selectedQuote?.gasMultiplier,
      )?.toString(10) ||
      selectedQuote?.maxGas?.toString(10)
    );
  }, [selectedQuote, selectedQuoteValue]);
  const gasLimit = useMemo(
    () => customGasLimit || initialGasLimit,
    [customGasLimit, initialGasLimit],
  );
  /* Balance */
  const checkEnoughEthBalance = useCallback(
    (gasAmountHex?: string) => {
      const gasBN = new BigNumber(gasAmountHex || '0', 16);
      const ethAmountBN = isSwapsNativeAsset(sourceToken)
        ? new BigNumber(sourceAmount)
        : new BigNumber(0);
      const ethBalanceBN = new BigNumber(
        accounts[selectedAddress ?? '']?.balance,
      );
      const hasEnoughEthBalance =
        isGasIncludedTrade && tradeTxTokenFee
          ? true
          : ethBalanceBN.gte(ethAmountBN.plus(gasBN));
      return hasEnoughEthBalance;
    },
    [
      accounts,
      selectedAddress,
      sourceAmount,
      sourceToken,
      tradeTxTokenFee,
      isGasIncludedTrade,
    ],
  );

  const balance = useBalance(accounts, balances, selectedAddress, sourceToken, {
    asUnits: true,
  });
  const [
    hasEnoughTokenBalance,
    missingTokenBalance,
    hasEnoughEthBalance,
    missingEthBalance,
  ] = useMemo(() => {
    // Token
    const sourceBN = new BigNumber(sourceAmount);
    const tokenBalanceBN = new BigNumber(String(balance));
    const enoughTokenBalance = tokenBalanceBN.gte(sourceBN);
    const missingToken = enoughTokenBalance
      ? null
      : sourceBN.minus(tokenBalanceBN);

    const ethAmountBN = isSwapsNativeAsset(sourceToken)
      ? sourceBN
      : new BigNumber(0);
    const ethBalanceBN = new BigNumber(
      accounts[selectedAddress ?? '']?.balance,
    );
    const gasBN = toWei(selectedQuoteValue?.maxEthFee || '0').toString(10);
    const enoughEthBalance = canUseGasIncludedSwap
      ? true
      : ethBalanceBN.gte(ethAmountBN.plus(gasBN));
    const missingEth = enoughEthBalance
      ? null
      : ethAmountBN.plus(gasBN).minus(ethBalanceBN);

    return [
      enoughTokenBalance,
      missingToken,
      enoughEthBalance,
      missingEth,
    ] as const;
  }, [
    accounts,
    balance,
    selectedQuoteValue,
    selectedAddress,
    sourceAmount,
    sourceToken,
    canUseGasIncludedSwap,
  ]);

  /* Selected quote slippage */
  const shouldDisplaySlippage = useMemo(
    () =>
      (selectedQuote &&
        ([SLIPPAGE_BUCKETS.MEDIUM, SLIPPAGE_BUCKETS.HIGH] as string[]).includes(
          selectedQuote?.priceSlippage?.bucket ?? '',
        )) ||
      (selectedQuote?.priceSlippage?.calculationError?.length ?? 0) > 0,
    [selectedQuote],
  );

  const slippageRatio = useMemo(
    () =>
      parseFloat(
        new BigNumber(selectedQuote?.priceSlippage?.ratio || 0, 10)
          .minus(1, 10)
          .times(100, 10)
          .toFixed(2),
      ),
    [selectedQuote],
  );

  const unableToSwap = useMemo(
    () =>
      !isInPolling ||
      isInFetch ||
      !selectedQuote ||
      !hasEnoughTokenBalance ||
      !hasEnoughEthBalance,
    [
      isInPolling,
      isInFetch,
      selectedQuote,
      hasEnoughTokenBalance,
      hasEnoughEthBalance,
    ],
  );

  /* Approval transaction if any */
  const [approvalTransaction, setApprovalTransaction] = useState<
    ApprovalTransaction | undefined
  >(originalApprovalTransaction ?? undefined);

  const approvalMinimumSpendLimit = useMemo(() => {
    if (!approvalTransaction) return '0';
    return fromTokenMinimalUnit(sourceAmount, sourceToken.decimals);
  }, [approvalTransaction, sourceAmount, sourceToken.decimals]);

  const onCancelEditQuoteTransactions = useCallback(
    () => setEditQuoteTransactionsVisible(false),
    [],
  );

  useEffect(() => {
    setApprovalTransaction(originalApprovalTransaction ?? undefined);
  }, [originalApprovalTransaction]);

  /* Modals, state and handlers */
  const [isFeeModalVisible, toggleFeeModal, , hideFeeModal] =
    useModalHandler(false);
  const [isQuotesModalVisible, toggleQuotesModal, , hideQuotesModal] =
    useModalHandler(false);
  const [isUpdateModalVisible, toggleUpdateModal, , hideUpdateModal] =
    useModalHandler(false);
  const [
    isPriceDifferenceModalVisible,
    togglePriceDifferenceModal,
    ,
    hidePriceDifferenceModal,
  ] = useModalHandler(false);
  const [
    isPriceImpactModalVisible,
    togglePriceImpactModal,
    ,
    hidePriceImpactModal,
  ] = useModalHandler(false);

  const [isEditingGas, , showEditingGas, hideEditingGas] =
    useModalHandler(false);
  const [isGasTooltipVisible, , showGasTooltip, hideGasTooltip] =
    useModalHandler(false);
  const [
    isGasIncludedTooltipVisible,
    ,
    showGasIncludedTooltip,
    hideGasIncludedTooltip,
  ] = useModalHandler(false);

  const handleGasFeeUpdate = useCallback(
    (changedGasEstimate: CustomGasEstimate, changedGasLimit?: string) => {
      const { SwapsController } = Engine.context;
      setCustomGasEstimate(changedGasEstimate);
      SwapsController.updateQuotesWithGasPrice(
        changedGasEstimate as CustomEthGasPriceEstimate | CustomGasFee,
      );
      if (changedGasLimit && changedGasLimit !== gasLimit) {
        setCustomGasLimit(changedGasLimit);
        SwapsController.updateSelectedQuoteWithGasLimit(
          addHexPrefix(new BigNumber(changedGasLimit).toString(16)),
        );
      }

      const changedGasPrice = changedGasEstimate.gasPrice;
      const parameters = {
        speed_set: changedGasEstimate?.selected,
        gas_mode: changedGasEstimate?.selected ? 'Basic' : 'Advanced',
        // TODO: how should we track EIP1559 values?
        gas_fees: (
          [
            GAS_ESTIMATE_TYPES.LEGACY,
            GAS_ESTIMATE_TYPES.ETH_GASPRICE,
          ] as string[]
        ).includes(gasEstimateType) && changedGasPrice !== undefined
          ? weiToFiat(
              toWei(
                swapsUtils
                  .calcTokenAmount(
                    new BigNumber(changedGasLimit ?? '0', 10).times(
                      decGWEIToHexWEI(changedGasPrice),
                      16,
                    ),
                    18,
                  )
                  .toString(10),
              ),
              conversionRate,
              currentCurrency,
              // eslint-disable-next-line no-mixed-spaces-and-tabs
            )
          : '',
        chain_id: getDecimalChainId(chainId),
      };

      trackEvent(
        createEventBuilder(MetaMetricsEvents.GAS_FEES_CHANGED)
          .addProperties(parameters)
          .build(),
      );
    },
    [
      chainId,
      conversionRate,
      currentCurrency,
      gasEstimateType,
      gasLimit,
      trackEvent,
      createEventBuilder,
    ],
  );

  /* Handlers */
  const handleAnimationEnd = useCallback(() => {
    setIsFirstLoad(false);
    if (!error?.key) {
      navigation.setParams({ leftAction: strings('swaps.edit') });
    }
  }, [error, navigation]);

  const selectedNetworkClientId = useSelector(selectSelectedNetworkClientId);

  const handleRetryFetchQuotes = useCallback(() => {
    if (error?.key === swapsUtils.SwapsError.QUOTES_EXPIRED_ERROR) {
      navigation.setParams({ leftAction: strings('navigation.back') });
      setFirstLoadTime(Date.now());
      setIsFirstLoad(true);
      setTrackedRequestedQuotes(false);
      setTrackedReceivedQuotes(false);
      setTrackedError(false);
      resetAndStartPolling({
        slippage,
        sourceToken,
        destinationToken,
        sourceAmount,
        walletAddress: selectedAddress,
        networkClientId: selectedNetworkClientId,
        enableGasIncludedQuotes: shouldUseSmartTransaction,
      });
    } else {
      navigation.pop();
    }
  }, [
    error,
    slippage,
    sourceToken,
    destinationToken,
    sourceAmount,
    selectedAddress,
    navigation,
    selectedNetworkClientId,
    shouldUseSmartTransaction,
  ]);

  const updateSwapsTransactions = useCallback(
    async (transactionMetaId: string, approvalTransactionMetaId?: string) => {
      const ethQuery = getGlobalEthQuery();
      const blockNumber = await query(ethQuery, 'blockNumber', []);
      const currentBlock = await query(ethQuery, 'getBlockByNumber', [
        blockNumber,
        false,
      ]);

      addSwapsTransaction(transactionMetaId, {
        action: 'swap',
        sourceToken: {
          address: sourceToken.address,
          decimals: sourceToken.decimals,
        },
        destinationToken: {
          address: destinationToken.address,
          decimals: destinationToken.decimals,
        },
        sourceAmount,
        destinationAmount: String(selectedQuote?.destinationAmount),
        sourceAmountInFiat: weiToFiat(
          toWei(selectedQuote?.priceSlippage?.sourceAmountInETH ?? '0'),
          conversionRate,
          currentCurrency,
        ),
        analytics: {
          token_from: sourceToken.symbol,
          token_from_amount: fromTokenMinimalUnitString(
            sourceAmount,
            sourceToken.decimals,
          ),
          token_to: destinationToken.symbol,
          token_to_amount: fromTokenMinimalUnitString(
            String(selectedQuote?.destinationAmount),
            destinationToken.decimals,
          ),
          request_type: hasEnoughTokenBalance ? 'Order' : 'Quote',
          custom_slippage: slippage !== AppConstants.SWAPS.DEFAULT_SLIPPAGE,
          best_quote_source: selectedQuote?.aggregator,
          available_quotes: allQuotes.length,
          network_fees_USD: weiToFiat(
            toWei(selectedQuoteValue?.ethFee ?? '0'),
            conversionRate,
            currentCurrency,
          ),
          network_fees_ETH: renderFromWei(
            toWei(selectedQuoteValue?.ethFee ?? '0'),
          ),
          // The quotes list is indexed by position, so the original lookup by
          // aggregator id only ever resolved when no quote was selected.
          other_quote_selected: selectedQuote === undefined,
          chain_id: getDecimalChainId(chainId),
          is_smart_transaction: shouldUseSmartTransaction,
          gas_included: canUseGasIncludedSwap,
        },
        paramsForAnalytics: {
          sentAt: currentBlock.timestamp,
          gasEstimate: selectedQuote?.gasEstimate || selectedQuote?.maxGas,
          ethAccountBalance: accounts[selectedAddress ?? '']?.balance,
          approvalTransactionMetaId,
        },
      });
    },
    [
      chainId,
      accounts,
      selectedAddress,
      currentCurrency,
      selectedQuote,
      sourceToken,
      sourceAmount,
      destinationToken,
      hasEnoughTokenBalance,
      slippage,
      allQuotes,
      conversionRate,
      selectedQuoteValue,
      shouldUseSmartTransaction,
      canUseGasIncludedSwap,
    ],
  );

  const startSwapAnalytics = useCallback(
    (quote: SwapsQuote, address: string) => {
      const parameters = {
        account_type: getAddressAccountType(address),
        token_from: sourceToken.symbol,
        token_to: destinationToken.symbol,
        request_type: hasEnoughTokenBalance ? 'Order' : 'Quote',
        slippage,
        custom_slippage: slippage !== AppConstants.SWAPS.DEFAULT_SLIPPAGE,
        best_quote_source: quote.aggregator,
        available_quotes: allQuotes.length,
        other_quote_selected: selectedQuote === undefined,
        network_fees_USD: weiToFiat(
          toWei(selectedQuoteValue?.ethFee ?? '0'),
          conversionRate,
          'usd',
        ),
        network_fees_ETH: renderFromWei(
          toWei(selectedQuoteValue?.ethFee ?? '0'),
        ),
        chain_id: getDecimalChainId(chainId),
        is_smart_transaction: shouldUseSmartTransaction,
        gas_included: canUseGasIncludedSwap,
      };
      const sensitiveParameters = {
        token_from_amount: fromTokenMinimalUnitString(
          sourceAmount,
          sourceToken.decimals,
        ),
        token_to_amount: fromTokenMinimalUnitString(
          String(quote.destinationAmount),
          destinationToken.decimals,
        ),
      };
      trackEvent(
        createEventBuilder(MetaMetricsEvents.SWAP_STARTED)
          .addProperties(parameters)
          .addSensitiveProperties(sensitiveParameters)
          .build(),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      chainId,
      sourceAmount,
      hasEnoughTokenBalance,
      slippage,
      allQuotes,
      selectedQuoteValue,
      selectedQuoteId,
      conversionRate,
      destinationToken,
      createEventBuilder,
    ],
  );

  const handleSwapTransaction = useCallback(
    async (approvalTransactionMetaId?: string) => {
      if (!selectedQuote) {
        return;
      }

      try {
        resetTransaction();
        const tradeTransaction = { ...selectedQuote.trade, chainId };

        const tradeGasFeeEstimates = await getGasFeeEstimatesForTransaction(
          tradeTransaction,
          gasEstimates as TransactionGasEstimates,
          { chainId, isEIP1559Network },
        );

        const { transactionMeta, result } = await addTransaction(
          {
            ...tradeTransaction,
            ...tradeGasFeeEstimates,
          },
          {
            deviceConfirmedOn: WalletDevice.MM_MOBILE,
            networkClientId,
            origin: process.env.MM_FOX_CODE,
          },
        );

        Logger.log(LOG_PREFIX, 'Added trade transaction', transactionMeta.id);

        await result;

        Logger.log(
          LOG_PREFIX,
          'Submitted trade transaction',
          transactionMeta.id,
        );

        updateSwapsTransactions(transactionMeta.id, approvalTransactionMetaId);

        setRecipient(selectedAddress ?? '');

        await addTokenToAssetsController(destinationToken, networkClientId);
        await addTokenToAssetsController(sourceToken, networkClientId);
      } catch (e) {
        Logger.log(LOG_PREFIX, 'Failed to submit trade transaction', e);
      }
    },
    [
      destinationToken,
      gasEstimates,
      selectedQuote,
      sourceToken,
      updateSwapsTransactions,
      selectedAddress,
      setRecipient,
      resetTransaction,
      chainId,
      isEIP1559Network,
      networkClientId,
    ],
  );

  const handleApprovalTransaction = useCallback(
    async (isHardwareAddress: boolean) => {
      if (!approvalTransaction) {
        return;
      }

      try {
        resetTransaction();

        const approvalTransactionParams = { ...approvalTransaction, chainId };

        const approvalGasFeeEstimates = await getGasFeeEstimatesForTransaction(
          approvalTransactionParams,
          gasEstimates as TransactionGasEstimates,
          { chainId, isEIP1559Network },
        );

        const { transactionMeta, result } = await addTransaction(
          {
            ...approvalTransactionParams,
            ...approvalGasFeeEstimates,
          },
          {
            deviceConfirmedOn: WalletDevice.MM_MOBILE,
            networkClientId,
            origin: process.env.MM_FOX_CODE,
          },
        );

        Logger.log(
          LOG_PREFIX,
          'Added approval transaction',
          transactionMeta.id,
        );

        await result;

        Logger.log(
          LOG_PREFIX,
          'Submitted approval transaction',
          transactionMeta.id,
        );

        // TODO: remove this when linea swaps issue is resolved with better transaction awaiting
        if (
          (
            [
              CHAIN_IDS.LINEA_MAINNET,
              CHAIN_IDS.LINEA_GOERLI,
              CHAIN_IDS.LINEA_SEPOLIA,
            ] as Hex[]
          ).includes(chainId)
        ) {
          Logger.log(
            'Delaying submitting trade tx to make Linea confirmation more likely',
          );
          const waitPromise = new Promise((resolve) =>
            setTimeout(resolve, 5000),
          );
          await waitPromise;
        }

        setRecipient(selectedAddress ?? '');

        const approvalTransactionMetaId = transactionMeta.id;

        addSwapsTransaction(transactionMeta.id, {
          action: 'approval',
          sourceToken: {
            address: sourceToken.address,
            decimals: sourceToken.decimals,
          },
          destinationToken: { swaps: 'swaps' },
          upTo: new BigNumber(
            decodeApproveData(approvalTransaction.data).encodedAmount,
            16,
          ).toString(10),
        });

        if (isHardwareAddress) {
          const { id: transactionId } = transactionMeta;

          Engine.controllerMessenger.subscribeOnceIf(
            'TransactionController:transactionConfirmed',
            (confirmedTransactionMeta: TransactionMeta) => {
              if (
                confirmedTransactionMeta.status === TransactionStatus.confirmed
              ) {
                handleSwapTransaction(approvalTransactionMetaId);
              }
            },
            (confirmedTransactionMeta: TransactionMeta) =>
              confirmedTransactionMeta.id === transactionId,
          );
        }

        return approvalTransactionMetaId;
      } catch (e) {
        Logger.log(LOG_PREFIX, 'Failed to submit approval transaction', e);
      }
    },
    [
      approvalTransaction,
      gasEstimates,
      isEIP1559Network,
      handleSwapTransaction,
      sourceToken.address,
      sourceToken.decimals,
      selectedAddress,
      setRecipient,
      resetTransaction,
      chainId,
      networkClientId,
    ],
  );

  const handleCompleteSwap = useCallback(async () => {
    setIsHandlingSwap(true);

    if (!selectedQuote) {
      setIsHandlingSwap(false);
      return;
    }

    const isHardwareAddress = Boolean(isHardwareAccount(selectedAddress ?? ''));

    startSwapAnalytics(selectedQuote, selectedAddress ?? '');

    let approvalTransactionMetaId: string | undefined;

    if (shouldUseSmartTransaction) {
      try {
        const { approvalTxUuid, tradeTxUuid } =
          await submitSwapsSmartTransaction();

        // Update info to show in Activity list
        // We use the stx uuids instead of the txMeta.id since we don't have the txMeta
        // Approval tx info
        if (approvalTxUuid) {
          addSwapsTransaction(approvalTxUuid, {
            action: 'approval',
            sourceToken: {
              address: sourceToken.address,
              decimals: sourceToken.decimals,
            },
            destinationToken: { swaps: 'swaps' },
            upTo: new BigNumber(
              decodeApproveData(approvalTransaction?.data ?? '').encodedAmount,
              16,
            ).toString(10),
          });
        }

        // Trade tx info
        updateSwapsTransactions(tradeTxUuid ?? '', approvalTxUuid);

        // Route to TransactionsView and show Swaps STX modal
        navigation.navigate(Routes.TRANSACTIONS_VIEW);
        Engine.context.ApprovalController.addAndShowApprovalRequest({
          id: tradeTxUuid ?? '', // Doesn't really matter what this is, as long as it's unique, we will just read it from latest STX in SmartTransactionStatus
          origin: ORIGIN_METAMASK,
          type: ApprovalTypes.SMART_TRANSACTION_STATUS,
          // requestState gets passed to app/components/Views/confirmations/components/Approval/TemplateConfirmation/Templates/SmartTransactionStatus.ts
          // can also be read from approvalController.state.pendingApprovals[approvalId].requestState
          requestState: {
            smartTransaction: {
              status: SmartTransactionStatuses.PENDING,
              creationTime: Date.now(),
              uuid: tradeTxUuid ?? '',
            },
            isInSwapFlow: true,
          },
        });
      } catch (e) {
        Logger.log(LOG_PREFIX, 'Failed to submit smart transaction', e);
        setIsHandlingSwap(false);
      }
    } else {
      if (approvalTransaction) {
        approvalTransactionMetaId = await handleApprovalTransaction(
          isHardwareAddress,
        );

        if (isHardwareAddress) {
          setIsHandlingSwap(false);
          navigation.dangerouslyGetParent<QuotesNavigation>()?.pop();
          return;
        }
      }

      await handleSwapTransaction(approvalTransactionMetaId);

      setIsHandlingSwap(false);
      navigation.dangerouslyGetParent<QuotesNavigation>()?.pop();
    }
  }, [
    selectedQuote,
    selectedAddress,
    approvalTransaction,
    startSwapAnalytics,
    handleApprovalTransaction,
    handleSwapTransaction,
    navigation,
    shouldUseSmartTransaction,
    submitSwapsSmartTransaction,
    sourceToken.address,
    sourceToken.decimals,
    updateSwapsTransactions,
  ]);

  const onEditQuoteTransactionsGas = useCallback(() => {
    showEditingGas();
  }, [showEditingGas]);

  const onEditQuoteTransactionsApproveAmount = useCallback(() => {
    if (!approvalTransaction || !originalApprovalTransaction) {
      return;
    }
    const originalApprovalTransactionEncodedAmount = decodeApproveData(
      originalApprovalTransaction.data,
    ).encodedAmount;
    const originalAmount = fromTokenMinimalUnitString(
      hexToBN(originalApprovalTransactionEncodedAmount).toString(10),
      sourceToken.decimals,
    );
    const currentApprovalTransactionEncodedAmount = approvalTransaction
      ? decodeApproveData(approvalTransaction.data).encodedAmount
      : '0';
    const currentAmount = fromTokenMinimalUnitString(
      hexToBN(currentApprovalTransactionEncodedAmount).toString(10),
      sourceToken.decimals,
    );

    setEditQuoteTransactionsVisible(true);

    const parameters = {
      token_from: sourceToken.symbol,
      token_to: destinationToken.symbol,
      request_type: hasEnoughTokenBalance ? 'Order' : 'Quote',
      slippage,
      custom_slippage: slippage !== AppConstants.SWAPS.DEFAULT_SLIPPAGE,
      available_quotes: allQuotes.length,
      best_quote_source: selectedQuote?.aggregator,
      other_quote_selected: selectedQuote === undefined,
      gas_fees: weiToFiat(
        toWei(selectedQuoteValue?.ethFee ?? '0'),
        conversionRate,
        currentCurrency,
      ),
      custom_spend_limit_set: originalAmount !== currentAmount,
      custom_spend_limit_amount: currentAmount,
      chain_id: getDecimalChainId(chainId),
      is_smart_transaction: shouldUseSmartTransaction,
      gas_included: canUseGasIncludedSwap,
    };
    const sensitiveParameters = {
      token_from_amount: fromTokenMinimalUnitString(
        sourceAmount,
        sourceToken.decimals,
      ),
      token_to_amount: fromTokenMinimalUnitString(
        String(selectedQuote?.destinationAmount),
        destinationToken.decimals,
      ),
    };
    trackEvent(
      createEventBuilder(MetaMetricsEvents.EDIT_SPEND_LIMIT_OPENED)
        .addProperties(parameters)
        .addSensitiveProperties(sensitiveParameters)
        .build(),
    );
  }, [
    chainId,
    allQuotes,
    approvalTransaction,
    conversionRate,
    currentCurrency,
    destinationToken,
    selectedQuoteValue,
    hasEnoughTokenBalance,
    originalApprovalTransaction,
    selectedQuote,
    slippage,
    sourceAmount,
    sourceToken,
    trackEvent,
    createEventBuilder,
    shouldUseSmartTransaction,
    canUseGasIncludedSwap,
  ]);

  const handleQuotesReceivedMetric = useCallback(() => {
    if (!selectedQuote || !selectedQuoteValue) return;
    const parameters = {
      token_from: sourceToken.symbol,
      token_to: destinationToken.symbol,
      request_type: hasEnoughTokenBalance ? 'Order' : 'Quote',
      slippage,
      custom_slippage: slippage !== AppConstants.SWAPS.DEFAULT_SLIPPAGE,
      response_time: allQuotesFetchTime,
      best_quote_source: selectedQuote.aggregator,
      network_fees_USD: weiToFiat(
        toWei(selectedQuoteValue.ethFee),
        conversionRate,
        'usd',
      ),
      network_fees_ETH: renderFromWei(toWei(selectedQuoteValue.ethFee)),
      available_quotes: allQuotes.length,
      chain_id: getDecimalChainId(chainId),
    };
    const sensitiveParameters = {
      token_from_amount: fromTokenMinimalUnitString(
        sourceAmount,
        sourceToken.decimals,
      ),
      token_to_amount: fromTokenMinimalUnitString(
        String(selectedQuote.destinationAmount),
        destinationToken.decimals,
      ),
    };
    trackEvent(
      createEventBuilder(MetaMetricsEvents.QUOTES_RECEIVED)
        .addProperties(parameters)
        .addSensitiveProperties(sensitiveParameters)
        .build(),
    );
  }, [
    chainId,
    sourceToken,
    sourceAmount,
    destinationToken,
    selectedQuote,
    hasEnoughTokenBalance,
    slippage,
    allQuotesFetchTime,
    selectedQuoteValue,
    allQuotes,
    conversionRate,
    trackEvent,
    createEventBuilder,
  ]);

  const handleOpenQuotesModal = useCallback(() => {
    if (!selectedQuote || !selectedQuoteValue) return;
    toggleQuotesModal();
    const parameters = {
      token_from: sourceToken.symbol,
      token_to: destinationToken.symbol,
      request_type: hasEnoughTokenBalance ? 'Order' : 'Quote',
      slippage,
      custom_slippage: slippage !== AppConstants.SWAPS.DEFAULT_SLIPPAGE,
      response_time: allQuotesFetchTime,
      best_quote_source: selectedQuote.aggregator,
      network_fees_USD: weiToFiat(
        toWei(selectedQuoteValue.ethFee),
        conversionRate,
        'usd',
      ),
      network_fees_ETH: renderFromWei(toWei(selectedQuoteValue.ethFee)),
      available_quotes: allQuotes.length,
      chain_id: getDecimalChainId(chainId),
    };
    const sensitiveParameters = {
      token_from_amount: fromTokenMinimalUnitString(
        sourceAmount,
        sourceToken.decimals,
      ),
      token_to_amount: fromTokenMinimalUnitString(
        String(selectedQuote.destinationAmount),
        destinationToken.decimals,
      ),
    };

    trackEvent(
      createEventBuilder(MetaMetricsEvents.ALL_AVAILABLE_QUOTES_OPENED)
        .addProperties(parameters)
        .addSensitiveProperties(sensitiveParameters)
        .build(),
    );
  }, [
    chainId,
    selectedQuote,
    selectedQuoteValue,
    toggleQuotesModal,
    sourceToken,
    sourceAmount,
    destinationToken,
    hasEnoughTokenBalance,
    slippage,
    allQuotesFetchTime,
    conversionRate,
    allQuotes.length,
    trackEvent,
    createEventBuilder,
  ]);

  const handleQuotesErrorMetric = useCallback(
    (quotesError?: SwapsQuotesError | null) => {
      const data = {
        token_from: sourceToken.symbol,
        token_to: destinationToken.symbol,
        request_type: hasEnoughTokenBalance ? 'Order' : 'Quote',
        slippage,
        custom_slippage: slippage !== AppConstants.SWAPS.DEFAULT_SLIPPAGE,
        chain_id: getDecimalChainId(chainId),
      };
      const sensitiveData = {
        token_from_amount: fromTokenMinimalUnitString(
          sourceAmount,
          sourceToken.decimals,
        ),
      };
      if (quotesError?.key === swapsUtils.SwapsError.QUOTES_EXPIRED_ERROR) {
        const parameters = {
          ...data,
          gas_fees: '',
        };

        trackEvent(
          createEventBuilder(MetaMetricsEvents.QUOTES_TIMED_OUT)
            .addProperties(parameters)
            .addSensitiveProperties(sensitiveData)
            .build(),
        );
      } else if (
        quotesError?.key === swapsUtils.SwapsError.QUOTES_NOT_AVAILABLE_ERROR
      ) {
        const parameters = { ...data };
        trackEvent(
          createEventBuilder(MetaMetricsEvents.NO_QUOTES_AVAILABLE)
            .addProperties(parameters)
            .addSensitiveProperties(sensitiveData)
            .build(),
        );
      } else {
        trackErrorAsAnalytics(
          `Swaps: ${quotesError?.key}`,
          quotesError?.description ?? '',
        );
      }
    },
    [
      chainId,
      sourceToken,
      sourceAmount,
      destinationToken,
      hasEnoughTokenBalance,
      slippage,
      trackEvent,
      createEventBuilder,
    ],
  );

  const handleSlippageAlertPress = useCallback(() => {
    if (!selectedQuote) {
      return;
    }
    setHasDismissedSlippageAlert(selectedQuote.priceSlippage?.bucket ?? false);
  }, [selectedQuote]);

  const buyEth = useCallback(() => {
    try {
      navigation.navigate(...createBuyNavigationDetails());
    } catch (navigationError) {
      Logger.error(
        navigationError as Error,
        'Navigation: Error when navigating to buy ETH.',
      );
    }

    trackEvent(
      createEventBuilder(
        MetaMetricsEvents.RECEIVE_OPTIONS_PAYMENT_REQUEST,
      ).build(),
    );
  }, [navigation, trackEvent, createEventBuilder]);

  const handleTermsPress = useCallback(
    () =>
      navigation.navigate('Webview', {
        screen: 'SimpleWebview',
        params: {
          url: AppConstants.URLS.TERMS_AND_CONDITIONS,
        },
      }),
    [navigation],
  );

  /* Effects */

  /* Main polling effect */
  useEffect(() => {
    resetAndStartPolling({
      slippage,
      sourceToken,
      destinationToken,
      sourceAmount,
      walletAddress: selectedAddress,
      networkClientId: selectedNetworkClientId,
      enableGasIncludedQuotes: shouldUseSmartTransaction,
    });

    return () => {
      const { SwapsController } = Engine.context;
      SwapsController.stopPollingAndResetState();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    destinationToken.address,
    selectedAddress,
    slippage,
    sourceAmount,
    sourceToken.address,
    selectedNetworkClientId,
    shouldUseSmartTransaction,
  ]);

  /** selectedQuote alert effect */
  useEffect(() => {
    if (!selectedQuote) {
      return setHasDismissedSlippageAlert(false);
    }
    if (
      Boolean(hasDismissedSlippageAlert) &&
      selectedQuote?.priceSlippage?.bucket !== hasDismissedSlippageAlert
    ) {
      return setHasDismissedSlippageAlert(false);
    }
  }, [hasDismissedSlippageAlert, selectedQuote]);

  /* First load effect: handle initial animation */
  useEffect(() => {
    if (isFirstLoad && !shouldFinishFirstLoad) {
      if (firstLoadTime < (quotesLastFetched ?? 0) || error) {
        setShouldFinishFirstLoad(true);
        if (!error) {
          navigation.setParams({ leftAction: strings('swaps.edit') });
        }
      }
    }
  }, [
    error,
    firstLoadTime,
    isFirstLoad,
    navigation,
    quotesLastFetched,
    shouldFinishFirstLoad,
  ]);

  useEffect(() => {
    let maxFetchTime = 0;
    allQuotes.forEach((quote) => {
      maxFetchTime = Math.max(maxFetchTime, quote?.fetchTime);
    });
    setAllQuotesFetchTime(maxFetchTime);
  }, [allQuotes]);

  /* selectedQuoteId effect: when topAggId changes make it selected by default */
  useEffect(() => setSelectedQuoteId(topAggId), [topAggId]);

  /* IsInFetch effect: hide every modal, handle countdown */
  useEffect(() => {
    const tick = setInterval(() => {
      const newRemainingTime =
        (quotesLastFetched ?? 0) +
        (quoteRefreshSeconds ?? 0) * 1000 -
        Date.now() +
        1000;
      // If newRemainingTime > remainingTime means that a new set of quotes were fetched
      if (newRemainingTime > remainingTime) {
        hideFeeModal();
        hideQuotesModal();
        hidePriceDifferenceModal();
        hidePriceImpactModal();
        onCancelEditQuoteTransactions();
        hideEditingGas();
      }

      // If newRemainingTime < 0 means that quotes are still being fetched
      // then we show a loader
      if (!isInFetch && newRemainingTime < 0) {
        setIsInFetch(true);
      } else if (isInFetch && newRemainingTime > 0) {
        setIsInFetch(false);
      }

      setRemainingTime(newRemainingTime);
    }, 1000);
    return () => {
      clearInterval(tick);
    };
  }, [
    hideFeeModal,
    hideEditingGas,
    hideQuotesModal,
    onCancelEditQuoteTransactions,
    isInFetch,
    quotesLastFetched,
    quoteRefreshSeconds,
    remainingTime,
    hidePriceDifferenceModal,
    hidePriceImpactModal,
  ]);

  /* errorKey effect: hide every modal */
  useEffect(() => {
    if (error?.key) {
      hideFeeModal();
      hideQuotesModal();
      hideUpdateModal();
      hidePriceDifferenceModal();
      onCancelEditQuoteTransactions();
      hideEditingGas();
    }
  }, [
    error,
    hideFeeModal,
    hideEditingGas,
    hideQuotesModal,
    handleQuotesErrorMetric,
    onCancelEditQuoteTransactions,
    hidePriceDifferenceModal,
    hideUpdateModal,
  ]);

  /** Gas Effects */

  const [pollToken, setPollToken] = useState<string | null>(null);

  useEffect(() => {
    const { GasFeeController } = Engine.context;
    async function polling() {
      const newPollToken =
        await GasFeeController.getGasFeeEstimatesAndStartPolling(
          pollToken ?? undefined,
        );
      setPollToken(newPollToken);
    }
    if (isInPolling) {
      polling();
      return () => {
        GasFeeController.stopPolling();
        setPollToken(null);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInPolling]);

  useEffect(
    () => {
      if (selectedQuote) {
        const { SwapsController } = Engine.context;
        let gasEstimate: CustomGasEstimate | null = null;
        let customGasAreIncompatible = false;
        if (gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
          // Added a selected property because for ETH_GASPRICE any user change will lead
          // to stop updating the estimates, unless there is an option selected.
          customGasAreIncompatible =
            customGasEstimate !== null &&
            'estimatedBaseFee' in customGasEstimate;
          gasEstimate = {
            gasPrice: legacyEstimateForOption(gasFeeEstimates, 'gasPrice'),
            selected: DEFAULT_GAS_FEE_OPTION_LEGACY,
          };
        } else if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
          customGasAreIncompatible =
            customGasEstimate !== null &&
            'estimatedBaseFee' in customGasEstimate;
          const selected =
            customGasEstimate?.selected || DEFAULT_GAS_FEE_OPTION_LEGACY;
          gasEstimate = {
            gasPrice: legacyEstimateForOption(gasFeeEstimates, selected),
            selected,
          };
        } else if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
          customGasAreIncompatible =
            customGasEstimate !== null && 'gasPrice' in customGasEstimate;
          const selected =
            customGasEstimate?.selected || DEFAULT_GAS_FEE_OPTION_FEE_MARKET;
          const feeMarketEstimate = feeMarketEstimateForOption(
            gasFeeEstimates,
            selected,
          );
          gasEstimate = {
            maxFeePerGas: feeMarketEstimate?.suggestedMaxFeePerGas,
            maxPriorityFeePerGas:
              feeMarketEstimate?.suggestedMaxPriorityFeePerGas,
            estimatedBaseFee: legacyEstimateForOption(
              gasFeeEstimates,
              'estimatedBaseFee',
            ),
            selected,
          };
        }
        if (
          gasEstimate &&
          (!customGasEstimate ||
            customGasEstimate?.selected ||
            customGasAreIncompatible)
        ) {
          setAnimateOnGasChange(true);
          setCustomGasEstimate(gasEstimate);
          SwapsController.updateQuotesWithGasPrice(
            gasEstimate as CustomEthGasPriceEstimate | CustomGasFee,
          );
        }
      }
    },
    // `customGasEstimate` is removed from dependency array because handleGasFeeUpdate updates it
    // leading to a infinite recursive call
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gasEstimateType, gasFeeEstimates, selectedQuote],
  );

  useEffect(() => {
    if (animateOnGasChange) setAnimateOnGasChange(false);
  }, [animateOnGasChange]);

  const onGasAnimationStart = useCallback(() => setIsAnimating(true), []);
  const onGasAnimationEnd = useCallback(() => setIsAnimating(false), []);

  /** Metrics Effects */
  /* Metrics: Quotes requested */
  useEffect(() => {
    if (!isInFetch) return;
    if (trackedRequestedQuotes) return;
    setTrackedRequestedQuotes(true);
    const data = {
      token_from: sourceToken.symbol,
      token_to: destinationToken.symbol,
      request_type: hasEnoughTokenBalance ? 'Order' : 'Quote',
      custom_slippage: slippage !== AppConstants.SWAPS.DEFAULT_SLIPPAGE,
      chain_id: getDecimalChainId(chainId),
    };
    const sensitiveData = {
      token_from_amount: fromTokenMinimalUnitString(
        sourceAmount,
        sourceToken.decimals,
      ),
    };
    navigation.setParams({ requestedTrade: { ...data, ...sensitiveData } });
    navigation.setParams({ selectedQuote: undefined });
    navigation.setParams({ quoteBegin: Date.now() });

    trackEvent(
      createEventBuilder(MetaMetricsEvents.QUOTES_REQUESTED)
        .addProperties(data)
        .addSensitiveProperties(sensitiveData)
        .build(),
    );
  }, [
    chainId,
    destinationToken,
    hasEnoughTokenBalance,
    isInFetch,
    navigation,
    slippage,
    sourceAmount,
    sourceToken,
    trackedRequestedQuotes,
    trackEvent,
    createEventBuilder,
  ]);

  /* Metrics: Quotes received */
  useEffect(() => {
    if (isInFetch) return;
    if (!selectedQuote) return;
    if (trackedReceivedQuotes) return;
    setTrackedReceivedQuotes(true);
    navigation.setParams({ selectedQuote });
    handleQuotesReceivedMetric();
  }, [
    isInFetch,
    navigation,
    selectedQuote,
    quotesLastFetched,
    handleQuotesReceivedMetric,
    trackedReceivedQuotes,
  ]);

  /* Metrics: Quotes error */
  useEffect(() => {
    if (!error?.key || trackedError) return;
    setTrackedError(true);
    handleQuotesErrorMetric(error);
  }, [error, handleQuotesErrorMetric, trackedError]);

  useEffect(() => {
    if (!multiLayerFeeNetwork) {
      return;
    }
    const getEstimatedL1ApprovalFee = async () => {
      try {
        let l1ApprovalFeeTotal: string | undefined = '0x0';
        if (approvalTransaction) {
          // `fetchEstimatedMultiLayerL1Fee` ignores its first argument.
          l1ApprovalFeeTotal = await fetchEstimatedMultiLayerL1Fee(undefined, {
            txParams: {
              ...approvalTransaction,
              value: '0x0', // For approval txs we need to use "0x0" here.
            },
            chainId,
          });
          setMultiLayerL1ApprovalFeeTotal(l1ApprovalFeeTotal ?? null);
        }
      } catch (e) {
        Logger.error(e as Error, 'fetchEstimatedMultiLayerL1Fee call failed');
        setMultiLayerL1ApprovalFeeTotal(null);
      }
    };
    getEstimatedL1ApprovalFee();
  }, [multiLayerFeeNetwork, approvalTransaction, chainId]);

  const openLinkAboutGas = () =>
    Linking.openURL(
      'https://community.metamask.io/t/what-is-gas-why-do-transactions-take-so-long/3172',
    );

  const openLinkAboutGasIncluded = () =>
    Linking.openURL(
      'https://support.metamask.io/token-swaps/user-guide-swaps/#gas-fees',
    );

  const fiatConversionRates = useFiatConversionRates({
    canUseGasIncludedSwap,
    selectedQuote: selectedQuote ?? null,
    tradeTxTokenFee,
    currentCurrency,
    chainId,
  });

  const gasTokenFiatAmount = useGasTokenFiatAmount({
    canUseGasIncludedSwap,
    selectedQuote: selectedQuote ?? null,
    tradeTxTokenFee,
    currentCurrency,
    fiatConversionRates: fiatConversionRates?.value,
  });

  /* Rendering */
  if (isFirstLoad || (!error?.key && !selectedQuote)) {
    return (
      <ScreenView contentContainerStyle={styles.screen} scrollEnabled={false}>
        <LoadingAnimation
          finish={shouldFinishFirstLoad}
          onAnimationEnd={handleAnimationEnd}
          aggregatorMetadata={aggregatorMetadata ?? undefined}
          headPan={false}
        />
      </ScreenView>
    );
  }

  if (!isInPolling && error?.key) {
    const [errorTitle, errorMessage, errorAction] = getErrorMessage(error?.key);
    const errorIcon =
      error?.key === swapsUtils.SwapsError.QUOTES_EXPIRED_ERROR ? (
        <MaterialCommunityIcons
          name="clock-outline"
          style={[styles.errorIcon, styles.expiredIcon]}
        />
      ) : (
        <MaterialCommunityIcons
          name="alert-outline"
          style={[styles.errorIcon]}
        />
      );

    return (
      <ScreenView contentContainerStyle={styles.screen}>
        <View style={[styles.content, styles.errorViewContent]}>
          {errorIcon}
          <Text primary centered style={styles.errorTitle}>
            {errorTitle}
          </Text>
          <Text centered style={styles.errorText}>
            {errorMessage}
          </Text>
        </View>
        <View style={styles.bottomSection}>
          <StyledButton
            type="blue"
            containerStyle={styles.ctaButton}
            onPress={handleRetryFetchQuotes}
          >
            {errorAction}
          </StyledButton>
        </View>
      </ScreenView>
    );
  }

  const disabledView =
    shouldDisplaySlippage &&
    !hasDismissedSlippageAlert &&
    hasEnoughTokenBalance &&
    hasEnoughEthBalance;

  return (
    <ScreenView
      contentContainerStyle={styles.screen}
      style={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        {shouldUseSmartTransaction && (
          <View style={styles.smartTransactionsMigrationBanner}>
            <SmartTransactionsMigrationBanner />
          </View>
        )}
        {(!hasEnoughTokenBalance || !hasEnoughEthBalance) && (
          <View style={styles.alertBar}>
            <Alert small type={AlertType.Info}>
              <Text reset bold>
                {!hasEnoughTokenBalance && !isSwapsNativeAsset(sourceToken)
                  ? `${renderFromTokenMinimalUnit(
                      missingTokenBalance?.toString(10) ?? '0',
                      sourceToken.decimals,
                    )} ${sourceToken.symbol} `
                  : `${renderFromWei(
                      missingEthBalance?.toString(10) ?? '0',
                    )} ${getTicker(ticker)} `}
              </Text>
              {!hasEnoughTokenBalance
                ? `${strings('swaps.more_to_complete')} `
                : `${strings('swaps.more_gas_to_complete')} `}
              {(isSwapsNativeAsset(sourceToken) ||
                (hasEnoughTokenBalance && !hasEnoughEthBalance)) && (
                <Text link underline small onPress={buyEth}>
                  {strings('swaps.token_marketplace')}
                </Text>
              )}
            </Alert>
          </View>
        )}
        {!!selectedQuote &&
          hasEnoughTokenBalance &&
          hasEnoughEthBalance &&
          shouldDisplaySlippage && (
            <View style={styles.alertBar}>
              <ActionAlert
                type={
                  selectedQuote.priceSlippage?.bucket === SLIPPAGE_BUCKETS.HIGH
                    ? AlertType.Error
                    : AlertType.Warning
                }
                action={
                  hasDismissedSlippageAlert
                    ? undefined
                    : strings('swaps.i_understand')
                }
                onPress={handleSlippageAlertPress}
                onInfoPress={
                  (selectedQuote.priceSlippage?.calculationError?.length ?? 0) >
                  0
                    ? togglePriceImpactModal
                    : togglePriceDifferenceModal
                }
              >
                {(textStyle) =>
                  (selectedQuote.priceSlippage?.calculationError?.length ?? 0) >
                  0 ? (
                    <>
                      <Text style={textStyle} bold centered>
                        {strings('swaps.market_price_unavailable_title')}
                      </Text>
                      <Text style={textStyle} small centered>
                        {strings('swaps.market_price_unavailable')}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={textStyle} bold centered>
                        {strings('swaps.price_difference', {
                          amount: `~${slippageRatio}%`,
                        })}
                      </Text>
                      <Text style={textStyle} centered>
                        {strings('swaps.about_to_swap')}{' '}
                        {renderFromTokenMinimalUnit(
                          selectedQuote.sourceAmount,
                          sourceToken.decimals,
                        )}{' '}
                        {sourceToken.symbol} (~
                        <Text reset upper>
                          {weiToFiat(
                            toWei(
                              selectedQuote.priceSlippage?.sourceAmountInETH ||
                                0,
                            ),
                            conversionRate,
                            currentCurrency,
                          )}
                        </Text>
                        ) {strings('swaps.for')}{' '}
                        {renderFromTokenMinimalUnit(
                          selectedQuote.destinationAmount,
                          destinationToken.decimals,
                        )}{' '}
                        {destinationToken.symbol} (~
                        <Text reset upper>
                          {weiToFiat(
                            toWei(
                              selectedQuote.priceSlippage
                                ?.destinationAmountInETH || 0,
                            ),
                            conversionRate,
                            currentCurrency,
                          )}
                        </Text>
                        ).
                      </Text>
                    </>
                  )
                }
              </ActionAlert>
            </View>
          )}
        {isInPolling && (
          <TouchableOpacity
            onPress={toggleUpdateModal}
            disabled={disabledView}
            style={[styles.timerWrapper, disabledView && styles.disabled]}
          >
            {isInFetch ? (
              <>
                <ActivityIndicator size="small" />
                <Text style={styles.fetchingText}>
                  {' '}
                  {strings('swaps.fetching_new_quotes')}
                </Text>
              </>
            ) : (
              <Text primary>
                {pollingCyclesLeft > 0
                  ? strings('swaps.new_quotes_in')
                  : strings('swaps.quotes_expire_in')}{' '}
                <Text
                  bold
                  primary
                  style={[
                    styles.timer,
                    remainingTime < 30000 && styles.timerHiglight,
                  ]}
                >
                  {new Date(remainingTime).toISOString().substr(15, 4)}
                </Text>
              </Text>
            )}
          </TouchableOpacity>
        )}
        {!isInPolling && (
          <View style={[styles.timerWrapper, disabledView && styles.disabled]}>
            <Text>...</Text>
          </View>
        )}
      </View>

      <View
        style={[styles.content, disabledView && styles.disabled]}
        pointerEvents={disabledView ? 'none' : 'auto'}
      >
        {selectedQuote && (
          <>
            <View style={styles.sourceTokenContainer}>
              <Text style={styles.tokenText}>
                {renderFromTokenMinimalUnit(
                  selectedQuote.sourceAmount,
                  sourceToken.decimals,
                )}
              </Text>
              <TokenIcon
                style={styles.tokenIcon}
                icon={sourceToken.iconUrl}
                symbol={sourceToken.symbol}
              />
              <Text style={styles.tokenText}>{sourceToken.symbol}</Text>
            </View>
            <IonicIcon style={styles.arrowDown} name="arrow-down" />
            <View style={styles.sourceTokenContainer}>
              <TokenIcon
                style={styles.tokenIcon}
                icon={destinationToken.iconUrl}
                symbol={destinationToken.symbol}
              />
              <Text style={[styles.tokenText, styles.tokenTextDestination]}>
                {destinationToken.symbol}
              </Text>
            </View>
            <Text
              primary
              style={styles.amount}
              numberOfLines={1}
              adjustsFontSizeToFit
              allowFontScaling
            >
              {renderFromTokenMinimalUnit(
                selectedQuote.destinationAmount,
                destinationToken.decimals,
              )}
            </Text>
            <View style={styles.exchangeRate}>
              <Ratio
                sourceAmount={selectedQuote.sourceAmount}
                sourceToken={sourceToken}
                destinationAmount={String(selectedQuote.destinationAmount)}
                destinationToken={destinationToken}
              />
            </View>
          </>
        )}
      </View>

      <View
        style={[styles.bottomSection, disabledView && styles.disabled]}
        pointerEvents={disabledView ? 'none' : 'auto'}
      >
        {selectedQuote && (
          <QuotesSummary style={styles.quotesSummary}>
            <QuotesSummary.Header
              style={styles.quotesSummaryHeader}
              savings={isSaving}
            >
              <QuotesSummary.HeaderText style={styles.bestQuoteText} bold>
                {`${strings('swaps.n_quotes', {
                  numberOfQuotes: allQuotes.length,
                })} `}
              </QuotesSummary.HeaderText>
              {allQuotes.length > 1 && (
                <TouchableOpacity
                  onPress={handleOpenQuotesModal}
                  disabled={isInFetch}
                >
                  <QuotesSummary.HeaderText small>
                    {strings('swaps.view_details')} →
                  </QuotesSummary.HeaderText>
                </TouchableOpacity>
              )}
            </QuotesSummary.Header>
            <QuotesSummary.Body>
              {canUseGasIncludedSwap && (
                <View
                  style={styles.quotesRow}
                  testID={SwapsViewSelectors.QUOTE_SUMMARY}
                >
                  <View style={styles.quotesDescription}>
                    <View style={styles.quotesLegend}>
                      <Text primary bold>
                        {strings('swaps.gas_fee')}
                      </Text>
                      <TouchableOpacity
                        testID={SwapsViewSelectors.GAS_FEE}
                        style={styles.gasInfoContainer}
                        onPress={showGasIncludedTooltip}
                        hitSlop={styles.hitSlop}
                      >
                        <MaterialCommunityIcons
                          name="information"
                          size={13}
                          style={styles.gasInfoIcon}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {usedGasEstimate?.gasPrice ? (
                    <View style={styles.quotesFiatColumn}>
                      <Text primary bold>
                        {renderFromWei(
                          toWei(selectedQuoteValue?.ethFee ?? '0'),
                        )}{' '}
                        {getTicker(ticker)}
                      </Text>
                      <Text primary bold upper>
                        {`  ${
                          weiToFiat(
                            toWei(selectedQuoteValue?.ethFee ?? '0'),
                            conversionRate,
                            currentCurrency,
                          ) || ''
                        } `}
                      </Text>
                    </View>
                  ) : (
                    <FadeAnimationView
                      valueToWatch={`${selectedQuoteValue?.ethFee}${selectedQuoteValue?.maxEthFee}`}
                      animateOnChange={animateOnGasChange}
                      onAnimationStart={onGasAnimationStart}
                      onAnimationEnd={onGasAnimationEnd}
                      style={styles.quotesFiatColumn}
                    >
                      <>
                        <Text strikethrough>{gasTokenFiatAmount}</Text>
                        <Text style={styles.included}>{` ${strings(
                          'swaps.included',
                        )}`}</Text>
                      </>
                    </FadeAnimationView>
                  )}
                </View>
              )}
              {!canUseGasIncludedSwap && (
                <>
                  <View
                    style={styles.quotesRow}
                    testID={SwapsViewSelectors.QUOTE_SUMMARY}
                  >
                    <View style={styles.quotesDescription}>
                      <View style={styles.quotesLegend}>
                        <Text primary bold>
                          {strings('swaps.estimated_gas_fee')}
                        </Text>
                        <TouchableOpacity
                          testID={SwapsViewSelectors.GAS_FEE}
                          style={styles.gasInfoContainer}
                          onPress={showGasTooltip}
                          hitSlop={styles.hitSlop}
                        >
                          <MaterialCommunityIcons
                            name="information"
                            size={13}
                            style={styles.gasInfoIcon}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {usedGasEstimate?.gasPrice ? (
                      <View style={styles.quotesFiatColumn}>
                        <Text primary bold>
                          {renderFromWei(
                            toWei(selectedQuoteValue?.ethFee ?? '0'),
                          )}{' '}
                          {getTicker(ticker)}
                        </Text>
                        <Text primary bold upper>
                          {`  ${
                            weiToFiat(
                              toWei(selectedQuoteValue?.ethFee ?? '0'),
                              conversionRate,
                              currentCurrency,
                            ) || ''
                          }`}
                        </Text>
                      </View>
                    ) : (
                      <FadeAnimationView
                        valueToWatch={`${selectedQuoteValue?.ethFee}${selectedQuoteValue?.maxEthFee}`}
                        animateOnChange={animateOnGasChange}
                        onAnimationStart={onGasAnimationStart}
                        onAnimationEnd={onGasAnimationEnd}
                        style={styles.quotesFiatColumn}
                      >
                        {primaryCurrency === 'ETH' ? (
                          <>
                            <Text>
                              {`${
                                weiToFiat(
                                  toWei(selectedQuoteValue?.ethFee ?? '0'),
                                  conversionRate,
                                  currentCurrency,
                                ) || ''
                              } `}
                            </Text>
                            <TouchableOpacity
                              disabled={unableToSwap}
                              onPress={
                                unableToSwap
                                  ? undefined
                                  : onEditQuoteTransactionsGas
                              }
                            >
                              <Text
                                bold
                                upper
                                link={!unableToSwap}
                                underline={!unableToSwap}
                              >
                                {renderFromWei(
                                  toWei(selectedQuoteValue?.ethFee ?? '0'),
                                )}{' '}
                                {getTicker(ticker)}
                              </Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <TouchableOpacity
                              disabled={unableToSwap}
                              onPress={
                                unableToSwap
                                  ? undefined
                                  : onEditQuoteTransactionsGas
                              }
                            >
                              <Text
                                upper
                                link={!unableToSwap}
                                underline={!unableToSwap}
                              >
                                {renderFromWei(
                                  toWei(selectedQuoteValue?.ethFee ?? '0'),
                                )}{' '}
                                {getTicker(ticker)}
                              </Text>
                            </TouchableOpacity>
                            <Text primary bold>
                              {` ${
                                weiToFiat(
                                  toWei(selectedQuoteValue?.ethFee ?? '0'),
                                  conversionRate,
                                  currentCurrency,
                                ) || ''
                              }`}
                            </Text>
                          </>
                        )}
                      </FadeAnimationView>
                    )}
                  </View>

                  <View style={styles.quotesRow}>
                    {usedGasEstimate?.gasPrice ? (
                      <>
                        <View style={styles.quotesDescription}>
                          <View style={styles.quotesLegend}>
                            <Text>{strings('swaps.max_gas_fee')} </Text>
                          </View>
                        </View>
                        <View style={styles.quotesFiatColumn}>
                          <Text>
                            {renderFromWei(
                              toWei(selectedQuoteValue?.maxEthFee || '0x0'),
                            )}{' '}
                            {getTicker(ticker)}
                          </Text>
                          <Text upper>
                            {`  ${
                              weiToFiat(
                                toWei(selectedQuoteValue?.maxEthFee ?? '0'),
                                conversionRate,
                                currentCurrency,
                              ) || ''
                            }`}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.quotesDescription} />
                        <FadeAnimationView
                          valueToWatch={`${selectedQuoteValue?.ethFee}${selectedQuoteValue?.maxEthFee}`}
                          animateOnChange={animateOnGasChange}
                          style={styles.quotesFiatColumn}
                        >
                          <Text small primary bold>
                            {strings('transaction_review_eip1559.max_fee')}:
                          </Text>
                          <Text small primary>
                            {primaryCurrency === 'ETH'
                              ? ` ${renderFromWei(
                                  toWei(selectedQuoteValue?.maxEthFee || '0x0'),
                                )} ${getTicker(ticker)}` // eslint-disable-line
                              : ` ${
                                  weiToFiat(
                                    toWei(selectedQuoteValue?.maxEthFee ?? '0'),
                                    conversionRate,
                                    currentCurrency,
                                  ) || '' // eslint-disable-next-line
                                }`}
                          </Text>
                        </FadeAnimationView>
                      </>
                    )}
                  </View>
                </>
              )}

              {!!approvalTransaction && !unableToSwap && (
                <View style={styles.quotesRow}>
                  <Text>
                    <Text>{`${strings('swaps.enable.this_will')} `}</Text>
                    <Text bold>
                      {`${strings('swaps.enable.enable_asset', {
                        asset: sourceToken.symbol,
                      })} `}
                    </Text>
                    <Text>{`${strings('swaps.enable.for_swapping')} `}</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={onEditQuoteTransactionsApproveAmount}
                  >
                    <Text link>{`${strings('swaps.enable.edit_limit')}`}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <QuotesSummary.Separator />
              <View style={styles.quotesRow}>
                <TouchableOpacity
                  style={styles.quotesRow}
                  onPress={toggleFeeModal}
                >
                  <Text small>
                    {canUseGasIncludedSwap
                      ? `${strings(
                          'swaps.quotes_include_gas_and_metamask_fee',
                          {
                            fee: selectedQuote.fee,
                          },
                        )} `
                      : `${strings('swaps.quotes_include_fee', {
                          fee: selectedQuote.fee,
                        })} `}
                    <MaterialCommunityIcons
                      name="information"
                      style={styles.infoIcon}
                    />
                  </Text>
                </TouchableOpacity>
              </View>
            </QuotesSummary.Body>
          </QuotesSummary>
        )}
        <StyledButton
          type="confirm"
          onPress={handleCompleteSwap}
          disabled={unableToSwap || isHandlingSwap || isAnimating}
          testID={SwapsViewSelectors.SWAP_BUTTON}
        >
          {strings('swaps.swap')}
        </StyledButton>
        <TouchableOpacity onPress={handleTermsPress} style={styles.termsButton}>
          <Text link centered>
            {strings('swaps.terms_of_service')}
          </Text>
        </TouchableOpacity>
      </View>

      <InfoModal
        isVisible={isUpdateModalVisible}
        toggleModal={toggleUpdateModal}
        title={strings('swaps.quotes_update_often')}
        body={
          <Text style={styles.text}>
            {strings('swaps.quotes_update_often_text')}
          </Text>
        }
      />
      <InfoModal
        isVisible={isPriceDifferenceModalVisible}
        toggleModal={togglePriceDifferenceModal}
        title={strings('swaps.price_difference_title')}
        body={
          <Text style={styles.text}>
            {strings('swaps.price_difference_body')}
          </Text>
        }
      />
      <InfoModal
        isVisible={isPriceImpactModalVisible}
        toggleModal={togglePriceImpactModal}
        title={strings('swaps.price_impact_title')}
        body={
          <Text style={styles.text}>{strings('swaps.price_impact_body')}</Text>
        }
      />
      <InfoModal
        isVisible={isFeeModalVisible}
        toggleModal={toggleFeeModal}
        title={strings('swaps.metamask_swap_fee')}
        body={
          <Text style={styles.text}>
            {selectedQuote && selectedQuote?.fee > 0
              ? strings('swaps.fee_text.fee_is_applied', {
                  fee: `${selectedQuote.fee}%`,
                })
              : strings('swaps.fee_text.fee_is_not_applied')}
          </Text>
        }
      />
      <InfoModal
        isVisible={isGasTooltipVisible}
        title={strings(`swaps.gas_education_title`)}
        toggleModal={hideGasTooltip}
        body={
          <View>
            <Text grey infoModal>
              {strings('swaps.gas_education_1')}
              {strings(
                `swaps.gas_education_2${isMainnet ? '_ethereum' : ''}`,
              )}{' '}
              <Text bold>{strings('swaps.gas_education_3')}</Text>
            </Text>
            <Text grey infoModal>
              {strings('swaps.gas_education_4')}{' '}
              <Text bold>{strings('swaps.gas_education_5')} </Text>
              {strings('swaps.gas_education_6')}
            </Text>
            <Text grey infoModal>
              <Text bold>{strings('swaps.gas_education_7')} </Text>
              {strings('swaps.gas_education_8')}
            </Text>
            <TouchableOpacity onPress={openLinkAboutGas}>
              <Text grey link infoModal>
                {strings('swaps.gas_education_learn_more')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
      <InfoModal
        isVisible={isGasIncludedTooltipVisible}
        title={strings(`swaps.gas_fee`)}
        toggleModal={hideGasIncludedTooltip}
        body={
          <View>
            <Text grey infoModal>
              {strings('swaps.gas_included_tooltip_explanation')}
            </Text>
            <TouchableOpacity onPress={openLinkAboutGasIncluded}>
              <Text grey link infoModal>
                {strings('swaps.gas_education_title')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <QuotesModal
        isVisible={isQuotesModalVisible}
        toggleModal={toggleQuotesModal}
        quotes={allQuotes}
        sourceToken={sourceToken}
        destinationToken={destinationToken}
        selectedQuote={selectedQuoteId ?? undefined}
        showOverallValue={hasConversionRate}
        ticker={getTicker(ticker)}
        multiLayerL1ApprovalFeeTotal={multiLayerL1ApprovalFeeTotal}
      />

      <ApprovalTransactionEditionModal
        approvalTransaction={approvalTransaction}
        editQuoteTransactionsVisible={editQuoteTransactionsVisible}
        minimumSpendLimit={approvalMinimumSpendLimit}
        onCancelEditQuoteTransactions={onCancelEditQuoteTransactions}
        setApprovalTransaction={setApprovalTransaction}
        sourceToken={sourceToken}
        chainId={chainId}
      />

      <GasEditModal
        isVisible={isEditingGas}
        gasEstimateType={gasEstimateType}
        gasFeeEstimates={gasFeeEstimates}
        defaultGasFeeOptionFeeMarket={DEFAULT_GAS_FEE_OPTION_FEE_MARKET}
        defaultGasFeeOptionLegacy={DEFAULT_GAS_FEE_OPTION_LEGACY}
        onGasUpdate={handleGasFeeUpdate}
        dismiss={hideEditingGas}
        customGasFee={usedCustomGas}
        initialGasLimit={initialGasLimit}
        tradeGasLimit={selectedQuoteValue?.tradeGasLimit}
        isNativeAsset={isSwapsNativeAsset(sourceToken)}
        tradeValue={selectedQuote?.trade?.value || '0x0'}
        sourceAmount={sourceAmount}
        checkEnoughEthBalance={checkEnoughEthBalance}
        animateOnChange={animateOnGasChange}
      />
    </ScreenView>
  );
}

const mapStateToProps = (state: RootState): StateProps => ({
  accounts: selectAccounts(state),
  chainId: selectEvmChainId(state),
  networkClientId: selectSelectedNetworkClientId(state),
  ticker: selectEvmTicker(state),
  balances: selectContractBalances(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  isInPolling: selectSwapsIsInPolling(state),
  quotesLastFetched: selectSwapsQuotesLastFetched(state),
  pollingCyclesLeft: selectSwapsPollingCyclesLeft(state),
  topAggId: selectSwapsTopAggId(state),
  aggregatorMetadata: selectSwapsAggregatorMetadata(state),
  quotes: selectSwapsQuotes(state),
  quoteValues: selectSwapsQuoteValues(state),
  approvalTransaction: asApprovalTransaction(
    selectSwapsApprovalTransaction(state),
  ),
  error: selectSwapsError(state),
  quoteRefreshSeconds: selectSwapsQuoteRefreshSeconds(state),
  gasEstimateType: selectGasFeeControllerEstimateType(state),
  gasFeeEstimates: selectGasFeeEstimates(state),
  usedGasEstimate: selectSwapsUsedGasEstimate(state),
  usedCustomGas: selectSwapsUsedCustomGas(state),
  primaryCurrency: state.settings.primaryCurrency,
  swapsTokens: swapsTokensSelector(state),
  shouldUseSmartTransaction: selectShouldUseSmartTransaction(
    state,
    selectEvmChainId(state),
  ),
  isEIP1559Network: selectIsEIP1559Network(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setRecipient: (from: string) =>
    dispatch(setRecipientAction(from, '', '', '', '')),
  resetTransaction: () => dispatch(resetTransactionAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SwapsQuotesView);
