import { createSelector } from 'reselect';
import { NotificationTypes } from '../../util/notifications';
import {
  NotificationState,
  NotificationAction,
  NotificationActionType,
  Notification,
  SimpleNotification,
  TransactionNotification,
} from './types';

export * from './types';

const { TRANSACTION, SIMPLE } = NotificationTypes;

export const initialState: NotificationState = {
  notifications: [],
};

export const ACTIONS = NotificationActionType;

const enqueue = (
  notifications: Notification[],
  notification: Notification,
): Notification[] => [...notifications, notification];

const dequeue = (notifications: Notification[]): Notification[] =>
  notifications.slice(1);

export const currentNotificationSelector = createSelector(
  (state: NotificationState) => state?.notifications,
  (notifications): Notification | Record<string, never> =>
    notifications?.[0] ?? {},
);

/* eslint-disable @typescript-eslint/default-param-last */
const notificationReducer = (
  state: NotificationState = initialState,
  action: NotificationAction,
): NotificationState => {
  const { notifications } = state;
  switch (action.type) {
    case NotificationActionType.HIDE_CURRENT_NOTIFICATION: {
      if (notifications[0]) {
        return {
          ...state,
          notifications: [
            { ...notifications[0], isVisible: false },
            ...notifications.slice(1),
          ],
        };
      }
      return state;
    }
    case NotificationActionType.HIDE_NOTIFICATION_BY_ID: {
      const index = notifications.findIndex(({ id }) => id === action.id);
      if (index === -1) {
        return state;
      }
      return {
        ...state,
        notifications: [
          ...notifications.slice(0, index),
          { ...notifications[index], isVisible: false },
          ...notifications.slice(index + 1),
        ],
      };
    }
    case NotificationActionType.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION: {
      const index = notifications.findIndex(({ id }) => id === action.id);
      const newNotification: TransactionNotification = {
        id: action.transaction.id,
        isVisible: true,
        autodismiss: action.autodismiss,
        transaction: action.transaction,
        status: action.status,
        type: TRANSACTION,
      };
      if (index >= 0) {
        return {
          ...state,
          notifications: [
            ...notifications.slice(0, index),
            {
              ...notifications[index],
              ...newNotification,
            },
            ...notifications.slice(index + 1),
          ],
        };
      }
      return {
        ...state,
        notifications: enqueue(notifications, newNotification),
      };
    }
    case NotificationActionType.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION: {
      const index = notifications.findIndex(({ id }) => id === action.id);
      const newNotification: SimpleNotification = {
        id: action.id,
        isVisible: true,
        autodismiss: action.autodismiss,
        title: action.title,
        description: action.description,
        status: action.status,
        type: SIMPLE,
      };
      if (index >= 0) {
        return {
          ...state,
          notifications: [
            ...notifications.slice(0, index),
            {
              ...notifications[index],
              ...newNotification,
            },
            ...notifications.slice(index + 1),
          ],
        };
      }
      return {
        ...state,
        notifications: enqueue(notifications, newNotification),
      };
    }
    case NotificationActionType.REPLACE_NOTIFICATION_BY_ID: {
      const index = notifications.findIndex(({ id }) => id === action.id);
      if (index === -1) {
        return state;
      }
      return {
        ...state,
        notifications: [
          ...notifications.slice(0, index),
          action.notification,
          ...notifications.slice(index + 1),
        ],
      };
    }
    case NotificationActionType.REMOVE_NOTIFICATION_BY_ID: {
      return {
        ...state,
        notifications: notifications.filter(({ id }) => id !== action.id),
      };
    }
    case NotificationActionType.REMOVE_CURRENT_NOTIFICATION: {
      return {
        ...state,
        notifications: dequeue(notifications),
      };
    }
    case NotificationActionType.SHOW_SIMPLE_NOTIFICATION: {
      const newNotification: SimpleNotification = {
        id: action.id,
        isVisible: true,
        autodismiss: action.autodismiss ?? 5000,
        title: action.title,
        description: action.description,
        status: action.status,
        type: SIMPLE,
      };
      return {
        ...state,
        notifications: enqueue(notifications, newNotification),
      };
    }
    case NotificationActionType.SHOW_TRANSACTION_NOTIFICATION: {
      const newNotification: TransactionNotification = {
        id: action.transaction.id,
        isVisible: true,
        autodismiss: action.autodismiss ?? 5000,
        transaction: action.transaction,
        status: action.status,
        type: TRANSACTION,
      };
      return {
        ...state,
        notifications: enqueue(notifications, newNotification),
      };
    }
    case NotificationActionType.REMOVE_NOT_VISIBLE_NOTIFICATIONS: {
      const visibleNotifications =
        notifications?.filter((notification) => notification.isVisible) ?? [];
      return {
        ...state,
        notifications: visibleNotifications,
      };
    }
    default:
      return state;
  }
};

export default notificationReducer;
