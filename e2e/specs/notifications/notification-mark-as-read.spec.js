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

describe(SmokeNotifications('Notification Mark as Read'), () => {
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

  it('views a notification and marks it as read', async () => {
    await Assertions.checkIfVisible(NotificationMenuView.title);

    const walletNotificationId = getMockWalletNotificationItemId();

    // Tap into the notification detail view
    await NotificationMenuView.tapOnNotificationItem(walletNotificationId);
    await Assertions.checkIfVisible(NotificationDetailsView.title);

    // Navigate back to the list
    await NotificationDetailsView.tapOnBackButton();
    await Assertions.checkIfVisible(NotificationMenuView.title);
  });

  it('notification item is still visible after viewing', async () => {
    const walletNotificationId = getMockWalletNotificationItemId();
    await Assertions.checkIfVisible(
      NotificationMenuView.selectNotificationItem(walletNotificationId),
    );
  });
});
