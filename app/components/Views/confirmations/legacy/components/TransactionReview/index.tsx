import Eth from '@metamask/ethjs-query';
import { withNavigation } from '@react-navigation/compat';
import React, { ComponentClass, ComponentType, PureComponent } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Theme } from '@metamask/design-tokens';
import { Hex } from '@metamask/utils';
import { connect } from 'react-redux';
import { strings } from '../../../../../../../locales/i18n';
import {
  IUseMetricsHook,
  withMetricsAwareness,
} from '../../../../../../components/hooks/useMetrics';
import { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
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
import { Colors } from '../../../../../../util/theme/models';
import { RootState } from '../../../../../../reducers';
import {
  decodeTransferData,
  getNormalizedTxState,
  getTicker,
  getTransactionReviewActionKey,
  isApprovalTransaction,
} from '../../../../../../util/transactions';
import AccountFromToInfoCardComponent from '../../../../../UI/AccountFromToInfoCard';
import ApprovalTagUrl from '../../../../../UI/ApprovalTagUrl';
import ActionView, { ConfirmButtonState } from '../../../../../UI/ActionView';
import QRSigningDetails from '../../../../../UI/QRHardware/QRSigningDetails';
import withQRHardwareAwareness from '../../../../../UI/QRHardware/withQRHardwareAwareness';
import { IQRState } from '../../../../../UI/QRHardware/types';
import SimulationDetails from '../../../../../UI/SimulationDetails/SimulationDetails';
import TransactionHeader from '../../../../../UI/TransactionHeader';
import { ResultType } from '../BlockaidBanner/BlockaidBanner.types';
import TransactionBlockaidBanner from '../TransactionBlockaidBanner/TransactionBlockaidBanner';
import TransactionReviewDataComponent from './TransactionReviewData';
import TransactionReviewInformation from './TransactionReviewInformation';
import TransactionReviewSummary from './TransactionReviewSummary';
import DevLogger from '../../../../../../core/SDKConnect/utils/DevLogger';
import { selectNativeCurrencyByChainId } from '../../../../../../selectors/networkController';
import { selectContractExchangeRatesByChainId } from '../../../../../../selectors/tokenRatesController';
import SmartTransactionsMigrationBanner from '../SmartTransactionsMigrationBanner/SmartTransactionsMigrationBanner';
const POLLING_INTERVAL_ESTIMATED_L1_FEE = 30000;

/**
 * Both components declare props this screen has never passed; the façades keep
 * the existing call sites unchanged.
 */
const AccountFromToInfoCard =
  AccountFromToInfoCardComponent as unknown as ComponentType<{
    transactionState: TransactionState;
    layout?: string;
  }>;

const TransactionReviewData =
  TransactionReviewDataComponent as unknown as ComponentType<{
    actionKey?: string;
    toggleDataView?: () => void;
    saveTransactionReviewDataHeight?: (height: number) => void;
    customGasHeight?: number;
  }>;

let intervalIdForEstimatedL1Fee: ReturnType<typeof setInterval>;

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

interface SelectedAsset {
  address: string;
  decimals: number;
  symbol: string;
  tokenId?: string;
  name?: string;
}

/**
 * Flattened transaction state, as returned by `getNormalizedTxState`
 */
interface TransactionState {
  transaction?: { data?: string; to?: string; value?: string };
  data?: string;
  to?: string;
  value?: string;
  from?: string;
  origin?: string;
  ensRecipient?: string;
  id?: string;
  chainId?: string;
  assetType?: string;
  selectedAsset: SelectedAsset;
}

interface TransactionReviewProps {
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
   * Indicates whether hex data should be shown in transaction editor
   */
  showHexData?: boolean;
  /**
   * Whether the transaction was confirmed or not
   */
  transactionConfirmed?: boolean;
  /**
   * Transaction object associated with this transaction
   */
  transaction: TransactionState;
  /**
   * Browser/tab information
   */
  browser: { tabs: { id: number; url: string }[]; activeTab: number };
  /**
   * ETH to current currency conversion rate
   */
  conversionRate?: number;
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency: ReturnType<typeof selectCurrentCurrency>;
  /**
   * Object containing token exchange rates in the format address => exchangeRate
   */
  contractExchangeRates: ReturnType<
    typeof selectContractExchangeRatesByChainId
  >;
  /**
   * Array of ERC20 assets
   */
  tokens: ReturnType<typeof selectTokens>;
  /**
   * Current provider ticker
   */
  ticker?: string;
  /**
   * Chain id
   */
  chainId?: string;
  /**
   * ETH or fiat, depending on user setting
   */
  primaryCurrency?: string;
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
  animate?: (config: {
    modalEndValue: number;
    xTranslationName: string;
    xTranslationEndValue: number;
  }) => void;
  /**
   * Generates a transform style unique to the component
   */
  generateTransform?: (valueType: string, outputRange: number[]) => ViewStyle;
  /**
   * Saves the height of TransactionReviewData
   */
  saveTransactionReviewDataHeight?: (height: number) => void;
  /**
   * Hides or shows TransactionReviewData
   */
  hideData?: boolean;
  /**
   * True if transaction is over the available funds
   */
  over?: boolean;
  gasEstimateType?: string;
  EIP1559GasData?: object;
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
   * List of tokens from TokenListController
   */
  tokenList: ReturnType<typeof selectTokenList>;
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
  gasSelected?: string;
  /**
   * Metrics injected by withMetricsAwareness HOC
   */
  metrics: IUseMetricsHook;
  /**
   * Boolean that indicates if smart transaction should be used
   */
  shouldUseSmartTransaction?: boolean;
  /**
   * Boolean that indicates if transaction simulations should be enabled
   */
  useTransactionSimulations?: boolean;
  /**
   * Object containing blockaid validation response for confirmation
   */
  securityAlertResponse: ReturnType<
    typeof selectCurrentTransactionSecurityAlertResponse
  >;
  /**
   * Object containing the current transaction metadata
   */
  transactionMetadata: ReturnType<typeof selectCurrentTransactionMetadata>;
  /**
   * Network client id
   */
  networkClientId?: string;
}

interface TransactionReviewComponentState {
  toFocused: boolean;
  actionKey?: string;
  showHexData: boolean | string;
  dataVisible: boolean;
  assetAmount?: string;
  conversionRate?: number;
  fiatValue?: string;
  approveTransaction?: boolean;
  multiLayerL1FeeTotal?: string;
}

/**
 * PureComponent that supports reviewing a transaction
 */
class TransactionReview extends PureComponent<
  TransactionReviewProps,
  TransactionReviewComponentState
> {
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
      } as Parameters<typeof fetchEstimatedMultiLayerL1Fee>[1]);
      this.setState({
        multiLayerL1FeeTotal: result,
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
    let showHexData: boolean | string | undefined = this.props.showHexData;
    let assetAmount: string | undefined,
      conversionRate: number | undefined,
      fiatValue: string | undefined;
    showHexData = showHexData || data;
    const approveTransaction =
      isApprovalTransaction(data as string) && (!value || isZeroValue(value));

    const actionKey = await getTransactionReviewActionKey(
      {
        ...transactionMetadata,
        transaction,
        txParams: undefined,
      },
      chainId as string,
    );

    if (approveTransaction) {
      let contract: { symbol?: string } | undefined =
        tokenList[safeToChecksumAddress(to as string) as string];
      if (!contract) {
        contract = tokens.find(
          ({ address }) => address === safeToChecksumAddress(to as string),
        );
      }
      const symbol = contract?.symbol || 'ERC20';
      assetAmount = `${
        decodeTransferData('transfer', data as string)[1]
      } ${symbol}`;
    } else {
      [assetAmount, conversionRate, fiatValue] = this.getRenderValues()() as [
        string | undefined,
        number | undefined,
        string | undefined,
      ];
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
    const values = {
      ETH: () => {
        const assetAmount = `${renderFromWei(value as string)} ${getTicker(
          ticker,
        )}`;
        const conversionRate = this.props.conversionRate;
        const fiatValue = weiToFiat(
          value as unknown as Parameters<typeof weiToFiat>[0],
          conversionRate as number,
          currentCurrency,
        );
        return [assetAmount, conversionRate, fiatValue];
      },
      ERC20: () => {
        const assetAmount = `${renderFromTokenMinimalUnit(
          value as string,
          selectedAsset.decimals,
        )} ${selectedAsset.symbol}`;
        const conversionRate = contractExchangeRates
          ? contractExchangeRates[selectedAsset.address as Hex]?.price
          : undefined;
        const fiatValue = balanceToFiat(
          (value && fromTokenMinimalUnit(value, selectedAsset.decimals)) || 0,
          this.props.conversionRate,
          conversionRate,
          currentCurrency,
        );
        return [assetAmount, conversionRate, fiatValue];
      },
      ERC721: () => {
        const assetAmount = strings('unit.token_id') + selectedAsset.tokenId;
        const conversionRate = true;
        const fiatValue = selectedAsset.name;
        return [assetAmount, conversionRate, fiatValue];
      },
      default: () => [undefined, undefined, undefined],
    };
    return values[assetType as keyof typeof values] || values.default;
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
      (this.context as unknown as Theme).colors || mockTheme.colors;
    return createStyles(colors);
  };

  toggleDataView = () => {
    const { animate } = this.props;
    if (this.state.dataVisible) {
      animate?.({
        modalEndValue: 1,
        xTranslationName: 'reviewToData',
        xTranslationEndValue: 0,
      });
      this.setState({ dataVisible: false });
      return;
    }
    animate?.({
      modalEndValue: 0,
      xTranslationName: 'reviewToData',
      xTranslationEndValue: 1,
    });
    this.setState({ dataVisible: true });
  };

  getUrlFromBrowser() {
    const { browser } = this.props;
    let url;
    browser.tabs.forEach((tab: { id: number; url: string }) => {
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
      url = (currentConnection.originatorInfo as { url: string }).url;
    } else {
      url = this.getUrlFromBrowser();
    }

    const styles = this.getStyles();

    const originatorInfo = currentConnection?.originatorInfo;
    const sdkDappMetadata = {
      url: originatorInfo?.url ?? strings('sdk.unknown'),
      icon: originatorInfo?.icon as string,
    };

    return (
      <>
        <Animated.View
          style={generateTransform?.('reviewToData', [
            0,
            -Device.getDeviceWidth(),
          ])}
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
                      sdkDappMetadata={sdkDappMetadata}
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
                      // `accountWrapper` is not part of the style sheet
                      <View
                        style={
                          (styles as { accountWrapper?: ViewStyle })
                            .accountWrapper
                        }
                      >
                        <AccountFromToInfoCard
                          transactionState={transaction}
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
                        navigation={navigation}
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
            generateTransform?.('reviewToData', [Device.getDeviceWidth(), 0]),
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
  const chainId = transaction?.chainId;
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

// Each HOC only knows about the props it injects itself
const TransactionReviewWithMetrics = withMetricsAwareness(
  TransactionReview as unknown as ComponentType<IWithMetricsAwarenessProps>,
) as unknown as ComponentClass<{
  QRState?: IQRState;
  isSigningQRObject?: boolean;
  isSyncingQRHardware?: boolean;
}>;

export default connect(mapStateToProps)(
  withNavigation(withQRHardwareAwareness(TransactionReviewWithMetrics)),
);
