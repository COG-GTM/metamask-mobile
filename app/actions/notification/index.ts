/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
export const HIDE_CURRENT_NOTIFICATION = 'HIDE_CURRENT_NOTIFICATION' as const;
export const HIDE_NOTIFICATION_BY_ID = 'HIDE_NOTIFICATION_BY_ID' as const;
export const MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION =
  'MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION' as const;
export const MODIFY_OR_SHOW_SIMPLE_NOTIFICATION =
  'MODIFY_OR_SHOW_SIMPLE_NOTIFICATION' as const;
export const REPLACE_NOTIFICATION_BY_ID = 'REPLACE_NOTIFICATION_BY_ID' as const;
export const REMOVE_NOTIFICATION_BY_ID = 'REMOVE_NOTIFICATION_BY_ID' as const;
export const REMOVE_CURRENT_NOTIFICATION =
  'REMOVE_CURRENT_NOTIFICATION' as const;
export const REMOVE_NOT_VISIBLE_NOTIFICATIONS =
  'REMOVE_NOT_VISIBLE_NOTIFICATIONS' as const;
export const SHOW_SIMPLE_NOTIFICATION = 'SHOW_SIMPLE_NOTIFICATION' as const;
export const SHOW_TRANSACTION_NOTIFICATION =
  'SHOW_TRANSACTION_NOTIFICATION' as const;

export interface NotificationTransaction {
  id: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string | number;
  [key: string]: unknown;
}

export interface HideCurrentNotificationAction {
  type: typeof HIDE_CURRENT_NOTIFICATION;
}

export interface HideNotificationByIdAction {
  type: typeof HIDE_NOTIFICATION_BY_ID;
  id: string | number;
}

export interface ModifyOrShowTransactionNotificationAction {
  type: typeof MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION;
  autodismiss?: number | boolean;
  transaction: NotificationTransaction;
  status?: string;
}

export interface ModifyOrShowSimpleNotificationAction {
  type: typeof MODIFY_OR_SHOW_SIMPLE_NOTIFICATION;
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
}

export interface ReplaceNotificationByIdAction {
  type: typeof REPLACE_NOTIFICATION_BY_ID;
  notification: Notification;
  id: string | number;
}

export interface RemoveNotificationByIdAction {
  type: typeof REMOVE_NOTIFICATION_BY_ID;
  id: string | number;
}

export interface RemoveCurrentNotificationAction {
  type: typeof REMOVE_CURRENT_NOTIFICATION;
}

export interface ShowSimpleNotificationAction {
  type: typeof SHOW_SIMPLE_NOTIFICATION;
  id?: string | number;
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
}

export interface ShowTransactionNotificationAction {
  type: typeof SHOW_TRANSACTION_NOTIFICATION;
  autodismiss?: number | boolean;
  transaction: NotificationTransaction;
  status?: string;
}

export interface RemoveNotVisibleNotificationsAction {
  type: typeof REMOVE_NOT_VISIBLE_NOTIFICATIONS;
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
    type: HIDE_CURRENT_NOTIFICATION,
  };
}

export function hideNotificationById(
  id: string | number,
): HideNotificationByIdAction {
  return {
    type: HIDE_NOTIFICATION_BY_ID,
    id,
  };
}

export function modifyOrShowTransactionNotificationById({
  autodismiss,
  transaction,
  status,
}: {
  autodismiss?: number | boolean;
  transaction: NotificationTransaction;
  status?: string;
}): ModifyOrShowTransactionNotificationAction {
  return {
    type: MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
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
}): ModifyOrShowSimpleNotificationAction {
  return {
    type: MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
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
    type: REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(
  id: string | number,
): RemoveNotificationByIdAction {
  return {
    type: REMOVE_NOTIFICATION_BY_ID,
    id,
  };
}

export function removeCurrentNotification(): RemoveCurrentNotificationAction {
  return {
    type: REMOVE_CURRENT_NOTIFICATION,
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
  id?: string | number;
}): ShowSimpleNotificationAction {
  return {
    id,
    type: SHOW_SIMPLE_NOTIFICATION,
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
  autodismiss?: number | boolean;
  transaction: NotificationTransaction;
  status?: string;
}): ShowTransactionNotificationAction {
  return {
    type: SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function removeNotVisibleNotifications(): RemoveNotVisibleNotificationsAction {
  return {
    type: REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  };
}
