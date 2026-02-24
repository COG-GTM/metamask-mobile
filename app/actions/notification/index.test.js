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
} from './';
import { ACTIONS } from '../../reducers/notification';

describe('Notification Actions', () => {
  describe('hideCurrentNotification', () => {
    it('returns HIDE_CURRENT_NOTIFICATION action', () => {
      expect(hideCurrentNotification()).toEqual({
        type: ACTIONS.HIDE_CURRENT_NOTIFICATION,
      });
    });
  });

  describe('hideNotificationById', () => {
    it('returns HIDE_NOTIFICATION_BY_ID action', () => {
      expect(hideNotificationById('notif-1')).toEqual({
        type: ACTIONS.HIDE_NOTIFICATION_BY_ID,
        id: 'notif-1',
      });
    });
  });

  describe('modifyOrShowTransactionNotificationById', () => {
    it('returns MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION action', () => {
      const result = modifyOrShowTransactionNotificationById({
        autodismiss: 5000,
        transaction: { id: 'tx1' },
        status: 'pending',
      });
      expect(result).toEqual({
        type: ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
        autodismiss: 5000,
        transaction: { id: 'tx1' },
        status: 'pending',
      });
    });
  });

  describe('modifyOrShowSimpleNotificationById', () => {
    it('returns MODIFY_OR_SHOW_SIMPLE_NOTIFICATION action', () => {
      const result = modifyOrShowSimpleNotificationById({
        autodismiss: 3000,
        title: 'Test',
        description: 'Test description',
        status: 'success',
      });
      expect(result).toEqual({
        type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
        autodismiss: 3000,
        title: 'Test',
        description: 'Test description',
        status: 'success',
      });
    });
  });

  describe('replaceNotificationById', () => {
    it('returns REPLACE_NOTIFICATION_BY_ID action', () => {
      const notification = { id: 'notif-1', title: 'Updated' };
      expect(replaceNotificationById(notification)).toEqual({
        type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
        notification,
        id: 'notif-1',
      });
    });
  });

  describe('removeNotificationById', () => {
    it('returns REMOVE_NOTIFICATION_BY_ID action', () => {
      expect(removeNotificationById('notif-1')).toEqual({
        type: ACTIONS.REMOVE_NOTIFICATION_BY_ID,
        id: 'notif-1',
      });
    });
  });

  describe('removeCurrentNotification', () => {
    it('returns REMOVE_CURRENT_NOTIFICATION action', () => {
      expect(removeCurrentNotification()).toEqual({
        type: ACTIONS.REMOVE_CURRENT_NOTIFICATION,
      });
    });
  });

  describe('showSimpleNotification', () => {
    it('returns SHOW_SIMPLE_NOTIFICATION action', () => {
      const result = showSimpleNotification({
        autodismiss: 5000,
        title: 'Hello',
        description: 'World',
        status: 'info',
        id: 'simple-1',
      });
      expect(result).toEqual({
        id: 'simple-1',
        type: ACTIONS.SHOW_SIMPLE_NOTIFICATION,
        autodismiss: 5000,
        title: 'Hello',
        description: 'World',
        status: 'info',
      });
    });
  });

  describe('showTransactionNotification', () => {
    it('returns SHOW_TRANSACTION_NOTIFICATION action', () => {
      const result = showTransactionNotification({
        autodismiss: 5000,
        transaction: { id: 'tx1' },
        status: 'confirmed',
      });
      expect(result).toEqual({
        type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
        autodismiss: 5000,
        transaction: { id: 'tx1' },
        status: 'confirmed',
      });
    });
  });

  describe('removeNotVisibleNotifications', () => {
    it('returns REMOVE_NOT_VISIBLE_NOTIFICATIONS action', () => {
      expect(removeNotVisibleNotifications()).toEqual({
        type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
      });
    });
  });
});
