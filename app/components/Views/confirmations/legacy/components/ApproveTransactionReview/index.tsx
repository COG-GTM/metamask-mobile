import React, { ComponentClass, PureComponent } from 'react';
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
import { IMetaMetricsEvent } from '../../../../../../core/Analytics/MetaMetrics.types';
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
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import { Theme } from '../../../../../../util/theme/models';
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
import {
  ResultType,
  SecurityAlertResponse,
} from '../BlockaidBanner/BlockaidBanner.types';
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
import { Hex } from '@metamask/utils';
import { NetworkState } from '@metamask/network-controller';
import { NetworkType } from '@metamask/controller-utils';

/**
 * The legacy markup in this view passes styling props that predate the
 * component-library `Text` and are ignored at runtime.
 */
const LegacyText = Text as React.FC<
  React.ComponentProps<typeof Text> & {
    grey?: boolean;
    infoModal?: boolean;
    bold?: boolean;
    link?: boolean;
    reset?: boolean;
  }
>;

/**
 * `ButtonLink` does not declare the text variant and element label used by
 * this legacy view, which are both supported at runtime.
 */
const LegacyButtonLink = ButtonLink as React.FC<
  Omit<React.ComponentProps<typeof ButtonLink>, 'label'> & {
    variant?: TextVariant;
    label?: React.ReactNode;
  }
>;

import SmartTransactionsMigrationBanner from '../SmartTransactionsMigrationBanner/SmartTransactionsMigrationBanner';
import { IQRState } from '../../../../../UI/QRHardware/types';
import { IWithMetricsAwarenessProps } from '../../../../../hooks/useMetrics/withMetricsAwareness.types';
import { RootState } from '../../../../../../reducers';

const { ORIGIN_DEEPLINK, ORIGIN_QR_CODE } = AppConstants.DEEPLINKS;
const POLLING_INTERVAL_ESTIMATED_L1_FEE = 30000;

let intervalIdForEstimatedL1Fee: ReturnType<typeof setInterval> | undefined;

const {
  ASSET: { ERC20 },
} = TransactionTypes;


interface TokenAllowanceState {
  tokenSymbol?: string;
  tokenDecimals?: string;
  tokenName?: string;
  tokenBalance?: string;
  tokenStandard?: string;
  tokenSpendValue?: string;
  originalApproveAmount?: string;
  isReadyToApprove?: boolean;
}

interface ApproveTransactionReviewProps extends IWithMetricsAwarenessProps {
  /**
   * Callback triggered when this transaction is cancelled
   */
  onCancel?: () => void;
  /**
   * Callback triggered when this transaction is confirmed
   */
  onConfirm?: () => void;
  /**
   * Transaction state
   */
  // TODO: Replace "any" with type once app/util/transactions is migrated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
  /**
   * Action that shows the global alert
   */
  // TODO: Replace "any" with type once app/actions/alert is migrated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showAlert: (config: any) => void;
  /**
   * Current provider ticker
   */
  ticker?: string;
  /**
   * Number of tokens
   */
  tokensLength?: number;
  /**
   * Number of accounts
   */
  accountsLength?: number;
  /**
   * A string representing the network name
   */
  providerType: NetworkType;
  /**
   * Function to change the mode
   */
  onModeChange?: (mode: string) => void;
  /**
   * Error coming from gas component
   */
  gasError?: string;
  /**
   * Primary currency, either ETH or Fiat
   */
  primaryCurrency?: string;
  /**
   * Active tab URL, the currently active tab url
   */
  activeTabUrl: string;
  /**
   * Object that represents the navigator
   */
  // TODO: Replace "any" with the navigation type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  /**
   * True if transaction is over the available funds
   */
  over?: boolean;
  /**
   * Function to set analytics params
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSetAnalyticsParams?: (params: Record<string, any>) => void;
  /**
   * A string representing the network chainId
   */
  chainId: Hex;
  /**
   * Estimate type returned by the gas fee controller, can be market-fee, legacy or eth_gasPrice
   */
  gasEstimateType?: string;
  /**
   * Function to call when update animation starts
   */
  onUpdatingValuesStart?: () => void;
  /**
   * Function to call when update animation ends
   */
  onUpdatingValuesEnd?: () => void;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange?: boolean;
  /**
   * Boolean to determine if the animation is happening
   */
  isAnimating?: boolean;
  /**
   * If the gas estimations are ready
   */
  gasEstimationReady?: boolean;
  /**
   * List of tokens from TokenListController
   */
  // TODO: Replace "any" with the token list type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenList: Record<string, any>;
  /**
   * Whether the transaction was confirmed or not
   */
  transactionConfirmed?: boolean;
  /**
   * Dispatch set transaction object from transaction action
   */
  // TODO: Replace "any" with type once app/actions/transaction is migrated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTransactionObject: (transaction: any) => void;
  /**
   * toggle nickname modal
   */
  toggleModal?: (address?: string) => void;
  /**
   * The saved nickname of the address
   */
  nickname?: string;
  /**
   * Check if nickname is saved
   */
  nicknameExists?: boolean;
  isSigningQRObject?: boolean;
  QRState: IQRState;
  /**
   * The selected gas value (low, medium, high). Gas value can be null when the advanced option is modified.
   */
  gasSelected?: string | null;
  /**
   * update gas transaction state to parent
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateTransactionState?: (gasTransaction: any) => void;
  /**
   * legacy gas object for calculating the legacy transaction
   */
  legacyGasObject?: {
    legacyGasLimit?: string;
    suggestedGasPrice?: string;
  };
  /**
   * eip1559 gas object for calculating eip1559 transaction
   */
  eip1559GasObject?: {
    suggestedGasLimit?: string;
    suggestedMaxFeePerGas?: string;
    suggestedMaxPriorityFeePerGas?: string;
  };
  showBlockExplorer: () => void;
  /**
   * function to toggle the verify contract details modal
   */
  showVerifyContractDetails: () => void;
  // TODO: Replace "any" with the address book entry type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  savedContactListToArray: any[];
  closeVerifyContractDetails: () => void;
  shouldVerifyContractDetails?: boolean;
  // TODO: Replace "any" with the network configuration type
  networkConfigurations: NetworkState['networkConfigurationsByChainId'];
  providerRpcTarget: string;
  /**
   * Boolean that indicates if the native token buy is supported
   */
  isNativeTokenBuySupported?: boolean;
  /**
   * Function to update token allowance state in Approve component
   */
  updateTokenAllowanceState: (state: TokenAllowanceState) => void;
  /**
   * Token allowance state from Approve component
   */
  tokenAllowanceState?: TokenAllowanceState;
  /**
   * Boolean that indicates gas estimated value is confirmed before approving
   */
  isGasEstimateStatusIn?: boolean;
  /**
   * Boolean that indicates if smart transaction should be used
   */
  shouldUseSmartTransaction?: boolean;
  /**
   * Object containing blockaid validation response for confirmation
   */
  securityAlertResponse?: SecurityAlertResponse;
}

interface ApproveTransactionReviewState {
  viewData: boolean;
  host?: string;
  originalApproveAmount?: string;
  spendLimitCustomValue?: string;
  ticker?: string;
  viewDetails: boolean;
  spenderAddress: string;
  // TODO: Replace "any" with type once app/util/transactions is migrated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
  token: {
    tokenSymbol?: string;
    tokenDecimals?: string;
    tokenName?: string;
    tokenValue?: string;
    tokenStandard?: string;
    tokenBalance?: string;
    tokenImage?: string;
  };
  isReadyToApprove: boolean;
  tokenSpendValue: string;
  showGasTooltip: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasTransactionObject: Record<string, any>;
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

  originIsWalletConnect = false;
  channelIdOrHostname = this.props.transaction.origin;

  sdkConnection = SDKConnect.getInstance().getConnection({
    channelId: this.channelIdOrHostname,
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
        chainId,
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
      setTransactionObject: setTransactionObjectProp,
      tokenList,
      tokenAllowanceState,
    } = this.props;
    const { AssetsContractController } = Engine.context;

    const host = getHost(origin);

    if (!this.originIsMMSDKRemoteConn) {
      // Check if it is walletConnect origin
      WC2Manager.getInstance().then((wc2) => {
        this.originIsWalletConnect = wc2.getSessions().some((session) => {
          // Otherwise, compare the origin with the metadata URL
          if (
            session.peer.metadata.url === origin ||
            origin.startsWith(WALLET_CONNECT_ORIGIN)
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

    let tokenSymbol,
      tokenDecimals,
      tokenName,
      tokenStandard,
      tokenBalance,
      createdSpendCap,
      unroundedAccountBalance = '';

    const { spenderAddress, encodedAmount: encodedHexAmount } =
      decodeApproveData(data);
    const encodedDecimalAmount = hexToBN(encodedHexAmount).toString();

    // The tokenList addresses we get from state are not checksum addresses
    // also, the tokenList we get does not contain the tokenStandard, so even if the token exists in tokenList we will
    // need to fetch it using getTokenDetails
    const contract = tokenList[to];
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
        const result = await getTokenDetails(to, from, encodedDecimalAmount);

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
            // TODO: Remove the cast once app/util/number is migrated to
            // TypeScript and exposes a single BN type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            erc20TokenBalance as any,
            decimals as unknown as number,
          );
          unroundedAccountBalance = fromTokenMinimalUnit(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (erc20TokenBalance || 0) as any,
            decimals as unknown as number,
          );
        }
      } catch (e) {
        tokenSymbol = contract?.symbol || 'ERC20 Token';
        tokenDecimals = contract?.decimals || 18;
      }
    }

    const approveAmount = fromTokenMinimalUnit(
      hexToBN(encodedHexAmount),
      tokenDecimals,
      false,
    );

    const { name: method } = await getMethodData(data, undefined);
    const minTokenAllowance = minimumTokenAllowance(
      tokenDecimals as unknown as number,
    );

    const approvalData = generateApprovalData({
      spender: spenderAddress,
      value: isNFTTokenStandard(tokenStandard as string)
        ? encodedHexAmount
        : '0',
      data,
    });

    setTransactionObjectProp({
      transaction: {
        ...transaction,
        data: approvalData,
      },
    });

    const token = Object.values(tokenList).filter(
      (listedToken) => listedToken.address === to,
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
    const { transaction, setTransactionObject: setTransactionObjectProp } =
      this.props;
    const {
      tokenSpendValue,
      spenderAddress,
      token: { tokenDecimals },
    } = this.state;

    if (prevState?.tokenSpendValue !== tokenSpendValue) {
      const newApprovalTransaction = generateTxWithNewTokenAllowance(
        tokenSpendValue || '0',
        // The token decimals are kept as a string in state, matching what
        // `app/util/transactions` expects at runtime
        tokenDecimals as unknown as number,
        spenderAddress,
        transaction,
      );

      setTransactionObjectProp({
        ...newApprovalTransaction,
        transaction: {
          ...(
            newApprovalTransaction as unknown as {
              transaction: Record<string, unknown>;
            }
          ).transaction,
          data: newApprovalTransaction.data,
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
      token: { tokenSymbol },
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

    updateTokenAllowanceState({
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
            <LegacyText grey infoModal>
              {strings('transaction.gas_education_1')}
              {strings(
                `transaction.gas_education_2${isMainnet ? '_ethereum' : ''}`,
              )}{' '}
              <LegacyText bold>{strings('transaction.gas_education_3')}</LegacyText>
            </LegacyText>
            <LegacyText grey infoModal>
              {strings('transaction.gas_education_4')}
            </LegacyText>
            <TouchableOpacity onPress={this.openLinkAboutGas}>
              <LegacyText grey link infoModal>
                {strings('transaction.gas_education_learn_more')}
              </LegacyText>
            </TouchableOpacity>
          </View>
        }
      />
    );
  };

  getStyles = () => {
    const colors = (this.context as Theme)?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  goToSpendCap = () => this.setState({ isReadyToApprove: false });

  handleSetIsCustomSpendInputValid = (value: boolean) => {
    this.setState({ isCustomSpendInputValid: value });
  };

  toggleLearnMoreWebPage = (url: string) => {
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
      ...getBlockaidTransactionMetricsParams(transaction),
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
    const isTestNetwork = isTestNet(chainId);

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
    const hasBlockExplorer = isNonEvmChainId(chainId)
      ? false
      : shouldShowBlockExplorer(
          providerType,
          providerRpcTarget,
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
              url={activeTabUrl}
              from={from}
              asset={{
                address: to,
                symbol: tokenSymbol as string,
                decimals: tokenDecimals as unknown as number,
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
                      <LegacyText reset style={styles.explanation}>
                        {`${this.getTrustMessage(
                          originIsDeeplink,
                          isMethodSetApprovalForAll,
                        )}`}
                      </LegacyText>
                    )}
                    <LegacyButtonLink
                      variant={TextVariant.BodyMD}
                      onPress={showVerifyContractDetails}
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
                              dappProposedValue={originalApproveAmount as string}
                              tokenSpendValue={tokenSpendValue}
                              accountBalance={tokenBalance as string}
                              unroundedAccountBalance={
                                unroundedAccountBalance as string
                              }
                              tokenDecimal={
                                tokenDecimals as unknown as number
                              }
                              toggleLearnMoreWebPage={
                                this.toggleLearnMoreWebPage
                              }
                              isEditDisabled={Boolean(isReadyToApprove)}
                              editValue={this.goToSpendCap}
                              onInputChanged={
                                this.handleCustomSpendOnInputChange
                              }
                              isInputValid={
                                this
                                  .handleSetIsCustomSpendInputValid as unknown as (
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
                                (!showFeeMarket
                                  ? legacyGasObject
                                  : eip1559GasObject) as Partial<{
                                  suggestedGasLimit: string;
                                  suggestedMaxFeePerGas: string;
                                  suggestedMaxPriorityFeePerGas: string;
                                }>
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
                                <LegacyText reset style={styles.error}>
                                  {gasError}
                                </LegacyText>

                                {over && (
                                  <LegacyText
                                    reset
                                    style={[styles.error, styles.underline]}
                                  >
                                    {errorLinkText}
                                  </LegacyText>
                                )}
                              </TouchableOpacity>
                            ) : (
                              <LegacyText reset style={styles.error}>
                                {gasError}
                              </LegacyText>
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
                              <LegacyText reset style={styles.viewDetailsText}>
                                {strings(
                                  'spend_limit_edition.view_transaction_details',
                                )}
                              </LegacyText>
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
      closeVerifyContractDetails();
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
        closeVerifyContractView={closeVerifyContractDetails}
        toggleBlockExplorer={toggleBlockExplorerModal}
        contractAddress={spenderAddress}
        tokenAddress={to}
        showNickname={showNickname}
        savedContactListToArray={savedContactListToArray}
        copyAddress={this.copyContractAddress}
        providerType={providerType}
        tokenSymbol={tokenSymbol as string}
        providerRpcTarget={providerRpcTarget}
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
      !learnMoreURL && showVerifyContractDetails();
      this.setState({
        showBlockExplorerModal: !showBlockExplorerModal,
        learnMoreURL: null,
      });
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
      Logger.error(error as Error, 'Navigation: Error when navigating to buy ETH.');
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
          ...getBlockaidTransactionMetricsParams(transaction),
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
            ...getBlockaidTransactionMetricsParams(this.props.transaction),
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
          QRState={QRState}
          tighten
          showHint={false}
          showCancelButton
          bypassAndroidCameraAccessCheck={false}
          fromAddress={from}
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

// TODO: Replace "any" with type once app/actions are migrated to TypeScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTransactionObject: (transaction: any) =>
    dispatch(setTransactionObject(transaction)),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showAlert: (config: any) => dispatch(showAlert(config)),
});

ApproveTransactionReview.contextType = ThemeContext;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withNavigation(
    withQRHardwareAwareness(
      withMetricsAwareness(
        ApproveTransactionReview as unknown as ComponentClass<IWithMetricsAwarenessProps>,
      ) as unknown as ComponentClass<{
        QRState?: IQRState;
        isSigningQRObject?: boolean;
        isSyncingQRHardware?: boolean;
      }>,
    ),
  ),
) as unknown as ComponentClass<Partial<ApproveTransactionReviewProps>>;
