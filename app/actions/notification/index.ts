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
export const REMOVE_CURRENT_NOTIFICATION = 'REMOVE_CURRENT_NOTIFICATION' as const;
export const SHOW_SIMPLE_NOTIFICATION = 'SHOW_SIMPLE_NOTIFICATION' as const;
export const SHOW_TRANSACTION_NOTIFICATION =
  'SHOW_TRANSACTION_NOTIFICATION' as const;
export const REMOVE_NOT_VISIBLE_NOTIFICATIONS =
  'REMOVE_NOT_VISIBLE_NOTIFICATIONS' as const;

interface HideCurrentNotificationAction {
  type: typeof HIDE_CURRENT_NOTIFICATION;
}

interface HideNotificationByIdAction {
  type: typeof HIDE_NOTIFICATION_BY_ID;
  id: unknown;
}

interface ModifyOrShowTransactionNotificationAction {
  type: typeof MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION;
  autodismiss: unknown;
  transaction: { id: unknown };
  status: unknown;
}

interface ModifyOrShowSimpleNotificationAction {
  type: typeof MODIFY_OR_SHOW_SIMPLE_NOTIFICATION;
  autodismiss: unknown;
  title: unknown;
  description: unknown;
  status: unknown;
}

interface ReplaceNotificationByIdAction {
  type: typeof REPLACE_NOTIFICATION_BY_ID;
  notification: { id: unknown };
  id: unknown;
}

interface RemoveNotificationByIdAction {
  type: typeof REMOVE_NOTIFICATION_BY_ID;
  id: unknown;
}

interface RemoveCurrentNotificationAction {
  type: typeof REMOVE_CURRENT_NOTIFICATION;
}

interface ShowSimpleNotificationAction {
  type: typeof SHOW_SIMPLE_NOTIFICATION;
  autodismiss: unknown;
  title: unknown;
  description: unknown;
  status: unknown;
  id: unknown;
}

interface ShowTransactionNotificationAction {
  type: typeof SHOW_TRANSACTION_NOTIFICATION;
  autodismiss: unknown;
  transaction: unknown;
  status: unknown;
}

interface RemoveNotVisibleNotificationsAction {
  type: typeof REMOVE_NOT_VISIBLE_NOTIFICATIONS;
}

export type Action =
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

export function hideNotificationById(id: unknown): HideNotificationByIdAction {
  return {
    type: HIDE_NOTIFICATION_BY_ID,
    id,
  };
}

export function modifyOrShowTransactionNotificationById({
  autodismiss,
  transaction,
  status,
}: Omit<
  ModifyOrShowTransactionNotificationAction,
  'type'
>): ModifyOrShowTransactionNotificationAction {
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
}: Omit<
  ModifyOrShowSimpleNotificationAction,
  'type'
>): ModifyOrShowSimpleNotificationAction {
  return {
    type: MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

export function replaceNotificationById(
  notification: { id: unknown },
): ReplaceNotificationByIdAction {
  return {
    type: REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(id: unknown): RemoveNotificationByIdAction {
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
}: Omit<ShowSimpleNotificationAction, 'type'>): ShowSimpleNotificationAction {
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
}: Omit<
  ShowTransactionNotificationAction,
  'type'
>): ShowTransactionNotificationAction {
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
