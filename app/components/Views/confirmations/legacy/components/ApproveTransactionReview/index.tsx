import React, { PureComponent } from 'react';
import {
  View,
  TouchableOpacity,
  InteractionManager,
  Linking,
  ScrollView,
  ViewStyle,
} from 'react-native';
import Eth from '@metamask/ethjs-query';
import ActionView, { ConfirmButtonState } from '../../../../../UI/ActionView';
import { getApproveNavbar } from '../../../../../UI/Navbar';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { TransactionParams } from '@metamask/transaction-controller';
import type { NetworkState } from '@metamask/network-controller';
import { RootState } from '../../../../../../reducers';
import { Theme } from '../../../../../../util/theme/models';
import { IUseMetricsHook } from '../../../../../../components/hooks/useMetrics/useMetrics.types';
import { IQRState } from '../../../../../UI/QRHardware/types';
import { getHost } from '../../../../../../util/browser';
import {
  getAddressAccountType,
  getTokenDetails,
  shouldShowBlockExplorer,
} from '../../../../../../util/address';
import Engine from '../../../../../../core/Engine';
import { strings } from '../../../../../../../locales/i18n';
import { setTransactionObject as setTransactionObjectAction } from '../../../../../../actions/transaction';
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
import {
  MetaMetricsEvents,
  IMetaMetricsEvent,
} from '../../../../../../core/Analytics';
import TransactionHeader from '../../../../../UI/TransactionHeader';
import TransactionReviewDetailsCard from '../TransactionReview/TransactionReviewDetailsCard';
import AppConstants from '../../../../../../core/AppConstants';
import { UINT256_HEX_MAX_VALUE } from '../../../../../../constants/transaction';
import {
  getBlockaidTransactionMetricsParams,
  TransactionType as BlockaidTransactionType,
} from '../../../../../../util/blockaid';
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
import ButtonLinkBase from '../../../../../../component-library/components/Buttons/Button/variants/ButtonLink';
import TransactionReview from '../TransactionReview/TransactionReviewEIP1559Update';
import ClipboardManager from '../../../../../../core/ClipboardManager';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
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
import TextBase, {
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
import { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import { selectShouldUseSmartTransaction } from '../../../../../../selectors/smartTransactionsController';
import { createBuyNavigationDetails } from '../../../../../UI/Ramp/routes/utils';
import SDKConnect from '../../../../../../core/SDKConnect/SDKConnect';
import DevLogger from '../../../../../../core/SDKConnect/utils/DevLogger';
import { WC2Manager } from '../../../../../../core/WalletConnect/WalletConnectV2';
import { WALLET_CONNECT_ORIGIN } from '../../../../../../util/walletconnect';
import { isNonEvmChainId } from '../../../../../../core/Multichain/utils';

import SmartTransactionsMigrationBanner from '../SmartTransactionsMigrationBanner/SmartTransactionsMigrationBanner';
const Text = TextBase as React.ComponentType<
  React.ComponentProps<typeof TextBase> & {
    reset?: boolean;
    bold?: boolean;
    grey?: boolean;
    link?: boolean;
    infoModal?: boolean;
    primary?: boolean;
  }
>;

const ButtonLink = ButtonLinkBase as React.ComponentType<
  React.ComponentProps<typeof ButtonLinkBase> & { variant?: TextVariant }
>;

const { ORIGIN_DEEPLINK, ORIGIN_QR_CODE } = AppConstants.DEEPLINKS;
const POLLING_INTERVAL_ESTIMATED_L1_FEE = 30000;

let intervalIdForEstimatedL1Fee: ReturnType<typeof setInterval> | undefined;

const {
  ASSET: { ERC20 },
} = TransactionTypes;

interface ApproveToken {
  tokenSymbol?: string;
  tokenDecimals?: string | number;
  tokenName?: string;
  tokenValue?: string;
  tokenStandard?: string;
  tokenBalance?: string;
  tokenImage?: string;
}

interface ApproveTransactionData {
  origin?: string;
  to?: string;
  data?: string;
  from?: string;
  id?: string;
  chainId?: string;
  transaction?: TransactionParams;
}

interface GasObject {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
}

interface TokenAllowanceState {
  tokenStandard?: string;
  isReadyToApprove?: boolean;
  tokenSpendValue?: string;
  tokenBalance?: string;
  tokenSymbol?: string;
  originalApproveAmount?: string;
  tokenDecimals?: string | number;
  tokenName?: string;
}

interface TokenListEntry {
  address?: string;
  symbol?: string;
  decimals?: number;
  iconUrl?: string;
}

interface ApproveTransactionReviewStateProps {
  ticker?: string;
  networkConfigurations: NetworkState['networkConfigurationsByChainId'];
  transaction: ApproveTransactionData;
  tokensLength?: number;
  accountsLength?: number;
  providerType?: string;
  providerRpcTarget?: string;
  primaryCurrency?: string;
  activeTabUrl?: string;
  chainId?: string;
  tokenList?: Record<string, TokenListEntry>;
  isNativeTokenBuySupported?: boolean;
  shouldUseSmartTransaction?: boolean;
  securityAlertResponse?: { result_type?: string } | null;
}

interface ApproveTransactionReviewDispatchProps {
  setTransactionObject: (transaction: unknown) => void;
  showAlert: (config: unknown) => void;
}

interface ApproveTransactionReviewOwnProps {
  onCancel?: () => void;
  onConfirm?: () => void;
  gasError?: string;
  over?: boolean;
  onModeChange?: (mode: string) => void;
  onSetAnalyticsParams?: (params: Record<string, unknown>) => void;
  gasEstimateType?: string;
  onUpdatingValuesStart?: () => void;
  onUpdatingValuesEnd?: () => void;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  gasEstimationReady?: boolean;
  transactionConfirmed?: boolean;
  toggleModal?: (address?: string) => void;
  nickname?: string;
  nicknameExists?: boolean;
  gasSelected?: string | null;
  updateTransactionState?: (gasTransaction: unknown) => void;
  legacyGasObject?: GasObject;
  eip1559GasObject?: GasObject;
  showBlockExplorer?: () => void;
  showVerifyContractDetails?: () => void;
  savedContactListToArray?: unknown[];
  closeVerifyContractDetails?: () => void;
  shouldVerifyContractDetails?: boolean;
  isGasEstimateStatusIn?: boolean;
  updateTokenAllowanceState?: (state: TokenAllowanceState) => void;
  tokenAllowanceState?: TokenAllowanceState & { tokenSpendValue?: string };
}

interface ApproveTransactionReviewHocProps {
  navigation: NavigationProp<ParamListBase>;
  metrics: IUseMetricsHook;
  isSigningQRObject?: boolean;
  isSyncingQRHardware?: boolean;
  QRState?: IQRState;
}

type ApproveTransactionReviewProps = ApproveTransactionReviewStateProps &
  ApproveTransactionReviewDispatchProps &
  ApproveTransactionReviewOwnProps &
  ApproveTransactionReviewHocProps;

interface ApproveTransactionReviewState {
  viewData: boolean;
  host?: string;
  originalApproveAmount?: string;
  spendLimitCustomValue?: string;
  ticker?: string;
  viewDetails: boolean;
  spenderAddress: string;
  transaction: ApproveTransactionData;
  token: ApproveToken;
  isReadyToApprove: boolean;
  tokenSpendValue: string;
  showGasTooltip: boolean;
  gasTransactionObject: object;
  multiLayerL1FeeTotal: string;
  fetchingUpdateDone: boolean;
  showBlockExplorerModal: boolean;
  address: string;
  isCustomSpendInputValid: boolean;
  unroundedAccountBalance: string | null;
  method?: string;
  encodedHexAmount?: string;
  learnMoreURL?: string | null;
}

/**
 * PureComponent that manages ERC20 approve from the dapp browser
 */
class ApproveTransactionReview extends PureComponent<
  ApproveTransactionReviewProps,
  ApproveTransactionReviewState
> {
  static contextType = ThemeContext;

  originIsWalletConnect?: boolean;

  static navigationOptions = () => getApproveNavbar('approve.title');

  state: ApproveTransactionReviewState = {
    viewData: false,
    host: undefined,
    originalApproveAmount: undefined,
    spendLimitCustomValue: undefined,
    ticker: getTicker(this.props.ticker),
    viewDetails: false,
    spenderAddress: '0x...',
    transaction: this.props.transaction,
    token: {},
    isReadyToApprove: false,
    tokenSpendValue: '',
    showGasTooltip: false,
    gasTransactionObject: {},
    multiLayerL1FeeTotal: '0x0',
    fetchingUpdateDone: false,
    showBlockExplorerModal: false,
    address: '',
    isCustomSpendInputValid: true,
    unroundedAccountBalance: null,
  };

  customSpendLimitInput = React.createRef();
  channelIdOrHostname = this.props.transaction.origin;

  sdkConnection = SDKConnect.getInstance().getConnection({
    channelId: this.channelIdOrHostname as string,
  });
  originIsMMSDKRemoteConn = Boolean(this.sdkConnection);

  fetchEstimatedL1Fee = async () => {
    const { transaction, chainId } = this.props;
    if (!transaction?.transaction) {
      return;
    }
    try {
      const eth = new Eth(
        Engine.context.NetworkController.getProviderAndBlockTracker().provider,
      );
      const result = await fetchEstimatedMultiLayerL1Fee(eth, {
        txParams: transaction.transaction,
        chainId: chainId as `0x${string}`,
      });
      this.setState({
        multiLayerL1FeeTotal: result as string,
      });
    } catch (e) {
      Logger.error(e as Error, 'fetchEstimatedMultiLayerL1Fee call failed');
      this.setState({
        multiLayerL1FeeTotal: '0x0',
      });
    }
  };

  componentDidMount = async () => {
    const { chainId } = this.props;
    const {
      // We need to extract transaction.transaction here to retrieve up-to-date nonce
      transaction: { origin, to, data, from, transaction },
      setTransactionObject,
      tokenList,
      tokenAllowanceState,
    } = this.props;
    const { AssetsContractController } = Engine.context;

    const host = getHost(origin as string);

    if (!this.originIsMMSDKRemoteConn) {
      // Check if it is walletConnect origin
      WC2Manager.getInstance().then((wc2) => {
        this.originIsWalletConnect = wc2.getSessions().some((session) => {
          // Otherwise, compare the origin with the metadata URL
          if (
            session.peer.metadata.url === origin ||
            origin?.startsWith(WALLET_CONNECT_ORIGIN)
          ) {
            DevLogger.log(
              `ApproveTransactionReview::componentDidMount Found matching session for origin ${origin}`,
            );
            return true;
          }
          return false;
        });
      });
    }

    let tokenSymbol: string | undefined,
      tokenDecimals: string | number | undefined,
      tokenName: string | undefined,
      tokenStandard: string | undefined,
      tokenBalance: string | undefined,
      createdSpendCap: boolean | undefined,
      unroundedAccountBalance: string | undefined = '';

    const { spenderAddress, encodedAmount: encodedHexAmount } =
      decodeApproveData(data);
    const encodedDecimalAmount = hexToBN(encodedHexAmount).toString();

    // The tokenList addresses we get from state are not checksum addresses
    // also, the tokenList we get does not contain the tokenStandard, so even if the token exists in tokenList we will
    // need to fetch it using getTokenDetails
    const contract = to ? tokenList?.[to] : undefined;
    if (tokenAllowanceState) {
      const {
        tokenSymbol: symbol,
        tokenDecimals: decimals,
        tokenName: name,
        tokenBalance: balance,
        tokenStandard: standard,
        isReadyToApprove,
      } = tokenAllowanceState;
      tokenSymbol = symbol;
      tokenDecimals = decimals;
      tokenName = name;
      tokenBalance = balance;
      tokenStandard = standard;
      createdSpendCap = isReadyToApprove;
    } else {
      try {
        const result = await getTokenDetails(
          to as string,
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
            await AssetsContractController.getERC20BalanceOf(
              to as string,
              from as string,
            );
          tokenDecimals = decimals;
          tokenSymbol = symbol;
          tokenStandard = standard;
          tokenName = name;
          tokenBalance = renderFromTokenMinimalUnit(
            erc20TokenBalance as unknown as string,
            decimals as unknown as number,
          );
          unroundedAccountBalance = fromTokenMinimalUnit(
            (erc20TokenBalance || 0) as unknown as string,
            decimals as string | number,
          );
        }
      } catch (e) {
        tokenSymbol = contract?.symbol || 'ERC20 Token';
        tokenDecimals = contract?.decimals || 18;
      }
    }

    const approveAmount = fromTokenMinimalUnit(
      hexToBN(encodedHexAmount),
      tokenDecimals as string | number,
      false,
    );

    const { name: method } = await getMethodData(data as string, undefined);
    const minTokenAllowance = minimumTokenAllowance(tokenDecimals as number);

    const approvalData = generateApprovalData({
      spender: spenderAddress,
      value: isNFTTokenStandard(tokenStandard as string)
        ? (encodedHexAmount as string)
        : '0',
      data,
    });

    setTransactionObject({
      transaction: {
        ...transaction,
        data: approvalData,
      },
    });

    const token = Object.values(tokenList ?? {}).filter(
      (tokenEntry) => tokenEntry.address === to,
    );

    this.setState(
      {
        host,
        method,
        originalApproveAmount: approveAmount,
        token: {
          tokenSymbol,
          tokenDecimals,
          tokenName,
          tokenValue: encodedDecimalAmount,
          tokenStandard,
          tokenBalance,
          tokenImage: token[0]?.iconUrl,
        },
        spenderAddress,
        encodedHexAmount,
        fetchingUpdateDone: true,
        isReadyToApprove: createdSpendCap as boolean,
        tokenSpendValue: (tokenAllowanceState
          ? tokenAllowanceState?.tokenSpendValue
          : '') as string,
        spendLimitCustomValue: minTokenAllowance,
        unroundedAccountBalance,
      },
      () => {
        this.props.metrics.trackEvent(
          this.props.metrics
            .createEventBuilder(MetaMetricsEvents.APPROVAL_STARTED)
            .addProperties(this.getAnalyticsParams())
            .build(),
        );
      },
    );
    if (isMultiLayerFeeNetwork(chainId)) {
      this.fetchEstimatedL1Fee();
      intervalIdForEstimatedL1Fee = setInterval(
        this.fetchEstimatedL1Fee,
        POLLING_INTERVAL_ESTIMATED_L1_FEE,
      );
    }
  };

  componentDidUpdate = (
    _prevProps: ApproveTransactionReviewProps,
    prevState: ApproveTransactionReviewState,
  ) => {
    const { transaction, setTransactionObject } = this.props;
    const {
      tokenSpendValue,
      spenderAddress,
      token: { tokenDecimals },
    } = this.state;

    if (prevState?.tokenSpendValue !== tokenSpendValue) {
      const newApprovalTransaction = generateTxWithNewTokenAllowance(
        tokenSpendValue || '0',
        tokenDecimals as number,
        spenderAddress,
        transaction,
      );

      const newApprovalTransactionData =
        newApprovalTransaction as unknown as {
          transaction?: Record<string, unknown>;
          data?: string;
        };

      setTransactionObject({
        ...newApprovalTransactionData,
        transaction: {
          ...newApprovalTransactionData.transaction,
          data: newApprovalTransactionData.data,
        },
      });
    }
  };

  componentWillUnmount = async () => {
    clearInterval(intervalIdForEstimatedL1Fee);
  };

  getTrustMessage = (
    originIsDeeplink: boolean,
    isMethodSetApprovalForAll: boolean,
  ) => {
    if (isMethodSetApprovalForAll) {
      return strings('spend_limit_edition.you_trust_this_third_party');
    }
    if (originIsDeeplink) {
      return strings('spend_limit_edition.you_trust_this_address');
    }
    return strings('spend_limit_edition.you_trust_this_site');
  };

  getTrustTitle = (
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
  };

  getAnalyticsParams = () => {
    const {
      chainId,
      transaction,
      onSetAnalyticsParams,
      shouldUseSmartTransaction,
    } = this.props;

    const {
      token: { tokenSymbol } = {} as ApproveToken,
      originalApproveAmount,
      encodedHexAmount,
    } = this.state || {};

    const baseParams = {
      account_type: transaction?.from
        ? getAddressAccountType(transaction.from)
        : 'unknown',
      dapp_host_name: transaction?.origin || 'unknown',
      chain_id: chainId ? getDecimalChainId(chainId) : 'unknown',
      active_currency: { value: tokenSymbol || 'N/A', anonymous: true },
      number_tokens_requested: {
        value: originalApproveAmount || '0',
        anonymous: true,
      },
      unlimited_permission_requested:
        encodedHexAmount === UINT256_HEX_MAX_VALUE,
      referral_type: 'unknown',
      request_source: this.originIsMMSDKRemoteConn
        ? AppConstants.REQUEST_SOURCES.SDK_REMOTE_CONN
        : this.originIsWalletConnect
        ? AppConstants.REQUEST_SOURCES.WC
        : AppConstants.REQUEST_SOURCES.IN_APP_BROWSER,
      is_smart_transaction: shouldUseSmartTransaction || false,
    };

    try {
      const isDapp = !(
        Object.values(AppConstants.DEEPLINKS) as string[]
      ).includes(transaction?.origin as string);

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
  };

  trackApproveEvent = (event: IMetaMetricsEvent) => {
    const { transaction, tokensLength, accountsLength, providerType } =
      this.props;

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(event)
        .addProperties({
          view: transaction.origin,
          numberOfTokens: tokensLength,
          numberOfAccounts: accountsLength,
          network: providerType,
        })
        .build(),
    );
  };

  toggleViewData = () => {
    const { viewData } = this.state;
    this.setState({ viewData: !viewData });
  };

  toggleViewDetails = () => {
    const { viewDetails } = this.state;
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.DAPP_APPROVE_SCREEN_VIEW_DETAILS)
        .build(),
    );
    this.setState({ viewDetails: !viewDetails });
  };

  copyContractAddress = async (address?: string) => {
    await ClipboardManager.setString(address);
    this.props.showAlert({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: strings('transactions.address_copied_to_clipboard') },
    });
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.CONTRACT_ADDRESS_COPIED)
        .addProperties(this.getAnalyticsParams())
        .build(),
    );
  };

  edit = () => {
    const { onModeChange, updateTokenAllowanceState } = this.props;
    const {
      token: {
        tokenName,
        tokenStandard,
        tokenSymbol,
        tokenDecimals,
        tokenBalance,
      },
      tokenSpendValue,
      originalApproveAmount,
    } = this.state;
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_EDIT_TRANSACTION)
        .build(),
    );

    updateTokenAllowanceState?.({
      tokenStandard,
      isReadyToApprove: true,
      tokenSpendValue,
      tokenBalance,
      tokenSymbol,
      originalApproveAmount,
      tokenDecimals,
      tokenName,
    });
    onModeChange && onModeChange('edit');
  };

  openLinkAboutGas = () =>
    Linking.openURL(AppConstants.URLS.WHY_TRANSACTION_TAKE_TIME);

  toggleGasTooltip = () =>
    this.setState((state) => ({ showGasTooltip: !state.showGasTooltip }));

  renderGasTooltip = () => {
    const isMainnet = isMainnetByChainId(this.props.chainId);
    return (
      <InfoModal
        isVisible={this.state.showGasTooltip}
        title={strings(
          `transaction.gas_education_title${isMainnet ? '_ethereum' : ''}`,
        )}
        toggleModal={this.toggleGasTooltip}
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
            <TouchableOpacity onPress={this.openLinkAboutGas}>
              <Text grey link infoModal>
                {strings('transaction.gas_education_learn_more')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    );
  };

  getStyles = () => {
    const colors =
      (this.context as Theme)?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  goToSpendCap = () => this.setState({ isReadyToApprove: false });

  handleSetIsCustomSpendInputValid = (value: boolean) => {
    this.setState({ isCustomSpendInputValid: value });
  };

  toggleLearnMoreWebPage = (url?: string) => {
    this.setState({
      showBlockExplorerModal: !this.state.showBlockExplorerModal,
      learnMoreURL: url,
    });
  };

  handleCustomSpendOnInputChange = (value: string) => {
    if (isNumber(value)) {
      this.setState({
        tokenSpendValue: value.replace(regex.nonNumber, ''),
      });
    }
  };

  onContactUsClicked = () => {
    const { transaction } = this.props;
    const analyticsParams = {
      ...this.getAnalyticsParams(),
      ...getBlockaidTransactionMetricsParams(
        transaction as unknown as BlockaidTransactionType,
      ),
      external_link_clicked: 'security_alert_support_link',
    };
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.CONTRACT_ADDRESS_COPIED)
        .addProperties(analyticsParams)
        .build(),
    );
  };

  getConfirmButtonState() {
    const { securityAlertResponse } = this.props;
    let confirmButtonState = ConfirmButtonState.Normal;

    if (securityAlertResponse) {
      if (securityAlertResponse.result_type === ResultType.Malicious) {
        confirmButtonState = ConfirmButtonState.Error;
      } else if (securityAlertResponse.result_type === ResultType.Warning) {
        confirmButtonState = ConfirmButtonState.Warning;
      }
    }
    return confirmButtonState;
  }

  renderDetails = () => {
    const {
      originalApproveAmount,
      multiLayerL1FeeTotal,
      token: {
        tokenStandard,
        tokenSymbol,
        tokenName,
        tokenValue,
        tokenDecimals,
        tokenBalance,
        tokenImage,
      },
      tokenSpendValue,
      fetchingUpdateDone,
      isReadyToApprove,
      isCustomSpendInputValid,
      method,
      unroundedAccountBalance,
    } = this.state;

    const {
      primaryCurrency,
      gasError,
      activeTabUrl,
      transaction: { origin, from, to, id: transactionId },
      chainId,
      over,
      gasEstimateType,
      onUpdatingValuesStart,
      onUpdatingValuesEnd,
      animateOnChange,
      isAnimating,
      gasEstimationReady,
      transactionConfirmed,
      gasSelected,
      legacyGasObject,
      eip1559GasObject,
      updateTransactionState,
      showBlockExplorer,
      showVerifyContractDetails,
      providerType,
      providerRpcTarget,
      networkConfigurations,
      isNativeTokenBuySupported,
      isGasEstimateStatusIn,
    } = this.props;

    const styles = this.getStyles();
    const isTestNetwork = isTestNet(chainId as string);

    const originIsDeeplink =
      origin === ORIGIN_DEEPLINK || origin === ORIGIN_QR_CODE;
    const errorPress = isTestNetwork ? this.goToFaucet : this.buyEth;
    const errorLinkText = isTestNetwork
      ? strings('transaction.go_to_faucet')
      : strings('transaction.token_marketplace');

    const showFeeMarket =
      !gasEstimateType ||
      gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ||
      gasEstimateType === GAS_ESTIMATE_TYPES.NONE;

    // TODO: [SOLANA] - before ship make sure block explorer supports Solana
    const hasBlockExplorer = isNonEvmChainId(chainId as string)
      ? false
      : shouldShowBlockExplorer(
          providerType as Parameters<typeof shouldShowBlockExplorer>[0],
          providerRpcTarget as string,
          networkConfigurations,
        );

    const tokenLabel = `${
      tokenName || tokenSymbol || strings(`spend_limit_edition.nft`)
    } (#${tokenValue})`;

    const isERC2OToken = tokenStandard === ERC20;
    const isNonERC20Token = tokenStandard !== ERC20;
    const isERC20SpendCapScreenWithoutValue = isERC2OToken && !tokenSpendValue;

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

    const isNonFungibleToken = isNFTTokenStandard(tokenStandard as string);
    const isMethodSetApprovalForAll =
      method === TOKEN_METHOD_SET_APPROVAL_FOR_ALL;

    return (
      <>
        <View style={styles.section}>
          {from && (
            <ApproveTransactionHeader
              dontWatchAsset
              origin={origin}
              url={activeTabUrl as string}
              from={from as string}
              asset={{
                address: to as string,
                symbol: tokenSymbol as string,
                decimals: tokenDecimals as number,
                standard: tokenStandard,
              }}
            />
          )}
          <View style={styles.actionViewWrapper}>
            <ActionView
              confirmButtonMode="confirm"
              cancelText={strings('transaction.reject')}
              confirmText={confirmText}
              onCancelPress={this.onCancelPress}
              onConfirmPress={this.onConfirmPress}
              confirmDisabled={shouldDisableConfirmButton}
              confirmButtonState={this.getConfirmButtonState()}
              confirmTestID="Confirm"
            >
              <View style={styles.actionViewChildren}>
                <ScrollView nestedScrollEnabled>
                  <View
                    style={styles.accountApprovalWrapper}
                    onStartShouldSetResponder={() => true}
                  >
                    <TransactionBlockaidBanner
                      transactionId={transactionId}
                      style={
                        (styles as Record<string, ViewStyle>).blockaidWarning
                      }
                      onContactUsClicked={this.onContactUsClicked}
                    />
                    <SmartTransactionsMigrationBanner
                      style={styles.smartTransactionsMigrationBanner}
                    />
                    <Text variant={TextVariant.HeadingMD} style={styles.title}>
                      {this.getTrustTitle(
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
                          {tokenImage ? (
                            <Avatar
                              variant={AvatarVariant.Token}
                              size={AvatarSize.Md}
                              imageSource={{ uri: tokenImage }}
                            />
                          ) : (
                            <Identicon address={to} diameter={25} />
                          )}
                          <Text
                            variant={TextVariant.HeadingMD}
                            style={styles.buttonColor}
                          >
                            {tokenSymbol}
                          </Text>
                        </>
                      )}
                      {isNonFungibleToken ? (
                        hasBlockExplorer ? (
                          <ButtonLink
                            onPress={showBlockExplorer as () => void}
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
                        {`${this.getTrustMessage(
                          originIsDeeplink,
                          isMethodSetApprovalForAll,
                        )}`}
                      </Text>
                    )}
                    <ButtonLink
                      variant={TextVariant.BodyMD}
                      onPress={showVerifyContractDetails as () => void}
                      style={styles.verifyContractLink}
                      label={strings(
                        'contract_allowance.token_allowance.verify_third_party_details',
                      )}
                    />
                    <View style={styles.paddingHorizontal}>
                      <View style={styles.section}>
                        {!tokenStandard ? (
                          <SkeletonText style={styles.skeletalView} />
                        ) : (
                          isERC2OToken && (
                            <CustomSpendCap
                              ticker={tokenSymbol as string}
                              dappProposedValue={
                                originalApproveAmount as string
                              }
                              tokenSpendValue={tokenSpendValue}
                              accountBalance={tokenBalance as string}
                              unroundedAccountBalance={
                                unroundedAccountBalance as string
                              }
                              tokenDecimal={tokenDecimals as number | undefined}
                              toggleLearnMoreWebPage={
                                this.toggleLearnMoreWebPage
                              }
                              isEditDisabled={Boolean(isReadyToApprove)}
                              editValue={this.goToSpendCap}
                              onInputChanged={
                                this.handleCustomSpendOnInputChange
                              }
                              isInputValid={
                                this.handleSetIsCustomSpendInputValid as (
                                  value: boolean,
                                ) => boolean
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
                              onEdit={this.edit}
                              chainId={this.props.chainId}
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
                            onPress={this.toggleViewDetails}
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

  renderTransactionReview = () => {
    const { nickname, nicknameExists } = this.props;
    const {
      host,
      method,
      viewData,
      tokenSpendValue,
      token: { tokenStandard, tokenSymbol, tokenValue, tokenName },
    } = this.state;
    const {
      transaction: { to, data },
    } = this.props;
    return (
      <TransactionReviewDetailsCard
        toggleViewDetails={this.toggleViewDetails}
        toggleViewData={this.toggleViewData}
        copyContractAddress={this.copyContractAddress}
        nickname={nickname}
        nicknameExists={nicknameExists}
        address={to}
        host={host}
        tokenSpendValue={tokenSpendValue}
        tokenSymbol={tokenSymbol}
        data={data}
        tokenValue={tokenValue}
        tokenName={tokenName}
        tokenStandard={tokenStandard}
        method={method}
        displayViewData={viewData}
      />
    );
  };

  renderVerifyContractDetails = () => {
    const {
      providerType,
      providerRpcTarget,
      savedContactListToArray,
      toggleModal,
      closeVerifyContractDetails,
      networkConfigurations,
    } = this.props;
    const {
      transaction: { to },
      showBlockExplorerModal,
      spenderAddress,
      token: { tokenSymbol },
    } = this.state;

    const toggleBlockExplorerModal = (address: string) => {
      closeVerifyContractDetails?.();
      this.setState({
        showBlockExplorerModal: !showBlockExplorerModal,
        address,
      });
    };

    const showNickname = (address: string) => {
      toggleModal?.(address);
    };

    return (
      <VerifyContractDetails
        closeVerifyContractView={closeVerifyContractDetails as () => void}
        toggleBlockExplorer={toggleBlockExplorerModal}
        contractAddress={spenderAddress}
        tokenAddress={to as string}
        showNickname={showNickname}
        savedContactListToArray={savedContactListToArray as unknown[]}
        copyAddress={this.copyContractAddress}
        providerType={providerType as string}
        tokenSymbol={tokenSymbol as string}
        providerRpcTarget={providerRpcTarget as string}
        networkConfigurations={networkConfigurations}
        tokenStandard={this.state.token?.tokenStandard as string}
      />
    );
  };

  renderBlockExplorerView = () => {
    const {
      providerType,
      showVerifyContractDetails,
      networkConfigurations,
      providerRpcTarget,
    } = this.props;
    const { showBlockExplorerModal, address, learnMoreURL } = this.state;

    const styles = this.getStyles();
    const closeModal = () => {
      !learnMoreURL && showVerifyContractDetails?.();
      this.setState({
        showBlockExplorerModal: !showBlockExplorerModal,
        learnMoreURL: null,
      });
    };

    return (
      <ShowBlockExplorer
        setIsBlockExplorerVisible={closeModal}
        type={providerType as string}
        address={address}
        headerWrapperStyle={styles.headerWrapper}
        headerTextStyle={styles.headerText}
        iconStyle={styles.icon}
        providerRpcTarget={providerRpcTarget}
        networkConfigurations={networkConfigurations}
        learnMoreURL={learnMoreURL as string | undefined}
      />
    );
  };

  buyEth = () => {
    const { navigation } = this.props;
    /* this is kinda weird, we have to reject the transaction to collapse the modal */
    this.onCancelPress();
    try {
      navigation.navigate(...createBuyNavigationDetails());
    } catch (error) {
      Logger.error(
        error as Error,
        'Navigation: Error when navigating to buy ETH.',
      );
    }

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.RECEIVE_OPTIONS_PAYMENT_REQUEST)
        .build(),
    );
  };

  onCancelPress = () => {
    const { onCancel, transaction } = this.props;
    onCancel && onCancel();
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.APPROVAL_PERMISSION_UPDATED)
        .addProperties({
          ...this.getAnalyticsParams(),
          ...getBlockaidTransactionMetricsParams(
            transaction as unknown as BlockaidTransactionType,
          ),
        })
        .build(),
    );
  };

  onConfirmPress = () => {
    const {
      isReadyToApprove,
      token: { tokenStandard },
    } = this.state;
    const { onConfirm } = this.props;

    if (tokenStandard === ERC20 && !isReadyToApprove) {
      this.props.metrics.trackEvent(
        this.props.metrics
          .createEventBuilder(MetaMetricsEvents.APPROVAL_PERMISSION_UPDATED)
          .addProperties({
            ...this.getAnalyticsParams(),
            ...getBlockaidTransactionMetricsParams(
              this.props.transaction as unknown as BlockaidTransactionType,
            ),
          })
          .build(),
      );
      return this.setState({ isReadyToApprove: true });
    }

    return onConfirm && onConfirm();
  };

  goToFaucet = () => {
    const { chainId } = this.props;
    InteractionManager.runAfterInteractions(() => {
      this.onCancelPress();
      this.props.navigation.navigate(Routes.BROWSER.VIEW, {
        newTabUrl: TESTNET_FAUCETS[chainId as keyof typeof TESTNET_FAUCETS],
        timestamp: Date.now(),
      });
    });
  };

  renderQRDetails() {
    const { host, spenderAddress } = this.state;
    const {
      activeTabUrl,
      transaction: { origin, from },
      QRState,
    } = this.props;
    const styles = this.getStyles();
    return (
      <View style={styles.actionViewQRObject}>
        <TransactionHeader
          currentPageInformation={{
            origin,
            spenderAddress,
            title: host,
            url: activeTabUrl,
          }}
        />
        <QRSigningDetails
          QRState={QRState as IQRState}
          tighten
          showHint={false}
          showCancelButton
          bypassAndroidCameraAccessCheck={false}
          fromAddress={from as string}
          cancelCallback={this.onCancelPress}
          successCallback={this.onConfirmPress}
        />
      </View>
    );
  }

  render = () => {
    const { viewDetails, showBlockExplorerModal } = this.state;
    const { isSigningQRObject, shouldVerifyContractDetails } = this.props;

    return (
      <View>
        {viewDetails
          ? this.renderTransactionReview()
          : shouldVerifyContractDetails
          ? this.renderVerifyContractDetails()
          : showBlockExplorerModal
          ? this.renderBlockExplorerView()
          : isSigningQRObject
          ? this.renderQRDetails()
          : this.renderDetails()}
      </View>
    );
  };
}

const mapStateToProps = (state: RootState) => {
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
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(state, chainId),
    securityAlertResponse: selectCurrentTransactionSecurityAlertResponse(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setTransactionObject: (transaction: unknown) =>
    dispatch(
      setTransactionObjectAction(
        transaction as Parameters<typeof setTransactionObjectAction>[0],
      ),
    ),
  showAlert: (config: unknown) =>
    dispatch(showAlert(config as Parameters<typeof showAlert>[0])),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withNavigation(
    withQRHardwareAwareness(
      withMetricsAwareness(
        ApproveTransactionReview as unknown as React.ComponentType<IWithMetricsAwarenessProps>,
      ),
    ),
  ),
);
