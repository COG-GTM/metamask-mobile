/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import { type Action } from 'redux';
import {
  ACTIONS,
  InAppNotification,
  NotificationId,
  NotificationTransaction,
} from '../../reducers/notification';

export type HideCurrentNotificationAction = Action<
  typeof ACTIONS.HIDE_CURRENT_NOTIFICATION
>;

export type HideNotificationByIdAction = Action<
  typeof ACTIONS.HIDE_NOTIFICATION_BY_ID
> & {
  id: NotificationId;
};

export interface TransactionNotificationParams {
  autodismiss?: number | false;
  transaction: NotificationTransaction;
  status?: string;
}

export interface SimpleNotificationParams {
  autodismiss?: number | false;
  title?: string;
  description?: string;
  status?: string;
}

export type ModifyOrShowTransactionNotificationAction = Action<
  typeof ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION
> &
  TransactionNotificationParams & {
    id?: NotificationId;
  };

export type ModifyOrShowSimpleNotificationAction = Action<
  typeof ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION
> &
  SimpleNotificationParams & {
    id?: NotificationId;
  };

export type ReplaceNotificationByIdAction = Action<
  typeof ACTIONS.REPLACE_NOTIFICATION_BY_ID
> & {
  notification: InAppNotification;
  id: NotificationId | undefined;
};

export type RemoveNotificationByIdAction = Action<
  typeof ACTIONS.REMOVE_NOTIFICATION_BY_ID
> & {
  id: NotificationId;
};

export type RemoveCurrentNotificationAction = Action<
  typeof ACTIONS.REMOVE_CURRENT_NOTIFICATION
>;

export type ShowSimpleNotificationAction = Action<
  typeof ACTIONS.SHOW_SIMPLE_NOTIFICATION
> &
  SimpleNotificationParams & {
    id: NotificationId;
  };

export type ShowTransactionNotificationAction = Action<
  typeof ACTIONS.SHOW_TRANSACTION_NOTIFICATION
> &
  TransactionNotificationParams;

export type RemoveNotVisibleNotificationsAction = Action<
  typeof ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS
>;

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
  id: NotificationId,
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
}: TransactionNotificationParams): ModifyOrShowTransactionNotificationAction {
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
}: SimpleNotificationParams): ModifyOrShowSimpleNotificationAction {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

export function replaceNotificationById(
  notification: InAppNotification,
): ReplaceNotificationByIdAction {
  return {
    type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(
  id: NotificationId,
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
}: SimpleNotificationParams & {
  id: NotificationId;
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
}: TransactionNotificationParams): ShowTransactionNotificationAction {
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
