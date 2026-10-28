import { NotificationTransactionTypes } from '../util/notifications';

import NotificationManager, {
  constructTitleAndMessage,
} from './NotificationManager';
import { strings } from '../../locales/i18n';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';
import Engine from './Engine';
import { TransactionMeta } from '@metamask/transaction-controller';
import { EventConstraint } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from './ExtendedControllerMessenger';

interface NavigationMock {
  navigate: jest.Mock;
}

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.unmock('./NotificationManager');

jest.mock('./ReviewManager', () => ({
  promptReview: jest.fn(),
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

  it('calling NotificationManager in _failedCallback mode should call _showNotification', () => {
    notificationManager._failedCallback({
      id: 1,
      txParams: {
        nonce: 1,
      },
    });
    expect(notificationManager._showNotification).toBeInstanceOf(Function);
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

    it('shows a pending notification when a transaction is watched', () => {
      notificationManager.watchSubmittedTransaction({
        id: '0x123',
        txParams: {
          nonce: '0x1',
        },
        silent: false,
      });

      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: 'pending',
        autoHide: false,
        transaction: { id: '0x123' },
      });
    });

    it('subscribes to smart transaction events filtered by transaction id and non-pending status', () => {
      notificationManager.watchSubmittedTransaction({
        id: '0x123',
        txParams: {
          nonce: '0x1',
        },
        silent: false,
      });

      expect(mockControllerMessenger.subscribe).not.toHaveBeenCalled();
      const stxCall = mockControllerMessenger.subscribeOnceIf.mock.calls.find(
        ([eventType]) =>
          eventType === 'SmartTransactionsController:smartTransaction',
      );
      expect(stxCall).toBeDefined();
      const criteria = stxCall[2];
      expect(
        criteria({
          transactionId: '0x123',
          status: SmartTransactionStatuses.CANCELLED,
        }),
      ).toBe(true);
      expect(
        criteria({
          transactionId: '0x123',
          status: SmartTransactionStatuses.SUCCESS,
        }),
      ).toBe(true);
      expect(
        criteria({
          transactionId: '0x123',
          status: SmartTransactionStatuses.PENDING,
        }),
      ).toBe(false);
      expect(
        criteria({
          transactionId: '0x456',
          status: SmartTransactionStatuses.CANCELLED,
        }),
      ).toBe(false);
    });

    describe('with a real controller messenger', () => {
      const STX_EVENT = 'SmartTransactionsController:smartTransaction';
      let messenger: ExtendedControllerMessenger<never, EventConstraint>;
      const publish = (eventType: string, payload: Record<string, unknown>) =>
        (
          messenger as unknown as {
            publish: (type: string, data: Record<string, unknown>) => void;
          }
        ).publish(eventType, payload);
      let subscribeSpy: jest.SpyInstance;
      let unsubscribeSpy: jest.SpyInstance;

      const watch = (
        id: string,
        nonce: string,
        from = '0x123',
        chainId = '0x1',
      ) => {
        mockTransactionController.state.transactions.push({
          ...mockTransactionController.state.transactions[0],
          id,
          chainId,
          txParams: { nonce, from },
        });
        notificationManager.watchSubmittedTransaction({
          id,
          txParams: { nonce },
          silent: false,
        });
      };

      const publishStx = (transactionId: string, status: string) =>
        publish(STX_EVENT, { transactionId, status });

      const cancelledNotifications = () =>
        showNotificationSpy.mock.calls.filter(
          ([data]) => data.type === 'cancelled',
        );

      const stxHandlerCount = () =>
        subscribeSpy.mock.calls.filter(([e]) => e === STX_EVENT).length -
        unsubscribeSpy.mock.calls.filter(([e]) => e === STX_EVENT).length;

      const originalTransactions = [
        ...mockTransactionController.state.transactions,
      ];

      beforeEach(() => {
        jest.useFakeTimers();
        messenger = new ExtendedControllerMessenger();
        subscribeSpy = jest.spyOn(messenger, 'subscribe');
        unsubscribeSpy = jest.spyOn(messenger, 'unsubscribe');
        Object.defineProperty(Engine, 'controllerMessenger', {
          value: messenger,
          writable: true,
        });
        Object.defineProperty(Engine, 'context', {
          value: {
            TransactionController: mockTransactionController,
            AccountTrackerController: { refresh: jest.fn() },
            TokenBalancesController: { updateBalancesByChainId: jest.fn() },
            TokenDetectionController: { detectTokens: jest.fn() },
          },
          writable: true,
        });
        notificationManager._transactionsWatchTable = {};
        notificationManager._smartTransactionListeners = {};
        mockTransactionController.state.transactions = [
          ...originalTransactions,
        ];
        mockTransactionController.getTransactions.mockImplementation(
          () => mockTransactionController.state.transactions,
        );
      });

      afterEach(() => {
        jest.useRealTimers();
        Object.defineProperty(Engine, 'controllerMessenger', {
          value: mockControllerMessenger,
          writable: true,
        });
        Object.defineProperty(Engine, 'context', {
          value: { TransactionController: mockTransactionController },
          writable: true,
        });
      });

      it('shows a cancelled notification for a cancelled smart transaction and then unsubscribes', () => {
        watch('0x123', '0x1');
        expect(stxHandlerCount()).toBe(1);

        publishStx('0x123', SmartTransactionStatuses.CANCELLED);

        expect(cancelledNotifications()).toStrictEqual([
          [
            {
              type: 'cancelled',
              autoHide: true,
              transaction: { id: '0x123' },
              duration: 5000,
            },
          ],
        ]);
        expect(stxHandlerCount()).toBe(0);
        expect(notificationManager._smartTransactionListeners).toStrictEqual(
          {},
        );

        publishStx('0x123', SmartTransactionStatuses.CANCELLED);
        expect(cancelledNotifications()).toHaveLength(1);
      });

      it('ignores pending events and events for other transactions', () => {
        watch('0x123', '0x1');

        publishStx('0x123', SmartTransactionStatuses.PENDING);
        publishStx('0x456', SmartTransactionStatuses.CANCELLED);

        expect(cancelledNotifications()).toHaveLength(0);
        expect(stxHandlerCount()).toBe(1);
      });

      it('unsubscribes without notifying on a successful smart transaction', () => {
        watch('0x123', '0x1');

        publishStx('0x123', SmartTransactionStatuses.SUCCESS);

        expect(cancelledNotifications()).toHaveLength(0);
        expect(stxHandlerCount()).toBe(0);
      });

      it('only runs the handler of the matching transaction when many are watched', () => {
        ['0xa', '0xb', '0xc', '0xd', '0xe'].forEach((id, i) =>
          watch(id, `0x${i + 10}`),
        );
        expect(stxHandlerCount()).toBe(5);

        publishStx('0xc', SmartTransactionStatuses.CANCELLED);

        expect(cancelledNotifications()).toHaveLength(1);
        expect(cancelledNotifications()[0][0].transaction).toStrictEqual({
          id: '0xc',
        });
        expect(stxHandlerCount()).toBe(4);
        expect(
          mockTransactionController.getTransactions,
        ).not.toHaveBeenCalled();
      });

      it('does not leak smart transaction listeners for regular transactions that confirm or fail', () => {
        watch('0x1', '0x1');
        watch('0x2', '0x2');
        expect(stxHandlerCount()).toBe(2);

        publish('TransactionController:transactionConfirmed', {
          id: '0x1',
          chainId: '0x1',
          txParams: { nonce: '0x1', from: '0x123' },
        });
        publish('TransactionController:transactionFailed', {
          id: '0x2',
          status: 'failed',
          chainId: '0x1',
          txParams: { nonce: '0x2', from: '0x123' },
        });
        jest.runAllTimers();

        expect(stxHandlerCount()).toBe(0);
        expect(notificationManager._smartTransactionListeners).toStrictEqual(
          {},
        );

        publishStx('0x1', SmartTransactionStatuses.CANCELLED);
        publishStx('0x2', SmartTransactionStatuses.CANCELLED);
        expect(cancelledNotifications()).toHaveLength(0);
      });

      it('removes the original transaction listener when its speed-up confirms', () => {
        watch('0x1', '0x1');
        watch('0x1-speedup', '0x1');
        expect(stxHandlerCount()).toBe(2);

        publish('TransactionController:transactionConfirmed', {
          id: '0x1-speedup',
          chainId: '0x1',
          txParams: { nonce: '0x1', from: '0x123' },
        });
        jest.runAllTimers();

        expect(stxHandlerCount()).toBe(0);
      });

      it('keeps listeners of unrelated transactions that share the nonce', () => {
        watch('0xalice', '0x1', '0xA11CE', '0x1');
        watch('0xbob', '0x1', '0xb0b', '0x1');
        watch('0xalice-other-chain', '0x1', '0xa11ce', '0x89');
        expect(stxHandlerCount()).toBe(3);

        publish('TransactionController:transactionConfirmed', {
          id: '0xalice',
          chainId: '0x1',
          txParams: { nonce: '0x1', from: '0xa11ce' },
        });
        jest.runAllTimers();

        expect(stxHandlerCount()).toBe(2);
        expect(
          Object.keys(notificationManager._smartTransactionListeners).sort(),
        ).toStrictEqual(['0xalice-other-chain', '0xbob']);

        publishStx('0xbob', SmartTransactionStatuses.CANCELLED);
        expect(cancelledNotifications()).toHaveLength(1);
        expect(cancelledNotifications()[0][0].transaction).toStrictEqual({
          id: '0xbob',
        });

        expect(
          Object.keys(notificationManager._transactionsWatchTable).sort(),
        ).toStrictEqual(['0x1:0xb0b:0x1', '0x89:0xa11ce:0x1']);

        notificationManager._failedCallback({
          id: '0xalice-other-chain',
          status: 'failed',
          chainId: '0x89',
          txParams: { nonce: '0x1', from: '0xa11ce' },
        });
        notificationManager._confirmedCallback(
          {
            id: '0xbob',
            chainId: '0x1',
            txParams: { nonce: '0x1', from: '0xb0b' },
          },
          { id: '0xbob' },
        );
        jest.runAllTimers();

        expect(stxHandlerCount()).toBe(0);
        expect(notificationManager._smartTransactionListeners).toStrictEqual(
          {},
        );
        expect(notificationManager._transactionsWatchTable).toStrictEqual({});
        const notificationTypes = showNotificationSpy.mock.calls.map(
          ([data]) => data.type,
        );
        expect(notificationTypes.filter((t) => t === 'error')).toHaveLength(1);
        expect(notificationTypes.filter((t) => t === 'success')).toHaveLength(
          2,
        );
      });

      it('keeps a single listener when the same transaction is watched twice', () => {
        watch('0x123', '0x1');
        notificationManager.watchSubmittedTransaction({
          id: '0x123',
          txParams: { nonce: '0x1' },
          silent: false,
        });

        expect(stxHandlerCount()).toBe(1);
        publishStx('0x123', SmartTransactionStatuses.CANCELLED);
        expect(cancelledNotifications()).toHaveLength(1);
      });
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

      expect(mockControllerMessenger.subscribeOnceIf).toHaveBeenCalledTimes(4);
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
      expect(mockControllerMessenger.subscribeOnceIf).toHaveBeenCalledWith(
        'SmartTransactionsController:smartTransaction',
        expect.any(Function),
        expect.any(Function)
      );
    });
  });
});
