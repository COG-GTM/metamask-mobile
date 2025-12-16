'use strict';

import Engine from './Engine';
import { hexToBN, renderFromWei } from '../util/number';
import Device from '../util/device';
import { strings } from '../../locales/i18n';
import { AppState, AppStateStatus } from 'react-native';
import NotificationsService from '../util/notifications/services/NotificationService';
import {
  NotificationTransactionTypes,
  ChannelId,
} from '../util/notifications';
import { safeToChecksumAddress } from '../util/address';
import ReviewManager from './ReviewManager';
import { selectEvmTicker } from '../selectors/networkController';
import { store } from '../store';
import { getTicker } from '../../app/util/transactions';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';

import Logger from '../util/Logger';
import { TransactionStatus, TransactionMeta } from '@metamask/transaction-controller';

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
  };
  duration?: number;
  autoHide?: boolean;
}

interface TransactionNotificationData {
  autodismiss?: number;
  transaction?: NotificationTransaction;
  status?: string;
}

interface SimpleNotificationData {
  id?: number;
  autodismiss?: number;
  title?: string;
  description?: string;
  status?: string;
  duration?: number;
}

interface WatchedTransaction {
  id: string;
  silent?: boolean;
  assetType?: string;
}

interface TransactionsWatchTable {
  [nonce: string]: string[];
}

interface Navigation {
  navigate: (view: string) => void;
}

type ShowTransactionNotificationFn = (data: TransactionNotificationData) => void;
type HideTransactionNotificationFn = () => void;
type ShowSimpleNotificationFn = (data: SimpleNotificationData) => void;
type RemoveNotificationByIdFn = (id: string) => void;

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

class NotificationManager {
  private static instance: NotificationManager | null = null;
  private _navigation: Navigation | null = null;
  private _transactionToView: string[] = [];
  private _backgroundMode: boolean = false;
  private _transactionsWatchTable: TransactionsWatchTable = {};
  private _transactionFailedListener: (() => void) | null = null;
  private _transactionConfirmedListener: (() => void) | null = null;
  private _transactionSpeedupListener: (() => void) | null = null;
  private _showTransactionNotification: ShowTransactionNotificationFn | null =
    null;
  private _hideTransactionNotification: HideTransactionNotificationFn | null =
    null;
  private _showSimpleNotification: ShowSimpleNotificationFn | null = null;
  private _removeNotificationById: RemoveNotificationByIdFn | null = null;

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
      this._transactionConfirmedListener as () => void,
    );

    Engine.controllerMessenger.tryUnsubscribe(
      'TransactionController:transactionFailed',
      this._transactionFailedListener as () => void,
    );

    Engine.controllerMessenger.tryUnsubscribe(
      'TransactionController:speedupTransactionAdded',
      this._transactionSpeedupListener as () => void,
    );
  };

  private _showNotification = async (data: NotificationData): Promise<void> => {
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
      this._showTransactionNotification?.({
        autodismiss: data.duration,
        transaction: data.transaction,
        status: data.type,
      });
    }
  };

  private _failedCallback = (transactionMeta: TransactionMeta): void => {
    this._removeNotificationById?.(transactionMeta.id);
    const transaction =
      this._transactionsWatchTable[transactionMeta.txParams.nonce as string];
    transaction &&
      transaction.length &&
      setTimeout(() => {
        this._showNotification({
          type:
            transactionMeta.status === 'cancelled' ? 'cancelled' : 'error',
          autoHide: true,
          transaction: { id: transactionMeta.id },
          duration: 5000,
        });
        this._removeListeners();
        delete this._transactionsWatchTable[
          transactionMeta.txParams.nonce as string
        ];
      }, 2000);
  };

  private _confirmedCallback = (
    transactionMeta: TransactionMeta,
    originalTransaction: WatchedTransaction,
  ): void => {
    this._removeNotificationById?.(transactionMeta.id);
    this._transactionsWatchTable[transactionMeta.txParams.nonce as string]
      ?.length &&
      setTimeout(() => {
        this._showNotification({
          type: 'success',
          autoHide: true,
          transaction: {
            id: transactionMeta.id,
            nonce: `${hexToBN(transactionMeta.txParams.nonce as string).toString()}`,
          },
          duration: 5000,
        });
        this._removeListeners();

        const {
          TokenBalancesController,
          TokenDetectionController,
          AccountTrackerController,
        } = Engine.context;
        const pollPromises: Promise<void>[] = [
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

        ReviewManager.promptReview();

        this._removeListeners();
        delete this._transactionsWatchTable[
          transactionMeta.txParams.nonce as string
        ];
      }, 2000);
  };

  private _speedupCallback = (transactionMeta: TransactionMeta): void => {
    this.watchSubmittedTransaction(
      { id: transactionMeta.id } as WatchedTransaction,
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

  goTo(view: string): void {
    this._navigation?.navigate(view);
  }

  onMessageReceived(data: NotificationData): void {
    this._showNotification(data);
  }

  getTransactionToView = (): string | undefined => this._transactionToView.pop();

  setTransactionToView = (id: string): void => {
    this._transactionToView.push(id);
  };

  showSimpleNotification = (data: SimpleNotificationData): number => {
    const id = Date.now();
    this._showSimpleNotification?.({
      id,
      autodismiss: data.duration,
      title: data.title,
      description: data.description,
      status: data.status,
    });
    return id;
  };

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
        (txMeta: TransactionMeta) => {
          this._failedCallback(txMeta);
        },
        (txMeta: TransactionMeta) => txMeta.id === transaction.id,
      );

    this._transactionSpeedupListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:speedupTransactionAdded',
        (txMeta: TransactionMeta) => {
          this._speedupCallback(txMeta);
        },
        (txMeta: TransactionMeta) => txMeta.id === transaction.id,
      );

    interface SmartTransaction {
      status: string;
      transactionId: string;
    }

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
        return;
      }
      const transactions = TransactionController.getTransactions({
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

    return undefined;
  }

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

let instance: NotificationManager | null = null;

interface InitOptions {
  navigation: Navigation;
  showTransactionNotification: ShowTransactionNotificationFn;
  hideCurrentNotification: HideTransactionNotificationFn;
  showSimpleNotification: ShowSimpleNotificationFn;
  removeNotificationById: RemoveNotificationByIdFn;
}

export default {
  init({
    navigation,
    showTransactionNotification,
    hideCurrentNotification,
    showSimpleNotification,
    removeNotificationById,
  }: InitOptions): NotificationManager {
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
