import StorageWrapper from '../../store/storage-wrapper';
import {
  BIOMETRY_CHOICE_DISABLED,
  TRUE,
  PASSCODE_DISABLED,
  EXISTING_USER,
} from '../../constants/storage';
import { Authentication } from './Authentication';
import AUTHENTICATION_TYPE from '../../constants/userProperties';
// eslint-disable-next-line import/no-namespace
import * as Keychain from 'react-native-keychain';
import SecureKeychain from '../SecureKeychain';
import ReduxService, { ReduxStore } from '../redux';
const storage: Record<string, unknown> = {};

jest.mock('../../store/storage-wrapper', () => ({
  getItem: jest.fn((key) => Promise.resolve(storage[key] ?? null)),
  setItem: jest.fn((key, value) => {
    storage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    delete storage[key];
    return Promise.resolve();
  }),
  clearAll: jest.fn(() => {
    Object.keys(storage).forEach((key) => delete storage[key]);
    return Promise.resolve();
  }),
}));

const mockSnapClient = {
  addDiscoveredAccounts: jest.fn(),
};

jest.mock('../SnapKeyring/MultichainWalletSnapClient', () => ({
  MultichainWalletSnapFactory: {
    createClient: () => mockSnapClient,
  },
  WalletClientType: {
    Solana: 'solana',
  },
}));

describe('Authentication', () => {
  afterEach(() => {
    StorageWrapper.clearAll();
    jest.restoreAllMocks();
  });

  it('should return a type password', async () => {
    SecureKeychain.getSupportedBiometryType = jest
      .fn()
      .mockReturnValue(Keychain.BIOMETRY_TYPE.FACE_ID);
    await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
    await StorageWrapper.setItem(PASSCODE_DISABLED, TRUE);
    const result = await Authentication.getType();
    expect(result.availableBiometryType).toEqual('FaceID');
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
  });

  it('should return a type biometric', async () => {
    SecureKeychain.getSupportedBiometryType = jest
      .fn()
      .mockReturnValue(Keychain.BIOMETRY_TYPE.FACE_ID);
    const result = await Authentication.getType();
    expect(result.availableBiometryType).toEqual('FaceID');
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.BIOMETRIC);
  });

  it('should return a type passcode', async () => {
    SecureKeychain.getSupportedBiometryType = jest
      .fn()
      .mockReturnValue(Keychain.BIOMETRY_TYPE.FINGERPRINT);
    await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
    const result = await Authentication.getType();
    expect(result.availableBiometryType).toEqual('Fingerprint');
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSCODE);
  });

  it('should return a type password with biometric & pincode disabled', async () => {
    SecureKeychain.getSupportedBiometryType = jest
      .fn()
      .mockReturnValue(Keychain.BIOMETRY_TYPE.FINGERPRINT);
    await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
    await StorageWrapper.setItem(PASSCODE_DISABLED, TRUE);
    const result = await Authentication.getType();
    expect(result.availableBiometryType).toEqual('Fingerprint');
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
  });

  it('should return a type AUTHENTICATION_TYPE.REMEMBER_ME if the user exists and there are no available biometrics options and the password exist in the keychain', async () => {
    SecureKeychain.getSupportedBiometryType = jest.fn().mockReturnValue(null);
    const mockCredentials = { username: 'test', password: 'test' };
    SecureKeychain.getGenericPassword = jest
      .fn()
      .mockReturnValue(mockCredentials);
    await StorageWrapper.setItem(EXISTING_USER, TRUE);
    const result = await Authentication.getType();
    expect(result.availableBiometryType).toBeNull();
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.REMEMBER_ME);
  });

  it('should return a type AUTHENTICATION_TYPE.PASSWORD if the user exists and there are no available biometrics options but the password does not exist in the keychain', async () => {
    SecureKeychain.getSupportedBiometryType = jest.fn().mockReturnValue(null);
    await StorageWrapper.setItem(EXISTING_USER, TRUE);
    SecureKeychain.getGenericPassword = jest.fn().mockReturnValue(null);
    const result = await Authentication.getType();
    expect(result.availableBiometryType).toBeNull();
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
  });

  it('should return a type AUTHENTICATION_TYPE.PASSWORD if the user does not exist and there are no available biometrics options', async () => {
    SecureKeychain.getSupportedBiometryType = jest.fn().mockReturnValue(null);
    // Do not set EXISTING_USER to simulate a non-existing user
    const result = await Authentication.getType();
    expect(result.availableBiometryType).toBeNull();
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
  });

  describe('checkAuthenticationMethod - comprehensive edge cases', () => {
    it('should return BIOMETRIC when BIOMETRY_CHOICE_DISABLED is set to a non-true string', async () => {
      SecureKeychain.getSupportedBiometryType = jest
        .fn()
        .mockReturnValue(Keychain.BIOMETRY_TYPE.FACE_ID);
      await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, 'false');
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toEqual('FaceID');
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.BIOMETRIC);
    });

    it('should return BIOMETRIC when BIOMETRY_CHOICE_DISABLED is set to an empty string', async () => {
      SecureKeychain.getSupportedBiometryType = jest
        .fn()
        .mockReturnValue(Keychain.BIOMETRY_TYPE.FINGERPRINT);
      await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, '');
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toEqual('Fingerprint');
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.BIOMETRIC);
    });

    it('should return PASSCODE when biometry disabled but PASSCODE_DISABLED is set to a non-true string', async () => {
      SecureKeychain.getSupportedBiometryType = jest
        .fn()
        .mockReturnValue(Keychain.BIOMETRY_TYPE.FACE_ID);
      await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
      await StorageWrapper.setItem(PASSCODE_DISABLED, 'no');
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toEqual('FaceID');
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSCODE);
    });

    it('should return PASSWORD when biometry is available but both biometry and passcode are disabled, and no existing user', async () => {
      SecureKeychain.getSupportedBiometryType = jest
        .fn()
        .mockReturnValue(Keychain.BIOMETRY_TYPE.FACE_ID);
      await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
      await StorageWrapper.setItem(PASSCODE_DISABLED, TRUE);
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toEqual('FaceID');
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
    });

    it('should return REMEMBER_ME when biometry is available but both biometry and passcode are disabled, existing user with stored credentials', async () => {
      SecureKeychain.getSupportedBiometryType = jest
        .fn()
        .mockReturnValue(Keychain.BIOMETRY_TYPE.FINGERPRINT);
      await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
      await StorageWrapper.setItem(PASSCODE_DISABLED, TRUE);
      await StorageWrapper.setItem(EXISTING_USER, TRUE);
      SecureKeychain.getGenericPassword = jest
        .fn()
        .mockReturnValue({ username: 'user', password: 'pass' });
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toEqual('Fingerprint');
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.REMEMBER_ME);
    });

    it('should return PASSWORD when no biometry available, no existing user, and getGenericPassword is not called', async () => {
      SecureKeychain.getSupportedBiometryType = jest.fn().mockReturnValue(null);
      SecureKeychain.getGenericPassword = jest.fn();
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toBeNull();
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
      expect(SecureKeychain.getGenericPassword).not.toHaveBeenCalled();
    });

    it('should return PASSWORD when no biometry available, existing user exists, but getGenericPassword returns false', async () => {
      SecureKeychain.getSupportedBiometryType = jest.fn().mockReturnValue(null);
      await StorageWrapper.setItem(EXISTING_USER, TRUE);
      SecureKeychain.getGenericPassword = jest.fn().mockReturnValue(false);
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toBeNull();
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
    });

    it('should return PASSWORD when no biometry available, existing user exists, but getGenericPassword returns undefined', async () => {
      SecureKeychain.getSupportedBiometryType = jest.fn().mockReturnValue(null);
      await StorageWrapper.setItem(EXISTING_USER, TRUE);
      SecureKeychain.getGenericPassword = jest
        .fn()
        .mockReturnValue(undefined);
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toBeNull();
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
    });

    it('should return BIOMETRIC with IRIS biometry type', async () => {
      SecureKeychain.getSupportedBiometryType = jest
        .fn()
        .mockReturnValue(Keychain.BIOMETRY_TYPE.IRIS);
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toEqual('Iris');
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.BIOMETRIC);
    });

    it('should return BIOMETRIC with FACE biometry type', async () => {
      SecureKeychain.getSupportedBiometryType = jest
        .fn()
        .mockReturnValue(Keychain.BIOMETRY_TYPE.FACE);
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toEqual('Face');
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.BIOMETRIC);
    });

    it('should return PASSWORD when biometry returns null and EXISTING_USER is not set in storage', async () => {
      SecureKeychain.getSupportedBiometryType = jest
        .fn()
        .mockReturnValue(null);
      SecureKeychain.getGenericPassword = jest
        .fn()
        .mockReturnValue({ username: 'test', password: 'test' });
      // Deliberately do not set EXISTING_USER
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toBeNull();
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
      // getGenericPassword should not be called when EXISTING_USER is not set
      expect(SecureKeychain.getGenericPassword).not.toHaveBeenCalled();
    });

    it('should return PASSWORD when biometry returns undefined', async () => {
      SecureKeychain.getSupportedBiometryType = jest
        .fn()
        .mockReturnValue(undefined);
      const result = await Authentication.getType();
      expect(result.availableBiometryType).toBeUndefined();
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
    });

    it('should include availableBiometryType as null in REMEMBER_ME result when biometry is unavailable', async () => {
      SecureKeychain.getSupportedBiometryType = jest.fn().mockReturnValue(null);
      await StorageWrapper.setItem(EXISTING_USER, TRUE);
      SecureKeychain.getGenericPassword = jest
        .fn()
        .mockReturnValue({ username: 'user', password: 'secret' });
      const result = await Authentication.getType();
      expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.REMEMBER_ME);
      expect(result.availableBiometryType).toBeNull();
    });
  });

  it('should return an auth type for components AUTHENTICATION_TYPE.REMEMBER_ME', async () => {
    jest.spyOn(ReduxService, 'store', 'get').mockReturnValue({
      getState: () => ({ security: { allowLoginWithRememberMe: true } }),
    } as unknown as ReduxStore);

    SecureKeychain.getSupportedBiometryType = jest
      .fn()
      .mockReturnValue(Keychain.BIOMETRY_TYPE.FINGERPRINT);
    await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
    const result = await Authentication.componentAuthenticationType(
      false,
      true,
    );
    expect(result.availableBiometryType).toEqual('Fingerprint');
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.REMEMBER_ME);
  });

  it('should return an auth type for components AUTHENTICATION_TYPE.PASSWORD', async () => {
    SecureKeychain.getSupportedBiometryType = jest
      .fn()
      .mockReturnValue(Keychain.BIOMETRY_TYPE.FINGERPRINT);
    await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
    await StorageWrapper.setItem(PASSCODE_DISABLED, TRUE);
    const result = await Authentication.componentAuthenticationType(
      false,
      false,
    );
    expect(result.availableBiometryType).toEqual('Fingerprint');
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
  });

  it('should return an auth type for components AUTHENTICATION_TYPE.PASSCODE', async () => {
    SecureKeychain.getSupportedBiometryType = jest
      .fn()
      .mockReturnValue(Keychain.BIOMETRY_TYPE.FINGERPRINT);
    await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
    const result = await Authentication.componentAuthenticationType(
      true,
      false,
    );
    expect(result.availableBiometryType).toEqual('Fingerprint');
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSCODE);
  });

  it('should return an auth type for components AUTHENTICATION_TYPE.BIOMETRIC', async () => {
    SecureKeychain.getSupportedBiometryType = jest
      .fn()
      .mockReturnValue(Keychain.BIOMETRY_TYPE.FINGERPRINT);
    const result = await Authentication.componentAuthenticationType(
      true,
      false,
    );
    expect(result.availableBiometryType).toEqual('Fingerprint');
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.BIOMETRIC);
  });

  it('should return set a password using PASSWORD', async () => {
    let methodCalled = false;
    SecureKeychain.resetGenericPassword = jest
      .fn()
      .mockReturnValue((methodCalled = true));
    await Authentication.storePassword('1234', AUTHENTICATION_TYPE.UNKNOWN);
    expect(methodCalled).toBeTruthy();
  });

  describe('Multichain - discoverAccounts', () => {
    it('calls discoverAccounts after vault creation in newWalletAndKeychain', async () => {
      jest.spyOn(ReduxService, 'store', 'get').mockReturnValue({
        dispatch: jest.fn(),
        getState: () => ({ security: { allowLoginWithRememberMe: true } }),
      } as unknown as ReduxStore);
      await Authentication.newWalletAndKeychain('1234', {
        currentAuthType: AUTHENTICATION_TYPE.UNKNOWN,
      });
      expect(mockSnapClient.addDiscoveredAccounts).toHaveBeenCalledWith(
        expect.any(String), // mock entropySource
      );
    });

    it('calls discoverAccounts in newWalletVaultAndRestore', async () => {
      jest.spyOn(ReduxService, 'store', 'get').mockReturnValue({
        dispatch: jest.fn(),
        getState: () => ({ security: { allowLoginWithRememberMe: true } }),
      } as unknown as ReduxStore);
      await Authentication.newWalletAndRestore(
        '1234',
        {
          currentAuthType: AUTHENTICATION_TYPE.UNKNOWN,
        },
        '1234',
        false,
      );
      expect(mockSnapClient.addDiscoveredAccounts).toHaveBeenCalledWith(
        expect.any(String), // mock entropySource
      );
    });
  });
});
