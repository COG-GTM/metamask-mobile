import { defaultState } from '@metamask/notification-services-controller/push-services';
import {
  MOCK_NOTIFICATION_SERVICES_CONTROLLER,
  MOCK_NOTIFICATION_SERVICES_PUSH_CONTROLLER,
} from './testUtils';

describe('selectors/notifications/testUtils', () => {
  it('MOCK_NOTIFICATION_SERVICES_CONTROLLER enables notifications and seeds read/list arrays', () => {
    expect(MOCK_NOTIFICATION_SERVICES_CONTROLLER).toEqual(
      expect.objectContaining({
        isNotificationServicesEnabled: true,
        isMetamaskNotificationsFeatureSeen: true,
        isFeatureAnnouncementsEnabled: true,
        metamaskNotificationsReadList: [],
      }),
    );
    expect(
      Array.isArray(
        MOCK_NOTIFICATION_SERVICES_CONTROLLER.metamaskNotificationsList,
      ),
    ).toBe(true);
  });

  it('MOCK_NOTIFICATION_SERVICES_PUSH_CONTROLLER extends defaultState with isPushEnabled=true', () => {
    expect(MOCK_NOTIFICATION_SERVICES_PUSH_CONTROLLER).toEqual({
      ...defaultState,
      isPushEnabled: true,
    });
  });
});
