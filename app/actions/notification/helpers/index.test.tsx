import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import {
  assertIsFeatureEnabled,
  enableNotifications,
  disableNotifications,
  fetchAccountNotificationSettings,
  deleteNotificationsForAccount,
  createNotificationsForAccount,
  resetNotifications,
  toggleFeatureAnnouncements,
  fetchNotifications,
  markNotificationsAsRead,
  enablePushNotifications,
  disablePushNotifications,
} from '.';
import Engine from '../../../core/Engine';

jest.mock('../../../util/notifications', () => ({
  isNotificationsFeatureEnabled: () => true,
}));

const mockNotificationServicesController = {
  enableMetamaskNotifications: jest.fn(),
  disableNotificationServices: jest.fn(),
  checkAccountsPresence: jest.fn(),
  deleteOnChainTriggersByAccount: jest.fn(),
  updateOnChainTriggersByAccount: jest.fn(),
  createOnChainTriggers: jest.fn(),
  setFeatureAnnouncementsEnabled: jest.fn(),
  fetchAndUpdateMetamaskNotifications: jest.fn(),
  markMetamaskNotificationsAsRead: jest.fn(),
  enablePushNotifications: jest.fn(),
  disablePushNotifications: jest.fn(),
};

jest.mock('../../../core/Engine', () => ({
  context: {
    NotificationServicesController: {
      enableMetamaskNotifications: jest.fn(),
      disableNotificationServices: jest.fn(),
      checkAccountsPresence: jest.fn(),
      deleteOnChainTriggersByAccount: jest.fn(),
      updateOnChainTriggersByAccount: jest.fn(),
      createOnChainTriggers: jest.fn(),
      setFeatureAnnouncementsEnabled: jest.fn(),
      fetchAndUpdateMetamaskNotifications: jest.fn(),
      markMetamaskNotificationsAsRead: jest.fn(),
      enablePushNotifications: jest.fn(),
      disablePushNotifications: jest.fn(),
    },
  },
}));

describe('helpers - enableNotificationServices()', () => {
  it('invoke notification services method', async () => {
    await enableNotifications();
    expect(
      Engine.context.NotificationServicesController.enableMetamaskNotifications,
    ).toHaveBeenCalled();
  });
});

describe('helpers - disableNotificationServices()', () => {
  it('invoke notification services method', async () => {
    await disableNotifications();
    expect(
      Engine.context.NotificationServicesController.disableNotificationServices,
    ).toHaveBeenCalled();
  });
});

describe('helpers - checkAccountsPresence()', () => {
  it('invoke notification services method', async () => {
    const accounts = ['0xAddr1', '0xAddr2', '0xAddr3'];
    await fetchAccountNotificationSettings(accounts);
    expect(
      Engine.context.NotificationServicesController.checkAccountsPresence,
    ).toHaveBeenCalledWith(accounts);
  });
});

describe('helpers - deleteOnChainTriggersByAccount()', () => {
  it('invoke notification services method', async () => {
    const accounts = ['0xAddr1', '0xAddr2', '0xAddr3'];
    await deleteNotificationsForAccount(accounts);
    expect(
      Engine.context.NotificationServicesController
        .deleteOnChainTriggersByAccount,
    ).toHaveBeenCalledWith(accounts);
  });
});

describe('helpers - updateOnChainTriggersByAccount()', () => {
  it('invoke notification services method', async () => {
    const accounts = ['0xAddr1', '0xAddr2', '0xAddr3'];
    await createNotificationsForAccount(accounts);
    expect(
      Engine.context.NotificationServicesController
        .updateOnChainTriggersByAccount,
    ).toHaveBeenCalledWith(accounts);
  });
});

describe('helpers - createOnChainTriggersByAccount()', () => {
  it('invoke notification services method', async () => {
    await resetNotifications();
    expect(
      Engine.context.NotificationServicesController.createOnChainTriggers,
    ).toHaveBeenCalled();
  });
});

describe('helpers - setFeatureAnnouncementsEnabled()', () => {
  it('invoke notification services method', async () => {
    await toggleFeatureAnnouncements(true);
    expect(
      Engine.context.NotificationServicesController
        .setFeatureAnnouncementsEnabled,
    ).toHaveBeenCalled();
  });
});

describe('helpers - fetchAndUpdateMetamaskNotifications()', () => {
  it('invoke notification services method', async () => {
    await fetchNotifications();
    expect(
      Engine.context.NotificationServicesController
        .fetchAndUpdateMetamaskNotifications,
    ).toHaveBeenCalled();
  });
});

describe('helpers - markMetamaskNotificationsAsRead()', () => {
  it('invoke notification services method', async () => {
    const readNotifications = [
      { id: '1', isRead: true, type: TRIGGER_TYPES.ETH_SENT },
    ];
    await markNotificationsAsRead(readNotifications);
    expect(
      Engine.context.NotificationServicesController
        .markMetamaskNotificationsAsRead,
    ).toHaveBeenCalledWith(readNotifications);
  });
});

describe('helpers - enablePushNotifications()', () => {
  it('invoke notification services method', async () => {
    await enablePushNotifications();
    expect(
      Engine.context.NotificationServicesController.enablePushNotifications,
    ).toHaveBeenCalled();
  });
});

describe('helpers - disablePushNotifications()', () => {
  it('invoke notification services method', async () => {
    await disablePushNotifications();
    expect(
      Engine.context.NotificationServicesController.disablePushNotifications,
    ).toHaveBeenCalled();
  });
});

describe('helpers - error propagation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enableNotifications propagates errors from Engine', async () => {
    const error = new Error('Engine failure');
    (
      Engine.context.NotificationServicesController
        .enableMetamaskNotifications as jest.Mock
    ).mockRejectedValueOnce(error);
    await expect(enableNotifications()).rejects.toThrow('Engine failure');
  });

  it('disableNotifications propagates errors from Engine', async () => {
    const error = new Error('Disable failure');
    (
      Engine.context.NotificationServicesController
        .disableNotificationServices as jest.Mock
    ).mockRejectedValueOnce(error);
    await expect(disableNotifications()).rejects.toThrow('Disable failure');
  });

  it('fetchNotifications propagates errors from Engine', async () => {
    const error = new Error('Fetch failure');
    (
      Engine.context.NotificationServicesController
        .fetchAndUpdateMetamaskNotifications as jest.Mock
    ).mockRejectedValueOnce(error);
    await expect(fetchNotifications()).rejects.toThrow('Fetch failure');
  });

  it('resetNotifications propagates errors from Engine', async () => {
    const error = new Error('Reset failure');
    (
      Engine.context.NotificationServicesController
        .createOnChainTriggers as jest.Mock
    ).mockRejectedValueOnce(error);
    await expect(resetNotifications()).rejects.toThrow('Reset failure');
  });

  it('enablePushNotifications propagates errors from Engine', async () => {
    const error = new Error('Push enable failure');
    (
      Engine.context.NotificationServicesController
        .enablePushNotifications as jest.Mock
    ).mockRejectedValueOnce(error);
    await expect(enablePushNotifications()).rejects.toThrow(
      'Push enable failure',
    );
  });

  it('disablePushNotifications propagates errors from Engine', async () => {
    const error = new Error('Push disable failure');
    (
      Engine.context.NotificationServicesController
        .disablePushNotifications as jest.Mock
    ).mockRejectedValueOnce(error);
    await expect(disablePushNotifications()).rejects.toThrow(
      'Push disable failure',
    );
  });
});

describe('helpers - return value verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchAccountNotificationSettings returns account status', async () => {
    const expectedStatus = { '0xAddr1': true, '0xAddr2': false };
    (
      Engine.context.NotificationServicesController
        .checkAccountsPresence as jest.Mock
    ).mockResolvedValueOnce(expectedStatus);
    const result = await fetchAccountNotificationSettings([
      '0xAddr1',
      '0xAddr2',
    ]);
    expect(result).toEqual(expectedStatus);
  });

  it('enableNotifications resolves without return value', async () => {
    (
      Engine.context.NotificationServicesController
        .enableMetamaskNotifications as jest.Mock
    ).mockResolvedValueOnce(undefined);
    const result = await enableNotifications();
    expect(result).toBeUndefined();
  });
});

describe('helpers - parameter validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toggleFeatureAnnouncements passes boolean parameter correctly', async () => {
    await toggleFeatureAnnouncements(false);
    expect(
      Engine.context.NotificationServicesController
        .setFeatureAnnouncementsEnabled,
    ).toHaveBeenCalledWith(false);

    await toggleFeatureAnnouncements(true);
    expect(
      Engine.context.NotificationServicesController
        .setFeatureAnnouncementsEnabled,
    ).toHaveBeenCalledWith(true);
  });

  it('markNotificationsAsRead passes notification list correctly', async () => {
    const notifications = [
      { id: '1', isRead: true, type: TRIGGER_TYPES.ETH_SENT },
      { id: '2', isRead: true, type: TRIGGER_TYPES.ERC20_RECEIVED },
    ];
    await markNotificationsAsRead(notifications);
    expect(
      Engine.context.NotificationServicesController
        .markMetamaskNotificationsAsRead,
    ).toHaveBeenCalledWith(notifications);
  });

  it('deleteNotificationsForAccount passes accounts array correctly', async () => {
    const accounts = ['0xSingle'];
    await deleteNotificationsForAccount(accounts);
    expect(
      Engine.context.NotificationServicesController
        .deleteOnChainTriggersByAccount,
    ).toHaveBeenCalledWith(accounts);
  });

  it('createNotificationsForAccount passes accounts array correctly', async () => {
    const accounts = ['0xA', '0xB', '0xC'];
    await createNotificationsForAccount(accounts);
    expect(
      Engine.context.NotificationServicesController
        .updateOnChainTriggersByAccount,
    ).toHaveBeenCalledWith(accounts);
  });

  it('assertIsFeatureEnabled throws when feature is disabled', () => {
    jest.requireMock('../../../util/notifications').isNotificationsFeatureEnabled =
      () => false;
    expect(() => assertIsFeatureEnabled()).toThrow();
    jest.requireMock('../../../util/notifications').isNotificationsFeatureEnabled =
      () => true;
  });
});

describe('helpers - concurrent call behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles concurrent enableNotifications calls', async () => {
    let resolveFirst: () => void;
    let resolveSecond: () => void;
    const firstCall = new Promise<void>((r) => {
      resolveFirst = r;
    });
    const secondCall = new Promise<void>((r) => {
      resolveSecond = r;
    });
    (
      Engine.context.NotificationServicesController
        .enableMetamaskNotifications as jest.Mock
    )
      .mockReturnValueOnce(firstCall)
      .mockReturnValueOnce(secondCall);

    const promise1 = enableNotifications();
    const promise2 = enableNotifications();

    resolveFirst!();
    resolveSecond!();

    await Promise.all([promise1, promise2]);
    expect(
      Engine.context.NotificationServicesController
        .enableMetamaskNotifications,
    ).toHaveBeenCalledTimes(2);
  });

  it('handles concurrent enable and disable calls', async () => {
    (
      Engine.context.NotificationServicesController
        .enableMetamaskNotifications as jest.Mock
    ).mockResolvedValueOnce(undefined);
    (
      Engine.context.NotificationServicesController
        .disableNotificationServices as jest.Mock
    ).mockResolvedValueOnce(undefined);

    await Promise.all([enableNotifications(), disableNotifications()]);

    expect(
      Engine.context.NotificationServicesController
        .enableMetamaskNotifications,
    ).toHaveBeenCalledTimes(1);
    expect(
      Engine.context.NotificationServicesController
        .disableNotificationServices,
    ).toHaveBeenCalledTimes(1);
  });

  it('handles concurrent fetchNotifications calls without interference', async () => {
    (
      Engine.context.NotificationServicesController
        .fetchAndUpdateMetamaskNotifications as jest.Mock
    ).mockResolvedValue(undefined);

    await Promise.all([
      fetchNotifications(),
      fetchNotifications(),
      fetchNotifications(),
    ]);

    expect(
      Engine.context.NotificationServicesController
        .fetchAndUpdateMetamaskNotifications,
    ).toHaveBeenCalledTimes(3);
  });
});
