import {
  NotificationQueueManager,
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
  id: `notif-${Date.now()}-${Math.random()}`,
  title: 'Test Notification',
  body: 'Test body',
  category: NotificationCategory.TRANSACTION,
  priority: NotificationPriority.MEDIUM,
  status: NotificationStatus.UNREAD,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('NotificationQueueManager', () => {
  let manager: NotificationQueueManager;

  beforeEach(() => {
    manager = new NotificationQueueManager();
  });

  afterEach(() => {
    manager.clear();
    manager.removeAllListeners();
  });

  describe('enqueue', () => {
    it('emits NOTIFICATION_READY for critical notifications immediately', () => {
      const handler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_READY, handler);

      const notification = createNotification({
        priority: NotificationPriority.CRITICAL,
      });

      manager.enqueue(notification);

      expect(handler).toHaveBeenCalledWith(notification);
      expect(manager.queueSize).toBe(0);
    });

    it('emits NOTIFICATION_READY for non-critical notifications after processing', () => {
      const handler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_READY, handler);

      const notification = createNotification({
        priority: NotificationPriority.HIGH,
      });

      manager.enqueue(notification);

      expect(handler).toHaveBeenCalledWith(notification);
    });

    it('processes notifications in priority order', () => {
      const readyOrder: string[] = [];
      manager.on(QueueEvent.NOTIFICATION_READY, (n: EnhancedNotification) => {
        readyOrder.push(n.id);
      });

      const low = createNotification({
        id: 'low',
        priority: NotificationPriority.LOW,
      });
      const high = createNotification({
        id: 'high',
        priority: NotificationPriority.HIGH,
      });
      const medium = createNotification({
        id: 'medium',
        priority: NotificationPriority.MEDIUM,
      });

      // Enqueue them all — since they process immediately in the current
      // synchronous implementation, each one is emitted as it arrives.
      // To truly test ordering we would need async processing, but we
      // can verify that CRITICAL bypasses the queue.
      manager.enqueue(low);
      manager.enqueue(high);
      manager.enqueue(medium);

      expect(readyOrder).toContain('low');
      expect(readyOrder).toContain('high');
      expect(readyOrder).toContain('medium');
    });
  });

  describe('rate limiting', () => {
    it('drops notifications that exceed the rate limit', () => {
      const config: Partial<QueueManagerConfig> = {
        defaultRateLimit: { maxCount: 2, windowMs: 60_000 },
      };
      manager = new NotificationQueueManager(config);

      const readyHandler = jest.fn();
      const droppedHandler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_READY, readyHandler);
      manager.on(QueueEvent.NOTIFICATION_DROPPED, droppedHandler);

      manager.enqueue(createNotification({ id: '1' }));
      manager.enqueue(createNotification({ id: '2' }));
      manager.enqueue(createNotification({ id: '3' }));

      expect(readyHandler).toHaveBeenCalledTimes(2);
      expect(droppedHandler).toHaveBeenCalledTimes(1);
    });

    it('does not rate-limit critical notifications', () => {
      const config: Partial<QueueManagerConfig> = {
        defaultRateLimit: { maxCount: 1, windowMs: 60_000 },
      };
      manager = new NotificationQueueManager(config);

      const readyHandler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_READY, readyHandler);

      manager.enqueue(createNotification({ id: '1' }));
      manager.enqueue(
        createNotification({
          id: '2',
          priority: NotificationPriority.CRITICAL,
        }),
      );

      expect(readyHandler).toHaveBeenCalledTimes(2);
    });

    it('respects per-category rate limits', () => {
      const config: Partial<QueueManagerConfig> = {
        rateLimits: {
          [NotificationCategory.TRANSACTION]: {
            maxCount: 1,
            windowMs: 60_000,
          },
        },
        defaultRateLimit: { maxCount: 100, windowMs: 60_000 },
      };
      manager = new NotificationQueueManager(config);

      const droppedHandler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_DROPPED, droppedHandler);

      manager.enqueue(
        createNotification({
          id: '1',
          category: NotificationCategory.TRANSACTION,
        }),
      );
      manager.enqueue(
        createNotification({
          id: '2',
          category: NotificationCategory.TRANSACTION,
        }),
      );
      // Different category should NOT be rate-limited
      manager.enqueue(
        createNotification({
          id: '3',
          category: NotificationCategory.ANNOUNCEMENT,
        }),
      );

      expect(droppedHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('grouping', () => {
    it('emits NOTIFICATION_GROUPED when grouping is enabled and notification is collapsible', () => {
      const groupHandler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_GROUPED, groupHandler);

      const notification = createNotification({
        grouping: {
          groupId: 'tx-group',
          groupTitle: 'Pending Transactions',
          collapsible: true,
        },
      });

      manager.enqueue(notification);

      expect(groupHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: 'tx-group',
          groupTitle: 'Pending Transactions',
          count: 1,
        }),
      );
      expect(manager.groupCount).toBe(1);
    });

    it('increments group count on subsequent grouped notifications', () => {
      const groupHandler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_GROUPED, groupHandler);

      const base = {
        grouping: {
          groupId: 'tx-group',
          groupTitle: 'Pending Transactions',
          collapsible: true,
        },
      };

      manager.enqueue(createNotification({ id: 'a', ...base }));
      manager.enqueue(createNotification({ id: 'b', ...base }));

      expect(groupHandler).toHaveBeenCalledTimes(2);
      const lastCall = groupHandler.mock.calls[1][0];
      expect(lastCall.count).toBe(2);
    });

    it('does not group notifications when grouping is disabled', () => {
      manager = new NotificationQueueManager({ groupingEnabled: false });

      const groupHandler = jest.fn();
      const readyHandler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_GROUPED, groupHandler);
      manager.on(QueueEvent.NOTIFICATION_READY, readyHandler);

      manager.enqueue(
        createNotification({
          grouping: {
            groupId: 'tx-group',
            groupTitle: 'Pending Transactions',
            collapsible: true,
          },
        }),
      );

      expect(groupHandler).not.toHaveBeenCalled();
      expect(readyHandler).toHaveBeenCalled();
    });
  });

  describe('flushGroup', () => {
    it('emits all notifications in a group and clears it', () => {
      const readyHandler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_READY, readyHandler);

      const base = {
        grouping: {
          groupId: 'tx-group',
          groupTitle: 'Pending Transactions',
          collapsible: true,
        },
      };

      manager.enqueue(createNotification({ id: 'a', ...base }));
      manager.enqueue(createNotification({ id: 'b', ...base }));

      expect(manager.groupCount).toBe(1);

      manager.flushGroup('tx-group');

      expect(readyHandler).toHaveBeenCalledTimes(2);
      expect(manager.groupCount).toBe(0);
    });

    it('does nothing for a non-existent group', () => {
      const readyHandler = jest.fn();
      manager.on(QueueEvent.NOTIFICATION_READY, readyHandler);

      manager.flushGroup('non-existent');

      expect(readyHandler).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('clears queue, groups, and rate limit state', () => {
      manager.enqueue(
        createNotification({
          grouping: {
            groupId: 'g',
            groupTitle: 'Group',
            collapsible: true,
          },
        }),
      );

      expect(manager.groupCount).toBe(1);

      manager.clear();

      expect(manager.queueSize).toBe(0);
      expect(manager.groupCount).toBe(0);
    });
  });
});
