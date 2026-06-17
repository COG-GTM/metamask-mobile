'use strict';

import Engine from './Engine';
import { hexToBN, renderFromWei } from '../util/number';
import Device from '../util/device';
import { strings } from '../../locales/i18n';
import { AppState, AppStateStatus } from 'react-native';
import NotificationsService from '../util/notifications/services/NotificationService';
import { NotificationTransactionTypes, ChannelId } from '../util/notifications';
import { safeToChecksumAddress } from '../util/address';
import ReviewManager from './ReviewManager';
import { selectEvmTicker } from '../selectors/networkController';
import { store } from '../store';
import { getTicker } from '../../app/util/transactions';
import { SmartTransactionStatuses , SmartTransaction } from '@metamask/smart-transactions-controller/dist/types';

import Logger from '../util/Logger';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';

interface NotificationTransaction {
  id?: string;
  nonce?: string;
  amount?: string;
  assetType?: string;
}

interface NotificationData {
  type?: string;
  transaction?: NotificationTransaction;
  data?: {
    title?: string;
    shortDescription?: string;
    [key: string]: unknown;
  };
  duration?: number;
  autoHide?: boolean;
  autodismiss?: number;
}

interface SimpleNotification {
  status?: string;
  duration?: number;
  title?: string;
  description?: string;
  action?: string;
}

interface NavigationLike {
  navigate: (routeName: string, params?: object) => void;
}

type ShowTransactionNotification = (opts: {
  autodismiss?: number;
  transaction?: NotificationTransaction;
  status?: string;
}) => void;

type ShowSimpleNotification = (opts: {
  id: number;
  autodismiss?: number;
  title?: string;
  description?: string;
  status?: string;
}) => void;

type RemoveNotificationById = (id: string | number) => void;

interface SubmittedTransaction {
  id: string;
  txParams: { nonce?: string };
  silent?: boolean;
  assetType?: string;
}

interface NotificationManagerInitParams {
  navigation: NavigationLike;
  showTransactionNotification: ShowTransactionNotification;
  hideCurrentNotification: () => void;
  showSimpleNotification: ShowSimpleNotification;
  removeNotificationById: RemoveNotificationById;
}

export const constructTitleAndMessage = (
  notification: NotificationData,
): { title: string; message: string } => {
  let title: string;
  let message: string;
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
  static instance: NotificationManager;

  /**
   * Navigation object from react-navigation
   */
  _navigation!: NavigationLike;
  /**
   * Array containing the id of the transaction that should be
   * displayed while interacting with a notification
   */
  _transactionToView: (string | number)[] = [];
  /**
   * Boolean based on the current state of the app
   */
  _backgroundMode = false;

  _showTransactionNotification!: ShowTransactionNotification;
  _hideTransactionNotification!: () => void;
  _showSimpleNotification!: ShowSimpleNotification;
  _removeNotificationById!: RemoveNotificationById;

  /**
   * Object containing watched transaction ids list by transaction nonce
   */
  _transactionsWatchTable: Record<string, string[]> = {};

  _transactionFailedListener?: (payload: {
    actionId?: string;
    error: string;
    transactionMeta: TransactionMeta;
  }) => void;

  _transactionConfirmedListener?: (transactionMeta: TransactionMeta) => void;

  _transactionSpeedupListener?: (transactionMeta: TransactionMeta) => void;

  _handleAppStateChange = (appState: AppStateStatus) => {
    this._backgroundMode = appState === 'background';
  };

  _viewTransaction = (id: string | number) => {
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
          type:
            transactionMeta.status === TransactionStatus.cancelled
              ? 'cancelled'
              : 'error',
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
    originalTransaction: SubmittedTransaction,
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
        const pollPromises = [
          (
            AccountTrackerController.refresh as (
              ...args: unknown[]
            ) => Promise<void>
          )(),
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
    this.watchSubmittedTransaction(
      transactionMeta as unknown as SubmittedTransaction,
      true,
    );
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
    _navigation: NavigationLike,
    _showTransactionNotification: ShowTransactionNotification,
    _hideTransactionNotification: () => void,
    _showSimpleNotification: ShowSimpleNotification,
    _removeNotificationById: RemoveNotificationById,
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
  getTransactionToView = (): string | number | undefined =>
    this._transactionToView.pop();

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
  showSimpleNotification = (data: SimpleNotification) => {
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
  watchSubmittedTransaction(transaction: SubmittedTransaction, speedUp = false) {
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
        (txMeta) => {
          this._confirmedCallback(txMeta, transaction);
        },
        (txMeta) => txMeta.id === transaction.id,
      );

    this._transactionFailedListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:transactionFailed',
        (txMeta) => {
          this._failedCallback(txMeta as unknown as TransactionMeta);
        },
        (txMeta) =>
          (txMeta as unknown as TransactionMeta).id === transaction.id,
      );

    this._transactionSpeedupListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:speedupTransactionAdded',
        (txMeta) => {
          this._speedupCallback(txMeta);
        },
        (txMeta) => txMeta.id === transaction.id,
      );

    const smartTransactionListener = async (
      smartTransaction: SmartTransaction,
    ) => {
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
      const transactions = TransactionController.getTransactions();
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
          (tx) =>
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

      // Update balance upon detecting a new incoming transaction
      (
        AccountTrackerController.refresh as (...args: unknown[]) => Promise<void>
      )();
    } catch (error) {
      Logger.log(
        'Notifications',
        'Error while processing incoming transaction',
        error,
      );
    }
  };
}

let instance: NotificationManager;

export default {
  init({
    navigation,
    showTransactionNotification,
    hideCurrentNotification,
    showSimpleNotification,
    removeNotificationById,
  }: NotificationManagerInitParams) {
    instance = new NotificationManager(
      navigation,
      showTransactionNotification,
      hideCurrentNotification,
      showSimpleNotification,
      removeNotificationById,
    );
    return instance;
  },
  watchSubmittedTransaction(transaction: SubmittedTransaction) {
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
  showSimpleNotification(data: SimpleNotification) {
    return instance?.showSimpleNotification(data);
  },
  onMessageReceived(data: NotificationData) {
    return instance?.onMessageReceived(data);
  },
};
