/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React, { PureComponent } from 'react';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { StyleSheet, AppState, Alert, InteractionManager } from 'react-native';
import Engine from '../../../../../core/Engine';
import TransactionEditor from './components/TransactionEditor';
import Modal from 'react-native-modal';
import { safeBNToHex } from '../../../../../util/number';
import { getTransactionOptionsTitle } from '../../../../UI/Navbar';
import { resetTransaction } from '../../../../../actions/transaction';
import { connect } from 'react-redux';
import NotificationManager from '../../../../../core/NotificationManager';
import AppConstants from '../../../../../core/AppConstants';
import { MetaMetricsEvents } from '../../../../../core/Analytics';
import {
  getTransactionReviewActionKey,
  getNormalizedTxState,
  getActiveTabUrl,
} from '../../../../../util/transactions';
import { strings } from '../../../../../../locales/i18n';
import {
  getAddressAccountType,
  isQRHardwareAccount,
  isHardwareAccount,
} from '../../../../../util/address';
import { WALLET_CONNECT_ORIGIN } from '../../../../../util/walletconnect';
import Logger from '../../../../../util/Logger';
import { KEYSTONE_TX_CANCELED } from '../../../../../constants/error';
import { ThemeContext, mockTheme } from '../../../../../util/theme';
import { createLedgerTransactionModalNavDetails } from '../../../../UI/LedgerModals/LedgerTransactionModal';
import {
  TX_CANCELLED,
  TX_CONFIRMED,
  TX_FAILED,
  TX_SUBMITTED,
  TX_REJECTED,
} from '../../../../../constants/transaction';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../../selectors/accountsController';
import { providerErrors } from '@metamask/rpc-errors';
import { getDeviceId } from '../../../../../core/Ledger/Ledger';
import { selectShouldUseSmartTransaction } from '../../../../../selectors/smartTransactionsController';
import ExtendedKeyringTypes from '../../../../../constants/keyringTypes';
import { getBlockaidMetricsParams } from '../../../../../util/blockaid';
import { getDecimalChainId } from '../../../../../util/networks';
import Routes from '../../../../../constants/navigation/Routes';

import { updateTransaction } from '../../../../../util/transaction-controller';
import { withMetricsAwareness } from '../../../../../components/hooks/useMetrics';
import { STX_NO_HASH_ERROR } from '../../../../../util/smart-transactions/smart-publish-hook';
import { getSmartTransactionMetricsProperties } from '../../../../../util/smart-transactions';
import { selectConfirmationMetrics } from '../../../../../core/redux/slices/confirmationMetrics';
import {
  selectCurrentTransactionSecurityAlertResponse,
  selectCurrentTransactionMetadata,
} from '../../../../../selectors/confirmTransaction';
import { selectTransactions } from '../../../../../selectors/transactionController';
import { selectShowCustomNonce } from '../../../../../selectors/settings';
import { buildTransactionParams } from '../../../../../util/confirmation/transactions';
import DevLogger from '../../../../../core/SDKConnect/utils/DevLogger';
import SDKConnect from '../../../../../core/SDKConnect/SDKConnect';
import WC2Manager from '../../../../../core/WalletConnect/WalletConnectV2';
import { selectProviderTypeByChainId } from '../../../../../selectors/networkController';

const REVIEW = 'review';
const EDIT = 'edit';
const APPROVAL = 'Approval';

const styles = StyleSheet.create({
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
});

/**
 * PureComponent that manages transaction approval from the dapp browser
 */
class Approval extends PureComponent {
  // @ts-expect-error -- legacy JavaScript UI type boundary
  appStateListener;

  // @ts-expect-error -- legacy JavaScript UI type boundary
  #transactionFinishedListener;

  state = {
    mode: REVIEW,
    transactionHandled: false,
    transactionConfirmed: false,
    isChangeInSimulationModalOpen: false,
  };

  originIsWalletConnect = false;
  originIsMMSDKRemoteConn = false;

  updateNavBar = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { navigation } = this.props;
    navigation.setOptions(
      getTransactionOptionsTitle('approval.title', navigation, {}, colors),
    );
  };

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  componentWillUnmount = () => {
    try {
      const { transactionHandled } = this.state;
      // @ts-expect-error -- legacy JavaScript UI type boundary
      const { transaction, selectedAddress } = this.props;
      const { KeyringController } = Engine.context;

      if (!transactionHandled) {
        if (isQRHardwareAccount(selectedAddress)) {
          KeyringController.cancelQRSignRequest();
        } else {
          Engine.rejectPendingApproval(
            transaction?.id,
            providerErrors.userRejectedRequest(),
            {
              ignoreMissing: true,
              logErrors: false,
            },
          );
        }

        Engine.controllerMessenger.tryUnsubscribe(
          'TransactionController:transactionFinished',
          this.#transactionFinishedListener,
        );

        this.appStateListener?.remove();
      }

      this.clear();
    } catch (e) {
      if (e) {
        throw e;
      }
    }
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  isTxStatusCancellable = (transaction) => {
    if (
      transaction?.status === TX_SUBMITTED ||
      transaction?.status === TX_REJECTED ||
      transaction?.status === TX_CONFIRMED ||
      transaction?.status === TX_CANCELLED ||
      transaction?.status === TX_FAILED
    ) {
      return false;
    }
    return true;
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  handleAppStateChange = (appState) => {
    try {
      if (appState !== 'active') {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        const { transaction, transactions } = this.props;
        const currentTransaction = transactions.find(
          // @ts-expect-error -- legacy JavaScript UI type boundary
          (tx) => tx.id === transaction.id,
        );

        if (transaction?.id && this.isTxStatusCancellable(currentTransaction)) {
          Engine.rejectPendingApproval(
            transaction.id,
            providerErrors.userRejectedRequest(),
            {
              ignoreMissing: true,
              logErrors: false,
            },
          );
        }
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.hideModal();
      }
    } catch (e) {
      if (e) {
        throw e;
      }
    }
  };

  componentDidMount = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { navigation } = this.props;
    this.updateNavBar();
    this.appStateListener = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
    navigation &&
      navigation.setParams({ mode: REVIEW, dispatch: this.onModeChange });
    this.initialise();
  };

  initialise = async () => {
    // Detect origin: WalletConnect / SDK / InAppBrowser
    await this.detectOrigin(); // Ensure detectOrigin finishes before proceeding

    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.metrics.trackEvent(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.DAPP_TRANSACTION_STARTED)
        .addProperties(this.getAnalyticsParams())
        .build(),
    );
  };

  detectOrigin = async () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { transaction } = this.props;
    const { origin } = transaction;

    const connection = SDKConnect.getInstance().getConnection({
      channelId: origin,
    });
    if (connection) {
      this.originIsMMSDKRemoteConn = true;
    } else {
      // Check if origin is WalletConnect
      const wc2Manager = await WC2Manager.getInstance();
      const sessions = wc2Manager.getSessions();
      this.originIsWalletConnect = sessions.some((session) => {
        // Otherwise, compare the origin with the metadata URL
        if (
          session.peer.metadata.url === origin ||
          origin.startsWith(WALLET_CONNECT_ORIGIN)
        ) {
          DevLogger.log(
            `Approval::detectOrigin Comparing session URL ${session.peer.metadata.url} with origin ${origin}`,
          );
          return true;
        }
        return false;
      });
    }
    DevLogger.log(
      `Approval::detectOrigin originIsWalletConnect=${this.originIsWalletConnect} originIsMMSDKRemoteConn=${this.originIsMMSDKRemoteConn}`,
    );
  };

  /**
   * Call Analytics to track confirm started event for approval screen
   */
  trackConfirmScreen = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.metrics.trackEvent(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CONFIRM_STARTED)
        .addProperties(this.getTrackingParams())
        .build(),
    );
  };

  /**
   * Call Analytics to track confirm started event for approval screen
   */
  trackEditScreen = async () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { transaction, metrics } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const actionKey = await getTransactionReviewActionKey({ transaction });
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_EDIT_TRANSACTION)
        .addProperties({
          ...this.getTrackingParams(),
          actionKey,
        })
        .build(),
    );
  };

  /**
   * Call Analytics to track cancel pressed
   */
  trackOnCancel = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.metrics.trackEvent(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CANCEL_TRANSACTION)
        .addProperties(this.getTrackingParams())
        .build(),
    );
  };

  /**
   * Returns corresponding tracking params to send
   *
   * @return {object} - Object containing view, network, activeCurrency and assetType
   */
  getTrackingParams = () => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      networkType,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transaction: { selectedAsset, assetType },
      // @ts-expect-error -- legacy JavaScript UI type boundary
      shouldUseSmartTransaction,
    } = this.props;
    return {
      view: APPROVAL,
      network: networkType,
      activeCurrency: selectedAsset.symbol || selectedAsset.contractName,
      assetType,
      is_smart_transaction: shouldUseSmartTransaction,
    };
  };

  getBlockaidMetricsParams = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { securityAlertResponse } = this.props;
    return securityAlertResponse
      ? getBlockaidMetricsParams(securityAlertResponse)
      : {};
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  getAnalyticsParams = ({ gasEstimateType, gasSelected } = {}) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { chainId, transaction, selectedAddress, shouldUseSmartTransaction } =
      this.props;

    const baseParams = {
      dapp_host_name: transaction?.origin || 'N/A',
      asset_type: { value: transaction?.assetType, anonymous: true },
      request_source: this.originIsMMSDKRemoteConn
        ? AppConstants.REQUEST_SOURCES.SDK_REMOTE_CONN
        : this.originIsWalletConnect
        ? AppConstants.REQUEST_SOURCES.WC
        : AppConstants.REQUEST_SOURCES.IN_APP_BROWSER,
    };

    try {
      const { selectedAsset } = transaction;
      const { TransactionController, SmartTransactionsController } =
        Engine.context;

      const transactionMeta = TransactionController.getTransactions({
        // @ts-expect-error -- legacy JavaScript UI type boundary
        chainId,
        searchCriteria: { id: transaction.id },
      })?.[0];

      const smartTransactionMetricsProperties =
        // @ts-expect-error -- legacy JavaScript UI type boundary
        getSmartTransactionMetricsProperties(
          SmartTransactionsController,
          transactionMeta,
        );

      return {
        ...baseParams,
        account_type: getAddressAccountType(selectedAddress),
        chain_id: getDecimalChainId(chainId),
        active_currency: { value: selectedAsset?.symbol, anonymous: true },
        gas_estimate_type: gasEstimateType,
        gas_mode: gasSelected ? 'Basic' : 'Advanced',
        speed_set: gasSelected || undefined,
        is_smart_transaction: shouldUseSmartTransaction,
        ...smartTransactionMetricsProperties,
      };
    } catch (error) {
      Logger.error(
        // @ts-expect-error -- legacy JavaScript UI type boundary
        error,
        'Error while getting analytics params for approval screen',
      );
      return baseParams;
    }
  };

  /**
   * Transaction state is erased, ready to create a new clean transaction
   */
  clear = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.resetTransaction();
  };

  showWalletConnectNotification = (confirmation = false) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { transaction } = this.props;
    InteractionManager.runAfterInteractions(() => {
      transaction.origin &&
        transaction.origin.startsWith(WALLET_CONNECT_ORIGIN) &&
        NotificationManager.showSimpleNotification({
          status: `simple_notification${!confirmation ? '_rejected' : ''}`,
          duration: 5000,
          title: confirmation
            ? strings('notifications.wc_sent_tx_title')
            : strings('notifications.wc_sent_tx_rejected_title'),
          description: strings('notifications.wc_description'),
        });
    });
  };

  onCancel = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.hideModal();
    this.state.mode === REVIEW && this.trackOnCancel();
    this.showWalletConnectNotification();
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.metrics.trackEvent(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.DAPP_TRANSACTION_CANCELLED)
        .addProperties({
          ...this.getAnalyticsParams(),
          ...this.getBlockaidMetricsParams(),
          ...this.getTransactionMetrics(),
        })
        .build(),
    );
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onLedgerConfirmation = (approve, transactionId, gaParams) => {
    try {
      //manual cancel from UI when transaction is awaiting from ledger confirmation
      if (!approve) {
        //cancelTransaction will change transaction status to reject and throw error from event listener
        //component is being unmounted, error will be unhandled, hence remove listener before cancel
        Engine.controllerMessenger.tryUnsubscribe(
          'TransactionController:transactionFinished',
          this.#transactionFinishedListener,
        );

        this.showWalletConnectNotification();

        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.metrics.trackEvent(
          // @ts-expect-error -- legacy JavaScript UI type boundary
          this.props.metrics
            .createEventBuilder(MetaMetricsEvents.DAPP_TRANSACTION_CANCELLED)
            .addProperties(gaParams)
            .build(),
        );
      } else {
        this.showWalletConnectNotification(true);
      }
    } finally {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.metrics.trackEvent(
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.metrics
          .createEventBuilder(MetaMetricsEvents.DAPP_TRANSACTION_COMPLETED)
          .addProperties(gaParams)
          .build(),
      );
    }
  };

  /**
   * Callback on confirm transaction
   */
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onConfirm = async ({ gasEstimateType, EIP1559GasData, gasSelected }) => {
    const { KeyringController, ApprovalController } = Engine.context;
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transactions,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      shouldUseSmartTransaction,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      simulationData: { isUpdatedAfterSecurityCheck } = {},
      // @ts-expect-error -- legacy JavaScript UI type boundary
      navigation,
    } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    let { transaction } = this.props;
    const { transactionConfirmed } = this.state;
    if (transactionConfirmed) return;

    const isLedgerAccount = isHardwareAccount(transaction.from, [
      ExtendedKeyringTypes.ledger,
    ]);

    if (isUpdatedAfterSecurityCheck) {
      this.setState({ isChangeInSimulationModalOpen: true });

      navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
        screen: Routes.SHEET.CHANGE_IN_SIMULATION_MODAL,
        params: {
          onProceed: () => {
            this.setState({ isChangeInSimulationModalOpen: false });
            this.setState({ transactionConfirmed: false });
          },
          onReject: () => {
            this.setState({ isChangeInSimulationModalOpen: false });
            this.onCancel();
          },
        },
      });
      return;
    }

    this.setState({ transactionConfirmed: true });

    try {
      transaction = this.prepareTransaction({
        gasEstimateType,
        EIP1559GasData,
      });

      // For STX, don't wait for TxController to get finished event, since it will take some time to get hash for STX
      if (shouldUseSmartTransaction) {
        this.setState({ transactionHandled: true });
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.hideModal();
      }

      this.#transactionFinishedListener =
        Engine.controllerMessenger.subscribeOnceIf(
          'TransactionController:transactionFinished',
          (transactionMeta) => {
            if (transactionMeta.status === 'submitted') {
              if (!isLedgerAccount) {
                this.setState({ transactionHandled: true });
                // @ts-expect-error -- legacy JavaScript UI type boundary
                this.props.hideModal();
              }
              NotificationManager.watchSubmittedTransaction({
                ...transactionMeta,
                assetType: transaction.assetType,
              });
            } else {
              Logger.error(
                // @ts-expect-error -- legacy JavaScript UI type boundary
                transactionMeta.error,
                'error while trying to finish a transaction (Approval)',
              );
            }
          },
          (transactionMeta) => transactionMeta.id === transaction.id,
        );
      await KeyringController.resetQRKeyringState();

      // @ts-expect-error -- legacy JavaScript UI type boundary
      const fullTx = transactions.find(({ id }) => id === transaction.id);

      if (fullTx.txParams.type !== TransactionEnvelopeType.legacy) {
        // For EIP-1559 transactions, we need to remove gasPrice as it's not compatible
        delete transaction.gasPrice;
      }

      const updatedTx = {
        ...fullTx,
        txParams: {
          ...transaction,
        },
      };

      // @ts-expect-error -- legacy JavaScript UI type boundary
      await updateTransaction(updatedTx);

      // For Ledger Accounts we handover the signing to the confirmation flow
      if (isLedgerAccount) {
        const deviceId = await getDeviceId();
        this.setState({ transactionHandled: true });
        this.setState({ transactionConfirmed: false });

        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.navigation.navigate(
          ...createLedgerTransactionModalNavDetails({
            transactionId: transaction.id,
            deviceId,
            onConfirmationComplete: (approve) =>
              this.onLedgerConfirmation(approve, transaction.id, {
                ...this.getAnalyticsParams({ gasEstimateType, gasSelected }),
                ...this.getTransactionMetrics(),
              }),
            // @ts-expect-error -- legacy JavaScript UI type boundary
            type: 'signTransaction',
          }),
        );
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.hideModal();
        return;
      }

      await ApprovalController.accept(transaction.id, undefined, {
        waitForResult: true,
      });

      this.showWalletConnectNotification(true);
    } catch (error) {
      if (
        // @ts-expect-error -- legacy JavaScript UI type boundary
        !error?.message.startsWith(KEYSTONE_TX_CANCELED) &&
        // @ts-expect-error -- legacy JavaScript UI type boundary
        !error?.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          // @ts-expect-error -- legacy JavaScript UI type boundary
          error && error.message,
          [{ text: strings('navigation.ok') }],
        );
        Logger.error(
          // @ts-expect-error -- legacy JavaScript UI type boundary
          error,
          'error while trying to send transaction (Approval)',
        );
        this.setState({ transactionHandled: true });
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.hideModal();
      } else {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.metrics.trackEvent(
          // @ts-expect-error -- legacy JavaScript UI type boundary
          this.props.metrics
            .createEventBuilder(
              MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
            )
            .build(),
        );
      }
      this.setState({ transactionHandled: false });
    }

    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.metrics.trackEvent(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.DAPP_TRANSACTION_COMPLETED)
        .addProperties({
          ...this.getAnalyticsParams({
            gasEstimateType,
            gasSelected,
          }),
          ...this.getBlockaidMetricsParams(),
          ...this.getTransactionMetrics(),
        })
        .build(),
    );
    this.setState({ transactionConfirmed: false });
  };

  /**
   * Handle approval mode change
   * If changed to 'review' sends an Analytics track event
   *
   * @param mode - Transaction mode, review or edit
   */
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onModeChange = (mode) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { navigation } = this.props;
    navigation && navigation.setParams({ mode });
    this.setState({ mode });
    InteractionManager.runAfterInteractions(() => {
      mode === REVIEW && this.trackConfirmScreen();
      mode === EDIT && this.trackEditScreen();
    });
  };

  /**
   * Returns transaction object with gas and gasPrice in hex format, value set to 0 in hex format
   * and to set to selectedAsset address
   *
   * @param {object} transaction - Transaction object
   * @param {object} selectedAsset - Asset object
   */
  // @ts-expect-error -- legacy JavaScript UI type boundary
  prepareTransaction = ({ EIP1559GasData, gasEstimateType }) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { transaction: rawTransaction, showCustomNonce } = this.props;
    const { assetType, gas, gasPrice, selectedAsset } = rawTransaction;

    const transaction = {
      ...rawTransaction,
    };

    if (assetType !== 'ETH') {
      transaction.to = selectedAsset.address;
      transaction.value = '0x0';
    }

    const gasDataLegacy = {
      suggestedGasLimitHex: safeBNToHex(gas),
      suggestedGasPriceHex: safeBNToHex(gasPrice),
    };

    return buildTransactionParams({
      gasDataEIP1559: EIP1559GasData,
      gasDataLegacy,
      gasEstimateType,
      showCustomNonce,
      transaction,
    });
  };

  getTransactionMetrics = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { confirmationMetricsById, transaction } = this.props;
    const { id: transactionId } = transaction;

    // Skip sensitiveProperties for now as it's not supported by mobile Metametrics client
    return confirmationMetricsById[transactionId]?.properties || {};
  };

  render = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { dappTransactionModalVisible } = this.props;
    const { mode, transactionConfirmed, isChangeInSimulationModalOpen } =
      this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;

    return (
      <Modal
        isVisible={
          dappTransactionModalVisible && !isChangeInSimulationModalOpen
        }
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.bottomModal}
        backdropColor={colors.overlay.default}
        backdropOpacity={1}
        animationInTiming={600}
        animationOutTiming={600}
        onBackdropPress={this.onCancel}
        onBackButtonPress={this.onCancel}
        onSwipeComplete={this.onCancel}
        swipeDirection={'down'}
        propagateSwipe
      >
        <TransactionEditor
          // @ts-expect-error -- legacy JavaScript UI type boundary
          promptedFromApproval
          mode={mode}
          onCancel={this.onCancel}
          onConfirm={this.onConfirm}
          onModeChange={this.onModeChange}
          dappTransactionModalVisible={dappTransactionModalVisible}
          transactionConfirmed={transactionConfirmed}
        />
      </Modal>
    );
  };
}

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapStateToProps = (state) => {
  const transaction = getNormalizedTxState(state);
  const chainId = transaction?.chainId;

  return {
    transaction,
    transactions: selectTransactions(state),
    simulationData: selectCurrentTransactionMetadata(state)?.simulationData,
    selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
    networkType: selectProviderTypeByChainId(state, chainId),
    showCustomNonce: selectShowCustomNonce(state),
    chainId,
    activeTabUrl: getActiveTabUrl(state),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(state, chainId),
    confirmationMetricsById: selectConfirmationMetrics(state),
    securityAlertResponse: selectCurrentTransactionSecurityAlertResponse(state),
  };
};

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapDispatchToProps = (dispatch) => ({
  resetTransaction: () => dispatch(resetTransaction()),
});

Approval.contextType = ThemeContext;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
// @ts-expect-error -- legacy JavaScript UI type boundary
)(withMetricsAwareness(Approval));

interface ApprovalProps {
  chainId?: string;
  confirmationMetricsById?: Record<string, any>;
  dappTransactionModalVisible?: boolean;
  hideModal?: (...args: any[]) => any;
  metrics?: Record<string, any>;
  navigation: Record<string, any>;
  networkType?: string;
  resetTransaction: (...args: any[]) => any;
  securityAlertResponse?: Record<string, any>;
  selectedAddress?: string;
  shouldUseSmartTransaction?: boolean;
  showCustomNonce?: boolean;
  simulationData?: Record<string, any>;
  transaction: Record<string, any>;
  transactions?: any[];
}
