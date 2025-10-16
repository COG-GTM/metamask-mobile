import Engine from './Engine';
import { hexToBN, renderFromWei } from '../util/number';
import { strings } from '../../locales/i18n';
import { AppState, type AppStateStatus } from 'react-native';
import NotificationsService from '../util/notifications/services/NotificationService';
import { NotificationTransactionTypes, ChannelId } from '../util/notifications';
import { safeToChecksumAddress } from '../util/address';
import ReviewManager from './ReviewManager';
import { selectEvmTicker } from '../selectors/networkController';
import { store } from '../store';
import { getTicker } from '../../app/util/transactions';
import {
  SmartTransactionStatuses,
  type SmartTransaction,
} from '@metamask/smart-transactions-controller/dist/types';
import Logger from '../util/Logger';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';

interface NotificationTransaction {
  id?: string;
  nonce?: string;
  amount?: string;
  assetType?: string;
}

interface NotificationData {
  type: string;
  transaction?: NotificationTransaction;
  data?: {
    title?: string;
    shortDescription?: string;
  };
  duration?: number;
  autoHide?: boolean;
  silent?: boolean;
}

interface TitleAndMessage {
  title: string;
  message: string;
}

export const constructTitleAndMessage = (
  notification: NotificationData,
): TitleAndMessage => {
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

interface NavigationProp {
  navigate: (view: string) => void;
}

interface ShowTransactionNotificationParams {
  autodismiss?: number;
  transaction: NotificationTransaction;
  status: string;
}

interface ShowSimpleNotificationParams {
  id: string | number;
  autodismiss?: number;
  title: string;
  description: string;
  status: string;
}

type SubscriptionUnsubscribe = () => void;

class NotificationManager {
  static instance: NotificationManager | undefined;

  private _navigation!: NavigationProp;
  private _showTransactionNotification!: (
    params: ShowTransactionNotificationParams,
  ) => void;
  private _hideTransactionNotification!: () => void;
  private _showSimpleNotification!: (params: ShowSimpleNotificationParams) => void;
  private _removeNotificationById!: (id: string) => void;
  private _transactionToView!: string[];
  private _backgroundMode!: boolean;
  private _transactionsWatchTable: Record<string, string[]> = {};
  private _transactionFailedListener?: SubscriptionUnsubscribe;
  private _transactionConfirmedListener?: SubscriptionUnsubscribe;
  private _transactionSpeedupListener?: SubscriptionUnsubscribe;

  private _handleAppStateChange = (appState: AppStateStatus): void => {
    this._backgroundMode = appState === 'background';
  };

  private _viewTransaction = (id: string): void => {
    this._transactionToView.push(id);
    this.goTo('TransactionsHome');
  };

  private _removeListeners = (): void => {
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

  private _showNotification = async (data: NotificationData): Promise<void> => {
    if (this._backgroundMode) {
      const { title, message } = constructTitleAndMessage(data);
      const id = data?.transaction?.id || '';
      if (id) {
        this._transactionToView.push(id);
      }

      const extraData = { action: 'tx', id };
      const notificationData = { ...data?.transaction, ...extraData };

      await NotificationsService.displayNotification({
        channelId: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
        title,
        body: message,
        data: notificationData,
        id,
      });
    } else if (data.transaction) {
      this._showTransactionNotification({
        autodismiss: data.duration,
        transaction: data.transaction,
        status: data.type,
      });
    }
  };

  private _failedCallback = (transactionMeta: TransactionMeta): void => {
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

  private _confirmedCallback = (
    transactionMeta: TransactionMeta,
    originalTransaction: TransactionMeta & { assetType?: string; silent?: boolean },
  ): void => {
    // Once it's confirmed we hide the pending tx notification
    this._removeNotificationById(transactionMeta.id);
    const nonce = transactionMeta.txParams.nonce;
    if (!nonce) return;

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
        } = Engine.context;
        // account balances for ETH txs
        // Detect assets and tokens for ERC20 txs
        // Detect assets for ERC721 txs
        // right after a transaction was confirmed
        const pollPromises = [
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
        delete this._transactionsWatchTable[nonce];
      }, 2000);
  };

  private _speedupCallback = (transactionMeta: TransactionMeta): void => {
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

  constructor(
    _navigation: NavigationProp,
    _showTransactionNotification: (
      params: ShowTransactionNotificationParams,
    ) => void,
    _hideTransactionNotification: () => void,
    _showSimpleNotification: (params: ShowSimpleNotificationParams) => void,
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

  goTo(view: string): void {
    this._navigation.navigate(view);
  }

  onMessageReceived(data: NotificationData): void {
    this._showNotification(data);
  }

  getTransactionToView = (): string | undefined => this._transactionToView.pop();

  setTransactionToView = (id: string): void => {
    this._transactionToView.push(id);
  };

  showSimpleNotification = (data: {
    duration?: number;
    title: string;
    description: string;
    status: string;
  }): number => {
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

  watchSubmittedTransaction(
    transaction: TransactionMeta & { silent?: boolean },
    speedUp = false,
  ): boolean | undefined {
    if (transaction.silent) return false;
    const { TransactionController } = Engine.context;
    const transactionMeta = TransactionController.state.transactions.find(
      ({ id }) => id === transaction.id,
    );

    if (!transactionMeta) return false;

    const nonce = transactionMeta.txParams.nonce;
    if (!nonce) return false;

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
        (confirmedMeta) => {
          this._confirmedCallback(confirmedMeta, transaction);
        },
        (confirmedMeta) => confirmedMeta.id === transaction.id,
      ) as unknown as SubscriptionUnsubscribe;

    this._transactionFailedListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:transactionFailed',
        (payload) => {
          this._failedCallback(payload.transactionMeta);
        },
        (payload) => payload.transactionMeta.id === transaction.id,
      ) as unknown as SubscriptionUnsubscribe;

    this._transactionSpeedupListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:speedupTransactionAdded',
        (speedupMeta) => {
          this._speedupCallback(speedupMeta);
        },
        (speedupMeta) => speedupMeta.id === transaction.id,
      ) as unknown as SubscriptionUnsubscribe;

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
      const transactions = TransactionController.getTransactions({});
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

  gotIncomingTransaction = async (
    incomingTransactions: TransactionMeta[],
  ): Promise<void> => {
    try {
      const { AccountsController } = Engine.context;

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
            tx.txParams?.to &&
            safeToChecksumAddress(tx.txParams.to) ===
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
  navigation: NavigationProp;
  showTransactionNotification: (
    params: ShowTransactionNotificationParams,
  ) => void;
  hideCurrentNotification: () => void;
  showSimpleNotification: (params: ShowSimpleNotificationParams) => void;
  removeNotificationById: (id: string) => void;
}

export default {
  init(params: NotificationManagerInitParams): NotificationManager {
    instance = new NotificationManager(
      params.navigation,
      params.showTransactionNotification,
      params.hideCurrentNotification,
      params.showSimpleNotification,
      params.removeNotificationById,
    );
    return instance;
  },
  watchSubmittedTransaction(
    transaction: TransactionMeta & { silent?: boolean },
  ): boolean | undefined {
    return instance?.watchSubmittedTransaction(transaction);
  },
  getTransactionToView(): string | undefined {
    return instance?.getTransactionToView();
  },
  setTransactionToView(id: string): void {
    return instance?.setTransactionToView(id);
  },
  gotIncomingTransaction(
    incomingTransactions: TransactionMeta[],
  ): Promise<void> | undefined {
    return instance?.gotIncomingTransaction(incomingTransactions);
  },
  showSimpleNotification(data: {
    duration?: number;
    title: string;
    description: string;
    status: string;
  }): number | undefined {
    return instance?.showSimpleNotification(data);
  },
  onMessageReceived(data: NotificationData): void | undefined {
    return instance?.onMessageReceived(data);
  },
};
