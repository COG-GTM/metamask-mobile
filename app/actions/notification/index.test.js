import {
  hideCurrentNotification,
  hideNotificationById,
  modifyOrShowTransactionNotificationById,
  modifyOrShowSimpleNotificationById,
  replaceNotificationById,
  removeNotificationById,
  removeCurrentNotification,
  showSimpleNotification,
  showTransactionNotification,
  removeNotVisibleNotifications,
} from './index';
import { ACTIONS } from '../../reducers/notification';

describe('notification actions', () => {
  it('hideCurrentNotification', () => {
    expect(hideCurrentNotification()).toEqual({ type: ACTIONS.HIDE_CURRENT_NOTIFICATION });
  });

  it('hideNotificationById', () => {
    expect(hideNotificationById('n1')).toEqual({ type: ACTIONS.HIDE_NOTIFICATION_BY_ID, id: 'n1' });
  });

  it('modifyOrShowTransactionNotificationById', () => {
    const action = modifyOrShowTransactionNotificationById({
      autodismiss: 5000,
      transaction: { id: 'tx1' },
      status: 'pending',
    });
    expect(action.type).toBe(ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION);
    expect(action.transaction.id).toBe('tx1');
  });

  it('modifyOrShowSimpleNotificationById', () => {
    const action = modifyOrShowSimpleNotificationById({
      autodismiss: 3000,
      title: 'Test',
      description: 'Desc',
      status: 'info',
    });
    expect(action.type).toBe(ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION);
    expect(action.title).toBe('Test');
  });

  it('replaceNotificationById', () => {
    const notification = { id: 'n1', title: 'New' };
    const action = replaceNotificationById(notification);
    expect(action.type).toBe(ACTIONS.REPLACE_NOTIFICATION_BY_ID);
    expect(action.id).toBe('n1');
  });

  it('removeNotificationById', () => {
    expect(removeNotificationById('n1')).toEqual({ type: ACTIONS.REMOVE_NOTIFICATION_BY_ID, id: 'n1' });
  });

  it('removeCurrentNotification', () => {
    expect(removeCurrentNotification()).toEqual({ type: ACTIONS.REMOVE_CURRENT_NOTIFICATION });
  });

  it('showSimpleNotification', () => {
    const action = showSimpleNotification({
      id: 's1',
      autodismiss: 5000,
      title: 'Title',
      description: 'Desc',
      status: 'success',
    });
    expect(action.type).toBe(ACTIONS.SHOW_SIMPLE_NOTIFICATION);
    expect(action.id).toBe('s1');
  });

  it('showTransactionNotification', () => {
    const action = showTransactionNotification({
      autodismiss: 5000,
      transaction: { id: 'tx1' },
      status: 'submitted',
    });
    expect(action.type).toBe(ACTIONS.SHOW_TRANSACTION_NOTIFICATION);
  });

  it('removeNotVisibleNotifications', () => {
    expect(removeNotVisibleNotifications()).toEqual({ type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS });
  });
});
