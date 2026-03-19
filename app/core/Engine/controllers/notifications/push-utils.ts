import FCMService from '../../../../util/notifications/services/FCMService';
import NotificationsService from '../../../../util/notifications/services/NotificationService';
import { PressActionId } from '../../../../util/notifications';
import { ChannelId } from '../../../../util/notifications/androidChannels';
import { getChannelIdForCategory } from '../../../../util/notifications/services/NotificationFilterService';
import { NotificationCategory } from '../../../../util/notifications/types/notification-types';
import { createNotificationMessage } from './create-push-message';

export const createRegToken = FCMService.createRegToken;
export const deleteRegToken = FCMService.deleteRegToken;

/**
 * Maps a notification type string from the push payload to a NotificationCategory.
 * Falls back to TRANSACTION for unrecognised types.
 */
export function resolveNotificationCategory(
  type?: string,
): NotificationCategory {
  if (!type) {
    return NotificationCategory.TRANSACTION;
  }

  const lower = type.toLowerCase();

  if (lower.includes('security') || lower.includes('phishing')) {
    return NotificationCategory.SECURITY;
  }
  if (lower.includes('price') || lower.includes('alert')) {
    return NotificationCategory.PRICE_ALERT;
  }
  if (lower.includes('dapp') || lower.includes('snap')) {
    return NotificationCategory.DAPP;
  }
  if (lower.includes('announcement') || lower.includes('feature')) {
    return NotificationCategory.ANNOUNCEMENT;
  }

  return NotificationCategory.TRANSACTION;
}

/**
 * Resolves the Android ChannelId for a given notification category.
 */
export function resolveChannelId(category: NotificationCategory): ChannelId {
  return getChannelIdForCategory(category);
}

export const createSubscribeToPushNotifications = () => async () =>
  FCMService.listenToPushNotificationsReceived(async (notification) => {
    const notificationMessage = createNotificationMessage(notification);
    if (!notificationMessage) {
      return;
    }

    const category = resolveNotificationCategory(notification.type);
    const channelId = resolveChannelId(category);

    await NotificationsService.displayNotification({
      id: notification.id,
      channelId,
      pressActionId: PressActionId.OPEN_NOTIFICATIONS_VIEW,
      title: notificationMessage.title,
      body: notificationMessage.description,
      data: notification,
    });
  });

export const isPushNotificationsEnabled = FCMService.isPushNotificationsEnabled;
