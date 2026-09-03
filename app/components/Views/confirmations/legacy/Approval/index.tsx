import React, { PureComponent, type ComponentType } from 'react';
import {
  TransactionEnvelopeType,
  type TransactionMeta,
  type SimulationData,
} from '@metamask/transaction-controller';
import {
  StyleSheet,
  AppState,
  Alert,
  InteractionManager,
  type AppStateStatus,
  type NativeEventSubscription,
} from 'react-native';
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
import type { GasEstimateType } from '@metamask/gas-fee-controller';
import DevLogger from '../../../../../core/SDKConnect/utils/DevLogger';
import SDKConnect from '../../../../../core/SDKConnect/SDKConnect';
import WC2Manager from '../../../../../core/WalletConnect/WalletConnectV2';
import { selectProviderTypeByChainId } from '../../../../../selectors/networkController';
import type { RootState } from '../../../../../reducers';
import type { Dispatch } from 'redux';
import {
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';
import type { Theme } from '../../../../../util/theme/models';
import type { IWithMetricsAwarenessProps } from '../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import type { JsonMap } from '../../../../../core/Analytics/MetaMetrics.types';
import type { Hex } from '@metamask/utils';
import type BN from 'bnjs4';

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
interface LegacyTransaction {
  id?: string;
  chainId?: string;
  from?: string;
  to?: string;
  value?: string | number;
  gas?: string | BN;
  gasPrice?: string | BN;
  data?: string;
  nonce?: string | number;
  origin?: string;
  assetType?: string;
  selectedAsset?: {
    address?: string;
    symbol?: string;
    contractName?: string;
    tokenId?: string | number;
  };
  txParams?: {
    from?: string;
    to?: string;
    value?: string | number;
    gas?: string | number;
    gasPrice?: string | number;
    data?: string;
    nonce?: string | number;
  };
}

interface State {
  mode: string;
  transactionHandled: boolean;
  transactionConfirmed: boolean;
  isChangeInSimulationModalOpen: boolean;
}

interface OwnProps {
  navigation: NavigationProp<ParamListBase>;
  hideModal: () => void;
}

interface StateProps {
  activeTabUrl?: string;
  selectedAddress?: string;
  transaction: LegacyTransaction;
  transactions: TransactionMeta[];
  networkType?: string;
  dappTransactionModalVisible?: boolean;
  showCustomNonce?: boolean;
  chainId?: string;
  shouldUseSmartTransaction?: boolean;
  confirmationMetricsById?: Record<string, { properties?: Record<string, unknown> }>;
  securityAlertResponse?: Record<string, unknown>;
  simulationData?: SimulationData;
}

interface DispatchProps {
  resetTransaction: () => void;
}

type Props = OwnProps & StateProps & DispatchProps & IWithMetricsAwarenessProps;

interface TransactionEditorProps {
  promptedFromApproval: boolean;
  mode: string;
  onCancel: () => void;
  onConfirm: (params: GasParams) => void;
  onModeChange: (mode: string) => void;
  dappTransactionModalVisible?: boolean;
  transactionConfirmed: boolean;
}

const TypedTransactionEditor = TransactionEditor as unknown as ComponentType<
  TransactionEditorProps
>;

interface GasParams {
  gasEstimateType?: string;
  EIP1559GasData?: Record<string, unknown>;
  gasSelected?: string | null;
}

class Approval extends PureComponent<Props, State> {
  appStateListener?: NativeEventSubscription;

  #transactionFinishedListener?: (transactionMeta: TransactionMeta) => void;

  static contextType = ThemeContext;

  state: State = {
    mode: REVIEW,
    transactionHandled: false,
    transactionConfirmed: false,
    isChangeInSimulationModalOpen: false,
  };

  originIsWalletConnect = false;
  originIsMMSDKRemoteConn = false;

  updateNavBar = () => {
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
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
      const { transaction, selectedAddress } = this.props;
      const { KeyringController } = Engine.context;

      if (!transactionHandled) {
        if (isQRHardwareAccount(selectedAddress ?? '')) {
          KeyringController.cancelQRSignRequest();
        } else {
          Engine.rejectPendingApproval(
            transaction?.id as string,
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

  isTxStatusCancellable = (transaction?: TransactionMeta) => {
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

  handleAppStateChange = (appState: AppStateStatus) => {
    try {
      if (appState !== 'active') {
        const { transaction, transactions } = this.props;
        const currentTransaction = transactions.find(
          (tx: TransactionMeta) => tx.id === transaction.id,
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
        this.props.hideModal();
      }
    } catch (e) {
      if (e) {
        throw e;
      }
    }
  };

  componentDidMount = () => {
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

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.DAPP_TRANSACTION_STARTED)
        .addProperties(
          this.getAnalyticsParams() as unknown as JsonMap,
        )
        .build(),
    );
  };

  detectOrigin = async () => {
    const { transaction } = this.props;
    const { origin } = transaction;

    const connection = SDKConnect.getInstance().getConnection({
      channelId: origin ?? '',
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
          origin?.startsWith(WALLET_CONNECT_ORIGIN)
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
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CONFIRM_STARTED)
        .addProperties(this.getTrackingParams() as unknown as JsonMap)
        .build(),
    );
  };

  /**
   * Call Analytics to track confirm started event for approval screen
   */
  trackEditScreen = async () => {
    const { transaction, metrics } = this.props;
      const actionKey = await getTransactionReviewActionKey(
        {
          transaction:
            transaction as unknown as Parameters<
              typeof getTransactionReviewActionKey
            >[0]['transaction'],
        },
        undefined as unknown as string,
      );
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_EDIT_TRANSACTION)
        .addProperties({
          ...this.getTrackingParams(),
          actionKey,
        } as unknown as JsonMap)
        .build(),
    );
  };

  /**
   * Call Analytics to track cancel pressed
   */
  trackOnCancel = () => {
    this.props.metrics.trackEvent(
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
      networkType,
      transaction: { selectedAsset, assetType },
      shouldUseSmartTransaction,
    } = this.props;
    return {
      view: APPROVAL,
      network: networkType,
      activeCurrency: selectedAsset?.symbol || selectedAsset?.contractName,
      assetType,
      is_smart_transaction: shouldUseSmartTransaction,
    };
  };

  getBlockaidMetricsParams = () => {
    const { securityAlertResponse } = this.props;
    return securityAlertResponse
      ? getBlockaidMetricsParams(
          securityAlertResponse as unknown as Parameters<
            typeof getBlockaidMetricsParams
          >[0],
        )
      : {};
  };

  getAnalyticsParams = ({
    gasEstimateType,
    gasSelected,
  }: GasParams = {}) => {
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

      const transactionMeta = TransactionController.getTransactions(
        {
          chainId,
          searchCriteria: { id: transaction.id },
        } as Parameters<typeof TransactionController.getTransactions>[0],
      )?.[0];

      const smartTransactionMetricsProperties =
        getSmartTransactionMetricsProperties(
          SmartTransactionsController,
          transactionMeta,
          shouldUseSmartTransaction ?? false,
        );

      return {
        ...baseParams,
        account_type: getAddressAccountType(selectedAddress ?? ''),
        chain_id: getDecimalChainId(chainId ?? ''),
        active_currency: { value: selectedAsset?.symbol, anonymous: true },
        gas_estimate_type: gasEstimateType,
        gas_mode: gasSelected ? 'Basic' : 'Advanced',
        speed_set: gasSelected || undefined,
        is_smart_transaction: shouldUseSmartTransaction,
        ...smartTransactionMetricsProperties,
      };
    } catch (error) {
      Logger.error(
        error as Error,
        'Error while getting analytics params for approval screen',
      );
      return baseParams;
    }
  };

  /**
   * Transaction state is erased, ready to create a new clean transaction
   */
  clear = () => {
    this.props.resetTransaction();
  };

  showWalletConnectNotification = (confirmation = false): void => {
    const { transaction } = this.props;
    InteractionManager.runAfterInteractions(() => {
      transaction.origin?.startsWith(WALLET_CONNECT_ORIGIN) &&
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
    this.props.hideModal();
    this.state.mode === REVIEW && this.trackOnCancel();
    this.showWalletConnectNotification();
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.DAPP_TRANSACTION_CANCELLED)
        .addProperties({
          ...this.getAnalyticsParams(),
          ...this.getBlockaidMetricsParams(),
          ...this.getTransactionMetrics(),
        } as unknown as JsonMap)
        .build(),
    );
  };

  onLedgerConfirmation = (
    approve: boolean,
    _transactionId: string,
    gaParams: Record<string, unknown>,
  ) => {
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

        this.props.metrics.trackEvent(
          this.props.metrics
            .createEventBuilder(MetaMetricsEvents.DAPP_TRANSACTION_CANCELLED)
        .addProperties(gaParams as unknown as JsonMap)
            .build(),
        );
      } else {
        this.showWalletConnectNotification(true);
      }
    } finally {
      this.props.metrics.trackEvent(
        this.props.metrics
          .createEventBuilder(MetaMetricsEvents.DAPP_TRANSACTION_COMPLETED)
            .addProperties(gaParams as unknown as JsonMap)
          .build(),
      );
    }
  };

  /**
   * Callback on confirm transaction
   */
  onConfirm = async ({
    gasEstimateType,
    EIP1559GasData,
    gasSelected,
  }: GasParams) => {
    const { KeyringController, ApprovalController } = Engine.context;
    const {
      transactions,
      shouldUseSmartTransaction,
      simulationData: { isUpdatedAfterSecurityCheck } = {},
      navigation,
    } = this.props;
    let { transaction } = this.props;
    const { transactionConfirmed } = this.state;
    if (transactionConfirmed) return;

    const isLedgerAccount = isHardwareAccount(transaction.from as string, [
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
        this.props.hideModal();
      }

      this.#transactionFinishedListener =
        Engine.controllerMessenger.subscribeOnceIf(
          'TransactionController:transactionFinished',
          (transactionMeta) => {
            if (transactionMeta.status === 'submitted') {
              if (!isLedgerAccount) {
                this.setState({ transactionHandled: true });
                this.props.hideModal();
              }
              NotificationManager.watchSubmittedTransaction({
                ...transactionMeta,
                assetType: transaction.assetType,
              });
            } else {
              Logger.error(
                transactionMeta.error as Error,
                'error while trying to finish a transaction (Approval)',
              );
            }
          },
          (transactionMeta) => transactionMeta.id === transaction.id,
        );
      await KeyringController.resetQRKeyringState();

      const fullTx = transactions.find(
        ({ id }) => id === transaction.id,
      ) as TransactionMeta;

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

      await updateTransaction(
        updatedTx as unknown as TransactionMeta,
        undefined as unknown as string,
      );

      // For Ledger Accounts we handover the signing to the confirmation flow
      if (isLedgerAccount) {
        const deviceId = await getDeviceId();
        this.setState({ transactionHandled: true });
        this.setState({ transactionConfirmed: false });

        this.props.navigation.navigate(
          ...createLedgerTransactionModalNavDetails({
            transactionId: transaction.id as string,
            deviceId,
            onConfirmationComplete: (approve: boolean) =>
              this.onLedgerConfirmation(approve, transaction.id as string, {
                ...this.getAnalyticsParams({ gasEstimateType, gasSelected }),
                ...this.getTransactionMetrics(),
              }),
            type: 'signTransaction',
          } as unknown as Parameters<
            typeof createLedgerTransactionModalNavDetails
          >[0]),
        );
        this.props.hideModal();
        return;
      }

      await ApprovalController.accept(transaction.id as string, undefined, {
        waitForResult: true,
      });

      this.showWalletConnectNotification(true);
    } catch (error) {
      if (
        !(error as Error)?.message.startsWith(KEYSTONE_TX_CANCELED) &&
        !(error as Error)?.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          (error as Error).message,
          [{ text: strings('navigation.ok') }],
        );
        Logger.error(
          error as Error,
          'error while trying to send transaction (Approval)',
        );
        this.setState({ transactionHandled: true });
        this.props.hideModal();
      } else {
        this.props.metrics.trackEvent(
          this.props.metrics
            .createEventBuilder(
              MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
            )
            .build(),
        );
      }
      this.setState({ transactionHandled: false });
    }

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.DAPP_TRANSACTION_COMPLETED)
        .addProperties({
          ...this.getAnalyticsParams({
            gasEstimateType,
            gasSelected,
          }),
          ...this.getBlockaidMetricsParams(),
          ...this.getTransactionMetrics(),
        } as unknown as JsonMap)
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
  onModeChange = (mode: string) => {
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
  prepareTransaction = ({
    EIP1559GasData,
    gasEstimateType,
  }: GasParams) => {
    const { transaction: rawTransaction, showCustomNonce } = this.props;
    const { assetType, gas, gasPrice, selectedAsset } = rawTransaction;

    const transaction = {
      ...rawTransaction,
    };

    if (assetType !== 'ETH') {
      transaction.to = selectedAsset?.address;
      transaction.value = '0x0';
    }

    const gasDataLegacy = {
      suggestedGasLimitHex: safeBNToHex(gas),
      suggestedGasPriceHex: safeBNToHex(gasPrice),
    };

    return buildTransactionParams({
      gasDataEIP1559: EIP1559GasData,
      gasDataLegacy,
      gasEstimateType: gasEstimateType as GasEstimateType,
      showCustomNonce: showCustomNonce ?? false,
      transaction,
    });
  };

  getTransactionMetrics = () => {
    const { confirmationMetricsById, transaction } = this.props;
    const { id: transactionId } = transaction;

    // Skip sensitiveProperties for now as it's not supported by mobile Metametrics client
    return confirmationMetricsById?.[transactionId ?? '']?.properties || {};
  };

  render = () => {
    const { dappTransactionModalVisible } = this.props;
    const { mode, transactionConfirmed, isChangeInSimulationModalOpen } =
      this.state;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;

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
        <TypedTransactionEditor
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

const mapStateToProps = (state: RootState): StateProps => {
  const transaction = getNormalizedTxState(
    state,
  ) as unknown as LegacyTransaction;
  const chainId = transaction?.chainId as Hex;

  return {
    transaction,
    transactions: selectTransactions(state),
    simulationData: selectCurrentTransactionMetadata(state)?.simulationData,
    selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
    networkType: selectProviderTypeByChainId(state, chainId),
    showCustomNonce: selectShowCustomNonce(state) as boolean,
    chainId,
    activeTabUrl: getActiveTabUrl(state),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(
      state,
      chainId,
    ) as boolean,
    confirmationMetricsById: selectConfirmationMetrics(state),
    securityAlertResponse: selectCurrentTransactionSecurityAlertResponse(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  resetTransaction: () => dispatch(resetTransaction()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(
  Approval as unknown as ComponentType<IWithMetricsAwarenessProps>,
)) as ComponentType<Partial<Props>>;
