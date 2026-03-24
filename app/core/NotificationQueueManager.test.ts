import NotificationQueueManager, {
  QueueEvent,
  QueueManagerConfig,
} from './NotificationQueueManager';
import {
  EnhancedNotification,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
} from '../util/notifications/types/notification-types';

const createNotification = (
  overrides: Partial<EnhancedNotification> = {},
): EnhancedNotification => ({
  id: 'test-1',
  category: NotificationCategory.TRANSACTION,
  priority: NotificationPriority.MEDIUM,
  status: NotificationStatus.UNREAD,
  title: 'Test',
  body: 'Test body',
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('NotificationQueueManager', () => {
  let manager: NotificationQueueManager;

  beforeEach(() => {
    jest.useFakeTimers();
    manager = new NotificationQueueManager();
  });

  afterEach(() => {
    manager.stopProcessing();
    manager.clear();
    jest.useRealTimers();
  });

  describe('enqueue', () => {
    it('adds a notification to the queue', () => {
      const notification = createNotification();
      manager.enqueue(notification);
      expect(manager.getQueueSize()).toBe(1);
    });

    it('emits CRITICAL notifications immediately without queuing', () => {
      const handler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_PROCESSED, handler);

      const notification = createNotification({
        priority: NotificationPriority.CRITICAL,
      });
      manager.enqueue(notification);

      expect(manager.getQueueSize()).toBe(0);
      expect(handler).toHaveBeenCalledWith(notification);
    });

    it('rate-limits notifications when configured', () => {
      const rateLimitedHandler = jest.fn();
      const config: QueueManagerConfig = {
        rateLimits: {
          [NotificationCategory.TRANSACTION]: {
            maxCount: 2,
            windowMs: 10_000,
          },
        },
      };
      manager = new NotificationQueueManager(config);
      manager.on(QueueEvent.NOTIFICATION_RATE_LIMITED, rateLimitedHandler);

      // First two should be queued
      manager.enqueue(
        createNotification({ id: '1', category: NotificationCategory.TRANSACTION }),
      );
      manager.enqueue(
        createNotification({ id: '2', category: NotificationCategory.TRANSACTION }),
      );
      expect(manager.getQueueSize()).toBe(2);

      // Third should be rate-limited
      manager.enqueue(
        createNotification({ id: '3', category: NotificationCategory.TRANSACTION }),
      );
      expect(manager.getQueueSize()).toBe(2);
      expect(rateLimitedHandler).toHaveBeenCalledTimes(1);
    });

    it('does not rate-limit categories without a config entry', () => {
      const config: QueueManagerConfig = {
        rateLimits: {
          [NotificationCategory.TRANSACTION]: {
            maxCount: 1,
            windowMs: 10_000,
          },
        },
      };
      manager = new NotificationQueueManager(config);

      // DAPP category has no rate limit configured
      manager.enqueue(
        createNotification({ id: '1', category: NotificationCategory.DAPP }),
      );
      manager.enqueue(
        createNotification({ id: '2', category: NotificationCategory.DAPP }),
      );
      expect(manager.getQueueSize()).toBe(2);
    });
  });

  describe('processQueue', () => {
    it('emits NOTIFICATION_PROCESSED for each non-grouped notification', () => {
      const handler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_PROCESSED, handler);

      manager.enqueue(createNotification({ id: '1' }));
      manager.enqueue(createNotification({ id: '2' }));
      manager.processQueue();

      expect(handler).toHaveBeenCalledTimes(2);
      expect(manager.getQueueSize()).toBe(0);
    });

    it('sorts notifications by priority (high before low)', () => {
      const processed: EnhancedNotification[] = [];
      manager.on(QueueEvent.NOTIFICATION_PROCESSED, (n: EnhancedNotification) =>
        processed.push(n),
      );

      manager.enqueue(
        createNotification({ id: 'low', priority: NotificationPriority.LOW }),
      );
      manager.enqueue(
        createNotification({ id: 'high', priority: NotificationPriority.HIGH }),
      );
      manager.processQueue();

      expect(processed[0].id).toBe('high');
      expect(processed[1].id).toBe('low');
    });

    it('groups notifications with the same groupId', () => {
      const groupedHandler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_GROUPED, groupedHandler);

      const grouping = {
        groupId: 'tx-group',
        groupTitle: 'Transactions',
        count: 1,
      };

      manager.enqueue(createNotification({ id: '1', grouping }));
      manager.enqueue(createNotification({ id: '2', grouping }));
      manager.processQueue();

      expect(groupedHandler).toHaveBeenCalledTimes(1);
      const emitted = groupedHandler.mock.calls[0][0] as EnhancedNotification;
      expect(emitted.grouping?.count).toBe(2);
    });

    it('emits single grouped notification as NOTIFICATION_PROCESSED', () => {
      const processedHandler = jest.fn();
      const groupedHandler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_PROCESSED, processedHandler);
      manager.on(QueueEvent.NOTIFICATION_GROUPED, groupedHandler);

      const grouping = {
        groupId: 'single-group',
        groupTitle: 'Single',
        count: 1,
      };
      manager.enqueue(createNotification({ id: '1', grouping }));
      manager.processQueue();

      expect(processedHandler).toHaveBeenCalledTimes(1);
      expect(groupedHandler).not.toHaveBeenCalled();
    });
  });

  describe('startProcessing / stopProcessing', () => {
    it('processes queue at the configured interval', () => {
      const handler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_PROCESSED, handler);

      manager.enqueue(createNotification());
      manager.startProcessing();

      jest.advanceTimersByTime(1000);
      expect(handler).toHaveBeenCalledTimes(1);

      manager.enqueue(createNotification({ id: '2' }));
      jest.advanceTimersByTime(1000);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('stops processing when stopProcessing is called', () => {
      const handler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_PROCESSED, handler);

      manager.enqueue(createNotification());
      manager.startProcessing();
      manager.stopProcessing();

      jest.advanceTimersByTime(5000);
      expect(handler).not.toHaveBeenCalled();
    });

    it('startProcessing is idempotent (does not create duplicate timers)', () => {
      const handler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_PROCESSED, handler);

      manager.enqueue(createNotification());
      manager.startProcessing();
      manager.startProcessing(); // second call should be no-op

      jest.advanceTimersByTime(1000);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear', () => {
    it('removes all queued notifications', () => {
      manager.enqueue(createNotification({ id: '1' }));
      manager.enqueue(createNotification({ id: '2' }));
      expect(manager.getQueueSize()).toBe(2);

      manager.clear();
      expect(manager.getQueueSize()).toBe(0);
    });
  });

  describe('getQueue', () => {
    it('returns a copy of the queue', () => {
      const notification = createNotification();
      manager.enqueue(notification);

      const snapshot = manager.getQueue();
      expect(snapshot).toHaveLength(1);
      expect(snapshot[0]).toEqual(notification);

      // Mutating the snapshot should not affect the internal queue
      (snapshot as EnhancedNotification[]).pop();
      expect(manager.getQueueSize()).toBe(1);
    });
  });
});
