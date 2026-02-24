import notificationReducer, { ACTIONS, initialState, currentNotificationSelector } from './';

jest.mock('../../util/notifications', () => ({
  NotificationTypes: {
    TRANSACTION: 'transaction',
    SIMPLE: 'simple',
  },
}));

describe('notificationReducer', () => {
  it('returns initial state', () => {
    const state = notificationReducer(undefined, { type: 'INIT' });
    expect(state).toEqual(initialState);
  });

  it('handles HIDE_CURRENT_NOTIFICATION when notifications exist', () => {
    const stateWithNotifications = {
      notifications: [{ id: '1', isVisible: true }, { id: '2', isVisible: true }],
    };
    const state = notificationReducer(stateWithNotifications, {
      type: ACTIONS.HIDE_CURRENT_NOTIFICATION,
    });
    expect(state.notifications[0].isVisible).toBe(false);
    expect(state.notifications[1].isVisible).toBe(true);
  });

  it('handles HIDE_CURRENT_NOTIFICATION when no notifications', () => {
    const state = notificationReducer(initialState, {
      type: ACTIONS.HIDE_CURRENT_NOTIFICATION,
    });
    expect(state).toEqual(initialState);
  });

  it('handles HIDE_NOTIFICATION_BY_ID', () => {
    const stateWithNotifications = {
      notifications: [
        { id: '1', isVisible: true },
        { id: '2', isVisible: true },
      ],
    };
    const state = notificationReducer(stateWithNotifications, {
      type: ACTIONS.HIDE_NOTIFICATION_BY_ID,
      id: '2',
    });
    expect(state.notifications[0].isVisible).toBe(true);
    expect(state.notifications[1].isVisible).toBe(false);
  });

  it('handles HIDE_NOTIFICATION_BY_ID when id not found', () => {
    const stateWithNotifications = {
      notifications: [{ id: '1', isVisible: true }],
    };
    const state = notificationReducer(stateWithNotifications, {
      type: ACTIONS.HIDE_NOTIFICATION_BY_ID,
      id: 'nonexistent',
    });
    expect(state).toEqual(stateWithNotifications);
  });

  it('handles MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION new notification', () => {
    const state = notificationReducer(initialState, {
      type: ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
      transaction: { id: 'tx1' },
      autodismiss: 5000,
      status: 'pending',
    });
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].id).toBe('tx1');
    expect(state.notifications[0].isVisible).toBe(true);
    expect(state.notifications[0].type).toBe('transaction');
  });

  it('handles MODIFY_OR_SHOW_SIMPLE_NOTIFICATION new notification', () => {
    const state = notificationReducer(initialState, {
      type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
      title: 'Test',
      description: 'Test description',
      autodismiss: 3000,
      status: 'success',
    });
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].title).toBe('Test');
    expect(state.notifications[0].type).toBe('simple');
  });

  it('handles REPLACE_NOTIFICATION_BY_ID', () => {
    const stateWithNotifications = {
      notifications: [{ id: '1', title: 'Old' }],
    };
    const newNotification = { id: '1', title: 'New' };
    const state = notificationReducer(stateWithNotifications, {
      type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
      id: '1',
      notification: newNotification,
    });
    expect(state.notifications[0].title).toBe('New');
  });

  it('handles REPLACE_NOTIFICATION_BY_ID when id not found', () => {
    const stateWithNotifications = {
      notifications: [{ id: '1', title: 'Old' }],
    };
    const state = notificationReducer(stateWithNotifications, {
      type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
      id: 'nonexistent',
      notification: { id: 'nonexistent', title: 'New' },
    });
    expect(state).toEqual(stateWithNotifications);
  });

  it('handles REMOVE_NOTIFICATION_BY_ID', () => {
    const stateWithNotifications = {
      notifications: [{ id: '1' }, { id: '2' }],
    };
    const state = notificationReducer(stateWithNotifications, {
      type: ACTIONS.REMOVE_NOTIFICATION_BY_ID,
      id: '1',
    });
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].id).toBe('2');
  });

  it('handles REMOVE_CURRENT_NOTIFICATION', () => {
    const stateWithNotifications = {
      notifications: [{ id: '1' }, { id: '2' }],
    };
    const state = notificationReducer(stateWithNotifications, {
      type: ACTIONS.REMOVE_CURRENT_NOTIFICATION,
    });
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].id).toBe('2');
  });

  it('handles SHOW_SIMPLE_NOTIFICATION', () => {
    const state = notificationReducer(initialState, {
      type: ACTIONS.SHOW_SIMPLE_NOTIFICATION,
      id: 'simple-1',
      title: 'Hello',
      description: 'World',
      status: 'success',
    });
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].autodismiss).toBe(5000);
    expect(state.notifications[0].type).toBe('simple');
  });

  it('handles SHOW_TRANSACTION_NOTIFICATION', () => {
    const state = notificationReducer(initialState, {
      type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
      transaction: { id: 'tx1' },
      status: 'confirmed',
    });
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].autodismiss).toBe(5000);
    expect(state.notifications[0].type).toBe('transaction');
  });

  it('handles REMOVE_NOT_VISIBLE_NOTIFICATIONS', () => {
    const stateWithNotifications = {
      notifications: [
        { id: '1', isVisible: true },
        { id: '2', isVisible: false },
        { id: '3', isVisible: true },
      ],
    };
    const state = notificationReducer(stateWithNotifications, {
      type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
    });
    expect(state.notifications).toHaveLength(2);
    expect(state.notifications.every((n) => n.isVisible)).toBe(true);
  });

  it('returns current state for unknown action', () => {
    const state = notificationReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });
});

describe('currentNotificationSelector', () => {
  it('returns first notification', () => {
    const state = { notifications: [{ id: '1', title: 'First' }, { id: '2' }] };
    expect(currentNotificationSelector(state)).toEqual({ id: '1', title: 'First' });
  });

  it('returns empty object when no notifications', () => {
    const state = { notifications: [] };
    expect(currentNotificationSelector(state)).toEqual({});
  });
});
