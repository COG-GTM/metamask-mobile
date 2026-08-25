'use strict';

import Engine from './Engine';
import { hexToBN, renderFromWei } from '../util/number';
import Device from '../util/device';
import { strings } from '../../locales/i18n';
import { AppState } from 'react-native';
import NotificationsService from '../util/notifications/services/NotificationService';
import { NotificationTransactionTypes, ChannelId } from '../util/notifications';
import { safeToChecksumAddress } from '../util/address';
import ReviewManager from './ReviewManager';
import { selectEvmTicker } from '../selectors/networkController';
import { store } from '../store';
import { getTicker } from '../../app/util/transactions';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';

import Logger from '../util/Logger';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';

/**
 * Transaction details carried by an in-app or push notification.
 */
interface NotificationTransaction {
  id?: string;
  nonce?: string;
  amount?: string;
  assetType?: string;
}

/**
 * Payload used to build and display a notification.
 */
interface NotificationPayload {
  type?: string;
  autoHide?: boolean;
  duration?: number;
  transaction?: NotificationTransaction;
  data?: {
    title?: string;
    shortDescription?: string;
  };
}

/**
 * Payload of a simple (title + description) notification.
 */
interface SimpleNotificationPayload {
  duration?: number;
  title?: string;
  description?: string;
  status?: string;
  action?: string;
}

/**
 * The transaction shape this manager watches. Only the fields used here are
 * described.
 */
interface WatchedTransaction {
  id?: string;
  silent?: boolean;
  assetType?: string;
}

interface NotificationManagerCallbacks {
  navigation: { navigate: (view: string) => void };
  showTransactionNotification: (notification: {
    autodismiss?: number;
    transaction?: NotificationTransaction;
    status?: string;
  }) => void;
  hideCurrentNotification: () => void;
  showSimpleNotification: (notification: {
    id: number;
    autodismiss?: number;
    title?: string;
    description?: string;
    status?: string;
  }) => void;
  removeNotificationById: (id?: string) => void;
}

export const constructTitleAndMessage = (notification: NotificationPayload) => {
  let title, message;
  switch (notification.type as string) {
    case NotificationTransactionTypes.pending:
      title = strings('notifications.pending_title');
      message = strings('notifications.pending_message');
      break;
    case NotificationTransactionTypes.pending_deposit:
      title = strings('notifications.pending_deposit_title');
      message = strings('notifications.pending_deposit_message');
      break;
    case NotificationTransactionTypes.pending_withdrawal:
      title = strings('notifications.pending_withdrawal_title');
      message = strings('notifications.pending_withdrawal_message');
      break;
    case NotificationTransactionTypes.success:
      title = strings('notifications.success_title', {
        nonce: notification?.transaction?.nonce || '',
      });
      message = strings('notifications.success_message');
      break;
    case NotificationTransactionTypes.speedup:
      title = strings('notifications.speedup_title', {
        nonce: notification?.transaction?.nonce || '',
      });
      message = strings('notifications.speedup_message');
      break;
    case NotificationTransactionTypes.success_withdrawal:
      title = strings('notifications.success_withdrawal_title');
      message = strings('notifications.success_withdrawal_message');
      break;
    case NotificationTransactionTypes.success_deposit:
      title = strings('notifications.success_deposit_title');
      message = strings('notifications.success_deposit_message');
      break;
    case NotificationTransactionTypes.error:
      title = strings('notifications.error_title');
      message = strings('notifications.error_message');
      break;
    case NotificationTransactionTypes.cancelled:
      title = strings('notifications.cancelled_title');
      message = strings('notifications.cancelled_message');
      break;
    case NotificationTransactionTypes.received:
      title = strings('notifications.received_title', {
        amount: notification.transaction?.amount,
        assetType: notification.transaction?.assetType,
      });
      message = strings('notifications.received_message');
      break;
    case NotificationTransactionTypes.received_payment:
      title = strings('notifications.received_payment_title');
      message = strings('notifications.received_payment_message', {
        amount: notification.transaction?.amount,
      });
      break;
    default:
      title =
        notification?.data?.title ||
        strings('notifications.default_message_title');
      message =
        notification?.data?.shortDescription ||
        strings('notifications.default_message_description');
      break;
  }
  return { title, message };
};

/**
 * Singleton class responsible for managing all the
 * related notifications, which could be in-app or push
 * depending on the state of the app
 */
class NotificationManager {
  static instance: NotificationManager | undefined;

  /**
   * Navigation object from react-navigation
   */
  _navigation!: NotificationManagerCallbacks['navigation'];
  /**
   * Array containing the id of the transaction that should be
   * displayed while interacting with a notification
   */
  _transactionToView: (string | number)[] = [];
  /**
   * Boolean based on the current state of the app
   */
  _backgroundMode = false;

  _showTransactionNotification!: NotificationManagerCallbacks['showTransactionNotification'];

  _hideTransactionNotification!: NotificationManagerCallbacks['hideCurrentNotification'];

  _showSimpleNotification!: NotificationManagerCallbacks['showSimpleNotification'];

  _removeNotificationById!: NotificationManagerCallbacks['removeNotificationById'];

  /**
   * Object containing watched transaction ids list by transaction nonce
   */
  _transactionsWatchTable: Record<string, string[]> = {};

  _transactionFailedListener: unknown;

  _transactionConfirmedListener: unknown;

  _transactionSpeedupListener: unknown;

  _handleAppStateChange = (appState: string) => {
    this._backgroundMode = appState === 'background';
  };

  _viewTransaction = (id: string) => {
    this._transactionToView.push(id);
    this.goTo('TransactionsHome');
  };

  // The transaction id argument is accepted but unused, matching the existing
  // call sites.
  _removeListeners = (_transactionId?: string) => {
    Engine.controllerMessenger.tryUnsubscribe(
      'TransactionController:transactionConfirmed',
      this._transactionConfirmedListener as
        | ((transactionMeta: TransactionMeta) => void)
        | undefined,
    );

    Engine.controllerMessenger.tryUnsubscribe(
      'TransactionController:transactionFailed',
      this._transactionFailedListener as
        | ((payload: {
            actionId?: string;
            error: string;
            transactionMeta: TransactionMeta;
          }) => void)
        | undefined,
    );

    Engine.controllerMessenger.tryUnsubscribe(
      'TransactionController:speedupTransactionAdded',
      this._transactionSpeedupListener as
        | ((transactionMeta: TransactionMeta) => void)
        | undefined,
    );
  };

  _showNotification = async (data: NotificationPayload) => {
    if (this._backgroundMode) {
      const { title, message } = constructTitleAndMessage(data);
      const id = data?.transaction?.id || '';
      if (id) {
        this._transactionToView.push(id);
      }

      const pushData: {
        channelId: ChannelId;
        title: string;
        body: string;
        data: Record<string, unknown>;
        tag?: string;
        userInfo?: Record<string, unknown>;
      } = {
        channelId: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
        title,
        body: message,
        data: {
          ...data?.transaction,
          action: 'tx',
          id,
        },
      };

      const extraData = { action: 'tx', id };
      pushData.data = { ...data?.transaction, ...extraData };
      if (Device.isAndroid()) {
        pushData.tag = JSON.stringify(extraData);
      } else {
        pushData.userInfo = extraData;
      }
      await NotificationsService.displayNotification(pushData);
    } else {
      this._showTransactionNotification({
        autodismiss: data.duration,
        transaction: data.transaction,
        status: data.type,
      });
    }
  };

  _failedCallback = (transactionMeta: TransactionMeta) => {
    // If it fails we hide the pending tx notification
    this._removeNotificationById(transactionMeta.id);
    const transaction =
      this._transactionsWatchTable[transactionMeta.txParams.nonce as string];
    transaction?.length &&
      setTimeout(() => {
        // Then we show the error notification
        this._showNotification({
          type: transactionMeta.status === 'cancelled' ? 'cancelled' : 'error',
          autoHide: true,
          transaction: { id: transactionMeta.id },
          duration: 5000,
        });
        // Clean up
        this._removeListeners(transactionMeta.id);
        delete this._transactionsWatchTable[
          transactionMeta.txParams.nonce as string
        ];
      }, 2000);
  };

  _confirmedCallback = (
    transactionMeta: TransactionMeta,
    originalTransaction: WatchedTransaction,
  ) => {
    // Once it's confirmed we hide the pending tx notification
    this._removeNotificationById(transactionMeta.id);
    this._transactionsWatchTable[transactionMeta.txParams.nonce as string]
      .length &&
      setTimeout(() => {
        // Then we show the success notification
        this._showNotification({
          type: 'success',
          autoHide: true,
          transaction: {
            id: transactionMeta.id,
            nonce: `${hexToBN(transactionMeta.txParams.nonce).toString()}`,
          },
          duration: 5000,
        });
        // Clean up
        this._removeListeners(transactionMeta.id);

        const {
          TokenBalancesController,
          TokenDetectionController,
          AccountTrackerController,
        } = Engine.context;
        // account balances for ETH txs
        // Detect assets and tokens for ERC20 txs
        // Detect assets for ERC721 txs
        // right after a transaction was confirmed
        // `refresh` is called without arguments, matching the existing behavior.
        const refreshAccountTracker =
          AccountTrackerController.refresh as unknown as () => Promise<void>;
        const pollPromises = [
          refreshAccountTracker(),
          TokenBalancesController.updateBalancesByChainId({
            chainId: transactionMeta.chainId,
          }),
        ];
        switch (originalTransaction.assetType) {
          case 'ERC20': {
            pollPromises.push(
              ...[
                TokenDetectionController.detectTokens({
                  chainIds: [transactionMeta.chainId],
                }),
              ],
            );
            break;
          }
        }
        Promise.all(pollPromises);

        // Prompt review
        ReviewManager.promptReview();

        this._removeListeners(transactionMeta.id);
        delete this._transactionsWatchTable[
          transactionMeta.txParams.nonce as string
        ];
      }, 2000);
  };

  _speedupCallback = (transactionMeta: TransactionMeta) => {
    this.watchSubmittedTransaction(transactionMeta, true);
    setTimeout(() => {
      this._showNotification({
        autoHide: false,
        type: 'speedup',
        transaction: {
          id: transactionMeta.id,
          nonce: `${hexToBN(transactionMeta.txParams.nonce).toString()}`,
        },
      });
    }, 2000);
  };

  /**
   * Creates a NotificationManager instance
   */
  constructor(
    _navigation: NotificationManagerCallbacks['navigation'],
    _showTransactionNotification: NotificationManagerCallbacks['showTransactionNotification'],
    _hideTransactionNotification: NotificationManagerCallbacks['hideCurrentNotification'],
    _showSimpleNotification: NotificationManagerCallbacks['showSimpleNotification'],
    _removeNotificationById: NotificationManagerCallbacks['removeNotificationById'],
  ) {
    if (!NotificationManager.instance) {
      this._navigation = _navigation;
      this._showTransactionNotification = _showTransactionNotification;
      this._hideTransactionNotification = _hideTransactionNotification;
      this._showSimpleNotification = _showSimpleNotification;
      this._removeNotificationById = _removeNotificationById;
      this._transactionToView = [];
      this._backgroundMode = false;
      NotificationManager.instance = this;
      AppState.addEventListener('change', this._handleAppStateChange);
    }

    return NotificationManager.instance as NotificationManager;
  }

  /**
   * Navigates to a specific view
   */
  goTo(view: string) {
    this._navigation.navigate(view);
  }

  onMessageReceived(data: NotificationPayload) {
    this._showNotification(data);
  }

  /**
   * Returns the id of the transaction that should
   * be displayed and removes it from memory
   */
  getTransactionToView = () => this._transactionToView.pop();

  /**
   * Sets the id of the transaction that should
   * be displayed in memory
   */
  setTransactionToView = (id: string | number) => {
    this._transactionToView.push(id);
  };

  /**
   * Shows a notification with title and description
   */
  showSimpleNotification = (data: SimpleNotificationPayload) => {
    const id = Date.now();
    this._showSimpleNotification({
      id,
      autodismiss: data.duration,
      title: data.title,
      description: data.description,
      status: data.status,
    });
    return id;
  };

  /**
   * Listen for events of a submitted transaction
   * and generates the corresponding notification
   * based on the status of the transaction (failed or confirmed)
   */
  watchSubmittedTransaction(transaction: WatchedTransaction, speedUp = false) {
    if (transaction.silent) return false;
    const { TransactionController } = Engine.context;
    const transactionMeta = TransactionController.state.transactions.find(
      ({ id }) => id === transaction.id,
    ) as TransactionMeta;

    const nonce = transactionMeta.txParams.nonce as string;
    // First we show the pending tx notification if is not an speed up tx
    !speedUp &&
      this._showNotification({
        type: 'pending',
        autoHide: false,
        transaction: {
          id: transactionMeta.id,
        },
      });

    this._transactionsWatchTable[nonce]
      ? this._transactionsWatchTable[nonce].push(transactionMeta.id)
      : (this._transactionsWatchTable[nonce] = [transactionMeta.id]);

    this._transactionConfirmedListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:transactionConfirmed',
        (confirmedTransactionMeta) => {
          this._confirmedCallback(confirmedTransactionMeta, transaction);
        },
        (confirmedTransactionMeta) =>
          confirmedTransactionMeta.id === transaction.id,
      );

    this._transactionFailedListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:transactionFailed',
        (payload) => {
          this._failedCallback(payload as unknown as TransactionMeta);
        },
        // The event payload is read as if it were the transaction metadata
        // itself, matching the existing behavior.
        (payload) =>
          (payload as unknown as { id?: string }).id === transaction.id,
      );

    this._transactionSpeedupListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:speedupTransactionAdded',
        (speedupTransactionMeta) => {
          this._speedupCallback(speedupTransactionMeta);
        },
        (speedupTransactionMeta) =>
          speedupTransactionMeta.id === transaction.id,
      );

    const smartTransactionListener = async (smartTransaction: {
      status?: string;
      transactionId?: string;
    }) => {
      if (smartTransaction.status === SmartTransactionStatuses.PENDING) {
        return;
      }
      Engine.controllerMessenger.unsubscribe(
        'SmartTransactionsController:smartTransaction',
        smartTransactionListener,
      );
      if (smartTransaction.status !== SmartTransactionStatuses.CANCELLED) {
        // If the smart transaction is not cancelled, notifications are already handled.
        return;
      }
      const transactions = TransactionController.getTransactions({
        filterToCurrentNetwork: false,
      } as Parameters<typeof TransactionController.getTransactions>[0]);
      const foundTransaction = transactions.find(
        (tx) => tx.id === smartTransaction.transactionId,
      );
      this._showNotification({
        type: 'cancelled',
        autoHide: true,
        transaction: { id: foundTransaction?.id },
        duration: 5000,
      });
    };

    Engine.controllerMessenger.subscribe(
      'SmartTransactionsController:smartTransaction',
      smartTransactionListener,
    );
  }

  /**
   * Generates a notification for an incoming transaction
   */
  gotIncomingTransaction = async (incomingTransactions: TransactionMeta[]) => {
    try {
      const { AccountTrackerController, AccountsController } = Engine.context;

      const selectedInternalAccount = AccountsController.getSelectedAccount();

      const selectedInternalAccountChecksummedAddress = safeToChecksumAddress(
        selectedInternalAccount.address,
      );

      const ticker = selectEvmTicker(store.getState());

      // If a TX has been confirmed more than 10 min ago, it's considered old
      const oldestTimeAllowed = Date.now() - 1000 * 60 * 10;

      const filteredTransactions = incomingTransactions
        .reverse()
        .filter(
          (tx: TransactionMeta) =>
            safeToChecksumAddress(tx.txParams?.to as string) ===
              selectedInternalAccountChecksummedAddress &&
            safeToChecksumAddress(tx.txParams?.from) !==
              selectedInternalAccountChecksummedAddress &&
            tx.status === TransactionStatus.confirmed &&
            tx.time > oldestTimeAllowed,
        );

      if (!filteredTransactions.length) {
        return;
      }

      const nonce = hexToBN(filteredTransactions[0].txParams.nonce).toString();
      const amount = renderFromWei(
        hexToBN(filteredTransactions[0].txParams.value),
      );
      const id = filteredTransactions[0]?.id;

      this._showNotification({
        type: 'received',
        transaction: {
          nonce,
          amount,
          id,
          assetType: getTicker(ticker),
        },
        autoHide: true,
        duration: 7000,
      });

      // Update balance upon detecting a new incoming transaction.
      // `refresh` is called without arguments, matching the existing behavior.
      (AccountTrackerController.refresh as unknown as () => void)();
    } catch (error) {
      Logger.log(
        'Notifications',
        'Error while processing incoming transaction',
        error,
      );
    }
  };
}

let instance: NotificationManager | undefined;

export default {
  init({
    navigation,
    showTransactionNotification,
    hideCurrentNotification,
    showSimpleNotification,
    removeNotificationById,
  }: NotificationManagerCallbacks) {
    instance = new NotificationManager(
      navigation,
      showTransactionNotification,
      hideCurrentNotification,
      showSimpleNotification,
      removeNotificationById,
    );
    return instance;
  },
  watchSubmittedTransaction(transaction: WatchedTransaction) {
    return instance?.watchSubmittedTransaction(transaction);
  },
  getTransactionToView() {
    return instance?.getTransactionToView();
  },
  setTransactionToView(id: string | number) {
    return instance?.setTransactionToView(id);
  },
  gotIncomingTransaction(incomingTransactions: TransactionMeta[]) {
    return instance?.gotIncomingTransaction(incomingTransactions);
  },
  showSimpleNotification(data: SimpleNotificationPayload) {
    return instance?.showSimpleNotification(data);
  },
  onMessageReceived(data: NotificationPayload) {
    return instance?.onMessageReceived(data);
  },
};
