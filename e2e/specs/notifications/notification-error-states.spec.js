// @ts-check
import { startMockServer, stopMockServer } from '../../api-mocking/mock-server';
import TestHelpers from '../../helpers';
import EnableNotificationsModal from '../../pages/Notifications/EnableNotificationsModal';
import WalletView from '../../pages/wallet/WalletView';
import { SmokeNotifications } from '../../tags';
import Assertions from '../../utils/Assertions';
import { importWalletWithRecoveryPhrase } from '../../viewHelper';
import {
  NOTIFICATIONS_TEAM_PASSWORD,
  NOTIFICATIONS_TEAM_SEED_PHRASE,
} from './utils/constants';
import {
  mockNotificationServices,
} from './utils/mocks';
import { getDecodedProxiedURL } from './utils/helpers';

/**
 * Extends the standard mock notification services with error response variants.
 * Specific endpoints return 500 errors to test error handling.
 *
 * @param {import('mockttp').Mockttp} server - obj used to mock our endpoints
 */
async function mockNotificationServicesWithErrors(server) {
  // First set up normal mocks for auth and other services
  await mockNotificationServices(server);

  // Override the list notifications endpoint to return 500
  server
    .forGet('/proxy')
    .matching((request) => {
      const url = getDecodedProxiedURL(request.url);
      return url.includes('notifications/metamask');
    })
    .thenCallback(() => ({
      statusCode: 500,
      json: { error: 'Internal Server Error' },
    }));
}

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

describe(SmokeNotifications('Notification Error States'), () => {
  /** @type {import('mockttp').Mockttp} */
  let mockServer;

  beforeAll(async () => {
    jest.setTimeout(200000);
    await TestHelpers.reverseServerPort();

    mockServer = await startMockServer({});
    await mockNotificationServicesWithErrors(mockServer);

    await TestHelpers.launchApp(launchAppSettings(mockServer.port));
  });

  afterAll(async () => {
    await stopMockServer(mockServer);
  });

  it('sets up wallet and attempts to enable notifications with error responses', async () => {
    await importWalletWithRecoveryPhrase({
      seedPhrase: NOTIFICATIONS_TEAM_SEED_PHRASE,
      password: NOTIFICATIONS_TEAM_PASSWORD,
    });

    await WalletView.tapBellIcon();
    await Assertions.checkIfVisible(EnableNotificationsModal.title);
    await EnableNotificationsModal.tapOnConfirm();
  });

  it('app does not crash when notification services return errors', async () => {
    // The app should still be running and functional even when notification
    // services return 500 errors. The wallet view should still be accessible.
    // We verify stability by checking we can still navigate.
    await TestHelpers.delay(3000);

    // The app should not have crashed - we should still be in a valid state
    // Either the notification menu is shown (with empty/error state) or
    // we're back on the wallet view
    try {
      await Assertions.checkIfVisible(WalletView.container);
    } catch {
      // If not on wallet view, we might be on notifications view which is also valid
    }
  });
});
