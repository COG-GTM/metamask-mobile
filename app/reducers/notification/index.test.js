import notificationReducer, { initialState, ACTIONS, currentNotificationSelector } from './index';

jest.mock('../../util/notifications', () => ({
  NotificationTypes: { TRANSACTION: 'transaction', SIMPLE: 'simple' },
}));

describe('notification reducer', () => {
  it('returns initial state', () => {
    expect(notificationReducer(undefined, {})).toEqual(initialState);
  });

  it('HIDE_CURRENT_NOTIFICATION hides first notification', () => {
    const state = {
      notifications: [{ id: '1', isVisible: true }, { id: '2', isVisible: true }],
    };
    const result = notificationReducer(state, { type: ACTIONS.HIDE_CURRENT_NOTIFICATION });
    expect(result.notifications[0].isVisible).toBe(false);
    expect(result.notifications[1].isVisible).toBe(true);
  });

  it('HIDE_CURRENT_NOTIFICATION returns state when no notifications', () => {
    const state = { notifications: [] };
    const result = notificationReducer(state, { type: ACTIONS.HIDE_CURRENT_NOTIFICATION });
    expect(result).toBe(state);
  });

  it('HIDE_NOTIFICATION_BY_ID hides specific notification', () => {
    const state = {
      notifications: [{ id: '1', isVisible: true }, { id: '2', isVisible: true }],
    };
    const result = notificationReducer(state, { type: ACTIONS.HIDE_NOTIFICATION_BY_ID, id: '2' });
    expect(result.notifications[0].isVisible).toBe(true);
    expect(result.notifications[1].isVisible).toBe(false);
  });

  it('HIDE_NOTIFICATION_BY_ID returns state for unknown id', () => {
    const state = { notifications: [{ id: '1', isVisible: true }] };
    const result = notificationReducer(state, { type: ACTIONS.HIDE_NOTIFICATION_BY_ID, id: 'unknown' });
    expect(result).toBe(state);
  });

  it('SHOW_SIMPLE_NOTIFICATION enqueues simple notification', () => {
    const result = notificationReducer(initialState, {
      type: ACTIONS.SHOW_SIMPLE_NOTIFICATION,
      id: 'n1',
      autodismiss: 3000,
      title: 'Test',
      description: 'Test desc',
      status: 'success',
    });
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0]).toEqual(expect.objectContaining({
      id: 'n1',
      isVisible: true,
      title: 'Test',
      type: 'simple',
    }));
  });

  it('SHOW_TRANSACTION_NOTIFICATION enqueues transaction notification', () => {
    const tx = { id: 'tx1', hash: '0x123' };
    const result = notificationReducer(initialState, {
      type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
      autodismiss: 5000,
      transaction: tx,
      status: 'pending',
    });
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].type).toBe('transaction');
    expect(result.notifications[0].transaction).toBe(tx);
  });

  it('MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION modifies existing', () => {
    const state = {
      notifications: [{ id: 'tx1', isVisible: true, status: 'pending', type: 'transaction' }],
    };
    const result = notificationReducer(state, {
      type: ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
      id: 'tx1',
      transaction: { id: 'tx1' },
      status: 'confirmed',
      autodismiss: 5000,
    });
    expect(result.notifications[0].status).toBe('confirmed');
  });

  it('MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION adds new if not found', () => {
    const result = notificationReducer(initialState, {
      type: ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
      id: 'tx2',
      transaction: { id: 'tx2' },
      status: 'pending',
      autodismiss: 5000,
    });
    expect(result.notifications).toHaveLength(1);
  });

  it('MODIFY_OR_SHOW_SIMPLE_NOTIFICATION modifies existing', () => {
    const state = {
      notifications: [{ id: 's1', isVisible: true, title: 'Old', type: 'simple' }],
    };
    const result = notificationReducer(state, {
      type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
      id: 's1',
      title: 'New',
      description: 'Updated',
      status: 'info',
      autodismiss: 3000,
    });
    expect(result.notifications[0].title).toBe('New');
  });

  it('MODIFY_OR_SHOW_SIMPLE_NOTIFICATION adds new if not found', () => {
    const result = notificationReducer(initialState, {
      type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
      id: 's2',
      title: 'New',
      description: 'Desc',
      status: 'info',
      autodismiss: 3000,
    });
    expect(result.notifications).toHaveLength(1);
  });

  it('REPLACE_NOTIFICATION_BY_ID replaces notification', () => {
    const state = {
      notifications: [{ id: 'r1', title: 'Old' }],
    };
    const newNotification = { id: 'r1', title: 'Replaced' };
    const result = notificationReducer(state, {
      type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
      id: 'r1',
      notification: newNotification,
    });
    expect(result.notifications[0].title).toBe('Replaced');
  });

  it('REPLACE_NOTIFICATION_BY_ID returns state for unknown id', () => {
    const state = { notifications: [{ id: 'r1' }] };
    const result = notificationReducer(state, {
      type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
      id: 'unknown',
      notification: {},
    });
    expect(result).toBe(state);
  });

  it('REMOVE_NOTIFICATION_BY_ID removes notification', () => {
    const state = { notifications: [{ id: '1' }, { id: '2' }] };
    const result = notificationReducer(state, { type: ACTIONS.REMOVE_NOTIFICATION_BY_ID, id: '1' });
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].id).toBe('2');
  });

  it('REMOVE_CURRENT_NOTIFICATION dequeues first', () => {
    const state = { notifications: [{ id: '1' }, { id: '2' }] };
    const result = notificationReducer(state, { type: ACTIONS.REMOVE_CURRENT_NOTIFICATION });
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].id).toBe('2');
  });

  it('REMOVE_NOT_VISIBLE_NOTIFICATIONS filters hidden', () => {
    const state = {
      notifications: [
        { id: '1', isVisible: true },
        { id: '2', isVisible: false },
        { id: '3', isVisible: true },
      ],
    };
    const result = notificationReducer(state, { type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS });
    expect(result.notifications).toHaveLength(2);
  });
});

describe('currentNotificationSelector', () => {
  it('returns first notification', () => {
    const state = { notifications: [{ id: '1' }, { id: '2' }] };
    expect(currentNotificationSelector(state)).toEqual({ id: '1' });
  });

  it('returns empty object when no notifications', () => {
    const state = { notifications: [] };
    expect(currentNotificationSelector(state)).toEqual({});
  });
});
