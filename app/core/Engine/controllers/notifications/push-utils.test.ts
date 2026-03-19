import { ChannelId } from '../../../../util/notifications/androidChannels';
import { NotificationCategory } from '../../../../util/notifications/types/notification-types';
import { resolveNotificationCategory, resolveChannelId } from './push-utils';

jest.mock('../../../../util/notifications/services/FCMService', () => ({
  __esModule: true,
  default: {
    createRegToken: jest.fn(),
    deleteRegToken: jest.fn(),
    listenToPushNotificationsReceived: jest.fn(),
    isPushNotificationsEnabled: jest.fn(),
  },
}));
jest.mock('../../../../util/notifications/services/NotificationService', () => ({
  __esModule: true,
  default: {
    displayNotification: jest.fn(),
  },
}));
jest.mock('./create-push-message', () => ({
  createNotificationMessage: jest.fn(),
}));

describe('resolveNotificationCategory', () => {
  it('returns TRANSACTION when type is undefined', () => {
    expect(resolveNotificationCategory(undefined)).toBe(
      NotificationCategory.TRANSACTION,
    );
  });

  it('returns TRANSACTION when type is empty string', () => {
    expect(resolveNotificationCategory('')).toBe(
      NotificationCategory.TRANSACTION,
    );
  });

  it('returns SECURITY for security-related types', () => {
    expect(resolveNotificationCategory('security_alert')).toBe(
      NotificationCategory.SECURITY,
    );
    expect(resolveNotificationCategory('PHISHING_DETECTED')).toBe(
      NotificationCategory.SECURITY,
    );
  });

  it('returns PRICE_ALERT for price-related types', () => {
    expect(resolveNotificationCategory('price_change')).toBe(
      NotificationCategory.PRICE_ALERT,
    );
    expect(resolveNotificationCategory('price_alert_eth')).toBe(
      NotificationCategory.PRICE_ALERT,
    );
  });

  it('returns DAPP for dapp-related types', () => {
    expect(resolveNotificationCategory('dapp_interaction')).toBe(
      NotificationCategory.DAPP,
    );
    expect(resolveNotificationCategory('snap_notification')).toBe(
      NotificationCategory.DAPP,
    );
  });

  it('returns ANNOUNCEMENT for announcement-related types', () => {
    expect(resolveNotificationCategory('announcement_new')).toBe(
      NotificationCategory.ANNOUNCEMENT,
    );
    expect(resolveNotificationCategory('feature_update')).toBe(
      NotificationCategory.ANNOUNCEMENT,
    );
  });

  it('returns TRANSACTION for unknown types', () => {
    expect(resolveNotificationCategory('eth_sent')).toBe(
      NotificationCategory.TRANSACTION,
    );
  });
});

describe('resolveChannelId', () => {
  it('returns security channel for SECURITY category', () => {
    expect(resolveChannelId(NotificationCategory.SECURITY)).toBe(
      ChannelId.SECURITY_NOTIFICATION_CHANNEL_ID,
    );
  });

  it('returns price alert channel for PRICE_ALERT category', () => {
    expect(resolveChannelId(NotificationCategory.PRICE_ALERT)).toBe(
      ChannelId.PRICE_ALERT_NOTIFICATION_CHANNEL_ID,
    );
  });

  it('returns dapp channel for DAPP category', () => {
    expect(resolveChannelId(NotificationCategory.DAPP)).toBe(
      ChannelId.DAPP_NOTIFICATION_CHANNEL_ID,
    );
  });

  it('returns announcement channel for ANNOUNCEMENT category', () => {
    expect(resolveChannelId(NotificationCategory.ANNOUNCEMENT)).toBe(
      ChannelId.ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID,
    );
  });

  it('returns default channel for TRANSACTION category', () => {
    expect(resolveChannelId(NotificationCategory.TRANSACTION)).toBe(
      ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
    );
  });
});
