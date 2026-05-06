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
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface NotificationData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  autoHide?: boolean;
  duration?: number;
}

interface ShowSimpleNotificationData {
  duration?: number;
  title: string;
  description: string;
  status?: string;
  action?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export const constructTitleAndMessage = (notification: NotificationData) => {
  let title, message;
  switch (notification.type) {
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
        amount: notification.transaction.amount,
        assetType: notification.transaction.assetType,
      });
      message = strings('notifications.received_message');
      break;
    case NotificationTransactionTypes.received_payment:
      title = strings('notifications.received_payment_title');
      message = strings('notifications.received_payment_message', {
        amount: notification.transaction.amount,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _navigation: any;
  /**
   * Array containing the id of the transaction that should be
   * displayed while interacting with a notification
   */
  _transactionToView: string[] = [];
  /**
   * Boolean based on the current state of the app
   */
  _backgroundMode = false;

  /**
   * Object containing watched transaction ids list by transaction nonce
   */
  _transactionsWatchTable: Record<string, string[]> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transactionFailedListener: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transactionConfirmedListener: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transactionSpeedupListener: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _showTransactionNotification: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _hideTransactionNotification: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _showSimpleNotification: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _removeNotificationById: any;

  _handleAppStateChange = (appState: string) => {
    this._backgroundMode = appState === 'background';
  };

  _viewTransaction = (id: string) => {
    this._transactionToView.push(id);
    this.goTo('TransactionsHome');
  };

  _removeListeners = (_transactionId?: string) => {
    Engine.controllerMessenger.tryUnsubscribe(
      'TransactionController:transactionConfirmed',
      this._transactionConfirmedListener,
    );

    Engine.controllerMessenger.tryUnsubscribe(
      'TransactionController:transactionFailed',
      this._transactionFailedListener,
    );

    Engine.controllerMessenger.tryUnsubscribe(
      'TransactionController:speedupTransactionAdded',
      this._transactionSpeedupListener,
    );
  };

  _showNotification = async (data: NotificationData) => {
    if (this._backgroundMode) {
      const { title, message } = constructTitleAndMessage(data);
      const id = data?.transaction?.id || '';
      if (id) {
        this._transactionToView.push(id);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pushData: Record<string, any> = {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await NotificationsService.displayNotification(pushData as any);
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
    const nonce = transactionMeta.txParams.nonce ?? '';
    const transaction = this._transactionsWatchTable[nonce];
    if (transaction?.length) {
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
        delete this._transactionsWatchTable[nonce];
      }, 2000);
    }
  };

  _confirmedCallback = (
    transactionMeta: TransactionMeta,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalTransaction: any,
  ) => {
    // Once it's confirmed we hide the pending tx notification
    this._removeNotificationById(transactionMeta.id);
    const nonce = transactionMeta.txParams.nonce ?? '';
    this._transactionsWatchTable[nonce]?.length &&
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
        const pollPromises = [
          AccountTrackerController.refresh([]),
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
        delete this._transactionsWatchTable[nonce];
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _navigation: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _showTransactionNotification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _hideTransactionNotification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _showSimpleNotification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _removeNotificationById: any,
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

    return NotificationManager.instance;
  }

  /**
   * Navigates to a specific view
   */
  goTo(view: string) {
    this._navigation.navigate(view);
  }

  onMessageReceived(data: NotificationData) {
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
    this._transactionToView.push(String(id));
  };

  /**
   * Shows a notification with title and description
   */
  showSimpleNotification = (data: ShowSimpleNotificationData) => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watchSubmittedTransaction(transaction: any, speedUp = false) {
    if (transaction.silent) return false;
    const { TransactionController } = Engine.context;
    const transactionMeta = TransactionController.state.transactions.find(
      ({ id }) => id === transaction.id,
    );
    if (!transactionMeta) {
      return false;
    }

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
        (txMeta: TransactionMeta) => {
          this._confirmedCallback(txMeta, transaction);
        },
        (txMeta: TransactionMeta) => txMeta.id === transaction.id,
      );

    this._transactionFailedListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:transactionFailed',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ transactionMeta: txMeta }: { transactionMeta: any }) => {
          this._failedCallback(txMeta);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ transactionMeta: txMeta }: { transactionMeta: any }) =>
          txMeta.id === transaction.id,
      );

    this._transactionSpeedupListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:speedupTransactionAdded',
        (txMeta: TransactionMeta) => {
          this._speedupCallback(txMeta);
        },
        (txMeta: TransactionMeta) => txMeta.id === transaction.id,
      );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const smartTransactionListener = async (smartTransaction: any) => {
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
      const transactions = TransactionController.getTransactions(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { filterToCurrentNetwork: false } as any,
      );
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gotIncomingTransaction = async (incomingTransactions: any[]) => {
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
          (tx) =>
            safeToChecksumAddress(tx.txParams?.to) ===
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

      // Update balance upon detecting a new incoming transaction
      AccountTrackerController.refresh([]);
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

interface NotificationManagerInitOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showTransactionNotification: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hideCurrentNotification: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showSimpleNotification: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeNotificationById: any;
}

export default {
  init({
    navigation,
    showTransactionNotification,
    hideCurrentNotification,
    showSimpleNotification,
    removeNotificationById,
  }: NotificationManagerInitOptions) {
    instance = new NotificationManager(
      navigation,
      showTransactionNotification,
      hideCurrentNotification,
      showSimpleNotification,
      removeNotificationById,
    );
    return instance;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watchSubmittedTransaction(transaction: any) {
    return instance?.watchSubmittedTransaction(transaction);
  },
  getTransactionToView() {
    return instance?.getTransactionToView();
  },
  setTransactionToView(id: string | number) {
    return instance?.setTransactionToView(id);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gotIncomingTransaction(incomingTransactions: any[]) {
    return instance?.gotIncomingTransaction(incomingTransactions);
  },
  showSimpleNotification(data: ShowSimpleNotificationData) {
    return instance?.showSimpleNotification(data);
  },
  onMessageReceived(data: NotificationData) {
    return instance?.onMessageReceived(data);
  },
};
