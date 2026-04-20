import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  TouchableOpacity,
  InteractionManager,
  Linking,
  ScrollView,
} from 'react-native';
import Eth from '@metamask/ethjs-query';
import ActionView, { ConfirmButtonState } from '../../../../../UI/ActionView';
import { getApproveNavbar } from '../../../../../UI/Navbar';
import { connect } from 'react-redux';
import { getHost } from '../../../../../../util/browser';
import {
  getAddressAccountType,
  getTokenDetails,
  shouldShowBlockExplorer,
} from '../../../../../../util/address';
import Engine from '../../../../../../core/Engine';
import { strings } from '../../../../../../../locales/i18n';
import { setTransactionObject } from '../../../../../../actions/transaction';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import {
  fromTokenMinimalUnit,
  hexToBN,
  isNumber,
  renderFromTokenMinimalUnit,
} from '../../../../../../util/number';
import {
  getTicker,
  getNormalizedTxState,
  getActiveTabUrl,
  getMethodData,
  decodeApproveData,
  generateTxWithNewTokenAllowance,
  minimumTokenAllowance,
  generateApprovalData,
  isNFTTokenStandard,
  TOKEN_METHOD_SET_APPROVAL_FOR_ALL,
} from '../../../../../../util/transactions';
import Avatar, {
  AvatarSize,
  AvatarVariant,
} from '../../../../../../component-library/components/Avatars/Avatar';
import Identicon from '../../../../../UI/Identicon';
import TransactionTypes from '../../../../../../core/TransactionTypes';
import { showAlert } from '../../../../../../actions/alert';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import TransactionHeader from '../../../../../UI/TransactionHeader';
import TransactionReviewDetailsCard from '../TransactionReview/TransactionReviewDetailsCard';
import AppConstants from '../../../../../../core/AppConstants';
import { UINT256_HEX_MAX_VALUE } from '../../../../../../constants/transaction';
import { getBlockaidTransactionMetricsParams } from '../../../../../../util/blockaid';
import { withNavigation } from '@react-navigation/compat';
import {
  isTestNet,
  isMultiLayerFeeNetwork,
  isMainnetByChainId,
  TESTNET_FAUCETS,
  isTestNetworkWithFaucet,
  getDecimalChainId,
} from '../../../../../../util/networks';
import { fetchEstimatedMultiLayerL1Fee } from '../../../../../../util/networks/engineNetworkUtils';
import CustomSpendCap from '../../../../../../component-library/components-temp/CustomSpendCap';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import Logger from '../../../../../../util/Logger';
import ButtonLink from '../../../../../../component-library/components/Buttons/Button/variants/ButtonLink';
import TransactionReview from '../TransactionReview/TransactionReviewEIP1559Update';
import ClipboardManager from '../../../../../../core/ClipboardManager';
import { useTheme } from '../../../../../../util/theme';
import withQRHardwareAwareness from '../../../../../UI/QRHardware/withQRHardwareAwareness';
import QRSigningDetails from '../../../../../UI/QRHardware/QRSigningDetails';
import Routes from '../../../../../../constants/navigation/Routes';
import createStyles from './styles';
import {
  selectNativeCurrencyByChainId,
  selectEvmNetworkConfigurationsByChainId,
  selectProviderTypeByChainId,
  selectRpcUrlByChainId,
} from '../../../../../../selectors/networkController';
import { selectTokenList } from '../../../../../../selectors/tokenListController';
import { selectTokensLength } from '../../../../../../selectors/tokensController';
import { selectAccountsLength } from '../../../../../../selectors/accountTrackerController';
import { selectCurrentTransactionSecurityAlertResponse } from '../../../../../../selectors/confirmTransaction';
import Text, {
  TextVariant,
} from '../../../../../../component-library/components/Texts/Text';
import ApproveTransactionHeader from '../ApproveTransactionHeader';
import VerifyContractDetails from './VerifyContractDetails/VerifyContractDetails';
import ShowBlockExplorer from './ShowBlockExplorer';
import { isNetworkRampNativeTokenSupported } from '../../../../../../components/UI/Ramp/utils';
import { getRampNetworks } from '../../../../../../reducers/fiatOrders';
import SkeletonText from '../../../../../../components/UI/Ramp/components/SkeletonText';
import InfoModal from '../../../../../UI/Swaps/components/InfoModal';
import { ResultType } from '../BlockaidBanner/BlockaidBanner.types';
import TransactionBlockaidBanner from '../TransactionBlockaidBanner/TransactionBlockaidBanner';
import { regex } from '../../../../../../util/regex';
import { withMetricsAwareness } from '../../../../../../components/hooks/useMetrics';
import { selectShouldUseSmartTransaction } from '../../../../../../selectors/smartTransactionsController';
import { createBuyNavigationDetails } from '../../../../../UI/Ramp/routes/utils';
import SDKConnect from '../../../../../../core/SDKConnect/SDKConnect';
import DevLogger from '../../../../../../core/SDKConnect/utils/DevLogger';
import { WC2Manager } from '../../../../../../core/WalletConnect/WalletConnectV2';
import { WALLET_CONNECT_ORIGIN } from '../../../../../../util/walletconnect';
import { isNonEvmChainId } from '../../../../../../core/Multichain/utils';
import { RootState } from '../../../../../../reducers';
import { IQRState } from '../../../../../UI/QRHardware/types';
import { IUseMetricsHook } from '../../../../../../components/hooks/useMetrics';

import SmartTransactionsMigrationBanner from '../SmartTransactionsMigrationBanner/SmartTransactionsMigrationBanner';
const { ORIGIN_DEEPLINK, ORIGIN_QR_CODE } = AppConstants.DEEPLINKS;
const POLLING_INTERVAL_ESTIMATED_L1_FEE = 30000;

let intervalIdForEstimatedL1Fee: ReturnType<typeof setInterval> | undefined;

const {
  ASSET: { ERC20 },
} = TransactionTypes;

interface TokenInfo {
  tokenSymbol?: string;
  tokenDecimals?: number;
  tokenName?: string;
  tokenValue?: string;
  tokenStandard?: string;
  tokenBalance?: string;
  tokenImage?: string;
}

interface TokenAllowanceState {
  tokenSymbol?: string;
  tokenDecimals?: number;
  tokenName?: string;
  tokenBalance?: string;
  tokenStandard?: string;
  isReadyToApprove?: boolean;
  tokenSpendValue?: string;
  originalApproveAmount?: string;
}

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TransactionObject {
  origin?: string;
  to?: string;
  data?: string;
  from?: string;
  id?: string;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction?: Record<string, any>;
  chainId?: string;
}

interface OwnProps {
  onCancel?: () => void;
  onConfirm?: () => void;
  onModeChange?: (mode: string) => void;
  gasError?: string;
  over?: boolean;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSetAnalyticsParams?: (params: Record<string, any>) => void;
  gasEstimateType?: string;
  onUpdatingValuesStart?: () => void;
  onUpdatingValuesEnd?: () => void;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  gasEstimationReady?: boolean;
  transactionConfirmed?: boolean;
  gasSelected?: string;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateTransactionState?: (state: Record<string, any>) => void;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  legacyGasObject?: Record<string, any>;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eip1559GasObject?: Record<string, any>;
  showBlockExplorer?: () => void;
  showVerifyContractDetails?: () => void;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  savedContactListToArray?: any[];
  closeVerifyContractDetails?: () => void;
  shouldVerifyContractDetails?: boolean;
  updateTokenAllowanceState?: (state: TokenAllowanceState) => void;
  tokenAllowanceState?: TokenAllowanceState;
  isGasEstimateStatusIn?: boolean;
  toggleModal?: (address: string) => void;
  nickname?: string;
  nicknameExists?: boolean;
  isSigningQRObject?: boolean;
  QRState?: IQRState;
  metrics: IUseMetricsHook;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
}

interface StateProps {
  ticker?: string;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkConfigurations?: Record<string, any>;
  transaction: TransactionObject;
  tokensLength?: number;
  accountsLength?: number;
  providerType?: string;
  providerRpcTarget?: string;
  primaryCurrency?: string;
  activeTabUrl?: string;
  chainId?: string;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenList?: Record<string, any>;
  isNativeTokenBuySupported?: boolean;
  shouldUseSmartTransaction?: boolean;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  securityAlertResponse?: Record<string, any>;
}

interface DispatchProps {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTransactionObject: (transaction: Record<string, any>) => void;
  showAlert: (config: {
    isVisible: boolean;
    autodismiss: number;
    content: string;
    data: { msg: string };
  }) => void;
}

type Props = OwnProps & StateProps & DispatchProps;

/**
 * Functional component that manages ERC20 approve from the dapp browser
 */
const ApproveTransactionReview = (props: Props) => {
  const {
    onCancel,
    onConfirm,
    transaction,
    showAlert: showAlertAction,
    ticker,
    tokensLength,
    accountsLength,
    providerType,
    onModeChange,
    gasError,
    primaryCurrency,
    activeTabUrl,
    navigation,
    over,
    onSetAnalyticsParams,
    chainId,
    gasEstimateType,
    onUpdatingValuesStart,
    onUpdatingValuesEnd,
    animateOnChange,
    isAnimating,
    gasEstimationReady,
    tokenList,
    transactionConfirmed,
    setTransactionObject: setTransactionObjectAction,
    toggleModal,
    nickname,
    nicknameExists,
    isSigningQRObject,
    QRState,
    gasSelected,
    updateTransactionState,
    legacyGasObject,
    eip1559GasObject,
    showBlockExplorer,
    showVerifyContractDetails,
    savedContactListToArray,
    closeVerifyContractDetails,
    shouldVerifyContractDetails,
    networkConfigurations,
    providerRpcTarget,
    isNativeTokenBuySupported,
    updateTokenAllowanceState,
    tokenAllowanceState,
    isGasEstimateStatusIn,
    metrics,
    shouldUseSmartTransaction,
    securityAlertResponse,
  } = props;

  const { colors } = useTheme();

  const [viewData, setViewData] = useState(false);
  const [host, setHost] = useState<string | undefined>(undefined);
  const [originalApproveAmount, setOriginalApproveAmount] = useState<
    string | undefined
  >(undefined);
  const [spendLimitCustomValue, setSpendLimitCustomValue] = useState<
    string | undefined
  >(undefined);
  const [tickerValue] = useState(getTicker(ticker));
  const [viewDetails, setViewDetails] = useState(false);
  const [spenderAddress, setSpenderAddress] = useState('0x...');
  const [token, setToken] = useState<TokenInfo>({});
  const [isReadyToApprove, setIsReadyToApprove] = useState(false);
  const [tokenSpendValue, setTokenSpendValue] = useState('');
  const [showGasTooltip, setShowGasTooltip] = useState(false);
  const [multiLayerL1FeeTotal, setMultiLayerL1FeeTotal] = useState('0x0');
  const [fetchingUpdateDone, setFetchingUpdateDone] = useState(false);
  const [showBlockExplorerModal, setShowBlockExplorerModal] = useState(false);
  const [address, setAddress] = useState('');
  const [isCustomSpendInputValid, setIsCustomSpendInputValid] = useState(true);
  const [unroundedAccountBalance, setUnroundedAccountBalance] = useState<
    string | null
  >(null);
  const [encodedHexAmount, setEncodedHexAmount] = useState<
    string | undefined
  >(undefined);
  const [method, setMethod] = useState<string | undefined>(undefined);
  const [learnMoreURL, setLearnMoreURL] = useState<string | null>(null);

  const customSpendLimitInput = useRef<View>(null);

  const channelIdOrHostname = transaction.origin;
  const sdkConnection = useMemo(
    () =>
      SDKConnect.getInstance().getConnection({
        channelId: channelIdOrHostname,
      }),
    [channelIdOrHostname],
  );
  const originIsMMSDKRemoteConn = Boolean(sdkConnection);
  const originIsWalletConnectRef = useRef(false);

  const getStyles = useCallback(() => createStyles(colors), [colors]);

  const fetchEstimatedL1Fee = useCallback(async () => {
    if (!transaction?.transaction) {
      return;
    }
    try {
      const eth = new Eth(
        Engine.context.NetworkController.getProviderAndBlockTracker().provider,
      );
      const result = await fetchEstimatedMultiLayerL1Fee(eth, {
        txParams: transaction.transaction,
        chainId,
      });
      setMultiLayerL1FeeTotal(result);
    } catch (e) {
      Logger.error(e as Error, 'fetchEstimatedMultiLayerL1Fee call failed');
      setMultiLayerL1FeeTotal('0x0');
    }
  }, [transaction, chainId]);

  const getAnalyticsParams = useCallback(() => {
    const baseParams = {
      account_type: transaction?.from
        ? getAddressAccountType(transaction.from)
        : 'unknown',
      dapp_host_name: transaction?.origin || 'unknown',
      chain_id: chainId ? getDecimalChainId(chainId) : 'unknown',
      active_currency: {
        value: token.tokenSymbol || 'N/A',
        anonymous: true,
      },
      number_tokens_requested: {
        value: originalApproveAmount || '0',
        anonymous: true,
      },
      unlimited_permission_requested:
        encodedHexAmount === UINT256_HEX_MAX_VALUE,
      referral_type: 'unknown',
      request_source: originIsMMSDKRemoteConn
        ? AppConstants.REQUEST_SOURCES.SDK_REMOTE_CONN
        : originIsWalletConnectRef.current
          ? AppConstants.REQUEST_SOURCES.WC
          : AppConstants.REQUEST_SOURCES.IN_APP_BROWSER,
      is_smart_transaction: shouldUseSmartTransaction || false,
    };

    try {
      const isDapp = !Object.values(AppConstants.DEEPLINKS).includes(
        transaction?.origin,
      );

      const params = {
        ...baseParams,
        referral_type: isDapp ? 'dapp' : transaction?.origin,
      };

      // Send analytics params to parent component so it's available when cancelling and confirming
      if (onSetAnalyticsParams) {
        onSetAnalyticsParams(params);
      }

      return params;
    } catch (error) {
      Logger.error(error as Error, 'Error in getAnalyticsParams:');
      return baseParams;
    }
  }, [
    transaction,
    chainId,
    token.tokenSymbol,
    originalApproveAmount,
    encodedHexAmount,
    originIsMMSDKRemoteConn,
    shouldUseSmartTransaction,
    onSetAnalyticsParams,
  ]);

  // componentDidMount equivalent
  useEffect(() => {
    const initComponent = async () => {
      const {
        origin,
        to,
        data,
        from,
        transaction: innerTransaction,
      } = transaction;
      const { AssetsContractController } = Engine.context;

      const hostValue = getHost(origin);

      if (!originIsMMSDKRemoteConn) {
        // Check if it is walletConnect origin
        WC2Manager.getInstance().then((wc2) => {
          originIsWalletConnectRef.current = wc2
            .getSessions()
            .some(
              (session: {
                peer: { metadata: { url: string } };
              }) => {
                // Otherwise, compare the origin with the metadata URL
                if (
                  session.peer.metadata.url === origin ||
                  (origin && origin.startsWith(WALLET_CONNECT_ORIGIN))
                ) {
                  DevLogger.log(
                    `ApproveTransactionReview::componentDidMount Found matching session for origin ${origin}`,
                  );
                  return true;
                }
                return false;
              },
            );
        });
      }

      let tokenSymbol: string | undefined,
        tokenDecimals: number | undefined,
        tokenName: string | undefined,
        tokenStandard: string | undefined,
        tokenBalance: string | undefined,
        createdSpendCap: boolean | undefined,
        unroundedBalance = '';

      const {
        spenderAddress: decodedSpenderAddress,
        encodedAmount: decodedEncodedHexAmount,
      } = decodeApproveData(data);
      const encodedDecimalAmount = hexToBN(decodedEncodedHexAmount).toString();

      // The tokenList addresses we get from state are not checksum addresses
      // also, the tokenList we get does not contain the tokenStandard, so even if the token exists in tokenList we will
      // need to fetch it using getTokenDetails
      const contract = tokenList?.[to as string];
      if (tokenAllowanceState) {
        const {
          tokenSymbol: symbol,
          tokenDecimals: decimals,
          tokenName: name,
          tokenBalance: balance,
          tokenStandard: standard,
          isReadyToApprove: readyToApprove,
        } = tokenAllowanceState;
        tokenSymbol = symbol;
        tokenDecimals = decimals;
        tokenName = name;
        tokenBalance = balance;
        tokenStandard = standard;
        createdSpendCap = readyToApprove;
      } else {
        try {
          const result = await getTokenDetails(
            to,
            from,
            encodedDecimalAmount,
          );

          const { standard, name, decimals, symbol } = result;

          if (isNFTTokenStandard(standard)) {
            tokenName = name;
            tokenSymbol = symbol;
            tokenStandard = standard;
          } else {
            const erc20TokenBalance =
              await AssetsContractController.getERC20BalanceOf(to, from);
            tokenDecimals = decimals;
            tokenSymbol = symbol;
            tokenStandard = standard;
            tokenName = name;
            tokenBalance = renderFromTokenMinimalUnit(
              erc20TokenBalance,
              decimals,
            );
            unroundedBalance = fromTokenMinimalUnit(
              erc20TokenBalance || 0,
              decimals,
            );
          }
        } catch (e) {
          tokenSymbol = contract?.symbol || 'ERC20 Token';
          tokenDecimals = contract?.decimals || 18;
        }
      }

      const approveAmount = fromTokenMinimalUnit(
        hexToBN(decodedEncodedHexAmount),
        tokenDecimals,
        false,
      );

      const { name: methodName } = await getMethodData(data);
      const minTokenAllowance = minimumTokenAllowance(tokenDecimals);

      const approvalData = generateApprovalData({
        spender: decodedSpenderAddress,
        value: isNFTTokenStandard(tokenStandard)
          ? decodedEncodedHexAmount
          : '0',
        data,
      });

      setTransactionObjectAction({
        transaction: {
          ...innerTransaction,
          data: approvalData,
        },
      });

      const tokenMatch = Object.values(tokenList || {}).filter(
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => t.address === to,
      );

      setHost(hostValue);
      setMethod(methodName);
      setOriginalApproveAmount(approveAmount);
      setToken({
        tokenSymbol,
        tokenDecimals,
        tokenName,
        tokenValue: encodedDecimalAmount,
        tokenStandard,
        tokenBalance,
        tokenImage: tokenMatch[0]?.iconUrl,
      });
      setSpenderAddress(decodedSpenderAddress);
      setEncodedHexAmount(decodedEncodedHexAmount);
      setFetchingUpdateDone(true);
      setIsReadyToApprove(!!createdSpendCap);
      setTokenSpendValue(tokenAllowanceState?.tokenSpendValue ?? '');
      setSpendLimitCustomValue(minTokenAllowance);
      setUnroundedAccountBalance(unroundedBalance);

      // Build analytics params inline using local variables to avoid stale closure
      // (getAnalyticsParams() would read from initial state since useEffect has [] deps)
      const isDapp = !Object.values(AppConstants.DEEPLINKS).includes(
        transaction?.origin,
      );
      const initAnalyticsParams = {
        account_type: from
          ? getAddressAccountType(from)
          : 'unknown',
        dapp_host_name: origin || 'unknown',
        chain_id: chainId ? getDecimalChainId(chainId) : 'unknown',
        active_currency: {
          value: tokenSymbol || 'N/A',
          anonymous: true,
        },
        number_tokens_requested: {
          value: approveAmount || '0',
          anonymous: true,
        },
        unlimited_permission_requested:
          decodedEncodedHexAmount === UINT256_HEX_MAX_VALUE,
        referral_type: isDapp ? 'dapp' : origin,
        request_source: originIsMMSDKRemoteConn
          ? AppConstants.REQUEST_SOURCES.SDK_REMOTE_CONN
          : originIsWalletConnectRef.current
            ? AppConstants.REQUEST_SOURCES.WC
            : AppConstants.REQUEST_SOURCES.IN_APP_BROWSER,
        is_smart_transaction: shouldUseSmartTransaction || false,
      };

      if (onSetAnalyticsParams) {
        onSetAnalyticsParams(initAnalyticsParams);
      }

      metrics.trackEvent(
        metrics
          .createEventBuilder(MetaMetricsEvents.APPROVAL_STARTED)
          .addProperties(initAnalyticsParams)
          .build(),
      );

      if (isMultiLayerFeeNetwork(chainId)) {
        fetchEstimatedL1Fee();
        intervalIdForEstimatedL1Fee = setInterval(
          fetchEstimatedL1Fee,
          POLLING_INTERVAL_ESTIMATED_L1_FEE,
        );
      }
    };

    initComponent();

    return () => {
      clearInterval(intervalIdForEstimatedL1Fee);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidUpdate equivalent for tokenSpendValue changes
  useEffect(() => {
    if (!fetchingUpdateDone) return;
    const newApprovalTransaction = generateTxWithNewTokenAllowance(
      tokenSpendValue || '0',
      token.tokenDecimals,
      spenderAddress,
      transaction,
    );

    setTransactionObjectAction({
      ...newApprovalTransaction,
      transaction: {
        ...newApprovalTransaction.transaction,
        data: newApprovalTransaction.data,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenSpendValue]);

  const getTrustMessage = useCallback(
    (originIsDeeplink: boolean, isMethodSetApprovalForAll: boolean) => {
      if (isMethodSetApprovalForAll) {
        return strings('spend_limit_edition.you_trust_this_third_party');
      }
      if (originIsDeeplink) {
        return strings('spend_limit_edition.you_trust_this_address');
      }
      return strings('spend_limit_edition.you_trust_this_site');
    },
    [],
  );

  const getTrustTitle = useCallback(
    (
      originIsDeeplink: boolean,
      isNonFungibleToken: boolean,
      isMethodSetApprovalForAll: boolean,
    ) => {
      if (isMethodSetApprovalForAll) {
        return strings('spend_limit_edition.allow_to_transfer_all');
      }
      if (originIsDeeplink) {
        return strings('spend_limit_edition.allow_to_address_access');
      }
      if (isNonFungibleToken) {
        return strings('spend_limit_edition.allow_to_access');
      }
      return strings('spend_limit_edition.spend_cap');
    },
    [],
  );

  const trackApproveEvent = useCallback(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) => {
      metrics.trackEvent(
        metrics
          .createEventBuilder(event)
          .addProperties({
            view: transaction.origin,
            numberOfTokens: tokensLength,
            numberOfAccounts: accountsLength,
            network: providerType,
          })
          .build(),
      );
    },
    [metrics, transaction.origin, tokensLength, accountsLength, providerType],
  );

  const toggleViewData = useCallback(() => {
    setViewData((prev) => !prev);
  }, []);

  const toggleViewDetails = useCallback(() => {
    metrics.trackEvent(
      metrics
        .createEventBuilder(
          MetaMetricsEvents.DAPP_APPROVE_SCREEN_VIEW_DETAILS,
        )
        .build(),
    );
    setViewDetails((prev) => !prev);
  }, [metrics]);

  const copyContractAddress = useCallback(
    async (addr: string) => {
      await ClipboardManager.setString(addr);
      showAlertAction({
        isVisible: true,
        autodismiss: 1500,
        content: 'clipboard-alert',
        data: { msg: strings('transactions.address_copied_to_clipboard') },
      });
      metrics.trackEvent(
        metrics
          .createEventBuilder(MetaMetricsEvents.CONTRACT_ADDRESS_COPIED)
          .addProperties(getAnalyticsParams())
          .build(),
      );
    },
    [showAlertAction, metrics, getAnalyticsParams],
  );

  const edit = useCallback(() => {
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_EDIT_TRANSACTION)
        .build(),
    );

    updateTokenAllowanceState?.({
      tokenStandard: token.tokenStandard,
      isReadyToApprove: true,
      tokenSpendValue,
      tokenBalance: token.tokenBalance,
      tokenSymbol: token.tokenSymbol,
      originalApproveAmount,
      tokenDecimals: token.tokenDecimals,
      tokenName: token.tokenName,
    });
    onModeChange?.('edit');
  }, [
    metrics,
    updateTokenAllowanceState,
    token,
    tokenSpendValue,
    originalApproveAmount,
    onModeChange,
  ]);

  const openLinkAboutGas = useCallback(
    () => Linking.openURL(AppConstants.URLS.WHY_TRANSACTION_TAKE_TIME),
    [],
  );

  const toggleGasTooltip = useCallback(() => {
    setShowGasTooltip((prev) => !prev);
  }, []);

  const goToSpendCap = useCallback(() => setIsReadyToApprove(false), []);

  const handleSetIsCustomSpendInputValid = useCallback((value: boolean) => {
    setIsCustomSpendInputValid(value);
  }, []);

  const toggleLearnMoreWebPage = useCallback((url?: string) => {
    setShowBlockExplorerModal((prev) => !prev);
    setLearnMoreURL(url ?? null);
  }, []);

  const handleCustomSpendOnInputChange = useCallback((value: string) => {
    if (isNumber(value)) {
      setTokenSpendValue(value.replace(regex.nonNumber, ''));
    }
  }, []);

  const onContactUsClicked = useCallback(() => {
    const analyticsParams = {
      ...getAnalyticsParams(),
      ...getBlockaidTransactionMetricsParams(transaction),
      external_link_clicked: 'security_alert_support_link',
    };
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.CONTRACT_ADDRESS_COPIED)
        .addProperties(analyticsParams)
        .build(),
    );
  }, [getAnalyticsParams, transaction, metrics]);

  const onCancelPress = useCallback(() => {
    onCancel?.();
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.APPROVAL_PERMISSION_UPDATED)
        .addProperties({
          ...getAnalyticsParams(),
          ...getBlockaidTransactionMetricsParams(transaction),
        })
        .build(),
    );
  }, [onCancel, metrics, getAnalyticsParams, transaction]);

  const buyEth = useCallback(() => {
    /* this is kinda weird, we have to reject the transaction to collapse the modal */
    onCancelPress();
    try {
      navigation.navigate(...createBuyNavigationDetails());
    } catch (error) {
      Logger.error(
        error as Error,
        'Navigation: Error when navigating to buy ETH.',
      );
    }

    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.RECEIVE_OPTIONS_PAYMENT_REQUEST)
        .build(),
    );
  }, [navigation, onCancelPress, metrics]);

  const onConfirmPress = useCallback(() => {
    if (token.tokenStandard === ERC20 && !isReadyToApprove) {
      metrics.trackEvent(
        metrics
          .createEventBuilder(MetaMetricsEvents.APPROVAL_PERMISSION_UPDATED)
          .addProperties({
            ...getAnalyticsParams(),
            ...getBlockaidTransactionMetricsParams(transaction),
          })
          .build(),
      );
      return setIsReadyToApprove(true);
    }

    return onConfirm?.();
  }, [
    token.tokenStandard,
    isReadyToApprove,
    metrics,
    getAnalyticsParams,
    transaction,
    onConfirm,
  ]);

  const goToFaucet = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      onCancelPress();
      navigation.navigate(Routes.BROWSER.VIEW, {
        newTabUrl: TESTNET_FAUCETS[chainId as keyof typeof TESTNET_FAUCETS],
        timestamp: Date.now(),
      });
    });
  }, [chainId, navigation, onCancelPress]);

  const getConfirmButtonState = useCallback(() => {
    let confirmButtonState = ConfirmButtonState.Normal;

    if (securityAlertResponse) {
      if (securityAlertResponse.result_type === ResultType.Malicious) {
        confirmButtonState = ConfirmButtonState.Error;
      } else if (securityAlertResponse.result_type === ResultType.Warning) {
        confirmButtonState = ConfirmButtonState.Warning;
      }
    }
    return confirmButtonState;
  }, [securityAlertResponse]);

  const renderGasTooltip = useCallback(() => {
    const isMainnet = isMainnetByChainId(chainId);
    return (
      <InfoModal
        isVisible={showGasTooltip}
        title={strings(
          `transaction.gas_education_title${isMainnet ? '_ethereum' : ''}`,
        )}
        toggleModal={toggleGasTooltip}
        body={
          <View>
            <Text grey infoModal>
              {strings('transaction.gas_education_1')}
              {strings(
                `transaction.gas_education_2${isMainnet ? '_ethereum' : ''}`,
              )}{' '}
              <Text bold>{strings('transaction.gas_education_3')}</Text>
            </Text>
            <Text grey infoModal>
              {strings('transaction.gas_education_4')}
            </Text>
            <TouchableOpacity onPress={openLinkAboutGas}>
              <Text grey link infoModal>
                {strings('transaction.gas_education_learn_more')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    );
  }, [chainId, showGasTooltip, toggleGasTooltip, openLinkAboutGas]);

  const renderDetails = () => {
    const styles = getStyles();
    const isTestNetwork = isTestNet(chainId);

    const originIsDeeplink =
      transaction.origin === ORIGIN_DEEPLINK ||
      transaction.origin === ORIGIN_QR_CODE;
    const errorPress = isTestNetwork ? goToFaucet : buyEth;
    const errorLinkText = isTestNetwork
      ? strings('transaction.go_to_faucet')
      : strings('transaction.token_marketplace');

    const showFeeMarket =
      !gasEstimateType ||
      gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ||
      gasEstimateType === GAS_ESTIMATE_TYPES.NONE;

    // TODO: [SOLANA] - before ship make sure block explorer supports Solana
    const hasBlockExplorer = isNonEvmChainId(chainId)
      ? false
      : shouldShowBlockExplorer(
          providerType,
          providerRpcTarget,
          networkConfigurations,
        );

    const tokenLabel = `${
      token.tokenName ||
      token.tokenSymbol ||
      strings(`spend_limit_edition.nft`)
    } (#${token.tokenValue})`;

    const isERC2OToken = token.tokenStandard === ERC20;
    const isNonERC20Token = token.tokenStandard !== ERC20;
    const isERC20SpendCapScreenWithoutValue =
      isERC2OToken && !tokenSpendValue;

    const shouldDisableConfirmButton =
      !fetchingUpdateDone ||
      isERC20SpendCapScreenWithoutValue ||
      Boolean(gasError) ||
      transactionConfirmed ||
      (!isCustomSpendInputValid && isERC2OToken) ||
      (isNonERC20Token && !isGasEstimateStatusIn);

    const confirmText =
      isERC2OToken && !isReadyToApprove
        ? strings('transaction.next')
        : strings('transactions.approve');

    const isNonFungibleToken = isNFTTokenStandard(token.tokenStandard);
    const isMethodSetApprovalForAll =
      method === TOKEN_METHOD_SET_APPROVAL_FOR_ALL;

    return (
      <>
        <View style={styles.section}>
          {transaction.from && (
            <ApproveTransactionHeader
              dontWatchAsset
              origin={transaction.origin}
              url={activeTabUrl}
              from={transaction.from}
              asset={{
                address: transaction.to,
                symbol: token.tokenSymbol,
                decimals: token.tokenDecimals,
                standard: token.tokenStandard,
              }}
            />
          )}
          <View style={styles.actionViewWrapper}>
            <ActionView
              confirmButtonMode="confirm"
              cancelText={strings('transaction.reject')}
              confirmText={confirmText}
              onCancelPress={onCancelPress}
              onConfirmPress={onConfirmPress}
              confirmDisabled={shouldDisableConfirmButton}
              confirmButtonState={getConfirmButtonState()}
              confirmTestID="Confirm"
            >
              <View style={styles.actionViewChildren}>
                <ScrollView nestedScrollEnabled>
                  <View
                    style={styles.accountApprovalWrapper}
                    onStartShouldSetResponder={() => true}
                  >
                    <TransactionBlockaidBanner
                      transactionId={transaction.id}
                      style={styles.blockaidWarning}
                      onContactUsClicked={onContactUsClicked}
                    />
                    <SmartTransactionsMigrationBanner
                      style={styles.smartTransactionsMigrationBanner}
                    />
                    <Text variant={TextVariant.HeadingMD} style={styles.title}>
                      {getTrustTitle(
                        originIsDeeplink,
                        isNonFungibleToken,
                        isMethodSetApprovalForAll,
                      )}
                    </Text>
                    <View style={styles.tokenContainer}>
                      {!fetchingUpdateDone && (
                        <Text
                          variant={TextVariant.HeadingMD}
                          style={styles.alignText}
                        >
                          {strings('spend_limit_edition.token')}
                        </Text>
                      )}
                      {isERC2OToken && (
                        <>
                          {token.tokenImage ? (
                            <Avatar
                              variant={AvatarVariant.Token}
                              size={AvatarSize.Md}
                              imageSource={{ uri: token.tokenImage }}
                            />
                          ) : (
                            <Identicon
                              address={transaction.to}
                              diameter={25}
                            />
                          )}
                          <Text
                            variant={TextVariant.HeadingMD}
                            style={styles.buttonColor}
                          >
                            {token.tokenSymbol}
                          </Text>
                        </>
                      )}
                      {isNonFungibleToken ? (
                        hasBlockExplorer ? (
                          <ButtonLink
                            onPress={showBlockExplorer}
                            label={
                              <Text
                                variant={TextVariant.HeadingMD}
                                style={styles.symbol}
                              >
                                {tokenLabel}
                              </Text>
                            }
                          />
                        ) : (
                          <Text variant={TextVariant.HeadingMD}>
                            {tokenLabel}
                          </Text>
                        )
                      ) : null}
                    </View>
                    {isNonFungibleToken && (
                      <Text reset style={styles.explanation}>
                        {`${getTrustMessage(
                          originIsDeeplink,
                          isMethodSetApprovalForAll,
                        )}`}
                      </Text>
                    )}
                    <ButtonLink
                      variant={TextVariant.BodyMD}
                      onPress={showVerifyContractDetails}
                      style={styles.verifyContractLink}
                      label={strings(
                        'contract_allowance.token_allowance.verify_third_party_details',
                      )}
                    />
                    <View style={styles.paddingHorizontal}>
                      <View style={styles.section}>
                        {!token.tokenStandard ? (
                          <SkeletonText style={styles.skeletalView} />
                        ) : (
                          isERC2OToken && (
                            <CustomSpendCap
                              ticker={token.tokenSymbol}
                              dappProposedValue={originalApproveAmount}
                              tokenSpendValue={tokenSpendValue}
                              accountBalance={token.tokenBalance}
                              unroundedAccountBalance={
                                unroundedAccountBalance
                              }
                              tokenDecimal={token.tokenDecimals}
                              toggleLearnMoreWebPage={
                                toggleLearnMoreWebPage
                              }
                              isEditDisabled={Boolean(isReadyToApprove)}
                              editValue={goToSpendCap}
                              onInputChanged={
                                handleCustomSpendOnInputChange
                              }
                              isInputValid={
                                handleSetIsCustomSpendInputValid
                              }
                            />
                          )
                        )}
                        {((isERC2OToken && isReadyToApprove) ||
                          isNonFungibleToken) && (
                          <View style={styles.transactionWrapper}>
                            <TransactionReview
                              gasSelected={gasSelected}
                              primaryCurrency={primaryCurrency}
                              hideTotal
                              noMargin
                              onEdit={edit}
                              chainId={chainId}
                              onUpdatingValuesStart={onUpdatingValuesStart}
                              onUpdatingValuesEnd={onUpdatingValuesEnd}
                              animateOnChange={animateOnChange}
                              isAnimating={isAnimating}
                              gasEstimationReady={gasEstimationReady}
                              legacy={!showFeeMarket}
                              gasObject={
                                !showFeeMarket
                                  ? legacyGasObject
                                  : eip1559GasObject
                              }
                              gasObjectLegacy={legacyGasObject}
                              updateTransactionState={updateTransactionState}
                              onlyGas
                              multiLayerL1FeeTotal={multiLayerL1FeeTotal}
                            />
                          </View>
                        )}
                        {gasError && (
                          <View style={styles.errorWrapper}>
                            {isTestNetworkWithFaucet(chainId) ||
                            isNativeTokenBuySupported ? (
                              <TouchableOpacity onPress={errorPress}>
                                <Text reset style={styles.error}>
                                  {gasError}
                                </Text>

                                {over && (
                                  <Text
                                    reset
                                    style={[styles.error, styles.underline]}
                                  >
                                    {errorLinkText}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            ) : (
                              <Text reset style={styles.error}>
                                {gasError}
                              </Text>
                            )}
                          </View>
                        )}
                        {!gasError && (
                          <TouchableOpacity
                            style={styles.actionTouchable}
                            onPress={toggleViewDetails}
                            testID="view-transaction-details"
                          >
                            <View style={styles.iconContainer}>
                              <Text reset style={styles.viewDetailsText}>
                                {strings(
                                  'spend_limit_edition.view_transaction_details',
                                )}
                              </Text>
                              <IonicIcon
                                name="arrow-down"
                                size={16}
                                style={styles.iconDropdown}
                              />
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </ActionView>
          </View>
        </View>
      </>
    );
  };

  const renderTransactionReview = () => (
    <TransactionReviewDetailsCard
      toggleViewDetails={toggleViewDetails}
      toggleViewData={toggleViewData}
      copyContractAddress={copyContractAddress}
      nickname={nickname}
      nicknameExists={nicknameExists}
      address={transaction.to}
      host={host}
      tokenSpendValue={tokenSpendValue}
      tokenSymbol={token.tokenSymbol}
      data={transaction.data}
      tokenValue={token.tokenValue}
      tokenName={token.tokenName}
      tokenStandard={token.tokenStandard}
      method={method}
      displayViewData={viewData}
    />
  );

  const renderVerifyContractDetails = () => {
    const toggleBlockExplorerModal = (addr: string) => {
      closeVerifyContractDetails?.();
      setShowBlockExplorerModal((prev) => !prev);
      setAddress(addr);
    };

    const showNickname = (addr: string) => {
      toggleModal?.(addr);
    };

    return (
      <VerifyContractDetails
        closeVerifyContractView={closeVerifyContractDetails}
        toggleBlockExplorer={toggleBlockExplorerModal}
        contractAddress={spenderAddress}
        tokenAddress={transaction.to}
        showNickname={showNickname}
        savedContactListToArray={savedContactListToArray}
        copyAddress={copyContractAddress}
        providerType={providerType}
        tokenSymbol={token.tokenSymbol}
        providerRpcTarget={providerRpcTarget}
        networkConfigurations={networkConfigurations}
        tokenStandard={token.tokenStandard}
      />
    );
  };

  const renderBlockExplorerView = () => {
    const styles = getStyles();
    const closeModal = () => {
      if (!learnMoreURL) {
        showVerifyContractDetails?.();
      }
      setShowBlockExplorerModal((prev) => !prev);
      setLearnMoreURL(null);
    };

    return (
      <ShowBlockExplorer
        setIsBlockExplorerVisible={closeModal}
        type={providerType}
        address={address}
        headerWrapperStyle={styles.headerWrapper}
        headerTextStyle={styles.headerText}
        iconStyle={styles.icon}
        providerRpcTarget={providerRpcTarget}
        networkConfigurations={networkConfigurations}
        learnMoreURL={learnMoreURL}
      />
    );
  };

  const renderQRDetails = () => {
    const styles = getStyles();
    return (
      <View style={styles.actionViewQRObject}>
        <TransactionHeader
          currentPageInformation={{
            origin: transaction.origin,
            spenderAddress,
            title: host,
            url: activeTabUrl,
          }}
        />
        <QRSigningDetails
          QRState={QRState}
          tighten
          showHint={false}
          showCancelButton
          bypassAndroidCameraAccessCheck={false}
          fromAddress={transaction.from}
          cancelCallback={onCancelPress}
          successCallback={onConfirmPress}
        />
      </View>
    );
  };

  return (
    <View>
      {viewDetails
        ? renderTransactionReview()
        : shouldVerifyContractDetails
          ? renderVerifyContractDetails()
          : showBlockExplorerModal
            ? renderBlockExplorerView()
            : isSigningQRObject
              ? renderQRDetails()
              : renderDetails()}
    </View>
  );
};

ApproveTransactionReview.navigationOptions = ({
  navigation,
}: {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
}) => getApproveNavbar('approve.title', navigation);

const mapStateToProps = (state: RootState): StateProps => {
  const transaction = getNormalizedTxState(state);
  const chainId = transaction?.chainId;

  return {
    ticker: selectNativeCurrencyByChainId(state, chainId),
    networkConfigurations: selectEvmNetworkConfigurationsByChainId(state),
    transaction: getNormalizedTxState(state),
    tokensLength: selectTokensLength(state),
    accountsLength: selectAccountsLength(state),
    providerType: selectProviderTypeByChainId(state, chainId),
    providerRpcTarget: selectRpcUrlByChainId(state, chainId),
    primaryCurrency: state.settings.primaryCurrency,
    activeTabUrl: getActiveTabUrl(state),
    chainId,
    tokenList: selectTokenList(state),
    isNativeTokenBuySupported: isNetworkRampNativeTokenSupported(
      chainId,
      getRampNetworks(state),
    ),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(
      state,
      chainId,
    ),
    securityAlertResponse:
      selectCurrentTransactionSecurityAlertResponse(state),
  };
};

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  setTransactionObject: (transaction) =>
    dispatch(setTransactionObject(transaction)),
  showAlert: (config) => dispatch(showAlert(config)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withNavigation(
    withQRHardwareAwareness(withMetricsAwareness(ApproveTransactionReview)),
  ),
);
