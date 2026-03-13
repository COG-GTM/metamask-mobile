import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import {
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
    (
      Engine.context.NotificationServicesController
        .enableMetamaskNotifications as jest.Mock
    ).mockRejectedValueOnce(new Error('Engine failure'));
    await expect(enableNotifications()).rejects.toThrow('Engine failure');
  });

  it('disableNotifications propagates errors from Engine', async () => {
    (
      Engine.context.NotificationServicesController
        .disableNotificationServices as jest.Mock
    ).mockRejectedValueOnce(new Error('Disable failure'));
    await expect(disableNotifications()).rejects.toThrow('Disable failure');
  });

  it('fetchNotifications propagates errors from Engine', async () => {
    (
      Engine.context.NotificationServicesController
        .fetchAndUpdateMetamaskNotifications as jest.Mock
    ).mockRejectedValueOnce(new Error('Fetch failure'));
    await expect(fetchNotifications()).rejects.toThrow('Fetch failure');
  });

  it('resetNotifications propagates errors from Engine', async () => {
    (
      Engine.context.NotificationServicesController
        .createOnChainTriggers as jest.Mock
    ).mockRejectedValueOnce(new Error('Reset failure'));
    await expect(resetNotifications()).rejects.toThrow('Reset failure');
  });

  it('enablePushNotifications propagates errors from Engine', async () => {
    (
      Engine.context.NotificationServicesController
        .enablePushNotifications as jest.Mock
    ).mockRejectedValueOnce(new Error('Push enable failure'));
    await expect(enablePushNotifications()).rejects.toThrow(
      'Push enable failure',
    );
  });

  it('disablePushNotifications propagates errors from Engine', async () => {
    (
      Engine.context.NotificationServicesController
        .disablePushNotifications as jest.Mock
    ).mockRejectedValueOnce(new Error('Push disable failure'));
    await expect(disablePushNotifications()).rejects.toThrow(
      'Push disable failure',
    );
  });

  it('markNotificationsAsRead propagates errors from Engine', async () => {
    (
      Engine.context.NotificationServicesController
        .markMetamaskNotificationsAsRead as jest.Mock
    ).mockRejectedValueOnce(new Error('Mark read failure'));
    const readNotifications = [
      { id: '1', isRead: true, type: TRIGGER_TYPES.ETH_SENT },
    ];
    await expect(markNotificationsAsRead(readNotifications)).rejects.toThrow(
      'Mark read failure',
    );
  });
});

describe('helpers - return values', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchAccountNotificationSettings returns account status from Engine', async () => {
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

  it('enableNotifications resolves to undefined on success', async () => {
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

  it('fetchAccountNotificationSettings passes accounts array to Engine', async () => {
    const accounts = ['0x1', '0x2'];
    await fetchAccountNotificationSettings(accounts);
    expect(
      Engine.context.NotificationServicesController.checkAccountsPresence,
    ).toHaveBeenCalledWith(accounts);
  });

  it('deleteNotificationsForAccount passes accounts array to Engine', async () => {
    const accounts = ['0xA'];
    await deleteNotificationsForAccount(accounts);
    expect(
      Engine.context.NotificationServicesController
        .deleteOnChainTriggersByAccount,
    ).toHaveBeenCalledWith(accounts);
  });

  it('toggleFeatureAnnouncements passes boolean to Engine', async () => {
    await toggleFeatureAnnouncements(false);
    expect(
      Engine.context.NotificationServicesController
        .setFeatureAnnouncementsEnabled,
    ).toHaveBeenCalledWith(false);
  });

  it('markNotificationsAsRead passes notification objects to Engine', async () => {
    const notifications = [
      { id: 'n1', isRead: true, type: TRIGGER_TYPES.ERC20_SENT },
      { id: 'n2', isRead: false, type: TRIGGER_TYPES.ETH_RECEIVED },
    ];
    await markNotificationsAsRead(notifications);
    expect(
      Engine.context.NotificationServicesController
        .markMetamaskNotificationsAsRead,
    ).toHaveBeenCalledWith(notifications);
  });
});

describe('helpers - concurrent calls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles concurrent enableNotifications and disableNotifications calls', async () => {
    (
      Engine.context.NotificationServicesController
        .enableMetamaskNotifications as jest.Mock
    ).mockResolvedValue(undefined);
    (
      Engine.context.NotificationServicesController
        .disableNotificationServices as jest.Mock
    ).mockResolvedValue(undefined);

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

  it('handles concurrent fetchNotifications calls', async () => {
    (
      Engine.context.NotificationServicesController
        .fetchAndUpdateMetamaskNotifications as jest.Mock
    ).mockResolvedValue(undefined);

    await Promise.all([fetchNotifications(), fetchNotifications()]);

    expect(
      Engine.context.NotificationServicesController
        .fetchAndUpdateMetamaskNotifications,
    ).toHaveBeenCalledTimes(2);
  });

  it('handles mixed success and failure in concurrent calls', async () => {
    (
      Engine.context.NotificationServicesController
        .enableMetamaskNotifications as jest.Mock
    ).mockResolvedValueOnce(undefined);
    (
      Engine.context.NotificationServicesController
        .disableNotificationServices as jest.Mock
    ).mockRejectedValueOnce(new Error('Disable failed'));

    const results = await Promise.allSettled([
      enableNotifications(),
      disableNotifications(),
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
  });
});
