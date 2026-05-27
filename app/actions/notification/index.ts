import { ACTIONS } from '../../reducers/notification';

interface Transaction {
  id: string | number;
  [key: string]: unknown;
}

interface Notification {
  id: string | number;
  [key: string]: unknown;
}

export function hideCurrentNotification(): { type: string } {
  return {
    type: ACTIONS.HIDE_CURRENT_NOTIFICATION,
  };
}

export function hideNotificationById(id: string | number): { type: string; id: string | number } {
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
  autodismiss: number;
  transaction: Transaction;
  status: string;
}): { type: string; autodismiss: number; transaction: Transaction; status: string } {
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
  autodismiss: number;
  title: string;
  description: string;
  status: string;
}): { type: string; autodismiss: number; title: string; description: string; status: string } {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

export function replaceNotificationById(notification: Notification): { type: string; notification: Notification; id: string | number } {
  return {
    type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(id: string | number): { type: string; id: string | number } {
  return {
    type: ACTIONS.REMOVE_NOTIFICATION_BY_ID,
    id,
  };
}

export function removeCurrentNotification(): { type: string } {
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
  autodismiss: number;
  title: string;
  description: string;
  status: string;
  id: string | number;
}): { id: string | number; type: string; autodismiss: number; title: string; description: string; status: string } {
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
  autodismiss: number;
  transaction: Transaction;
  status: string;
}): { type: string; autodismiss: number; transaction: Transaction; status: string } {
  return {
    type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function removeNotVisibleNotifications(): { type: string } {
  return {
    type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  };
}
