import FCMService from '../../../../util/notifications/services/FCMService';
import NotificationsService from '../../../../util/notifications/services/NotificationService';
import { PressActionId } from '../../../../util/notifications';
import { createNotificationMessage } from './create-push-message';
import {
  createRegToken,
  deleteRegToken,
  createSubscribeToPushNotifications,
  isPushNotificationsEnabled,
} from './push-utils';

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

describe('push-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('re-exports FCMService.createRegToken, deleteRegToken, and isPushNotificationsEnabled', () => {
    expect(createRegToken).toBe(FCMService.createRegToken);
    expect(deleteRegToken).toBe(FCMService.deleteRegToken);
    expect(isPushNotificationsEnabled).toBe(FCMService.isPushNotificationsEnabled);
  });

  describe('createSubscribeToPushNotifications', () => {
    it('returns an async function that subscribes to FCM push notifications', async () => {
      const subscribe = createSubscribeToPushNotifications();
      await subscribe();

      expect(FCMService.listenToPushNotificationsReceived).toHaveBeenCalledTimes(1);
      expect(FCMService.listenToPushNotificationsReceived).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('displays a notification when a message is received and createNotificationMessage returns a payload', async () => {
      let capturedCb: ((notification: unknown) => Promise<void>) | undefined;
      (FCMService.listenToPushNotificationsReceived as jest.Mock).mockImplementation(
        (cb) => {
          capturedCb = cb;
        },
      );
      (createNotificationMessage as jest.Mock).mockReturnValue({
        title: 'hello',
        description: 'world',
      });

      const subscribe = createSubscribeToPushNotifications();
      await subscribe();

      const notification = { id: 'notif-1', foo: 'bar' };
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await capturedCb!(notification);

      expect(NotificationsService.displayNotification).toHaveBeenCalledWith({
        id: 'notif-1',
        pressActionId: PressActionId.OPEN_NOTIFICATIONS_VIEW,
        title: 'hello',
        body: 'world',
        data: notification,
      });
    });

    it('skips display when createNotificationMessage returns a falsy value', async () => {
      let capturedCb: ((notification: unknown) => Promise<void>) | undefined;
      (FCMService.listenToPushNotificationsReceived as jest.Mock).mockImplementation(
        (cb) => {
          capturedCb = cb;
        },
      );
      (createNotificationMessage as jest.Mock).mockReturnValue(undefined);

      const subscribe = createSubscribeToPushNotifications();
      await subscribe();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await capturedCb!({ id: 'notif-2' });

      expect(NotificationsService.displayNotification).not.toHaveBeenCalled();
    });
  });
});
