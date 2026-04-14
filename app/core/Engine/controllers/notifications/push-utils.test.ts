jest.mock('../../../../util/notifications/services/FCMService', () => ({
  createRegToken: jest.fn().mockResolvedValue('mock-token'),
  deleteRegToken: jest.fn().mockResolvedValue(undefined),
  listenToPushNotificationsReceived: jest.fn(),
  isPushNotificationsEnabled: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../../../util/notifications/services/NotificationService', () => ({
  displayNotification: jest.fn(),
}));

jest.mock('../../../../util/notifications', () => ({
  PressActionId: {
    OPEN_NOTIFICATIONS_VIEW: 'open-notifications-view',
  },
}));

jest.mock('./create-push-message', () => ({
  createNotificationMessage: jest.fn(),
}));

import {
  createRegToken,
  deleteRegToken,
  createSubscribeToPushNotifications,
  isPushNotificationsEnabled,
} from './push-utils';

describe('push-utils', () => {
  it('should export createRegToken', () => {
    expect(typeof createRegToken).toBe('function');
  });

  it('should export deleteRegToken', () => {
    expect(typeof deleteRegToken).toBe('function');
  });

  it('should export isPushNotificationsEnabled', () => {
    expect(typeof isPushNotificationsEnabled).toBe('function');
  });

  it('createSubscribeToPushNotifications should return a function', () => {
    const subscriber = createSubscribeToPushNotifications();
    expect(typeof subscriber).toBe('function');
  });
});
