/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import { ACTIONS } from '../../reducers/notification';

interface Transaction {
  id: string;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  [key: string]: unknown;
}

interface HideCurrentNotificationAction {
  type: typeof ACTIONS.HIDE_CURRENT_NOTIFICATION;
}

interface HideNotificationByIdAction {
  type: typeof ACTIONS.HIDE_NOTIFICATION_BY_ID;
  id: string;
}

interface ModifyOrShowTransactionNotificationAction {
  type: typeof ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION;
  autodismiss: number | boolean;
  transaction: Transaction;
  status: string;
}

interface ModifyOrShowSimpleNotificationAction {
  type: typeof ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION;
  autodismiss: number | boolean;
  title: string;
  description: string;
  status: string;
}

interface ReplaceNotificationByIdAction {
  type: typeof ACTIONS.REPLACE_NOTIFICATION_BY_ID;
  notification: Notification;
  id: string;
}

interface RemoveNotificationByIdAction {
  type: typeof ACTIONS.REMOVE_NOTIFICATION_BY_ID;
  id: string;
}

interface RemoveCurrentNotificationAction {
  type: typeof ACTIONS.REMOVE_CURRENT_NOTIFICATION;
}

interface ShowSimpleNotificationAction {
  type: typeof ACTIONS.SHOW_SIMPLE_NOTIFICATION;
  id: string;
  autodismiss: number | boolean;
  title: string;
  description: string;
  status: string;
}

interface ShowTransactionNotificationAction {
  type: typeof ACTIONS.SHOW_TRANSACTION_NOTIFICATION;
  autodismiss: number | boolean;
  transaction: Transaction;
  status: string;
}

interface RemoveNotVisibleNotificationsAction {
  type: typeof ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS;
}

export type NotificationAction =
  | HideCurrentNotificationAction
  | HideNotificationByIdAction
  | ModifyOrShowTransactionNotificationAction
  | ModifyOrShowSimpleNotificationAction
  | ReplaceNotificationByIdAction
  | RemoveNotificationByIdAction
  | RemoveCurrentNotificationAction
  | ShowSimpleNotificationAction
  | ShowTransactionNotificationAction
  | RemoveNotVisibleNotificationsAction;

export function hideCurrentNotification(): HideCurrentNotificationAction {
  return {
    type: ACTIONS.HIDE_CURRENT_NOTIFICATION,
  };
}

export function hideNotificationById(
  id: string,
): HideNotificationByIdAction {
  return {
    type: ACTIONS.HIDE_NOTIFICATION_BY_ID,
    id,
  };
}

export function modifyOrShowTransactionNotificationById({
  autodismiss,
  transaction,
  status,
}: {
  autodismiss: number | boolean;
  transaction: Transaction;
  status: string;
}): ModifyOrShowTransactionNotificationAction {
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
  autodismiss: number | boolean;
  title: string;
  description: string;
  status: string;
}): ModifyOrShowSimpleNotificationAction {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

export function replaceNotificationById(
  notification: Notification,
): ReplaceNotificationByIdAction {
  return {
    type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(
  id: string,
): RemoveNotificationByIdAction {
  return {
    type: ACTIONS.REMOVE_NOTIFICATION_BY_ID,
    id,
  };
}

export function removeCurrentNotification(): RemoveCurrentNotificationAction {
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
  autodismiss: number | boolean;
  title: string;
  description: string;
  status: string;
  id: string;
}): ShowSimpleNotificationAction {
  return {
    id,
    type: ACTIONS.SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

export function showTransactionNotification({
  autodismiss,
  transaction,
  status,
}: {
  autodismiss: number | boolean;
  transaction: Transaction;
  status: string;
}): ShowTransactionNotificationAction {
  return {
    type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function removeNotVisibleNotifications(): RemoveNotVisibleNotificationsAction {
  return {
    type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  };
}
