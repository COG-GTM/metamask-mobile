/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import { ACTIONS } from '../../reducers/notification';

type NotificationId = string | number;

export interface NotificationAction {
  type: string;
  id?: NotificationId;
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
  transaction?: object;
  notification?: object;
}

export function hideCurrentNotification(): NotificationAction {
  return {
    type: ACTIONS.HIDE_CURRENT_NOTIFICATION,
  };
}

export function hideNotificationById(id: NotificationId): NotificationAction {
  return {
    type: ACTIONS.HIDE_NOTIFICATION_BY_ID,
    id,
  };
}

export function modifyOrShowTransactionNotificationById<T extends { id: NotificationId }>({
  autodismiss,
  transaction,
  status,
}: {
  autodismiss?: number | boolean;
  transaction: T;
  status?: string;
}): NotificationAction {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function modifyOrShowSimpleNotificationById({
  autodismiss,
  title,
  description,
  status,
}: {
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
}): NotificationAction {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

export function replaceNotificationById<T extends { id: NotificationId }>(
  notification: T,
): NotificationAction {
  return {
    type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(id: NotificationId): NotificationAction {
  return {
    type: ACTIONS.REMOVE_NOTIFICATION_BY_ID,
    id,
  };
}

export function removeCurrentNotification(): NotificationAction {
  return {
    type: ACTIONS.REMOVE_CURRENT_NOTIFICATION,
  };
}

export function showSimpleNotification({
  autodismiss,
  title,
  description,
  status,
  id,
}: {
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
  id: NotificationId;
}): NotificationAction {
  return {
    id,
    type: ACTIONS.SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

export function showTransactionNotification<T extends { id: NotificationId }>({
  autodismiss,
  transaction,
  status,
}: {
  autodismiss?: number;
  transaction: T;
  status?: string;
}): NotificationAction {
  return {
    type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function removeNotVisibleNotifications(): NotificationAction {
  return {
    type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  };
}
