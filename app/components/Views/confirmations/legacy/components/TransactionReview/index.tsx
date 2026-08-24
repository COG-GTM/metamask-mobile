import Eth from '@metamask/ethjs-query';
import type BN4 from 'bnjs4';
import type { TransactionParams } from '@metamask/transaction-controller';
import { withNavigation } from '@react-navigation/compat';
import PropTypes from 'prop-types';
import React, { ComponentClass, PureComponent } from 'react';
import {
  Animated,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { connect } from 'react-redux';
import { strings } from '../../../../../../../locales/i18n';
import {
  withMetricsAwareness,
  IUseMetricsHook,
} from '../../../../../../components/hooks/useMetrics';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import Engine from '../../../../../../core/Engine';
import { SDKConnect } from '../../../../../../core/SDKConnect/SDKConnect';
import {
  selectCurrentTransactionMetadata,
  selectCurrentTransactionSecurityAlertResponse,
} from '../../../../../../selectors/confirmTransaction';
import {
  selectConversionRateByChainId,
  selectCurrentCurrency,
} from '../../../../../../selectors/currencyRateController';
import { selectUseTransactionSimulations } from '../../../../../../selectors/preferencesController';
import { selectShouldUseSmartTransaction } from '../../../../../../selectors/smartTransactionsController';
import { selectTokenList } from '../../../../../../selectors/tokenListController';
import { selectTokens } from '../../../../../../selectors/tokensController';
import { fontStyles } from '../../../../../../styles/common';
import Logger from '../../../../../../util/Logger';
import { safeToChecksumAddress } from '../../../../../../util/address';
import { getBlockaidMetricsParams } from '../../../../../../util/blockaid';
import Device from '../../../../../../util/device';
import { isMultiLayerFeeNetwork } from '../../../../../../util/networks';
import { fetchEstimatedMultiLayerL1Fee } from '../../../../../../util/networks/engineNetworkUtils';
import {
  balanceToFiat,
  fromTokenMinimalUnit,
  isZeroValue,
  renderFromTokenMinimalUnit,
  renderFromWei,
  weiToFiat,
} from '../../../../../../util/number';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import { Colors, Theme } from '../../../../../../util/theme/models';
import {
  decodeTransferData,
  getNormalizedTxState,
  getTicker,
  getTransactionReviewActionKey,
  isApprovalTransaction,
} from '../../../../../../util/transactions';
import AccountFromToInfoCard from '../../../../../UI/AccountFromToInfoCard';
import ApprovalTagUrl from '../../../../../UI/ApprovalTagUrl';
import ActionView, { ConfirmButtonState } from '../../../../../UI/ActionView';
import QRSigningDetails from '../../../../../UI/QRHardware/QRSigningDetails';
import withQRHardwareAwareness from '../../../../../UI/QRHardware/withQRHardwareAwareness';
import SimulationDetails from '../../../../../UI/SimulationDetails/SimulationDetails';
import TransactionHeader from '../../../../../UI/TransactionHeader';
import { ResultType } from '../BlockaidBanner/BlockaidBanner.types';
import TransactionBlockaidBanner from '../TransactionBlockaidBanner/TransactionBlockaidBanner';
import TransactionReviewData from './TransactionReviewData';
import TransactionReviewInformation from './TransactionReviewInformation';
import TransactionReviewSummary from './TransactionReviewSummary';
import DevLogger from '../../../../../../core/SDKConnect/utils/DevLogger';
import { selectNativeCurrencyByChainId } from '../../../../../../selectors/networkController';
import { selectContractExchangeRatesByChainId } from '../../../../../../selectors/tokenRatesController';
import SmartTransactionsMigrationBanner from '../SmartTransactionsMigrationBanner/SmartTransactionsMigrationBanner';
import { Hex } from '@metamask/utils';
import { IQRState } from '../../../../../UI/QRHardware/types';
import type { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import { RootState } from '../../../../../../reducers';
const POLLING_INTERVAL_ESTIMATED_L1_FEE = 30000;

let intervalIdForEstimatedL1Fee: ReturnType<typeof setInterval>;

interface TransactionReviewAsset {
  address: string;
  decimals?: number;
  symbol?: string;
  tokenId?: string;
  name?: string;
}

interface TransactionReviewTransactionState {
  transaction?: TransactionParams;
  value?: string;
  data?: string;
  to?: string;
  from?: string;
  origin?: string;
  ensRecipient?: string;
  id?: string;
  chainId?: Hex;
  assetType?: string;
  selectedAsset?: TransactionReviewAsset;
}

interface TransactionReviewBrowserState {
  activeTab?: string | number;
  tabs: { id: string | number; url: string }[];
}

interface TransactionReviewOwnProps {
  /**
   * Callback triggered when this transaction is cancelled
   */
  onCancel?: () => void;
  /**
   * Called when a user changes modes
   */
  onModeChange?: (mode: string) => void;
  /**
   * Callback triggered when this transaction is cancelled
   */
  onConfirm?: () => void;
  /**
   * Whether the transaction was confirmed or not
   */
  transactionConfirmed?: boolean;
  /**
   * Error blockaid transaction execution, undefined value signifies no error.
   */
  error?: string | boolean;
  /**
   * Whether or not basic gas estimates have been fetched
   */
  ready?: boolean;
  /**
   * Height of custom gas and data modal
   */
  customGasHeight?: number;
  /**
   * Drives animated values
   */
  animate?: (params: {
    modalEndValue: number;
    xTranslationName: string;
    xTranslationEndValue: number;
  }) => void;
  /**
   * Generates a transform style unique to the component
   */
  generateTransform?: (
    valueType: string,
    outRange: number[],
  ) => StyleProp<ViewStyle>;
  /**
   * Saves the height of TransactionReviewData
   */
  saveTransactionReviewDataHeight?: () => void;
  /**
   * Hides or shows TransactionReviewData
   */
  hideData?: boolean;
  /**
   * True if transaction is over the available funds
   */
  over?: boolean;
  gasEstimateType?: string;
  EIP1559GasData?: Record<string, unknown>;
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
  dappSuggestedGas?: boolean;
  /**
   * Object that represents the navigator
   */
  navigation?: object;
  /**
   * If it's a eip1559 network and dapp suggest legact gas then it should show a warning
   */
  dappSuggestedGasWarning?: boolean;
  isSigningQRObject?: boolean;
  QRState?: IQRState;
  /**
   * Returns the selected gas type
   */
  gasSelected?: string | null;
}

interface TransactionReviewStateProps {
  /**
   * Array of ERC20 assets
   */
  tokens: ReturnType<typeof selectTokens>;
  /**
   * ETH to current currency conversion rate
   */
  conversionRate?: number;
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency: string;
  /**
   * Object containing token exchange rates in the format address => exchangeRate
   */
  contractExchangeRates: ReturnType<
    typeof selectContractExchangeRatesByChainId
  >;
  /**
   * Current provider ticker
   */
  ticker?: string;
  /**
   * Chain id
   */
  chainId?: Hex;
  /**
   * Indicates whether hex data should be shown in transaction editor
   */
  showHexData?: boolean;
  /**
   * Transaction object associated with this transaction
   */
  transaction: TransactionReviewTransactionState;
  /**
   * Browser/tab information
   */
  browser: TransactionReviewBrowserState;
  /**
   * ETH or fiat, depending on user setting
   */
  primaryCurrency?: string;
  /**
   * List of tokens from TokenListController
   */
  tokenList: ReturnType<typeof selectTokenList>;
  /**
   * Boolean that indicates if smart transaction should be used
   */
  shouldUseSmartTransaction: boolean;
  /**
   * Boolean that indicates if transaction simulations should be enabled
   */
  useTransactionSimulations: boolean;
  /**
   * Object containing blockaid validation response for confirmation
   */
  securityAlertResponse: ReturnType<
    typeof selectCurrentTransactionSecurityAlertResponse
  >;
  /**
   * Object containing the current transaction metadata
   */
  transactionMetadata?: ReturnType<typeof selectCurrentTransactionMetadata>;
  /**
   * Network client id
   */
  networkClientId?: string;
}

type TransactionReviewProps = TransactionReviewOwnProps &
  TransactionReviewStateProps & {
    /**
     * Metrics injected by withMetricsAwareness HOC
     */
    metrics: IUseMetricsHook;
  };

interface TransactionReviewComponentState {
  toFocused: boolean;
  actionKey: string;
  showHexData: boolean | string;
  dataVisible: boolean;
  assetAmount?: string;
  conversionRate?: number | boolean;
  fiatValue?: string;
  approveTransaction?: boolean;
  multiLayerL1FeeTotal: string;
}

type RenderValues = [
  string | undefined,
  number | boolean | undefined,
  string | undefined,
];

/**
 * `AccountFromToInfoCard` declares props this legacy screen has never passed.
 */
const AccountFromToInfoCardView =
  AccountFromToInfoCard as unknown as React.ComponentType<
    Partial<React.ComponentProps<typeof AccountFromToInfoCard>>
  >;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    tabUnderlineStyle: {
      height: 2,
      backgroundColor: colors.primary.default,
    },
    tabStyle: {
      paddingBottom: 0,
      backgroundColor: colors.background.default,
    },
    textStyle: {
      fontSize: 12,
      letterSpacing: 0.5,
      ...fontStyles.bold,
    },
    actionViewWrapper: {
      height: Device.isMediumDevice() ? 590 : 670,
    },
    actionViewChildren: {
      height: Device.isMediumDevice() ? 510 : 590,
    },
    accountTransactionWrapper: {
      flex: 1,
    },
    actionViewQRObject: {
      height: 624,
    },
    accountInfoCardWrapper: {
      paddingBottom: 12,
    },
    transactionData: {
      position: 'absolute',
      width: '100%',
      height: '100%',
    },
    hidden: {
      opacity: 0,
      height: 0,
    },
    blockaidWarning: {
      marginBottom: 0,
      marginTop: 0,
      marginHorizontal: 0,
    },
    transactionSimulations: {
      marginLeft: 24,
      marginRight: 24,
      marginBottom: 24,
    },
    blockaidBannerContainer: {
      marginHorizontal: 16,
      marginBottom: 8,
    },
    smartTransactionsMigrationBanner: {
      marginHorizontal: 16,
    },
  });

/**
 * PureComponent that supports reviewing a transaction
 */
class TransactionReview extends PureComponent<
  TransactionReviewProps,
  TransactionReviewComponentState
> {
  static propTypes = {
    /**
     * Callback triggered when this transaction is cancelled
     */
    onCancel: PropTypes.func,
    /**
     * Called when a user changes modes
     */
    onModeChange: PropTypes.func,
    /**
     * Callback triggered when this transaction is cancelled
     */
    onConfirm: PropTypes.func,
    /**
     * Indicates whether hex data should be shown in transaction editor
     */
    showHexData: PropTypes.bool,
    /**
     * Whether the transaction was confirmed or not
     */
    transactionConfirmed: PropTypes.bool,
    /**
     * Transaction object associated with this transaction
     */
    transaction: PropTypes.object,
    /**
     * Browser/tab information
     */
    browser: PropTypes.object,
    /**
     * ETH to current currency conversion rate
     */
    conversionRate: PropTypes.number,
    /**
     * Currency code of the currently-active currency
     */
    currentCurrency: PropTypes.string,
    /**
     * Object containing token exchange rates in the format address => exchangeRate
     */
    contractExchangeRates: PropTypes.object,
    /**
     * Array of ERC20 assets
     */
    tokens: PropTypes.array,
    /**
     * Current provider ticker
     */
    ticker: PropTypes.string,
    /**
     * Chain id
     */
    chainId: PropTypes.string,
    /**
     * ETH or fiat, depending on user setting
     */
    primaryCurrency: PropTypes.string,
    /**
     * Error blockaid transaction execution, undefined value signifies no error.
     */
    error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    /**
     * Whether or not basic gas estimates have been fetched
     */
    ready: PropTypes.bool,
    /**
     * Height of custom gas and data modal
     */
    customGasHeight: PropTypes.number,
    /**
     * Drives animated values
     */
    animate: PropTypes.func,
    /**
     * Generates a transform style unique to the component
     */
    generateTransform: PropTypes.func,
    /**
     * Saves the height of TransactionReviewData
     */
    saveTransactionReviewDataHeight: PropTypes.func,
    /**
     * Hides or shows TransactionReviewData
     */
    hideData: PropTypes.bool,
    /**
     * True if transaction is over the available funds
     */
    over: PropTypes.bool,
    gasEstimateType: PropTypes.string,
    EIP1559GasData: PropTypes.object,
    /**
     * Function to call when update animation starts
     */
    onUpdatingValuesStart: PropTypes.func,
    /**
     * Function to call when update animation ends
     */
    onUpdatingValuesEnd: PropTypes.func,
    /**
     * If the values should animate upon update or not
     */
    animateOnChange: PropTypes.bool,
    /**
     * Boolean to determine if the animation is happening
     */
    isAnimating: PropTypes.bool,
    dappSuggestedGas: PropTypes.bool,
    /**
     * List of tokens from TokenListController
     */
    tokenList: PropTypes.object,
    /**
     * Object that represents the navigator
     */
    navigation: PropTypes.object,
    /**
     * If it's a eip1559 network and dapp suggest legact gas then it should show a warning
     */
    dappSuggestedGasWarning: PropTypes.bool,
    isSigningQRObject: PropTypes.bool,
    QRState: PropTypes.object,
    /**
     * Returns the selected gas type
     * @returns {string}
     */
    gasSelected: PropTypes.string,
    /**
     * Metrics injected by withMetricsAwareness HOC
     */
    metrics: PropTypes.object,
    /**
     * Boolean that indicates if smart transaction should be used
     */
    shouldUseSmartTransaction: PropTypes.bool,
    /**
     * Boolean that indicates if transaction simulations should be enabled
     */
    useTransactionSimulations: PropTypes.bool,
    /**
     * Object containing blockaid validation response for confirmation
     */
    securityAlertResponse: PropTypes.object,
    /**
     * Object containing the current transaction metadata
     */
    transactionMetadata: PropTypes.object,
    /**
     * Network client id
     */
    networkClientId: PropTypes.string,
  };

  state: TransactionReviewComponentState = {
    toFocused: false,
    actionKey: strings('transactions.tx_review_confirm'),
    showHexData: false,
    dataVisible: false,
    assetAmount: undefined,
    conversionRate: undefined,
    fiatValue: undefined,
    multiLayerL1FeeTotal: '0x0',
  };

  fetchEstimatedL1Fee = async () => {
    const { transaction, chainId, networkClientId } = this.props;
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
        networkClientId,
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
    const {
      transaction,
      transaction: { data, to, value },
      transactionMetadata,
      tokens,
      chainId,
      tokenList,
      metrics,
      shouldUseSmartTransaction,
    } = this.props;
    let { showHexData }: { showHexData?: boolean | string } = this.props;
    let assetAmount, conversionRate, fiatValue;
    showHexData = showHexData || data;
    const approveTransaction =
      isApprovalTransaction(data as string) && (!value || isZeroValue(value));

    const actionKey = await getTransactionReviewActionKey(
      {
        ...transactionMetadata,
        transaction,
        txParams: undefined,
      } as unknown as Parameters<typeof getTransactionReviewActionKey>[0],
      chainId as string,
    );

    if (approveTransaction) {
      let contract: { symbol?: string } | undefined =
        tokenList[safeToChecksumAddress(to as string) as Hex];
      if (!contract) {
        contract = tokens.find(
          ({ address }) => address === safeToChecksumAddress(to as string),
        );
      }
      const symbol = contract?.symbol || 'ERC20';
      assetAmount = `${
        (decodeTransferData('transfer', data as string) as string[])[1]
      } ${symbol}`;
    } else {
      [assetAmount, conversionRate, fiatValue] = this.getRenderValues()();
    }

    this.setState({
      actionKey,
      showHexData: showHexData as boolean | string,
      assetAmount,
      conversionRate,
      fiatValue,
      approveTransaction,
    });

    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CONFIRM_STARTED)
        .addProperties({
          is_smart_transaction: shouldUseSmartTransaction,
        })
        .build(),
    );

    if (isMultiLayerFeeNetwork(chainId)) {
      this.fetchEstimatedL1Fee();
      intervalIdForEstimatedL1Fee = setInterval(
        this.fetchEstimatedL1Fee,
        POLLING_INTERVAL_ESTIMATED_L1_FEE,
      );
    }
  };

  onContactUsClicked = () => {
    const { securityAlertResponse, metrics } = this.props;
    const additionalParams = {
      ...getBlockaidMetricsParams(securityAlertResponse),
      external_link_clicked: 'security_alert_support_link',
    };

    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CONFIRM_STARTED)
        .addProperties(additionalParams)
        .build(),
    );
  };

  componentWillUnmount = async () => {
    clearInterval(intervalIdForEstimatedL1Fee);
  };

  getRenderValues = () => {
    const {
      transaction: { value, selectedAsset, assetType },
      currentCurrency,
      contractExchangeRates,
      ticker,
    } = this.props;
    const values: Record<string, () => RenderValues> = {
      ETH: () => {
        const assetAmount = `${renderFromWei(value as string)} ${getTicker(
          ticker,
        )}`;
        const conversionRate = this.props.conversionRate;
        const fiatValue = weiToFiat(
          value as unknown as BN4,
          conversionRate as number,
          currentCurrency,
        );
        return [assetAmount, conversionRate, fiatValue];
      },
      ERC20: () => {
        const assetAmount = `${renderFromTokenMinimalUnit(
          value as string,
          selectedAsset?.decimals as number,
        )} ${selectedAsset?.symbol}`;
        const conversionRate = contractExchangeRates
          ? contractExchangeRates[selectedAsset?.address as Hex]?.price
          : undefined;
        const fiatValue = balanceToFiat(
          (value &&
            (fromTokenMinimalUnit(
              value,
              selectedAsset?.decimals as number,
            ) as unknown as string)) ||
            0,
          this.props.conversionRate as number,
          conversionRate,
          currentCurrency,
        );
        return [assetAmount, conversionRate, fiatValue];
      },
      ERC721: () => {
        const assetAmount = strings('unit.token_id') + selectedAsset?.tokenId;
        const conversionRate = true;
        const fiatValue = selectedAsset?.name;
        return [assetAmount, conversionRate, fiatValue];
      },
      default: () => [undefined, undefined, undefined],
    };
    return values[assetType as string] || values.default;
  };

  edit = () => {
    const { onModeChange, metrics } = this.props;
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_EDIT_TRANSACTION)
        .build(),
    );
    onModeChange && onModeChange('edit');
  };

  getStyles = () => {
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  toggleDataView = () => {
    const { animate } = this.props;
    const animateValues = animate as (params: {
      modalEndValue: number;
      xTranslationName: string;
      xTranslationEndValue: number;
    }) => void;
    if (this.state.dataVisible) {
      animateValues({
        modalEndValue: 1,
        xTranslationName: 'reviewToData',
        xTranslationEndValue: 0,
      });
      this.setState({ dataVisible: false });
      return;
    }
    animateValues({
      modalEndValue: 0,
      xTranslationName: 'reviewToData',
      xTranslationEndValue: 1,
    });
    this.setState({ dataVisible: true });
  };

  getUrlFromBrowser() {
    const { browser } = this.props;
    let url: string | undefined;
    browser.tabs.forEach((tab) => {
      if (tab.id === browser.activeTab) {
        url = tab.url;
      }
    });
    return url;
  }

  getConfirmButtonState() {
    const { securityAlertResponse } = this.props;
    let confirmButtonState = ConfirmButtonState.Normal;

    if (securityAlertResponse) {
      if (securityAlertResponse?.result_type === ResultType.Malicious) {
        confirmButtonState = ConfirmButtonState.Error;
      } else if (securityAlertResponse?.result_type === ResultType.Warning) {
        confirmButtonState = ConfirmButtonState.Warning;
      }
    }
    return confirmButtonState;
  }

  renderTransactionReview = () => {
    const {
      transactionConfirmed,
      primaryCurrency,
      ready,
      generateTransform,
      hideData,
      saveTransactionReviewDataHeight,
      customGasHeight,
      over,
      gasEstimateType,
      EIP1559GasData,
      onUpdatingValuesStart,
      onUpdatingValuesEnd,
      animateOnChange,
      isAnimating,
      dappSuggestedGas,
      navigation,
      dappSuggestedGasWarning,
      gasSelected,
      chainId,
      transaction,
      transaction: { to, origin, from, ensRecipient, id: transactionId },
      error,
      transactionMetadata,
      useTransactionSimulations,
      shouldUseSmartTransaction,
    } = this.props;

    const transactionSimulationData = transactionMetadata?.simulationData;

    const {
      actionKey,
      assetAmount,
      conversionRate,
      fiatValue,
      approveTransaction,
      multiLayerL1FeeTotal,
    } = this.state;
    const { origin: channelIdOrHostname } = transaction;
    DevLogger.log(
      `TransactionReview render channelIdOrHostname=${channelIdOrHostname}`,
    );

    const sdkConnections = SDKConnect.getInstance().getConnections();

    const currentConnection = sdkConnections[channelIdOrHostname ?? ''];

    let url: string | undefined = '';
    if (currentConnection) {
      url = currentConnection.originatorInfo?.url;
    } else {
      url = this.getUrlFromBrowser();
    }

    const styles = this.getStyles();

    const originatorInfo = currentConnection?.originatorInfo;
    const sdkDappMetadata = {
      url: originatorInfo?.url ?? strings('sdk.unknown'),
      icon: originatorInfo?.icon,
    };

    return (
      <>
        <Animated.View
          style={(
            generateTransform as (
              valueType: string,
              outRange: number[],
            ) => StyleProp<ViewStyle>
          )('reviewToData', [0, -Device.getDeviceWidth()])}
        >
          <View style={styles.actionViewWrapper}>
            <ActionView
              confirmButtonMode="confirm"
              cancelText={strings('transaction.reject')}
              onCancelPress={this.props.onCancel}
              onConfirmPress={this.props.onConfirm}
              confirmed={transactionConfirmed}
              confirmDisabled={
                transactionConfirmed || Boolean(error) || isAnimating
              }
              confirmButtonState={this.getConfirmButtonState.bind(this)()}
            >
              <View style={styles.actionViewChildren}>
                <ScrollView nestedScrollEnabled>
                  <View
                    style={styles.accountTransactionWrapper}
                    onStartShouldSetResponder={() => true}
                  >
                    <ApprovalTagUrl
                      currentEnsName={ensRecipient}
                      from={from as string}
                      origin={origin}
                      sdkDappMetadata={
                        sdkDappMetadata as React.ComponentProps<
                          typeof ApprovalTagUrl
                        >['sdkDappMetadata']
                      }
                      url={url as string}
                    />
                    <View style={styles.blockaidBannerContainer}>
                      <TransactionBlockaidBanner
                        transactionId={transactionId}
                        onContactUsClicked={this.onContactUsClicked}
                      />
                    </View>
                    {shouldUseSmartTransaction && (
                      <View style={styles.smartTransactionsMigrationBanner}>
                        <SmartTransactionsMigrationBanner />
                      </View>
                    )}
                    {to && (
                      <View
                        style={
                          (styles as unknown as { accountWrapper?: ViewStyle })
                            .accountWrapper
                        }
                      >
                        <AccountFromToInfoCardView
                          transactionState={
                            transaction as React.ComponentProps<
                              typeof AccountFromToInfoCard
                            >['transactionState']
                          }
                          layout="vertical"
                        />
                      </View>
                    )}
                    <TransactionReviewSummary
                      actionKey={actionKey}
                      assetAmount={assetAmount}
                      conversionRate={conversionRate}
                      fiatValue={fiatValue}
                      approveTransaction={approveTransaction}
                      primaryCurrency={primaryCurrency}
                      chainId={chainId}
                    />
                    {useTransactionSimulations &&
                      transactionSimulationData &&
                      transactionMetadata && (
                        <View style={styles.transactionSimulations}>
                          <SimulationDetails
                            transaction={transactionMetadata}
                            enableMetrics
                          />
                        </View>
                      )}
                    <View style={styles.accountInfoCardWrapper}>
                      <TransactionReviewInformation
                        navigation={
                          navigation as {
                            navigate: (...args: never[]) => void;
                          }
                        }
                        error={error}
                        edit={this.edit}
                        ready={ready}
                        assetAmount={assetAmount}
                        fiatValue={fiatValue}
                        toggleDataView={this.toggleDataView}
                        over={over}
                        onCancelPress={this.props.onCancel}
                        gasEstimateType={gasEstimateType}
                        EIP1559GasData={EIP1559GasData}
                        origin={dappSuggestedGas ? url : null}
                        gasSelected={gasSelected}
                        originWarning={dappSuggestedGasWarning}
                        onUpdatingValuesStart={onUpdatingValuesStart}
                        onUpdatingValuesEnd={onUpdatingValuesEnd}
                        animateOnChange={animateOnChange}
                        isAnimating={isAnimating}
                        multiLayerL1FeeTotal={multiLayerL1FeeTotal}
                      />
                    </View>
                  </View>
                </ScrollView>
              </View>
            </ActionView>
          </View>
        </Animated.View>
        <Animated.View
          style={[
            styles.transactionData,
            (
              generateTransform as (
                valueType: string,
                outRange: number[],
              ) => StyleProp<ViewStyle>
            )('reviewToData', [Device.getDeviceWidth(), 0]),
            hideData && styles.hidden,
          ]}
        >
          <TransactionReviewData
            actionKey={actionKey}
            toggleDataView={this.toggleDataView}
            saveTransactionReviewDataHeight={saveTransactionReviewDataHeight}
            customGasHeight={customGasHeight}
          />
        </Animated.View>
      </>
    );
  };

  renderQRDetails() {
    const currentPageInformation = { url: this.getUrlFromBrowser() };
    const {
      QRState,
      transaction: { from },
      onCancel,
      onConfirm,
    } = this.props;

    const styles = this.getStyles();
    return (
      <View style={styles.actionViewQRObject}>
        <TransactionHeader currentPageInformation={currentPageInformation} />
        <QRSigningDetails
          QRState={QRState as IQRState}
          tighten
          showCancelButton
          showHint={false}
          bypassAndroidCameraAccessCheck={false}
          fromAddress={from as string}
          cancelCallback={onCancel}
          successCallback={onConfirm}
        />
      </View>
    );
  }

  render() {
    const { isSigningQRObject } = this.props;
    return isSigningQRObject
      ? this.renderQRDetails()
      : this.renderTransactionReview();
  }
}

const mapStateToProps = (state: RootState) => {
  const transaction = getNormalizedTxState(state);
  const chainId = transaction?.chainId as Hex;
  const transactionMetadata = selectCurrentTransactionMetadata(state);
  const networkClientId = transactionMetadata?.networkClientId;

  return {
    tokens: selectTokens(state),
    conversionRate: selectConversionRateByChainId(state, chainId),
    currentCurrency: selectCurrentCurrency(state),
    contractExchangeRates: selectContractExchangeRatesByChainId(state, chainId),
    ticker: selectNativeCurrencyByChainId(state, chainId),
    chainId,
    showHexData: state.settings.showHexData,
    transaction,
    browser: state.browser,
    primaryCurrency: state.settings.primaryCurrency,
    tokenList: selectTokenList(state),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(state, chainId),
    useTransactionSimulations: selectUseTransactionSimulations(state),
    securityAlertResponse: selectCurrentTransactionSecurityAlertResponse(state),
    transactionMetadata,
    networkClientId,
  };
};

TransactionReview.contextType = ThemeContext;

export default connect(mapStateToProps)(
  withNavigation(
    withQRHardwareAwareness(
      withMetricsAwareness(
        TransactionReview as unknown as ComponentClass<IWithMetricsAwarenessProps>,
      ) as unknown as ComponentClass<{
        QRState?: IQRState;
        isSigningQRObject?: boolean;
        isSyncingQRHardware?: boolean;
      }>,
    ),
  ),
) as unknown as React.ComponentType<TransactionReviewOwnProps>;
