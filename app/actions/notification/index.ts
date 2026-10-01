import { ACTIONS } from '../../reducers/notification';

interface TransactionObject {
  id: string;
  [key: string]: unknown;
}

export function hideCurrentNotification(): {
  type: typeof ACTIONS.HIDE_CURRENT_NOTIFICATION;
} {
  return {
    type: ACTIONS.HIDE_CURRENT_NOTIFICATION,
  };
}

export function hideNotificationById(id: string): {
  type: typeof ACTIONS.HIDE_NOTIFICATION_BY_ID;
  id: string;
} {
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
  transaction: TransactionObject;
  status: string;
}): {
  type: typeof ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION;
  autodismiss: number;
  transaction: TransactionObject;
  status: string;
} {
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
}): {
  type: typeof ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION;
  autodismiss: number;
  title: string;
  description: string;
  status: string;
} {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

interface NotificationPayload {
  id: string;
  isVisible?: boolean;
  autodismiss?: number;
  title?: string;
  description?: string;
  status?: string;
  transaction?: TransactionObject;
  type?: string;
}

export function replaceNotificationById(
  notification: NotificationPayload,
): {
  type: typeof ACTIONS.REPLACE_NOTIFICATION_BY_ID;
  notification: NotificationPayload;
  id: string;
} {
  return {
    type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(id: string): {
  type: typeof ACTIONS.REMOVE_NOTIFICATION_BY_ID;
  id: string;
} {
  return {
    type: ACTIONS.REMOVE_NOTIFICATION_BY_ID,
    id,
  };
}

export function removeCurrentNotification(): {
  type: typeof ACTIONS.REMOVE_CURRENT_NOTIFICATION;
} {
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
  id: string;
}): {
  id: string;
  type: typeof ACTIONS.SHOW_SIMPLE_NOTIFICATION;
  autodismiss: number;
  title: string;
  description: string;
  status: string;
} {
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
  transaction: TransactionObject;
  status: string;
}): {
  type: typeof ACTIONS.SHOW_TRANSACTION_NOTIFICATION;
  autodismiss: number;
  transaction: TransactionObject;
  status: string;
} {
  return {
    type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function removeNotVisibleNotifications(): {
  type: typeof ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS;
} {
  return {
    type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  };
}
