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
  getMockFeatureAnnouncementItemId,
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

describe(SmokeNotifications('Notification Deep Links'), () => {
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

  it('tapping a wallet notification navigates to the correct detail view', async () => {
    await Assertions.checkIfVisible(NotificationMenuView.title);

    const walletNotificationId = getMockWalletNotificationItemId();
    await NotificationMenuView.tapOnNotificationItem(walletNotificationId);

    await Assertions.checkIfVisible(NotificationDetailsView.title);
    await NotificationDetailsView.tapOnBackButton();
  });

  it('tapping a feature announcement navigates to the correct detail view', async () => {
    const featureAnnouncementId = getMockFeatureAnnouncementItemId();
    await NotificationMenuView.tapOnNotificationItem(featureAnnouncementId);

    await Assertions.checkIfVisible(NotificationDetailsView.title);
    await NotificationDetailsView.tapOnBackButton();
  });

  it('navigating back from detail view returns to notification list', async () => {
    const walletNotificationId = getMockWalletNotificationItemId();
    await NotificationMenuView.tapOnNotificationItem(walletNotificationId);

    await Assertions.checkIfVisible(NotificationDetailsView.title);
    await NotificationDetailsView.tapOnBackButton();

    await Assertions.checkIfVisible(NotificationMenuView.title);
  });
});
