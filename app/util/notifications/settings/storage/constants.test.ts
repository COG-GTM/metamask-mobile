import { STORAGE_IDS, STORAGE_TYPES, mapStorageTypeToIds } from './constants';

describe('notification storage constants', () => {
  describe('STORAGE_IDS', () => {
    it('has NOTIFICATIONS id', () => {
      expect(STORAGE_IDS.NOTIFICATIONS).toBe('notifications');
    });

    it('has GLOBAL_PUSH_NOTIFICATION_SETTINGS id', () => {
      expect(STORAGE_IDS.GLOBAL_PUSH_NOTIFICATION_SETTINGS).toBe('globalNotificationSettings');
    });

    it('has MM_FCM_TOKEN id', () => {
      expect(STORAGE_IDS.MM_FCM_TOKEN).toBe('metaMaskFcmToken');
    });

    it('has PUSH_NOTIFICATIONS_PROMPT_COUNT id', () => {
      expect(STORAGE_IDS.PUSH_NOTIFICATIONS_PROMPT_COUNT).toBe('pushNotificationsPromptCount');
    });

    it('has DEVICE_ID_STORAGE_KEY id', () => {
      expect(STORAGE_IDS.DEVICE_ID_STORAGE_KEY).toBe('pns:deviceId');
    });

    it('has DEFAULT_NOTIFICATION_CHANNEL_ID', () => {
      expect(STORAGE_IDS.DEFAULT_NOTIFICATION_CHANNEL_ID).toBe('DEFAULT_NOTIFICATION_CHANNEL_ID');
    });

    it('has NOTIFICATION_DATE_FORMAT', () => {
      expect(STORAGE_IDS.NOTIFICATION_DATE_FORMAT).toBe('DD/MM/YYYY HH:mm:ss');
    });

    it('has NOTIFICATIONS_SETTINGS', () => {
      expect(STORAGE_IDS.NOTIFICATIONS_SETTINGS).toBe('notifications-settings');
    });

    it('has PN_USER_STORAGE', () => {
      expect(STORAGE_IDS.PN_USER_STORAGE).toBe('pnUserStorage');
    });
  });

  describe('STORAGE_TYPES', () => {
    it('has STRING type', () => {
      expect(STORAGE_TYPES.STRING).toBe('string');
    });

    it('has BOOLEAN type', () => {
      expect(STORAGE_TYPES.BOOLEAN).toBe('boolean');
    });

    it('has NUMBER type', () => {
      expect(STORAGE_TYPES.NUMBER).toBe('number');
    });

    it('has OBJECT type', () => {
      expect(STORAGE_TYPES.OBJECT).toBe('object');
    });
  });

  describe('mapStorageTypeToIds', () => {
    it('returns OBJECT for NOTIFICATIONS', () => {
      expect(mapStorageTypeToIds(STORAGE_IDS.NOTIFICATIONS)).toBe(STORAGE_TYPES.OBJECT);
    });

    it('returns OBJECT for GLOBAL_PUSH_NOTIFICATION_SETTINGS', () => {
      expect(mapStorageTypeToIds(STORAGE_IDS.GLOBAL_PUSH_NOTIFICATION_SETTINGS)).toBe(STORAGE_TYPES.OBJECT);
    });

    it('returns OBJECT for MM_FCM_TOKEN', () => {
      expect(mapStorageTypeToIds(STORAGE_IDS.MM_FCM_TOKEN)).toBe(STORAGE_TYPES.OBJECT);
    });

    it('returns OBJECT for NOTIFICATIONS_SETTINGS', () => {
      expect(mapStorageTypeToIds(STORAGE_IDS.NOTIFICATIONS_SETTINGS)).toBe(STORAGE_TYPES.OBJECT);
    });

    it('returns OBJECT for PN_USER_STORAGE', () => {
      expect(mapStorageTypeToIds(STORAGE_IDS.PN_USER_STORAGE)).toBe(STORAGE_TYPES.OBJECT);
    });

    it('returns NUMBER for PUSH_NOTIFICATIONS_PROMPT_COUNT', () => {
      expect(mapStorageTypeToIds(STORAGE_IDS.PUSH_NOTIFICATIONS_PROMPT_COUNT)).toBe(STORAGE_TYPES.NUMBER);
    });

    it('returns BOOLEAN for REQUEST_PERMISSION_ASKED', () => {
      expect(mapStorageTypeToIds(STORAGE_IDS.REQUEST_PERMISSION_ASKED)).toBe(STORAGE_TYPES.BOOLEAN);
    });

    it('returns BOOLEAN for REQUEST_PERMISSION_GRANTED', () => {
      expect(mapStorageTypeToIds(STORAGE_IDS.REQUEST_PERMISSION_GRANTED)).toBe(STORAGE_TYPES.BOOLEAN);
    });

    it('returns STRING for unknown id', () => {
      expect(mapStorageTypeToIds('unknown-id')).toBe(STORAGE_TYPES.STRING);
    });

    it('returns STRING for DEVICE_ID_STORAGE_KEY', () => {
      expect(mapStorageTypeToIds(STORAGE_IDS.DEVICE_ID_STORAGE_KEY)).toBe(STORAGE_TYPES.STRING);
    });
  });
});
