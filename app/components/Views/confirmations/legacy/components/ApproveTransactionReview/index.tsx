import React, {
  PureComponent,
  type ComponentClass,
  type ComponentType,
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
import {
  setTransactionObject as setTransactionObjectAction,
} from '../../../../../../actions/transaction';
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
import type { RootState } from '../../../../../../reducers';
import type { Dispatch } from 'redux';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { Theme } from '../../../../../../util/theme/models';
import type { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import type { IQRState } from '../../../../../UI/QRHardware/types';
import type { Hex } from '@metamask/utils';

import SmartTransactionsMigrationBanner from '../SmartTransactionsMigrationBanner/SmartTransactionsMigrationBanner';
const { ORIGIN_DEEPLINK, ORIGIN_QR_CODE } = AppConstants.DEEPLINKS;
const POLLING_INTERVAL_ESTIMATED_L1_FEE = 30000;

let intervalIdForEstimatedL1Fee: ReturnType<typeof setInterval> | undefined;

const {
  ASSET: { ERC20 },
} = TransactionTypes;

interface ActionViewProps {
  confirmButtonMode?: string;
  cancelText?: string;
  confirmText?: string;
  onCancelPress?: () => void;
  onConfirmPress?: () => void;
  confirmDisabled?: boolean;
  confirmButtonState?: string;
  confirmTestID?: string;
  children?: React.ReactNode;
}

interface TransactionReviewProps {
  gasSelected?: string | null;
  primaryCurrency?: string;
  hideTotal?: boolean;
  noMargin?: boolean;
  onEdit?: (...args: never[]) => void;
  chainId?: string;
  onUpdatingValuesStart?: () => void;
  onUpdatingValuesEnd?: () => void;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  gasEstimationReady?: boolean;
  legacy?: boolean;
  gasObject?: unknown;
  gasObjectLegacy?: unknown;
  updateTransactionState?: (...args: never[]) => void;
  onlyGas?: boolean;
  multiLayerL1FeeTotal?: string;
}

interface TransactionReviewDetailsCardProps {
  toggleViewDetails?: () => void;
  toggleViewData?: () => void;
  copyContractAddress?: (address: string) => void;
  nickname?: string;
  nicknameExists?: boolean;
  address?: string;
  host?: string;
  tokenSpendValue?: string;
  tokenSymbol?: string;
  data?: string;
  tokenValue?: string;
  tokenName?: string;
  tokenStandard?: string;
  method?: string;
  displayViewData?: boolean;
}

const ActionViewComponent = ActionView as unknown as ComponentType<ActionViewProps>;
interface LegacyTextProps extends React.ComponentProps<typeof Text> {
  reset?: boolean;
}

const TextWithReset = Text as unknown as ComponentType<LegacyTextProps>;
const TransactionReviewComponent =
  TransactionReview as unknown as ComponentType<TransactionReviewProps>;
const TransactionReviewDetailsCardComponent =
  TransactionReviewDetailsCard as unknown as ComponentType<TransactionReviewDetailsCardProps>;
const getApproveNavbarTyped = getApproveNavbar as unknown as (
  title: string,
  navigation: NavigationProp<ParamListBase>,
) => React.ReactNode;
const getTokenDetailsTyped = getTokenDetails as unknown as (
  tokenAddress: string,
  userAddress: string,
  tokenId: string,
) => Promise<TokenDetails>;
const getMethodDataTyped = getMethodData as unknown as (
  data: string,
) => Promise<{ name: string }>;
const generateApprovalDataTyped = generateApprovalData as unknown as (
  params: unknown,
) => string;
const generateTxWithNewTokenAllowanceTyped =
  generateTxWithNewTokenAllowance as unknown as (
    value: string,
    decimals: number,
    spender: string,
    transaction: unknown,
  ) => { transaction: Record<string, unknown>; data: string };
const getBlockaidTransactionMetricsParamsTyped =
  getBlockaidTransactionMetricsParams as unknown as (
    transaction: unknown,
  ) => Record<string, unknown>;

/**
 * PureComponent that manages ERC20 approve from the dapp browser
 */
interface LegacyTransaction {
  [key: string]: unknown;
  id?: string;
  origin: string;
  from: string;
  to: string;
  data: string;
  chainId: string;
  transaction?: Record<string, unknown>;
}

interface TokenState {
  [key: string]: unknown;
  address?: string;
  iconUrl?: string;
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
  tokenSpendValue?: string;
  isReadyToApprove?: boolean;
}

interface TokenDetails {
  standard?: string;
  name?: string;
  decimals?: number;
  symbol?: string;
}

interface GasData {
  [key: string]: string | number | boolean | null | undefined;
  suggestedGasLimit?: string | number;
  suggestedGasPrice?: string | number;
  suggestedGasLimitHex?: string;
  suggestedGasPriceHex?: string;
  totalHex?: string;
  totalMaxHex?: string;
  error?: string;
}

interface AlertConfig {
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: { msg: string };
}

interface State {
  viewData: boolean;
  host?: string;
  method?: string;
  originalApproveAmount?: string;
  spendLimitCustomValue?: string | number;
  ticker: string;
  viewDetails: boolean;
  spenderAddress: string;
  transaction: LegacyTransaction;
  token: TokenState;
  isReadyToApprove: boolean;
  tokenSpendValue: string;
  showGasTooltip: boolean;
  gasTransactionObject: Record<string, unknown>;
  multiLayerL1FeeTotal: string;
  fetchingUpdateDone: boolean;
  showBlockExplorerModal: boolean;
  address: string;
  isCustomSpendInputValid: boolean;
  unroundedAccountBalance: string | null;
  encodedHexAmount?: string;
  learnMoreURL?: string;
}

interface OwnProps {
  onCancel?: () => void;
  onConfirm?: () => void;
  onModeChange?: (mode: string) => void;
  onSetAnalyticsParams?: (params: Record<string, unknown>) => void;
  onUpdatingValuesStart?: () => void;
  onUpdatingValuesEnd?: () => void;
  updateTransactionState?: (gas: GasData) => void;
  toggleModal?: (value: string) => void;
  showBlockExplorer?: () => void;
  showVerifyContractDetails?: () => void;
  closeVerifyContractDetails?: () => void;
  updateTokenAllowanceState?: (state: Record<string, unknown>) => void;
  navigation: NavigationProp<ParamListBase>;
  shouldVerifyContractDetails?: boolean;
  chainId?: string;
  QRState?: IQRState;
  gasError?: string;
  tokensLength?: number;
  over?: boolean;
  gasEstimateType?: string;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  gasEstimationReady?: boolean;
  transactionConfirmed?: boolean;
  nickname?: string;
  nicknameExists?: boolean;
  isSigningQRObject?: boolean;
  gasSelected?: string | null;
  legacyGasObject?: Record<string, unknown>;
  eip1559GasObject?: Record<string, unknown>;
  savedContactListToArray?: Record<string, unknown>[];
  tokenAllowanceState?: TokenAllowanceState;
  isGasEstimateStatusIn?: boolean;
}

interface StateProps {
  transaction: LegacyTransaction;
  ticker?: string;
  tokensLength?: number;
  accountsLength?: number;
  providerType?: string;
  primaryCurrency?: string;
  activeTabUrl?: string;
  tokenList: Record<string, TokenState>;
  networkConfigurations?: Record<string, unknown>;
  providerRpcTarget?: string;
  isNativeTokenBuySupported?: boolean;
  shouldUseSmartTransaction?: boolean;
  securityAlertResponse?: Record<string, unknown>;
}

interface DispatchProps {
  setTransactionObject: (transaction: Record<string, unknown>) => void;
  showAlert: (config: AlertConfig) => void;
}

type Props = OwnProps &
  StateProps &
  DispatchProps &
  IWithMetricsAwarenessProps;

class ApproveTransactionReview extends PureComponent<Props, State> {
  originIsWalletConnect = false;
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationProp<ParamListBase>;
  }) =>
    getApproveNavbarTyped('approve.title', navigation);

  state: State = {
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
      const result = await (fetchEstimatedMultiLayerL1Fee as unknown as (
        client: unknown,
        params: unknown,
      ) => Promise<string>)(eth, {
        txParams: transaction.transaction,
        chainId,
      });
      this.setState({
        multiLayerL1FeeTotal: result,
      });
    } catch (e) {
      Logger.error(
        e instanceof Error ? e : new Error(String(e)),
        'fetchEstimatedMultiLayerL1Fee call failed',
      );
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

    let tokenSymbol: string | undefined,
      tokenDecimals: number | undefined,
      tokenName: string | undefined,
      tokenStandard: string | undefined,
      tokenBalance: string | undefined,
      createdSpendCap: boolean | undefined,
      unroundedAccountBalance = '';

    const {
      spenderAddress,
      encodedAmount: encodedHexAmount,
    } = decodeApproveData(data) as unknown as {
      spenderAddress: string;
      encodedAmount: string;
    };
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
        const result = await getTokenDetailsTyped(to, from, encodedDecimalAmount);

        const { standard, name, decimals, symbol } = result;

        if (isNFTTokenStandard(standard as string)) {
          tokenName = name as string;
          tokenSymbol = symbol as string;
          tokenStandard = standard as string;
        } else {
          const erc20TokenBalance =
            await AssetsContractController.getERC20BalanceOf(to, from);
          tokenDecimals = decimals;
          tokenSymbol = symbol;
          tokenStandard = standard;
          tokenName = name;
          tokenBalance = renderFromTokenMinimalUnit(
            erc20TokenBalance as unknown as string,
            decimals as number,
          );
          unroundedAccountBalance = fromTokenMinimalUnit(
            erc20TokenBalance as unknown as string,
            decimals as number,
          );
        }
      } catch (e) {
        tokenSymbol = (contract?.symbol as string) || 'ERC20 Token';
        tokenDecimals = (contract?.decimals as number) || 18;
      }
    }

    const approveAmount = fromTokenMinimalUnit(
      hexToBN(encodedHexAmount),
      tokenDecimals as number,
      false,
    );

    const { name: method } = await getMethodDataTyped(data);
    const minTokenAllowance = minimumTokenAllowance(tokenDecimals as number);

    const approvalData = generateApprovalDataTyped({
      spender: spenderAddress,
      value: isNFTTokenStandard(tokenStandard || '') ? encodedHexAmount : '0',
      data,
    });

    setTransactionObject({
      transaction: {
        ...transaction,
        data: approvalData,
      },
    });

    const token = Object.values(tokenList).filter(
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
        isReadyToApprove: createdSpendCap ?? false,
        tokenSpendValue: tokenAllowanceState
          ? tokenAllowanceState?.tokenSpendValue ?? ''
          : '',
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
    if (chainId !== undefined && isMultiLayerFeeNetwork(chainId)) {
      this.fetchEstimatedL1Fee();
      intervalIdForEstimatedL1Fee = setInterval(
        this.fetchEstimatedL1Fee,
        POLLING_INTERVAL_ESTIMATED_L1_FEE,
      );
    }
  };

  componentDidUpdate = (_: Props, prevState: State) => {
    const { transaction, setTransactionObject } = this.props;
    const {
      tokenSpendValue,
      spenderAddress,
      token: { tokenDecimals },
    } = this.state;

    if (prevState?.tokenSpendValue !== tokenSpendValue) {
      const newApprovalTransaction = generateTxWithNewTokenAllowanceTyped(
        tokenSpendValue || '0',
        tokenDecimals as number,
        spenderAddress,
        transaction,
      );

      setTransactionObject({
        ...newApprovalTransaction,
        transaction: {
          ...newApprovalTransaction.transaction,
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

    const { token: tokenState, originalApproveAmount, encodedHexAmount } =
      this.state;
    const { tokenSymbol } = tokenState;

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
        transaction?.origin as (typeof AppConstants.DEEPLINKS)[keyof typeof AppConstants.DEEPLINKS],
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
      Logger.error(
        error instanceof Error ? error : new Error(String(error)),
        'Error in getAnalyticsParams:',
      );
      return baseParams;
    }
  };

  trackApproveEvent = (event: string) => {
    const { transaction, tokensLength, accountsLength, providerType } =
      this.props;

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(event as unknown as Parameters<
          typeof this.props.metrics.createEventBuilder
        >[0])
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

  copyContractAddress = async (address: string) => {
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
    const isMainnet =
      !!this.props.chainId && isMainnetByChainId(this.props.chainId);
    return (
      <InfoModal
        isVisible={this.state.showGasTooltip}
        title={strings(
          `transaction.gas_education_title${isMainnet ? '_ethereum' : ''}`,
        )}
        toggleModal={this.toggleGasTooltip}
        body={
          <View>
            <TextWithReset>
              {strings('transaction.gas_education_1')}
              {strings(
                `transaction.gas_education_2${isMainnet ? '_ethereum' : ''}`,
              )}{' '}
              <TextWithReset>{strings('transaction.gas_education_3')}</TextWithReset>
            </TextWithReset>
            <TextWithReset>
              {strings('transaction.gas_education_4')}
            </TextWithReset>
            <TouchableOpacity onPress={this.openLinkAboutGas}>
              <TextWithReset>
                {strings('transaction.gas_education_learn_more')}
              </TextWithReset>
            </TouchableOpacity>
          </View>
        }
      />
    );
  };

  getStyles = () => {
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
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
      ...getBlockaidTransactionMetricsParamsTyped(transaction),
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
    let confirmButtonState: (typeof ConfirmButtonState)[keyof typeof ConfirmButtonState] =
      ConfirmButtonState.Normal;

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

    const styles = this.getStyles() as ReturnType<typeof createStyles> & {
      blockaidWarning: unknown;
    };
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
          providerType as unknown as import('@metamask/controller-utils').NetworkType,
          providerRpcTarget as string,
          networkConfigurations as unknown as import('@metamask/network-controller').NetworkState['networkConfigurationsByChainId'],
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
              from={from}
              asset={{
                address: to as string,
                symbol: tokenSymbol as string,
                decimals: tokenDecimals as number,
                standard: tokenStandard,
              }}
            />
          )}
          <View style={styles.actionViewWrapper}>
            <ActionViewComponent
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
                        styles.blockaidWarning as React.ComponentProps<
                          typeof TransactionBlockaidBanner
                        >['style']
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
                      <TextWithReset reset style={styles.explanation}>
                        {`${this.getTrustMessage(
                          originIsDeeplink,
                          isMethodSetApprovalForAll,
                        )}`}
                      </TextWithReset>
                    )}
                    <ButtonLink
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
                              dappProposedValue={originalApproveAmount as string}
                              tokenSpendValue={tokenSpendValue as string}
                              accountBalance={tokenBalance as string}
                              unroundedAccountBalance={unroundedAccountBalance as string}
                              tokenDecimal={tokenDecimals as number}
                              toggleLearnMoreWebPage={
                                this.toggleLearnMoreWebPage
                              }
                              isEditDisabled={Boolean(isReadyToApprove)}
                              editValue={this.goToSpendCap}
                              onInputChanged={
                                this.handleCustomSpendOnInputChange
                              }
                              isInputValid={(value) => {
                                this.handleSetIsCustomSpendInputValid(value);
                                return true;
                              }}
                            />
                          )
                        )}
                        {((isERC2OToken && isReadyToApprove) ||
                          isNonFungibleToken) && (
                          <View style={styles.transactionWrapper}>
                            <TransactionReviewComponent
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
                            {(!!chainId && isTestNetworkWithFaucet(chainId)) ||
                            isNativeTokenBuySupported ? (
                              <TouchableOpacity onPress={errorPress}>
                                <TextWithReset reset style={styles.error}>
                                  {gasError}
                                </TextWithReset>

                                {over && (
                                  <TextWithReset
                                    style={[styles.error, styles.underline]}
                                    reset
                                  >
                                    {errorLinkText}
                                  </TextWithReset>
                                )}
                              </TouchableOpacity>
                            ) : (
                              <TextWithReset reset style={styles.error}>
                                {gasError}
                              </TextWithReset>
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
                              <TextWithReset
                                reset
                                style={styles.viewDetailsText}
                              >
                                {strings(
                                  'spend_limit_edition.view_transaction_details',
                                )}
                              </TextWithReset>
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
            </ActionViewComponent>
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
      <TransactionReviewDetailsCardComponent
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
        tokenAddress={to}
        showNickname={showNickname}
        savedContactListToArray={savedContactListToArray ?? []}
        copyAddress={this.copyContractAddress}
        providerType={providerType as string}
        tokenSymbol={tokenSymbol as string}
        providerRpcTarget={providerRpcTarget as string}
        networkConfigurations={
          networkConfigurations as unknown as React.ComponentProps<
            typeof VerifyContractDetails
          >['networkConfigurations']
        }
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
        learnMoreURL: undefined,
      });
    };

    return (
        <ShowBlockExplorer
        setIsBlockExplorerVisible={closeModal}
        type={providerType as string}
        address={address as string}
        headerWrapperStyle={styles.headerWrapper}
        headerTextStyle={styles.headerText}
        iconStyle={styles.icon}
        providerRpcTarget={providerRpcTarget}
        networkConfigurations={
          networkConfigurations as unknown as React.ComponentProps<
            typeof ShowBlockExplorer
          >['networkConfigurations']
        }
        learnMoreURL={learnMoreURL}
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
        error instanceof Error ? error : new Error(String(error)),
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
          ...getBlockaidTransactionMetricsParamsTyped(transaction),
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
          ...getBlockaidTransactionMetricsParamsTyped(this.props.transaction),
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
        newTabUrl: (TESTNET_FAUCETS as unknown as Record<string, string>)[
          chainId as string
        ],
        timestamp: Date.now(),
      });
    });
  };

  renderQRDetails() {
    const { spenderAddress } = this.state;
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
            url: activeTabUrl,
          }}
        />
        <QRSigningDetails
          QRState={QRState as unknown as React.ComponentProps<
            typeof QRSigningDetails
          >['QRState']}
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

const mapStateToProps = (state: RootState): StateProps => {
  const transaction = getNormalizedTxState(
    state,
  ) as unknown as LegacyTransaction;
  const chainId = transaction?.chainId as Hex;

  return {
    ticker: selectNativeCurrencyByChainId(state, chainId),
    networkConfigurations: selectEvmNetworkConfigurationsByChainId(state),
    transaction,
    tokensLength: selectTokensLength(state),
    accountsLength: selectAccountsLength(state),
    providerType: selectProviderTypeByChainId(state, chainId),
    providerRpcTarget: selectRpcUrlByChainId(state, chainId),
    primaryCurrency: state.settings.primaryCurrency,
    activeTabUrl: getActiveTabUrl(state),
    tokenList: selectTokenList(state),
    isNativeTokenBuySupported: isNetworkRampNativeTokenSupported(
      chainId,
      getRampNetworks(state),
    ),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(state, chainId),
    securityAlertResponse: selectCurrentTransactionSecurityAlertResponse(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setTransactionObject: (transaction: Record<string, unknown>) =>
    dispatch(setTransactionObjectAction(transaction)),
  showAlert: (config: AlertConfig) =>
    dispatch(showAlert(config as unknown as Parameters<typeof showAlert>[0])),
});

ApproveTransactionReview.contextType = ThemeContext;

interface QRHardwareProps {
  QRState?: IQRState;
  isSigningQRObject?: boolean;
  isSyncingQRHardware?: boolean;
}

const MetricsAwareApproveTransactionReview = withMetricsAwareness(
  ApproveTransactionReview as unknown as ComponentType<IWithMetricsAwarenessProps>,
);
const QRHardwareAwareApproveTransactionReview = withQRHardwareAwareness(
  MetricsAwareApproveTransactionReview as unknown as ComponentClass<QRHardwareProps>,
);
const withNavigationTyped = withNavigation as unknown as (
  component: ComponentType<Props>,
) => ComponentType<Omit<Props, 'navigation' | 'metrics'>>;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withNavigationTyped(
  QRHardwareAwareApproveTransactionReview as unknown as ComponentType<Props>,
));
