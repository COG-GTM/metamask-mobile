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
import { SmartTransactionStatuses, SmartTransaction } from '@metamask/smart-transactions-controller/dist/types';

import Logger from '../util/Logger';
import {
  TransactionMeta as ControllerTransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';

interface NotificationTransaction {
  id?: string;
  nonce?: string;
  amount?: string;
  assetType?: string;
}

interface NotificationData {
  type: string;
  autoHide?: boolean;
  duration?: number;
  transaction?: NotificationTransaction;
  data?: {
    title?: string;
    shortDescription?: string;
  };
}

interface TransactionNotificationData {
  autodismiss?: number;
  transaction?: NotificationTransaction;
  status?: string;
}

interface SimpleNotificationData {
  duration?: number;
  title: string;
  description: string;
  status: string;
}

export const constructTitleAndMessage = (
  notification: NotificationData,
): { title: string; message: string } => {
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

interface NavigationLike {
  navigate(view: string): void;
}

/**
 * Singleton class responsible for managing all the
 * related notifications, which could be in-app or push
 * depending on the state of the app
 */
class NotificationManager {
  static instance: NotificationManager;
  _navigation!: NavigationLike;
  _transactionToView!: string[];
  _backgroundMode!: boolean;
  _transactionsWatchTable: Record<string, string[]> = {};

  _transactionFailedListener: ((...args: unknown[]) => void) | undefined;
  _transactionConfirmedListener: ((...args: unknown[]) => void) | undefined;
  _transactionSpeedupListener: ((...args: unknown[]) => void) | undefined;

  _showTransactionNotification!: (data: TransactionNotificationData) => void;
  _hideTransactionNotification!: () => void;
  _showSimpleNotification!: (data: {
    id: number;
    autodismiss?: number;
    title: string;
    description: string;
    status: string;
  }) => void;
  _removeNotificationById!: (id: string) => void;

  _handleAppStateChange = (appState: AppStateStatus) => {
    this._backgroundMode = appState === 'background';
  };

  _viewTransaction = (id: string) => {
    this._transactionToView.push(id);
    this.goTo('TransactionsHome');
  };

  _removeListeners = () => {
    if (this._transactionConfirmedListener) {
      Engine.controllerMessenger.tryUnsubscribe(
        'TransactionController:transactionConfirmed',
        this._transactionConfirmedListener as Parameters<typeof Engine.controllerMessenger.tryUnsubscribe<'TransactionController:transactionConfirmed'>>[1],
      );
    }

    if (this._transactionFailedListener) {
      Engine.controllerMessenger.tryUnsubscribe(
        'TransactionController:transactionFailed',
        this._transactionFailedListener as Parameters<typeof Engine.controllerMessenger.tryUnsubscribe<'TransactionController:transactionFailed'>>[1],
      );
    }

    if (this._transactionSpeedupListener) {
      Engine.controllerMessenger.tryUnsubscribe(
        'TransactionController:speedupTransactionAdded',
        this._transactionSpeedupListener as Parameters<typeof Engine.controllerMessenger.tryUnsubscribe<'TransactionController:speedupTransactionAdded'>>[1],
      );
    }
  };

  _showNotification = async (data: NotificationData) => {
    if (this._backgroundMode) {
      const { title, message } = constructTitleAndMessage(data);
      const id = data?.transaction?.id || '';
      if (id) {
        this._transactionToView.push(id);
      }

      const pushData: {
        channelId: string;
        title: string;
        body: string;
        data: unknown;
        id: string | undefined;
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
        id: undefined,
      };

      const extraData = { action: 'tx', id };
      pushData.data = { ...data?.transaction, ...extraData };
      if (Device.isAndroid()) {
        pushData.tag = JSON.stringify(extraData);
      } else {
        pushData.userInfo = extraData;
      }
      await NotificationsService.displayNotification(pushData as Parameters<typeof NotificationsService.displayNotification>[0]);
    } else {
      this._showTransactionNotification({
        autodismiss: data.duration,
        transaction: data.transaction,
        status: data.type,
      });
    }
  };

  _failedCallback = (payload: {
    actionId?: string;
    error: string;
    transactionMeta: ControllerTransactionMeta;
  }) => {
    const transactionMeta = payload.transactionMeta;
    // If it fails we hide the pending tx notification
    this._removeNotificationById(transactionMeta.id);
    const nonce = transactionMeta.txParams.nonce;
    if (!nonce) return;
    const transaction = this._transactionsWatchTable[nonce];
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
        this._removeListeners();
        delete this._transactionsWatchTable[nonce];
      }, 2000);
  };

  _confirmedCallback = (
    transactionMeta: ControllerTransactionMeta,
    originalTransaction: NotificationTransaction & { assetType?: string },
  ) => {
    const nonce = transactionMeta.txParams.nonce;
    if (!nonce) return;
    // Once it's confirmed we hide the pending tx notification
    this._removeNotificationById(transactionMeta.id);
    this._transactionsWatchTable[nonce].length &&
      setTimeout(() => {
        // Then we show the success notification
        this._showNotification({
          type: 'success',
          autoHide: true,
          transaction: {
            id: transactionMeta.id,
            nonce: `${hexToBN(nonce).toString()}`,
          },
          duration: 5000,
        });
        // Clean up
        this._removeListeners();

        const {
          TokenBalancesController,
          TokenDetectionController,
          AccountTrackerController,
        } = Engine.context;
        // account balances for ETH txs
        // Detect assets and tokens for ERC20 txs
        // Detect assets for ERC721 txs
        // right after a transaction was confirmed
        const pollPromises: Promise<unknown>[] = [
          AccountTrackerController.refresh([]),
          TokenBalancesController.updateBalancesByChainId({
            chainId: transactionMeta.chainId as Hex,
          }),
        ];
        switch (originalTransaction.assetType) {
          case 'ERC20': {
            pollPromises.push(
              ...[
                TokenDetectionController.detectTokens({
                  chainIds: [transactionMeta.chainId as Hex],
                }),
              ],
            );
            break;
          }
        }
        Promise.all(pollPromises);

        // Prompt review
        ReviewManager.promptReview();

        this._removeListeners();
        delete this._transactionsWatchTable[nonce];
      }, 2000);
  };

  _speedupCallback = (transactionMeta: ControllerTransactionMeta) => {
    this.watchSubmittedTransaction(transactionMeta, true);
    const nonce = transactionMeta.txParams.nonce;
    setTimeout(() => {
      this._showNotification({
        autoHide: false,
        type: 'speedup',
        transaction: {
          id: transactionMeta.id,
          nonce: nonce ? `${hexToBN(nonce).toString()}` : undefined,
        },
      });
    }, 2000);
  };

  /**
   * Creates a NotificationManager instance
   */
  constructor(
    _navigation: NavigationLike,
    _showTransactionNotification: (data: TransactionNotificationData) => void,
    _hideTransactionNotification: () => void,
    _showSimpleNotification: (data: {
      id: number;
      autodismiss?: number;
      title: string;
      description: string;
      status: string;
    }) => void,
    _removeNotificationById: (id: string) => void,
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
  getTransactionToView = (): string | undefined => this._transactionToView.pop();

  /**
   * Sets the id of the transaction that should
   * be displayed in memory
   */
  setTransactionToView = (id: string) => {
    this._transactionToView.push(id);
  };

  /**
   * Shows a notification with title and description
   */
  showSimpleNotification = (data: SimpleNotificationData): number => {
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
  watchSubmittedTransaction(
    transaction: { id: string; silent?: boolean },
    speedUp = false,
  ) {
    if (transaction.silent) return false;
    const { TransactionController } = Engine.context;
    const transactionMeta = TransactionController.state.transactions.find(
      ({ id }: { id: string }) => id === transaction.id,
    );

    if (!transactionMeta) return;

    const nonce = transactionMeta.txParams.nonce;
    if (!nonce) return;
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
        (confirmedTransactionMeta) => confirmedTransactionMeta.id === transaction.id,
      ) as unknown as (...args: unknown[]) => void;

    this._transactionFailedListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:transactionFailed',
        (payload) => {
          this._failedCallback(payload);
        },
        (payload) => payload.transactionMeta.id === transaction.id,
      ) as unknown as (...args: unknown[]) => void;

    this._transactionSpeedupListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:speedupTransactionAdded',
        (speedupTransactionMeta) => {
          this._speedupCallback(speedupTransactionMeta);
        },
        (speedupTransactionMeta) => speedupTransactionMeta.id === transaction.id,
      ) as unknown as (...args: unknown[]) => void;

    const smartTransactionListener = (smartTransaction: SmartTransaction) => {
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
      const transactions = TransactionController.getTransactions({});
      const foundTransaction = transactions.find(
        (tx: { id: string }) => tx.id === smartTransaction.transactionId,
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
  gotIncomingTransaction = async (incomingTransactions: ControllerTransactionMeta[]) => {
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
            safeToChecksumAddress(tx.txParams?.to ?? '') ===
              selectedInternalAccountChecksummedAddress &&
            safeToChecksumAddress(tx.txParams?.from ?? '') !==
              selectedInternalAccountChecksummedAddress &&
            tx.status === TransactionStatus.confirmed &&
            tx.time > oldestTimeAllowed,
        );

      if (!filteredTransactions.length) {
        return;
      }

      const txNonce = filteredTransactions[0].txParams.nonce;
      const nonce = txNonce ? hexToBN(txNonce).toString() : '';
      const txValue = filteredTransactions[0].txParams.value;
      const amount = txValue ? renderFromWei(hexToBN(txValue)) : '0';
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

interface NotificationManagerInitParams {
  navigation: NavigationLike;
  showTransactionNotification: (data: TransactionNotificationData) => void;
  hideCurrentNotification: () => void;
  showSimpleNotification: (data: {
    id: number;
    autodismiss?: number;
    title: string;
    description: string;
    status: string;
  }) => void;
  removeNotificationById: (id: string) => void;
}

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
  watchSubmittedTransaction(transaction: { id: string; silent?: boolean }) {
    return instance?.watchSubmittedTransaction(transaction);
  },
  getTransactionToView() {
    return instance?.getTransactionToView();
  },
  setTransactionToView(id: string) {
    return instance?.setTransactionToView(id);
  },
  gotIncomingTransaction(incomingTransactions: ControllerTransactionMeta[]) {
    return instance?.gotIncomingTransaction(incomingTransactions);
  },
  showSimpleNotification(data: SimpleNotificationData) {
    return instance?.showSimpleNotification(data);
  },
  onMessageReceived(data: NotificationData) {
    return instance?.onMessageReceived(data);
  },
};
