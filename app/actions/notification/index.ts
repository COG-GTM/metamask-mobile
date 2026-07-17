/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import { ACTIONS } from '../../reducers/notification';

export interface NotificationTransaction {
  id: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string | number;
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
  transaction?: NotificationTransaction;
  isVisible?: boolean;
  type?: string;
}

interface HideCurrentNotificationAction {
  type: typeof ACTIONS.HIDE_CURRENT_NOTIFICATION;
}

interface HideNotificationByIdAction {
  type: typeof ACTIONS.HIDE_NOTIFICATION_BY_ID;
  id: string | number;
}

interface ModifyOrShowTransactionNotificationParams {
  autodismiss?: number | boolean;
  transaction: NotificationTransaction;
  status?: string;
}

interface ModifyOrShowTransactionNotificationAction
  extends ModifyOrShowTransactionNotificationParams {
  type: typeof ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION;
  id?: string | number;
}

interface ModifyOrShowSimpleNotificationParams {
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
}

interface ModifyOrShowSimpleNotificationAction
  extends ModifyOrShowSimpleNotificationParams {
  type: typeof ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION;
  id?: string | number;
}

interface ReplaceNotificationByIdAction {
  type: typeof ACTIONS.REPLACE_NOTIFICATION_BY_ID;
  notification: Notification;
  id: string | number;
}

interface RemoveNotificationByIdAction {
  type: typeof ACTIONS.REMOVE_NOTIFICATION_BY_ID;
  id: string | number;
}

interface RemoveCurrentNotificationAction {
  type: typeof ACTIONS.REMOVE_CURRENT_NOTIFICATION;
}

interface ShowSimpleNotificationParams {
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
  id: string | number;
}

interface ShowSimpleNotificationAction extends ShowSimpleNotificationParams {
  type: typeof ACTIONS.SHOW_SIMPLE_NOTIFICATION;
}

interface ShowTransactionNotificationParams {
  autodismiss?: number | boolean;
  transaction: NotificationTransaction;
  status?: string;
}

interface ShowTransactionNotificationAction
  extends ShowTransactionNotificationParams {
  type: typeof ACTIONS.SHOW_TRANSACTION_NOTIFICATION;
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
  id: string | number,
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
}: ModifyOrShowTransactionNotificationParams): ModifyOrShowTransactionNotificationAction {
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
}: ModifyOrShowSimpleNotificationParams): ModifyOrShowSimpleNotificationAction {
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
  id: string | number,
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
}: ShowSimpleNotificationParams): ShowSimpleNotificationAction {
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
}: ShowTransactionNotificationParams): ShowTransactionNotificationAction {
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
