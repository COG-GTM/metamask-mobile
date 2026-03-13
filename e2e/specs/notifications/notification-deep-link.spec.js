// @ts-check
import { startMockServer, stopMockServer } from '../../api-mocking/mock-server';
import TestHelpers from '../../helpers';
import EnableNotificationsModal from '../../pages/Notifications/EnableNotificationsModal';
import NotificationDetailsView from '../../pages/Notifications/NotificationDetailsView';
import NotificationMenuView from '../../pages/Notifications/NotificationMenuView';
import WalletView from '../../pages/wallet/WalletView';
import { SmokeNotifications } from '../../tags';
import Assertions from '../../utils/Assertions';
import { importWalletWithRecoveryPhrase } from '../../viewHelper';
import {
  NOTIFICATIONS_TEAM_PASSWORD,
  NOTIFICATIONS_TEAM_SEED_PHRASE,
} from './utils/constants';
import {
  getMockWalletNotificationItemId,
  mockNotificationServices,
} from './utils/mocks';

/**
 * @param {number} port
 * @returns {import('detox/detox').DeviceLaunchAppConfig}
 */
const launchAppSettings = (port) => ({
  newInstance: true,
  delete: true,
  permissions: {
    notifications: 'YES',
  },
  launchArgs: { mockServerPort: port },
});

describe(SmokeNotifications('Notification Deep Link Navigation'), () => {
  /** @type {import('mockttp').Mockttp} */
  let mockServer;

  beforeAll(async () => {
    jest.setTimeout(200000);
    await TestHelpers.reverseServerPort();

    mockServer = await startMockServer({});
    await mockNotificationServices(mockServer);

    await TestHelpers.launchApp(launchAppSettings(mockServer.port));
  });

  afterAll(async () => {
    await stopMockServer(mockServer);
  });

  it('sets up wallet and enables notifications', async () => {
    await importWalletWithRecoveryPhrase({
      seedPhrase: NOTIFICATIONS_TEAM_SEED_PHRASE,
      password: NOTIFICATIONS_TEAM_PASSWORD,
    });

    await WalletView.tapBellIcon();
    await Assertions.checkIfVisible(EnableNotificationsModal.title);
    await EnableNotificationsModal.tapOnConfirm();
  });

  it('navigates to correct detail view when tapping a notification', async () => {
    await Assertions.checkIfVisible(NotificationMenuView.title);

    const notificationId = getMockWalletNotificationItemId();
    await Assertions.checkIfVisible(
      NotificationMenuView.selectNotificationItem(notificationId),
    );

    await NotificationMenuView.tapOnNotificationItem(notificationId);
    await Assertions.checkIfVisible(NotificationDetailsView.title);
  });

  it('returns to notification list after pressing back', async () => {
    await NotificationDetailsView.tapOnBackButton();
    await Assertions.checkIfVisible(NotificationMenuView.title);
  });
});
