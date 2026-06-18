import SecureKeychain from './SecureKeychain';
import * as Keychain from 'react-native-keychain'; // eslint-disable-line import/no-namespace
import StorageWrapper from '../store/storage-wrapper';
import { Platform } from 'react-native';
import {
  BIOMETRY_CHOICE,
  BIOMETRY_CHOICE_DISABLED,
  PASSCODE_CHOICE,
  PASSCODE_DISABLED,
  TRUE,
} from '../constants/storage';
import { UserProfileProperty } from '../util/metrics/UserSettingsAnalyticsMetaData/UserProfileAnalyticsMetaData.types';
import AUTHENTICATION_TYPE from '../constants/userProperties';

jest.mock('../../locales/i18n', () => ({
  strings: jest.fn((key) => key),
}));

jest.mock('../store/storage-wrapper', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(),
    removeItem: jest.fn(),
    getItem: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: 'BIOMETRY_CURRENT_SET',
    DEVICE_PASSCODE: 'DEVICE_PASSCODE',
  },
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

jest.mock('../store/storage-wrapper', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockAddTraitsToUser = jest.fn();
jest.mock('../core/Analytics', () => ({
  MetaMetrics: {
    getInstance: jest.fn(() => ({
      addTraitsToUser: mockAddTraitsToUser,
      trackEvent: jest.fn(),
    })),
  },
}));

describe('SecureKeychain - setGenericPassword', () => {
  const mockPassword = 'test_password';

  beforeEach(() => {
    jest.clearAllMocks();
    SecureKeychain.init('test_salt');
  });

  it('should set biometric authentication correctly', async () => {
    await SecureKeychain.setGenericPassword(
      mockPassword,
      SecureKeychain.TYPES.BIOMETRICS,
    );

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'metamask-user',
      expect.any(String),
      expect.objectContaining({
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      }),
    );
    expect(StorageWrapper.setItem).toHaveBeenCalledWith(BIOMETRY_CHOICE, TRUE);
    expect(StorageWrapper.setItem).toHaveBeenCalledWith(
      PASSCODE_DISABLED,
      TRUE,
    );
    expect(mockAddTraitsToUser).toHaveBeenCalledWith(
      expect.objectContaining({
        [UserProfileProperty.AUTHENTICATION_TYPE]:
          AUTHENTICATION_TYPE.BIOMETRIC,
      }),
    );
  });

  it('should set passcode authentication correctly', async () => {
    await SecureKeychain.setGenericPassword(
      mockPassword,
      SecureKeychain.TYPES.PASSCODE,
    );

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'metamask-user',
      expect.any(String),
      expect.objectContaining({
        accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
      }),
    );
    expect(StorageWrapper.setItem).toHaveBeenCalledWith(PASSCODE_CHOICE, TRUE);
    expect(StorageWrapper.setItem).toHaveBeenCalledWith(
      BIOMETRY_CHOICE_DISABLED,
      TRUE,
    );
  });

  it('should set remember me correctly', async () => {
    await SecureKeychain.setGenericPassword(
      mockPassword,
      SecureKeychain.TYPES.REMEMBER_ME,
    );

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'metamask-user',
      expect.any(String),
      expect.not.objectContaining({
        accessControl: expect.anything(),
      }),
    );
    expect(StorageWrapper.setItem).toHaveBeenCalledWith(
      PASSCODE_DISABLED,
      TRUE,
    );
    expect(StorageWrapper.setItem).toHaveBeenCalledWith(
      BIOMETRY_CHOICE_DISABLED,
      TRUE,
    );
  });

  it('should reset password when no type is provided', async () => {
    const resetSpy = jest.spyOn(SecureKeychain, 'resetGenericPassword');
    await SecureKeychain.setGenericPassword(mockPassword);

    expect(resetSpy).toHaveBeenCalled();
    expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
  });

  describe('iOS Biometric Handling', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('should handle user cancellation of biometric prompt', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(
        new Error('User canceled the operation.'),
      );

      await SecureKeychain.setGenericPassword(
        mockPassword,
        SecureKeychain.TYPES.BIOMETRICS,
      );

      expect(StorageWrapper.removeItem).toHaveBeenCalledWith(BIOMETRY_CHOICE);
      expect(StorageWrapper.setItem).toHaveBeenCalledWith(
        BIOMETRY_CHOICE_DISABLED,
        TRUE,
      );
      expect(mockAddTraitsToUser).toHaveBeenLastCalledWith(
        expect.objectContaining({
          [UserProfileProperty.AUTHENTICATION_TYPE]:
            AUTHENTICATION_TYPE.PASSWORD,
        }),
      );
    });

    it('should successfully set up biometric authentication', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
        password: 'encrypted_password',
      });

      await SecureKeychain.setGenericPassword(
        mockPassword,
        SecureKeychain.TYPES.BIOMETRICS,
      );

      expect(StorageWrapper.setItem).toHaveBeenCalledWith(
        BIOMETRY_CHOICE,
        TRUE,
      );
      expect(StorageWrapper.setItem).toHaveBeenCalledWith(
        PASSCODE_DISABLED,
        TRUE,
      );
      expect(StorageWrapper.removeItem).toHaveBeenCalledWith(PASSCODE_CHOICE);
      expect(StorageWrapper.removeItem).toHaveBeenCalledWith(
        BIOMETRY_CHOICE_DISABLED,
      );
      expect(mockAddTraitsToUser).toHaveBeenCalledWith(
        expect.objectContaining({
          [UserProfileProperty.AUTHENTICATION_TYPE]:
            AUTHENTICATION_TYPE.BIOMETRIC,
        }),
      );
    });
  });
});

describe('SecureKeychain - per-device encryption key', () => {
  const DEVICE_KEY_SERVICE = 'com.metamask.device-encryption-key';
  const GENERATED_DEVICE_KEY = 'random-device-key';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let FreshKeychain: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let FreshSecureKeychain: any;
  let mockEncrypt: jest.Mock;
  let mockDecrypt: jest.Mock;

  const loadFresh = () => {
    jest.resetModules();
    mockEncrypt = jest.fn().mockResolvedValue('cipher');
    mockDecrypt = jest.fn();
    jest.doMock('./Encryptor', () => ({
      Encryptor: jest.fn().mockImplementation(() => ({
        encrypt: mockEncrypt,
        decrypt: mockDecrypt,
        generateSalt: jest.fn(() => GENERATED_DEVICE_KEY),
      })),
      LEGACY_DERIVATION_OPTIONS: {},
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    FreshKeychain = require('react-native-keychain');
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    FreshSecureKeychain = require('./SecureKeychain').default;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.dontMock('./Encryptor');
  });

  it('wraps the password with the per-device key, not the static build code', async () => {
    loadFresh();
    FreshKeychain.getGenericPassword.mockResolvedValue(false);
    FreshSecureKeychain.init('static-fox-code');

    await FreshSecureKeychain.setGenericPassword(
      'wallet-password',
      FreshSecureKeychain.TYPES.REMEMBER_ME,
    );

    expect(mockEncrypt).toHaveBeenCalledWith(GENERATED_DEVICE_KEY, {
      password: 'wallet-password',
    });
    expect(mockEncrypt).not.toHaveBeenCalledWith(
      'static-fox-code',
      expect.anything(),
    );
  });

  it('generates and persists a per-device key on first use', async () => {
    loadFresh();
    FreshKeychain.getGenericPassword.mockResolvedValue(false);
    FreshSecureKeychain.init('static-fox-code');

    await FreshSecureKeychain.setGenericPassword(
      'wallet-password',
      FreshSecureKeychain.TYPES.REMEMBER_ME,
    );

    expect(FreshKeychain.setGenericPassword).toHaveBeenCalledWith(
      'metamask-device',
      GENERATED_DEVICE_KEY,
      expect.objectContaining({
        service: DEVICE_KEY_SERVICE,
        accessible: FreshKeychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
    );
  });

  it('reuses an existing per-device key instead of generating a new one', async () => {
    loadFresh();
    FreshKeychain.getGenericPassword.mockResolvedValue({
      password: 'existing-device-key',
    });
    FreshSecureKeychain.init('static-fox-code');

    await FreshSecureKeychain.setGenericPassword(
      'wallet-password',
      FreshSecureKeychain.TYPES.REMEMBER_ME,
    );

    expect(mockEncrypt).toHaveBeenCalledWith('existing-device-key', {
      password: 'wallet-password',
    });
    const persistedDeviceKey = FreshKeychain.setGenericPassword.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === 'metamask-device',
    );
    expect(persistedDeviceKey).toBeUndefined();
  });

  it('falls back to the legacy build code to decrypt pre-migration passwords', async () => {
    loadFresh();
    mockDecrypt
      .mockRejectedValueOnce(new Error('unable to decrypt with device key'))
      .mockResolvedValueOnce({ password: 'wallet-password' });

    FreshKeychain.getGenericPassword.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (options: any) => {
        if (options?.service === DEVICE_KEY_SERVICE) {
          return { password: 'device-key' };
        }
        return { password: 'legacy-blob' };
      },
    );

    FreshSecureKeychain.init('static-fox-code');

    const result = await FreshSecureKeychain.getGenericPassword();

    expect(mockDecrypt).toHaveBeenNthCalledWith(1, 'device-key', 'legacy-blob');
    expect(mockDecrypt).toHaveBeenNthCalledWith(
      2,
      'static-fox-code',
      'legacy-blob',
    );
    expect(result.password).toBe('wallet-password');
  });
});
