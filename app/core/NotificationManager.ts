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
import {
  SmartTransactionStatuses,
  SmartTransaction,
} from '@metamask/smart-transactions-controller/dist/types';

import Logger from '../util/Logger';
import { TransactionMeta, TransactionStatus } from '@metamask/transaction-controller';

/**
 * Type for notification transaction types
 */
type NotificationTransactionType =
  (typeof NotificationTransactionTypes)[keyof typeof NotificationTransactionTypes];

/**
 * Interface for transaction data in notifications
 */
interface NotificationTransaction {
  id?: string;
  nonce?: string;
  amount?: string;
  assetType?: string;
}

/**
 * Interface for notification data
 */
interface NotificationData {
  type?: NotificationTransactionType | string;
  transaction?: NotificationTransaction;
  autoHide?: boolean;
  duration?: number;
  data?: {
    title?: string;
    shortDescription?: string;
  };
}

/**
 * Interface for simple notification data
 */
interface SimpleNotificationData {
  duration?: number;
  title: string;
  description: string;
  status?: string;
}

/**
 * Interface for transaction notification parameters
 */
interface TransactionNotificationParams {
  autodismiss?: number;
  transaction?: NotificationTransaction;
  status?: NotificationTransactionType | string;
}

/**
 * Interface for simple notification parameters
 */
interface SimpleNotificationParams {
  id: number;
  autodismiss?: number;
  title: string;
  description: string;
  status?: string;
}

/**
 * Interface for navigation object
 */
interface Navigation {
  navigate: (view: string) => void;
}

/**
 * Type for show transaction notification function
 */
type ShowTransactionNotificationFn = (
  params: TransactionNotificationParams,
) => void;

/**
 * Type for hide transaction notification function
 */
type HideTransactionNotificationFn = () => void;

/**
 * Type for show simple notification function
 */
type ShowSimpleNotificationFn = (params: SimpleNotificationParams) => void;

/**
 * Type for remove notification by id function
 */
type RemoveNotificationByIdFn = (id: string) => void;

/**
 * Interface for init parameters
 */
interface InitParams {
  navigation: Navigation;
  showTransactionNotification: ShowTransactionNotificationFn;
  hideCurrentNotification: HideTransactionNotificationFn;
  showSimpleNotification: ShowSimpleNotificationFn;
  removeNotificationById: RemoveNotificationByIdFn;
}

/**
 * Interface for watched transaction
 */
interface WatchedTransaction {
  id: string;
  silent?: boolean;
  assetType?: string;
}

/**
 * Interface for transactions watch table
 */
interface TransactionsWatchTable {
  [nonce: string]: string[];
}


/**
 * Constructs title and message for a notification based on its type
 */
export const constructTitleAndMessage = (
  notification: NotificationData,
): { title: string; message: string } => {
  let title: string, message: string;
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
  /**
   * The singleton instance
   */
  static instance: NotificationManager | null;

  /**
   * Navigation object from react-navigation
   */
  _navigation!: Navigation;

  /**
   * Array containing the id of the transaction that should be
   * displayed while interacting with a notification
   */
  _transactionToView!: string[];

  /**
   * Boolean based on the current state of the app
   */
  _backgroundMode!: boolean;

  /**
   * Object containing watched transaction ids list by transaction nonce
   */
  _transactionsWatchTable: TransactionsWatchTable = {};

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transactionFailedListener: any;

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transactionConfirmedListener: any;

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transactionSpeedupListener: any;

  _showTransactionNotification!: ShowTransactionNotificationFn;

  _hideTransactionNotification!: HideTransactionNotificationFn;

  _showSimpleNotification!: ShowSimpleNotificationFn;

  _removeNotificationById!: RemoveNotificationByIdFn;

  _handleAppStateChange = (appState: AppStateStatus): void => {
    this._backgroundMode = appState === 'background';
  };

  _viewTransaction = (id: string): void => {
    this._transactionToView.push(id);
    this.goTo('TransactionsHome');
  };

  _removeListeners = (): void => {
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

  _showNotification = async (data: NotificationData): Promise<void> => {
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

  _failedCallback = (transactionMeta: TransactionMeta): void => {
    // If it fails we hide the pending tx notification
    this._removeNotificationById(transactionMeta.id);
    const transaction =
      this._transactionsWatchTable[transactionMeta.txParams.nonce as string];
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
        this._removeListeners();
        delete this._transactionsWatchTable[
          transactionMeta.txParams.nonce as string
        ];
      }, 2000);
    }
  };

  _confirmedCallback = (
    transactionMeta: TransactionMeta,
    originalTransaction: WatchedTransaction,
  ): void => {
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
            nonce: `${hexToBN(transactionMeta.txParams.nonce as string).toString()}`,
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
        const pollPromises: Promise<void>[] = [
          // @ts-expect-error - AccountTrackerController.refresh() signature changed but we maintain backward compatibility
          AccountTrackerController.refresh(),
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

        this._removeListeners();
        delete this._transactionsWatchTable[
          transactionMeta.txParams.nonce as string
        ];
      }, 2000);
  };

  _speedupCallback = (transactionMeta: TransactionMeta): void => {
    this.watchSubmittedTransaction(
      transactionMeta as unknown as WatchedTransaction,
      true,
    );
    setTimeout(() => {
      this._showNotification({
        autoHide: false,
        type: 'speedup',
        transaction: {
          id: transactionMeta.id,
          nonce: `${hexToBN(transactionMeta.txParams.nonce as string).toString()}`,
        },
      });
    }, 2000);
  };

  /**
   * Creates a NotificationManager instance
   */
  constructor(
    _navigation: Navigation,
    _showTransactionNotification: ShowTransactionNotificationFn,
    _hideTransactionNotification: HideTransactionNotificationFn,
    _showSimpleNotification: ShowSimpleNotificationFn,
    _removeNotificationById: RemoveNotificationByIdFn,
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
  goTo(view: string): void {
    this._navigation.navigate(view);
  }

  onMessageReceived(data: NotificationData): void {
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
  setTransactionToView = (id: string): void => {
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
    transaction: WatchedTransaction,
    speedUp = false,
  ): boolean | undefined {
    if (transaction.silent) return false;
    const { TransactionController } = Engine.context;
    const transactionMeta = TransactionController.state.transactions.find(
      ({ id }: { id: string }) => id === transaction.id,
    );

    if (!transactionMeta) return false;

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
        ({
          transactionMeta: failedTxMeta,
        }: {
          transactionMeta: TransactionMeta;
        }) => {
          this._failedCallback(failedTxMeta);
        },
        ({
          transactionMeta: failedTxMeta,
        }: {
          transactionMeta: TransactionMeta;
        }) => failedTxMeta.id === transaction.id,
      );

    this._transactionSpeedupListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:speedupTransactionAdded',
        (txMeta: TransactionMeta) => {
          this._speedupCallback(txMeta);
        },
        (txMeta: TransactionMeta) => txMeta.id === transaction.id,
      );

    const smartTransactionListener = async (
      smartTransaction: SmartTransaction,
    ): Promise<void> => {
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
        // @ts-expect-error - filterToCurrentNetwork option may vary between versions
        filterToCurrentNetwork: false,
      });
      const foundTransaction = transactions.find(
        (tx: TransactionMeta) => tx.id === smartTransaction.transactionId,
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
  gotIncomingTransaction = async (
    incomingTransactions: TransactionMeta[],
  ): Promise<void> => {
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
            safeToChecksumAddress(tx.txParams?.from as string) !==
              selectedInternalAccountChecksummedAddress &&
            tx.status === TransactionStatus.confirmed &&
            (tx.time ?? 0) > oldestTimeAllowed,
        );

      if (!filteredTransactions.length) {
        return;
      }

      const nonce = hexToBN(
        filteredTransactions[0].txParams.nonce as string,
      ).toString();
      const amount = renderFromWei(
        hexToBN(filteredTransactions[0].txParams.value as string),
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
      // @ts-expect-error - AccountTrackerController.refresh() signature changed but we maintain backward compatibility
      AccountTrackerController.refresh();
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
  }: InitParams): NotificationManager {
    instance = new NotificationManager(
      navigation,
      showTransactionNotification,
      hideCurrentNotification,
      showSimpleNotification,
      removeNotificationById,
    );
    return instance;
  },
  watchSubmittedTransaction(
    transaction: WatchedTransaction,
  ): boolean | undefined {
    return instance?.watchSubmittedTransaction(transaction);
  },
  getTransactionToView(): string | undefined {
    return instance?.getTransactionToView();
  },
  setTransactionToView(id: string): void {
    instance?.setTransactionToView(id);
  },
  gotIncomingTransaction(
    incomingTransactions: TransactionMeta[],
  ): Promise<void> | undefined {
    return instance?.gotIncomingTransaction(incomingTransactions);
  },
  showSimpleNotification(data: SimpleNotificationData): number | undefined {
    return instance?.showSimpleNotification(data);
  },
  onMessageReceived(data: NotificationData): void {
    instance?.onMessageReceived(data);
  },
};
