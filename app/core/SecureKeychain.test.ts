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

const WRAPPING_KEY_SERVICE = 'com.metamask.SecureKeychainWrappingKey';

describe('SecureKeychain - per-install wrapping key', () => {
  let FreshSecureKeychain: typeof import('./SecureKeychain').default;
  let FreshKeychain: typeof import('react-native-keychain');

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    FreshKeychain = await import('react-native-keychain');
    FreshSecureKeychain = (await import('./SecureKeychain')).default;
  });

  it('generates and persists a random device-only wrapping key when none exists', async () => {
    (FreshKeychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

    FreshSecureKeychain.init('static-fox-code');
    await FreshSecureKeychain.setGenericPassword(
      'login-password',
      FreshSecureKeychain.TYPES.REMEMBER_ME,
    );

    expect(FreshKeychain.setGenericPassword).toHaveBeenCalledWith(
      WRAPPING_KEY_SERVICE,
      expect.any(String),
      expect.objectContaining({
        service: WRAPPING_KEY_SERVICE,
        accessible: FreshKeychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
    );
  });

  it('does not use the static foxCode as the encryption key', async () => {
    (FreshKeychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

    const foxCode = 'static-fox-code';
    FreshSecureKeychain.init(foxCode);
    await FreshSecureKeychain.setGenericPassword(
      'login-password',
      FreshSecureKeychain.TYPES.REMEMBER_ME,
    );

    const wrappingCall = (
      FreshKeychain.setGenericPassword as jest.Mock
    ).mock.calls.find(([account]) => account === WRAPPING_KEY_SERVICE);
    const generatedKey = wrappingCall?.[1];
    expect(generatedKey).toEqual(expect.any(String));
    expect(generatedKey).not.toEqual(foxCode);
  });

  it('encrypts the stored password with the OWASP2023 KDF (not legacy 5000 iterations)', async () => {
    (FreshKeychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

    FreshSecureKeychain.init('static-fox-code');
    await FreshSecureKeychain.setGenericPassword(
      'login-password',
      FreshSecureKeychain.TYPES.REMEMBER_ME,
    );

    const loginCall = (
      FreshKeychain.setGenericPassword as jest.Mock
    ).mock.calls.find(([account]) => account === 'metamask-user');
    const blob = JSON.parse(loginCall?.[1]);
    expect(blob.keyMetadata.params.iterations).toBe(900000);
    expect(blob.keyMetadata.params.iterations).not.toBe(5000);
  });

  it('reuses an existing wrapping key instead of creating a new one', async () => {
    (FreshKeychain.getGenericPassword as jest.Mock).mockImplementation(
      async (options) => {
        if (options?.service === WRAPPING_KEY_SERVICE) {
          return { username: WRAPPING_KEY_SERVICE, password: 'existing-key' };
        }
        return false;
      },
    );

    FreshSecureKeychain.init('static-fox-code');
    await FreshSecureKeychain.setGenericPassword(
      'login-password',
      FreshSecureKeychain.TYPES.REMEMBER_ME,
    );

    const wrappingWrites = (
      FreshKeychain.setGenericPassword as jest.Mock
    ).mock.calls.filter(([account]) => account === WRAPPING_KEY_SERVICE);
    expect(wrappingWrites).toHaveLength(0);
  });
});
