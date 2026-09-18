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
    expect(hideCurrentNotification()).toEqual({
      type: ACTIONS.HIDE_CURRENT_NOTIFICATION,
    });
  });

  it('hideNotificationById', () => {
    expect(hideNotificationById('1')).toEqual({
      type: ACTIONS.HIDE_NOTIFICATION_BY_ID,
      id: '1',
    });
  });

  it('modifyOrShowTransactionNotificationById', () => {
    const transaction = { id: 'tx' };
    expect(
      modifyOrShowTransactionNotificationById({
        autodismiss: 5000,
        transaction,
        status: 'pending',
      }),
    ).toEqual({
      type: ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
      autodismiss: 5000,
      transaction,
      status: 'pending',
    });
  });

  it('modifyOrShowSimpleNotificationById', () => {
    expect(
      modifyOrShowSimpleNotificationById({
        autodismiss: 1,
        title: 't',
        description: 'd',
        status: 's',
      }),
    ).toEqual({
      type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
      autodismiss: 1,
      title: 't',
      description: 'd',
      status: 's',
    });
  });

  it('replaceNotificationById', () => {
    const notification = { id: 'n1', title: 't' };
    expect(replaceNotificationById(notification)).toEqual({
      type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
      notification,
      id: 'n1',
    });
  });

  it('removeNotificationById / removeCurrentNotification', () => {
    expect(removeNotificationById('n1')).toEqual({
      type: ACTIONS.REMOVE_NOTIFICATION_BY_ID,
      id: 'n1',
    });
    expect(removeCurrentNotification()).toEqual({
      type: ACTIONS.REMOVE_CURRENT_NOTIFICATION,
    });
  });

  it('showSimpleNotification', () => {
    expect(
      showSimpleNotification({
        autodismiss: 1,
        title: 't',
        description: 'd',
        status: 's',
        id: 'id',
      }),
    ).toEqual({
      id: 'id',
      type: ACTIONS.SHOW_SIMPLE_NOTIFICATION,
      autodismiss: 1,
      title: 't',
      description: 'd',
      status: 's',
    });
  });

  it('showTransactionNotification', () => {
    const transaction = { id: 'tx' };
    expect(
      showTransactionNotification({
        autodismiss: 1,
        transaction,
        status: 'confirmed',
      }),
    ).toEqual({
      type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
      autodismiss: 1,
      transaction,
      status: 'confirmed',
    });
  });

  it('removeNotVisibleNotifications', () => {
    expect(removeNotVisibleNotifications()).toEqual({
      type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
    });
  });
});
