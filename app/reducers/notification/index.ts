import { createSelector } from 'reselect';
import { NotificationTypes } from '../../util/notifications';
import { NotificationState, Notification } from './types';
import { RootState } from '..';

const { TRANSACTION, SIMPLE } = NotificationTypes;

interface NotificationAction {
  type: string;
  id?: string;
  autodismiss?: number;
  transaction?: Record<string, unknown>;
  status?: string;
  title?: string;
  description?: string;
  notification?: Notification;
}

export const initialState: NotificationState = {
  notifications: [],
};

export const ACTIONS = {
  HIDE_CURRENT_NOTIFICATION: 'HIDE_CURRENT_NOTIFICATION',
  HIDE_NOTIFICATION_BY_ID: 'HIDE_NOTIFICATION_BY_ID',
  MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION:
    'MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION',
  MODIFY_OR_SHOW_SIMPLE_NOTIFICATION: 'MODIFY_OR_SHOW_SIMPLE_NOTIFICATION',
  REPLACE_NOTIFICATION_BY_ID: 'REPLACE_NOTIFICATION_BY_ID',
  REMOVE_NOTIFICATION_BY_ID: 'REMOVE_NOTIFICATION_BY_ID',
  REMOVE_CURRENT_NOTIFICATION: 'REMOVE_CURRENT_NOTIFICATION',
  REMOVE_NOT_VISIBLE_NOTIFICATIONS: 'REMOVE_NOT_VISIBLE_NOTIFICATIONS',
  SHOW_SIMPLE_NOTIFICATION: 'SHOW_SIMPLE_NOTIFICATION',
  SHOW_TRANSACTION_NOTIFICATION: 'SHOW_TRANSACTION_NOTIFICATION',
  UPDATE_NOTIFICATION_STATUS: 'UPDATE_NOTIFICATION_STATUS',
};

const enqueue = (notifications: Notification[], notification: Notification): Notification[] => [
  ...notifications,
  notification,
];
const dequeue = (notifications: Notification[]): Notification[] => notifications.slice(1);

export const currentNotificationSelector = createSelector(
  (state: RootState) => state?.notification?.notifications,
  (notifications) => notifications?.[0] || {},
);

const notificationReducer = (
  state: NotificationState = initialState,
  action: NotificationAction,
): NotificationState => {
  const { notifications } = state;
  switch (action.type) {
    // make current notification isVisible props false
    case ACTIONS.HIDE_CURRENT_NOTIFICATION: {
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
    case ACTIONS.HIDE_NOTIFICATION_BY_ID: {
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
    case ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION: {
      const transaction = action.transaction!;
      const index = notifications.findIndex(({ id }) => id === action.id);
      const newNotification = {
        id: transaction.id as string,
        isVisible: true,
        autodismiss: action.autodismiss as number,
        transaction: transaction as { id: string; [key: string]: unknown },
        status: action.status as string,
        type: TRANSACTION,
      } as Notification;
      if (index >= 0) {
        return {
          ...state,
          notifications: [
            ...notifications.slice(0, index),
            { ...notifications[index], ...newNotification },
            ...notifications.slice(index + 1),
          ],
        };
      }
      return {
        ...state,
        notifications: enqueue(notifications, newNotification),
      };
    }
    case ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION: {
      const index = notifications.findIndex(({ id }) => id === action.id);
      const newNotification: Notification = {
        id: action.id as string,
        isVisible: true,
        autodismiss: action.autodismiss as number,
        title: action.title as string,
        description: action.description as string,
        status: action.status as string,
        type: SIMPLE,
      };
      if (index >= 0) {
        return {
          ...state,
          notifications: [
            ...notifications.slice(0, index),
            { ...notifications[index], ...newNotification },
            ...notifications.slice(index + 1),
          ],
        };
      }
      return {
        ...state,
        notifications: enqueue(notifications, newNotification),
      };
    }
    case ACTIONS.REPLACE_NOTIFICATION_BY_ID: {
      const index = notifications.findIndex(({ id }) => id === action.id);
      if (index === -1) {
        return state;
      }
      return {
        ...state,
        notifications: [
          ...notifications.slice(0, index),
          action.notification as Notification,
          ...notifications.slice(index + 1),
        ],
      };
    }
    case ACTIONS.REMOVE_NOTIFICATION_BY_ID: {
      return {
        ...state,
        notifications: notifications.filter(({ id }) => id !== action.id),
      };
    }
    case ACTIONS.REMOVE_CURRENT_NOTIFICATION: {
      return {
        ...state,
        notifications: dequeue(notifications),
      };
    }
    case ACTIONS.SHOW_SIMPLE_NOTIFICATION: {
      return {
        ...state,
        notifications: enqueue(notifications, {
          id: action.id as string,
          isVisible: true,
          autodismiss: action.autodismiss || 5000,
          title: action.title as string,
          description: action.description as string,
          status: action.status as string,
          type: SIMPLE,
        }),
      };
    }
    case ACTIONS.SHOW_TRANSACTION_NOTIFICATION: {
      const transaction = action.transaction!;
      return {
        ...state,
        notifications: enqueue(notifications, {
          id: transaction.id as string,
          isVisible: true,
          autodismiss: action.autodismiss || 5000,
          transaction: transaction as { id: string; [key: string]: unknown },
          status: action.status as string,
          type: TRANSACTION,
        } as Notification),
      };
    }
    case ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS: {
      const visibleNotifications =
        notifications?.filter((notification) => notification.isVisible) || [];
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
