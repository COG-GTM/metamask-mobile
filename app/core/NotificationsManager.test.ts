import { NotificationTransactionTypes } from '../util/notifications';

import NotificationManager, {
  constructTitleAndMessage,
} from './NotificationManager';
import { strings } from '../../locales/i18n';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';
import Engine from './Engine';
import { TransactionMeta } from '@metamask/transaction-controller';
import NotificationsService from '../util/notifications/services/NotificationService';
import { ChannelId } from '../util/notifications/androidChannels';
import Device from '../util/device';
import ReviewManager from './ReviewManager';
import Logger from '../util/Logger';

interface NavigationMock {
  navigate: jest.Mock;
}

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.unmock('./NotificationManager');

jest.mock('../selectors/networkController', () => ({
  ...jest.requireActual('../selectors/networkController'),
  selectEvmTicker: jest.fn(() => 'ETH'),
}));

const mockNavigate: jest.Mock = jest.fn();
const mockNavigation: NavigationMock = {
  navigate: mockNavigate,
};

const showTransactionNotification = jest.fn();
const hideCurrentNotification = jest.fn();
const showSimpleNotification = jest.fn();
const removeNotificationById = jest.fn();

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let notificationManager: any;

describe('NotificationManager', () => {
  beforeEach(() => {
    notificationManager = NotificationManager.init({
      navigation: mockNavigation,
      showTransactionNotification,
      hideCurrentNotification,
      showSimpleNotification,
      removeNotificationById,
    });
  });

  it('calling NotificationManager.init returns an instance of NotificationManager', () => {
    expect(notificationManager).toStrictEqual(notificationManager);
  });

  it('calling NotificationManager in background mode should be truthy', () => {
    notificationManager._handleAppStateChange('background');
    expect(notificationManager._backgroundMode).toBe(true);
  });

  it('calling NotificationManager onMessageReceived', () => {
    notificationManager.onMessageReceived({
      data: {
        title: 'title',
        shortDescription: 'shortDescription',
      },
    });
    expect(notificationManager.onMessageReceived).toBeInstanceOf(Function);
  });

  it('calling NotificationManager in background mode OFF should be falsy', () => {
    notificationManager._handleAppStateChange('active');
    expect(notificationManager._backgroundMode).toBe(false);
  });

  it('calling NotificationManager.showSimpleNotification with dada should be truthy', () => {
    expect(
      NotificationManager.showSimpleNotification({
        duration: 5000,
        title: 'Simple Notification',
        description: 'Simple Notification Description',
        action: 'tx',
      }),
    ).toBeTruthy();
  });

  it('calling NotificationManager.getTransactionToView should be falsy if setTransactionToView was not called before', () => {
    expect(NotificationManager.getTransactionToView()).toBeFalsy();
  });

  it('calling NotificationManager.getTransactionToView should be truthy if setTransactionToView was called before', () => {
    NotificationManager.setTransactionToView(1);
    expect(NotificationManager.getTransactionToView()).toBeTruthy();
  });

  const selectedNotificationTypes: (keyof typeof NotificationTransactionTypes)[] =
    [
      'pending',
      'pending_deposit',
      'pending_withdrawal',
      'success_withdrawal',
      'success_deposit',
      'error',
      'cancelled',
    ];
  selectedNotificationTypes.forEach((type) => {
    it(`constructs title and message for ${type}`, () => {
      const { title, message } = constructTitleAndMessage({
        type: NotificationTransactionTypes[type],
      });

      expect(title).toBe(strings(`notifications.${type}_title`));
      expect(message).toBe(strings(`notifications.${type}_message`));
    });

    it('constructs default title and message for unknown type', () => {
      const { title, message } = constructTitleAndMessage({
        type: 'unknown',
      });

      expect(title).toBe(strings('notifications.default_message_title'));
      expect(message).toBe(strings('notifications.default_message_description'));
    });
  });

  describe('smartTransactionListener', () => {
    const mockTransactionController = {
      getTransactions: jest.fn(),
      state: {
        transactions: [{
          id: '0x123',
          txParams: {
            nonce: '0x1',
            from: '0x123'
          },
          chainId: '0x1',
          time: 123,
          status: 'failed' as TransactionMeta['status'],
          error: { message: 'test error', rpc: { code: 0 }, name: 'Error' }
        }]
      }
    };

    const mockControllerMessenger = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      subscribeOnceIf: jest.fn(),
      tryUnsubscribe: jest.fn()
    };

    let showNotificationSpy: jest.SpyInstance;

    beforeAll(() => {
      // Set up spies and mocks once before all tests
      Object.defineProperty(Engine, 'context', {
        value: {
          TransactionController: mockTransactionController,
        },
        writable: true
      });

      Object.defineProperty(Engine, 'controllerMessenger', {
        value: mockControllerMessenger,
        writable: true
      });
    });

    beforeEach(() => {
      // Clear all mock interactions before each test
      jest.clearAllMocks();

      // Reset the notification manager before each test
      notificationManager = NotificationManager.init({
        navigation: mockNavigation,
        showTransactionNotification,
        hideCurrentNotification,
        showSimpleNotification,
        removeNotificationById,
      });

      // Create spy on the instance method
      showNotificationSpy = jest.spyOn(notificationManager, '_showNotification');
    });

    afterAll(() => {
      // Clean up spy after all tests are done
      showNotificationSpy.mockRestore();
    });

    it('shows a notification for a pending smart transaction', async () => {
      const transaction = {
        status: SmartTransactionStatuses.PENDING,
        transactionId: '0x123',
      };

      notificationManager.watchSubmittedTransaction({
        id: '0x123',
        txParams: {
          nonce: '0x1'
        },
        silent: false
      });

      // Get the subscriber callback
      const subscriberCallback = mockControllerMessenger.subscribe.mock.calls[0][1];
      await subscriberCallback(transaction);

      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: 'pending',
        autoHide: false,
        transaction: { id: '0x123' },
      });
    });

    it('shows a cancelled notification for cancelled smart transactions', async () => {
      const mockTransaction = {
        id: '0x123',
        txParams: {
          nonce: '0x1'
        }
      };
      mockTransactionController.getTransactions.mockReturnValue([mockTransaction]);

      const smartTransaction = {
        status: SmartTransactionStatuses.CANCELLED,
        transactionId: '0x123',
      };

      notificationManager.watchSubmittedTransaction({
        id: '0x123',
        txParams: {
          nonce: '0x1'
        },
        silent: false
      });

      // Get the subscriber callback
      const subscriberCallback = mockControllerMessenger.subscribe.mock.calls[0][1];
      await subscriberCallback(smartTransaction);

      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: 'cancelled',
        autoHide: true,
        transaction: { id: '0x123' },
        duration: 5000,
      });
    });

    it('unsubscribes from smart transaction events when status is not pending', async () => {
      const transaction = {
        status: SmartTransactionStatuses.SUCCESS,
        transactionId: '0x123',
      };

      notificationManager.watchSubmittedTransaction({
        id: '0x123',
        txParams: {
          nonce: '0x1'
        },
        silent: false
      });

      // Get the subscriber callback
      const subscriberCallback = mockControllerMessenger.subscribe.mock.calls[0][1];
      await subscriberCallback(transaction);

      expect(mockControllerMessenger.unsubscribe).toHaveBeenCalledWith(
        'SmartTransactionsController:smartTransaction',
        subscriberCallback
      );
    });

    it('sets up transaction event listeners correctly', () => {
      const transaction = {
        id: '0x123',
        txParams: {
          nonce: '0x1'
        },
        silent: false
      };

      notificationManager.watchSubmittedTransaction(transaction);

      expect(mockControllerMessenger.subscribeOnceIf).toHaveBeenCalledTimes(3);
      expect(mockControllerMessenger.subscribeOnceIf).toHaveBeenCalledWith(
        'TransactionController:transactionConfirmed',
        expect.any(Function),
        expect.any(Function)
      );
      expect(mockControllerMessenger.subscribeOnceIf).toHaveBeenCalledWith(
        'TransactionController:transactionFailed',
        expect.any(Function),
        expect.any(Function)
      );
      expect(mockControllerMessenger.subscribeOnceIf).toHaveBeenCalledWith(
        'TransactionController:speedupTransactionAdded',
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  describe('transaction lifecycle callbacks', () => {
    const TX_ID = '0x123';
    const SPEEDUP_TX_ID = '0x456';
    const CHAIN_ID = '0x1';

    const mockTransactionController = {
      getTransactions: jest.fn(),
      state: {
        transactions: [
          { id: TX_ID, txParams: { nonce: '0x1' }, chainId: CHAIN_ID },
          { id: SPEEDUP_TX_ID, txParams: { nonce: '0x1' }, chainId: CHAIN_ID },
        ],
      },
    };
    const mockAccountTrackerController = { refresh: jest.fn() };
    const mockTokenBalancesController = { updateBalancesByChainId: jest.fn() };
    const mockTokenDetectionController = { detectTokens: jest.fn() };

    const mockControllerMessenger = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      subscribeOnceIf: jest.fn(),
      tryUnsubscribe: jest.fn(),
    };

    let showNotificationSpy: jest.SpyInstance;
    let promptReviewSpy: jest.SpyInstance;

    const getSubscription = (eventType: string) => {
      const call = mockControllerMessenger.subscribeOnceIf.mock.calls.find(
        ([event]) => event === eventType,
      );
      if (!call) {
        throw new Error(`No subscribeOnceIf call for ${eventType}`);
      }
      const [, handler, predicate] = call;
      return { handler, predicate };
    };

    const watchTransaction = (overrides = {}) =>
      notificationManager.watchSubmittedTransaction({
        id: TX_ID,
        txParams: { nonce: '0x1' },
        silent: false,
        ...overrides,
      });

    const confirmedMeta = {
      id: TX_ID,
      chainId: CHAIN_ID,
      txParams: { nonce: '0x1' },
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.clearAllMocks();

      Object.defineProperty(Engine, 'context', {
        value: {
          TransactionController: mockTransactionController,
          AccountTrackerController: mockAccountTrackerController,
          TokenBalancesController: mockTokenBalancesController,
          TokenDetectionController: mockTokenDetectionController,
        },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(Engine, 'controllerMessenger', {
        value: mockControllerMessenger,
        writable: true,
        configurable: true,
      });

      notificationManager = NotificationManager.init({
        navigation: mockNavigation,
        showTransactionNotification,
        hideCurrentNotification,
        showSimpleNotification,
        removeNotificationById,
      });
      notificationManager._transactionsWatchTable = {};
      notificationManager._backgroundMode = false;

      showNotificationSpy = jest.spyOn(
        notificationManager,
        '_showNotification',
      );
      promptReviewSpy = jest
        .spyOn(ReviewManager, 'promptReview')
        .mockResolvedValue(undefined);
    });

    afterEach(() => {
      showNotificationSpy.mockRestore();
      promptReviewSpy.mockRestore();
      jest.useRealTimers();
    });

    it.each([
      'TransactionController:transactionConfirmed',
      'TransactionController:transactionFailed',
      'TransactionController:speedupTransactionAdded',
    ])('only handles %s events for the watched transaction id', (eventType) => {
      watchTransaction();

      const { predicate } = getSubscription(eventType);

      expect(predicate({ id: TX_ID })).toBe(true);
      expect(predicate({ id: '0xother' })).toBe(false);
    });

    it('shows the pending notification and records the tx in the watch table', () => {
      watchTransaction();

      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: 'pending',
        autoHide: false,
        transaction: { id: TX_ID },
      });
      expect(notificationManager._transactionsWatchTable).toStrictEqual({
        '0x1': [TX_ID],
      });
    });

    it('on confirmation shows success, refreshes balances and prompts review after 2s', () => {
      watchTransaction();
      showNotificationSpy.mockClear();

      getSubscription('TransactionController:transactionConfirmed').handler(
        confirmedMeta,
      );

      expect(removeNotificationById).toHaveBeenCalledWith(TX_ID);
      expect(showNotificationSpy).not.toHaveBeenCalled();
      expect(mockAccountTrackerController.refresh).not.toHaveBeenCalled();

      jest.advanceTimersByTime(2000);

      expect(showNotificationSpy).toHaveBeenCalledTimes(1);
      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: 'success',
        autoHide: true,
        transaction: { id: TX_ID, nonce: '1' },
        duration: 5000,
      });
      expect(mockAccountTrackerController.refresh).toHaveBeenCalledTimes(1);
      expect(
        mockTokenBalancesController.updateBalancesByChainId,
      ).toHaveBeenCalledWith({ chainId: CHAIN_ID });
      expect(mockTokenDetectionController.detectTokens).not.toHaveBeenCalled();
      expect(promptReviewSpy).toHaveBeenCalledTimes(1);
      expect(mockControllerMessenger.tryUnsubscribe).toHaveBeenCalledWith(
        'TransactionController:transactionConfirmed',
        notificationManager._transactionConfirmedListener,
      );
      expect(notificationManager._transactionsWatchTable).toStrictEqual({});
    });

    it('on confirmation of an ERC20 transaction also detects tokens on the tx chain', () => {
      watchTransaction({ assetType: 'ERC20' });

      getSubscription('TransactionController:transactionConfirmed').handler(
        confirmedMeta,
      );
      jest.advanceTimersByTime(2000);

      expect(mockTokenDetectionController.detectTokens).toHaveBeenCalledWith({
        chainIds: [CHAIN_ID],
      });
      expect(mockAccountTrackerController.refresh).toHaveBeenCalledTimes(1);
    });

    it('on confirmation does nothing after hiding pending if the nonce has no watched txs', () => {
      notificationManager._transactionsWatchTable = { '0x1': [] };

      notificationManager._confirmedCallback(confirmedMeta, { id: TX_ID });
      jest.advanceTimersByTime(2000);

      expect(removeNotificationById).toHaveBeenCalledWith(TX_ID);
      expect(showNotificationSpy).not.toHaveBeenCalled();
      expect(mockAccountTrackerController.refresh).not.toHaveBeenCalled();
      expect(promptReviewSpy).not.toHaveBeenCalled();
    });

    it.each([
      ['failed', 'error'],
      ['cancelled', 'cancelled'],
    ])(
      'on failure with status %s shows a %s notification and clears the watch table',
      (status, expectedType) => {
        watchTransaction();
        showNotificationSpy.mockClear();

        getSubscription('TransactionController:transactionFailed').handler({
          id: TX_ID,
          status,
          txParams: { nonce: '0x1' },
        });

        expect(removeNotificationById).toHaveBeenCalledWith(TX_ID);
        expect(showNotificationSpy).not.toHaveBeenCalled();

        jest.advanceTimersByTime(2000);

        expect(showNotificationSpy).toHaveBeenCalledTimes(1);
        expect(showNotificationSpy).toHaveBeenCalledWith({
          type: expectedType,
          autoHide: true,
          transaction: { id: TX_ID },
          duration: 5000,
        });
        expect(mockControllerMessenger.tryUnsubscribe).toHaveBeenCalledWith(
          'TransactionController:transactionFailed',
          notificationManager._transactionFailedListener,
        );
        expect(notificationManager._transactionsWatchTable).toStrictEqual({});
      },
    );

    it('on failure of an unwatched nonce only hides the pending notification', () => {
      notificationManager._failedCallback({
        id: TX_ID,
        status: 'failed',
        txParams: { nonce: '0x9' },
      });
      jest.advanceTimersByTime(2000);

      expect(removeNotificationById).toHaveBeenCalledWith(TX_ID);
      expect(showNotificationSpy).not.toHaveBeenCalled();
    });

    it('on speedup watches the replacement tx without a pending notification and shows speedup after 2s', () => {
      watchTransaction();
      showNotificationSpy.mockClear();
      const { handler } = getSubscription(
        'TransactionController:speedupTransactionAdded',
      );
      mockControllerMessenger.subscribeOnceIf.mockClear();

      handler({ id: SPEEDUP_TX_ID, txParams: { nonce: '0x1' } });

      expect(showNotificationSpy).not.toHaveBeenCalled();
      expect(notificationManager._transactionsWatchTable).toStrictEqual({
        '0x1': [TX_ID, SPEEDUP_TX_ID],
      });
      expect(
        getSubscription('TransactionController:transactionConfirmed').predicate(
          { id: SPEEDUP_TX_ID },
        ),
      ).toBe(true);

      jest.advanceTimersByTime(2000);

      expect(showNotificationSpy).toHaveBeenCalledTimes(1);
      expect(showNotificationSpy).toHaveBeenCalledWith({
        autoHide: false,
        type: 'speedup',
        transaction: { id: SPEEDUP_TX_ID, nonce: '1' },
      });
    });
  });

  describe('gotIncomingTransaction', () => {
    const NOW = 1_700_000_000_000;
    const SELECTED_ADDRESS = '0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb';
    const OTHER_ADDRESS = '0xdc738206f559bdae106894a62876a119e470aee2';
    const ONE_ETH_HEX = '0xde0b6b3a7640000';

    const mockAccountTrackerController = { refresh: jest.fn() };
    const mockAccountsController = {
      getSelectedAccount: jest.fn(() => ({ address: SELECTED_ADDRESS })),
    };

    const buildTx = (overrides: Record<string, unknown> = {}) => ({
      id: 'valid',
      status: 'confirmed',
      time: NOW - 60 * 1000,
      txParams: {
        from: OTHER_ADDRESS,
        to: SELECTED_ADDRESS,
        nonce: '0x5',
        value: ONE_ETH_HEX,
      },
      ...overrides,
    });

    let showNotificationSpy: jest.SpyInstance;
    let dateNowSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      Object.defineProperty(Engine, 'context', {
        value: {
          AccountTrackerController: mockAccountTrackerController,
          AccountsController: mockAccountsController,
        },
        writable: true,
        configurable: true,
      });

      notificationManager = NotificationManager.init({
        navigation: mockNavigation,
        showTransactionNotification,
        hideCurrentNotification,
        showSimpleNotification,
        removeNotificationById,
      });
      notificationManager._backgroundMode = false;
      showNotificationSpy = jest.spyOn(
        notificationManager,
        '_showNotification',
      );
      dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW);
    });

    afterEach(() => {
      showNotificationSpy.mockRestore();
      dateNowSpy.mockRestore();
    });

    const nonMatchingTxs = () => [
      buildTx({
        id: 'wrong-to',
        txParams: { ...buildTx().txParams, to: OTHER_ADDRESS },
      }),
      buildTx({
        id: 'self-sent',
        txParams: { ...buildTx().txParams, from: SELECTED_ADDRESS },
      }),
      buildTx({ id: 'unconfirmed', status: 'submitted' }),
      buildTx({ id: 'too-old', time: NOW - 10 * 60 * 1000 - 1 }),
    ];

    it('notifies only for a recent confirmed tx sent to the selected account by someone else', async () => {
      await NotificationManager.gotIncomingTransaction([
        buildTx(),
        ...nonMatchingTxs(),
      ]);

      expect(showNotificationSpy).toHaveBeenCalledTimes(1);
      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: 'received',
        transaction: {
          nonce: '5',
          amount: '1',
          id: 'valid',
          assetType: 'ETH',
        },
        autoHide: true,
        duration: 7000,
      });
      expect(mockAccountTrackerController.refresh).toHaveBeenCalledTimes(1);
    });

    it.each(nonMatchingTxs().map((tx) => [tx.id, tx]))(
      'does not notify for a %s transaction',
      async (_id, tx) => {
        await NotificationManager.gotIncomingTransaction([tx]);

        expect(showNotificationSpy).not.toHaveBeenCalled();
        expect(mockAccountTrackerController.refresh).not.toHaveBeenCalled();
      },
    );

    it('notifies for the last matching tx in the list', async () => {
      const txs = [
        buildTx({ id: 'first' }),
        buildTx({
          id: 'last',
          txParams: { ...buildTx().txParams, nonce: '0xa', value: '0x0' },
        }),
      ];

      await NotificationManager.gotIncomingTransaction(txs);

      expect(showNotificationSpy).toHaveBeenCalledTimes(1);
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction: expect.objectContaining({
            id: 'last',
            nonce: '10',
            amount: '0',
          }),
        }),
      );
    });

    it('does not notify or refresh when no tx matches', async () => {
      await NotificationManager.gotIncomingTransaction([
        buildTx({ status: 'failed' }),
      ]);
      await NotificationManager.gotIncomingTransaction([]);

      expect(showNotificationSpy).not.toHaveBeenCalled();
      expect(mockAccountTrackerController.refresh).not.toHaveBeenCalled();
    });

    it('logs and swallows errors', async () => {
      const error = new Error('no account');
      mockAccountsController.getSelectedAccount.mockImplementationOnce(() => {
        throw error;
      });
      const loggerSpy = jest
        .spyOn(Logger, 'log')
        .mockImplementation(() => undefined);

      await expect(
        NotificationManager.gotIncomingTransaction([buildTx()]),
      ).resolves.toBeUndefined();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Notifications',
        'Error while processing incoming transaction',
        error,
      );
      expect(showNotificationSpy).not.toHaveBeenCalled();
      loggerSpy.mockRestore();
    });
  });

  describe('_showNotification', () => {
    let displayNotificationSpy: jest.SpyInstance;
    let isAndroidSpy: jest.SpyInstance;

    const successData = {
      type: 'success',
      autoHide: true,
      transaction: { id: '0x123', nonce: '1' },
      duration: 5000,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      notificationManager = NotificationManager.init({
        navigation: mockNavigation,
        showTransactionNotification,
        hideCurrentNotification,
        showSimpleNotification,
        removeNotificationById,
      });
      notificationManager._transactionToView = [];
      displayNotificationSpy = jest
        .spyOn(NotificationsService, 'displayNotification')
        .mockResolvedValue(undefined);
      isAndroidSpy = jest.spyOn(Device, 'isAndroid');
    });

    afterEach(() => {
      notificationManager._backgroundMode = false;
      displayNotificationSpy.mockRestore();
      isAndroidSpy.mockRestore();
    });

    it('shows an in-app transaction notification in the foreground', async () => {
      notificationManager._handleAppStateChange('active');

      await notificationManager._showNotification(successData);

      expect(showTransactionNotification).toHaveBeenCalledWith({
        autodismiss: 5000,
        transaction: successData.transaction,
        status: 'success',
      });
      expect(displayNotificationSpy).not.toHaveBeenCalled();
    });

    it.each([
      ['Android', true, { tag: JSON.stringify({ action: 'tx', id: '0x123' }) }],
      ['iOS', false, { userInfo: { action: 'tx', id: '0x123' } }],
    ])(
      'sends a push notification in the background on %s',
      async (_platform, isAndroid, platformFields) => {
        isAndroidSpy.mockReturnValue(isAndroid);
        notificationManager._handleAppStateChange('background');

        await notificationManager._showNotification(successData);

        expect(displayNotificationSpy).toHaveBeenCalledTimes(1);
        const payload = displayNotificationSpy.mock.calls[0][0];
        expect(payload).toStrictEqual({
          channelId: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
          title: strings('notifications.success_title', { nonce: '1' }),
          body: strings('notifications.success_message'),
          data: { id: '0x123', nonce: '1', action: 'tx' },
          ...platformFields,
        });
        expect(notificationManager._transactionToView).toStrictEqual(['0x123']);
        expect(showTransactionNotification).not.toHaveBeenCalled();
      },
    );

    it('does not queue a transaction to view when the push has no tx id', async () => {
      isAndroidSpy.mockReturnValue(true);
      notificationManager._handleAppStateChange('background');

      await notificationManager._showNotification({
        type: 'received',
        transaction: { amount: '1', assetType: 'ETH' },
      });

      expect(displayNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { amount: '1', assetType: 'ETH', action: 'tx', id: '' },
        }),
      );
      expect(notificationManager._transactionToView).toStrictEqual([]);
    });
  });
});
