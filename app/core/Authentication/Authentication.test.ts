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
import Engine from '../Engine';
import NavigationService from '../NavigationService';
import Routes from '../../constants/navigation/Routes';
import AuthenticationError from './AuthenticationError';
import {
  AUTHENTICATION_APP_TRIGGERED_AUTH_ERROR,
  AUTHENTICATION_APP_TRIGGERED_AUTH_NO_CREDENTIALS,
  AUTHENTICATION_FAILED_TO_LOGIN,
  AUTHENTICATION_FAILED_WALLET_CREATION,
  AUTHENTICATION_RESET_PASSWORD_FAILED,
  AUTHENTICATION_RESET_PASSWORD_FAILED_MESSAGE,
  AUTHENTICATION_STORE_PASSWORD_FAILED,
} from '../../constants/error';
import {
  authError,
  authSuccess,
  logIn,
  logOut,
  passwordSet,
} from '../../actions/user';
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
    await StorageWrapper.setItem(EXISTING_USER, TRUE);
    const result = await Authentication.getType();
    expect(result.availableBiometryType).toBeNull();
    expect(result.currentAuthType).toEqual(AUTHENTICATION_TYPE.PASSWORD);
  });

  it('should return a auth type for components AUTHENTICATION_TYPE.REMEMBER_ME', async () => {
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

  it('should return a auth type for components AUTHENTICATION_TYPE.PASSWORD', async () => {
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

  it('should return a auth type for components AUTHENTICATION_TYPE.PASSCODE', async () => {
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

  it('should return a auth type for components AUTHENTICATION_TYPE.BIOMETRIC', async () => {
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

  describe('login, lock and rollback paths', () => {
    const keyringController = Engine.context
      .KeyringController as unknown as Record<string, jest.Mock>;
    let mockDispatch: jest.Mock;
    let mockNavigationReset: jest.Mock;
    let setGenericPasswordSpy: jest.SpyInstance;
    let resetGenericPasswordSpy: jest.SpyInstance;
    let getGenericPasswordSpy: jest.SpyInstance;

    const flushPromises = () => new Promise(process.nextTick);

    const catchError = async (promise: Promise<unknown>) => {
      try {
        await promise;
      } catch (error) {
        return error as AuthenticationError;
      }
      throw new Error('Expected promise to reject');
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockDispatch = jest.fn();
      mockNavigationReset = jest.fn();
      jest.spyOn(ReduxService, 'store', 'get').mockReturnValue({
        dispatch: mockDispatch,
        getState: () => ({ security: { allowLoginWithRememberMe: true } }),
      } as unknown as ReduxStore);
      jest.spyOn(NavigationService, 'navigation', 'get').mockReturnValue({
        reset: mockNavigationReset,
      } as unknown as typeof NavigationService.navigation);
      setGenericPasswordSpy = jest
        .spyOn(SecureKeychain, 'setGenericPassword')
        .mockResolvedValue(undefined);
      resetGenericPasswordSpy = jest
        .spyOn(SecureKeychain, 'resetGenericPassword')
        .mockResolvedValue(true);
      getGenericPasswordSpy = jest
        .spyOn(SecureKeychain, 'getGenericPassword')
        .mockResolvedValue({
          username: 'metamask-user',
          password: 'pass',
        } as Keychain.UserCredentials);
      keyringController.submitPassword = jest.fn().mockResolvedValue(undefined);
      keyringController.isUnlocked = jest.fn().mockReturnValue(false);
      keyringController.setLocked = jest.fn().mockResolvedValue(undefined);
      keyringController.createNewVaultAndKeychain = jest
        .fn()
        .mockResolvedValue(undefined);
      keyringController.createNewVaultAndRestore = jest
        .fn()
        .mockResolvedValue(undefined);
    });

    describe('storePassword', () => {
      it.each([
        [AUTHENTICATION_TYPE.BIOMETRIC, SecureKeychain.TYPES.BIOMETRICS],
        [AUTHENTICATION_TYPE.PASSCODE, SecureKeychain.TYPES.PASSCODE],
        [AUTHENTICATION_TYPE.REMEMBER_ME, SecureKeychain.TYPES.REMEMBER_ME],
        [AUTHENTICATION_TYPE.PASSWORD, undefined],
        [AUTHENTICATION_TYPE.UNKNOWN, undefined],
      ])(
        'stores the password for %s with keychain type %s',
        async (authType, keychainType) => {
          await Authentication.storePassword('pass', authType);

          expect(setGenericPasswordSpy).toHaveBeenCalledTimes(1);
          expect(setGenericPasswordSpy).toHaveBeenCalledWith(
            'pass',
            keychainType,
          );
        },
      );

      it('wraps keychain failures in AUTHENTICATION_STORE_PASSWORD_FAILED', async () => {
        setGenericPasswordSpy.mockRejectedValueOnce(new Error('keychain down'));

        const error = await catchError(
          Authentication.storePassword('pass', AUTHENTICATION_TYPE.BIOMETRIC),
        );

        expect(error).toBeInstanceOf(AuthenticationError);
        expect(error.message).toBe('keychain down');
        expect(error.customErrorMessage).toBe(
          AUTHENTICATION_STORE_PASSWORD_FAILED,
        );
      });
    });

    describe('resetPassword', () => {
      it('resets the keychain password', async () => {
        await Authentication.resetPassword();

        expect(resetGenericPasswordSpy).toHaveBeenCalledTimes(1);
      });

      it('wraps keychain failures in AUTHENTICATION_RESET_PASSWORD_FAILED', async () => {
        resetGenericPasswordSpy.mockRejectedValueOnce(new Error('reset boom'));

        const error = await catchError(Authentication.resetPassword());

        expect(error).toBeInstanceOf(AuthenticationError);
        expect(error.message).toBe(
          `${AUTHENTICATION_RESET_PASSWORD_FAILED_MESSAGE} reset boom`,
        );
        expect(error.customErrorMessage).toBe(
          AUTHENTICATION_RESET_PASSWORD_FAILED,
        );
      });
    });

    describe('resetVault', () => {
      it('submits an empty password and resets the keychain', async () => {
        await Authentication.resetVault();

        expect(keyringController.submitPassword).toHaveBeenCalledWith('');
        expect(resetGenericPasswordSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('userEntryAuth', () => {
      it('unlocks the vault, stores the password with the auth type and dispatches login', async () => {
        await Authentication.userEntryAuth('pass', {
          currentAuthType: AUTHENTICATION_TYPE.BIOMETRIC,
        });

        expect(keyringController.submitPassword).toHaveBeenCalledWith('pass');
        expect(setGenericPasswordSpy).toHaveBeenCalledWith(
          'pass',
          SecureKeychain.TYPES.BIOMETRICS,
        );
        expect(mockDispatch.mock.calls).toEqual([[logIn()], [passwordSet()]]);
      });

      it('throws AUTHENTICATION_FAILED_TO_LOGIN without storing the password when submitPassword rejects', async () => {
        keyringController.submitPassword.mockRejectedValueOnce(
          new Error('Incorrect password'),
        );

        const error = await catchError(
          Authentication.userEntryAuth('wrong', {
            currentAuthType: AUTHENTICATION_TYPE.BIOMETRIC,
          }),
        );

        expect(error).toBeInstanceOf(AuthenticationError);
        expect(error.message).toBe('Incorrect password');
        expect(error.customErrorMessage).toBe(AUTHENTICATION_FAILED_TO_LOGIN);
        expect(setGenericPasswordSpy).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
      });

      it('throws AUTHENTICATION_FAILED_TO_LOGIN without dispatching login when storing the password fails', async () => {
        setGenericPasswordSpy.mockRejectedValueOnce(new Error('keychain down'));

        const error = await catchError(
          Authentication.userEntryAuth('pass', {
            currentAuthType: AUTHENTICATION_TYPE.PASSCODE,
          }),
        );

        expect(error.customErrorMessage).toBe(AUTHENTICATION_FAILED_TO_LOGIN);
        expect(mockDispatch).not.toHaveBeenCalled();
      });
    });

    describe('appTriggeredAuth', () => {
      it('unlocks with the keychain password and dispatches authSuccess', async () => {
        await Authentication.appTriggeredAuth({ bioStateMachineId: 'bio-1' });

        expect(getGenericPasswordSpy).toHaveBeenCalledTimes(1);
        expect(keyringController.submitPassword).toHaveBeenCalledWith('pass');
        expect(mockDispatch.mock.calls).toEqual([
          [logIn()],
          [authSuccess('bio-1')],
          [passwordSet()],
        ]);
        expect(mockNavigationReset).not.toHaveBeenCalled();
      });

      it.each([
        ['null credentials', null],
        ['false credentials', false],
        ['an empty password', { username: 'metamask-user', password: '' }],
      ])(
        'dispatches authError and locks the app when the keychain returns %s',
        async (_, credentials) => {
          getGenericPasswordSpy.mockResolvedValueOnce(credentials);
          const lockAppSpy = jest.spyOn(Authentication, 'lockApp');

          const error = await catchError(
            Authentication.appTriggeredAuth({ bioStateMachineId: 'bio-2' }),
          );
          await flushPromises();

          expect(error).toBeInstanceOf(AuthenticationError);
          expect(error.message).toBe(
            AUTHENTICATION_APP_TRIGGERED_AUTH_NO_CREDENTIALS,
          );
          expect(error.customErrorMessage).toBe(
            AUTHENTICATION_APP_TRIGGERED_AUTH_ERROR,
          );
          expect(keyringController.submitPassword).not.toHaveBeenCalled();
          expect(mockDispatch).toHaveBeenCalledWith(authError('bio-2'));
          expect(mockDispatch).not.toHaveBeenCalledWith(logIn());
          expect(mockDispatch).not.toHaveBeenCalledWith(authSuccess('bio-2'));
          expect(lockAppSpy).toHaveBeenCalledWith({ reset: false });
          expect(resetGenericPasswordSpy).not.toHaveBeenCalled();
          expect(mockDispatch).toHaveBeenCalledWith(logOut());
          expect(mockNavigationReset).toHaveBeenCalledWith({
            routes: [
              { name: Routes.ONBOARDING.LOGIN, params: { locked: false } },
            ],
          });
        },
      );

      it('dispatches authError and locks the app when the keychain password no longer unlocks the vault', async () => {
        keyringController.submitPassword.mockRejectedValueOnce(
          new Error('Incorrect password'),
        );
        const lockAppSpy = jest.spyOn(Authentication, 'lockApp');

        const error = await catchError(Authentication.appTriggeredAuth());
        await flushPromises();

        expect(error.message).toBe('Incorrect password');
        expect(error.customErrorMessage).toBe(
          AUTHENTICATION_APP_TRIGGERED_AUTH_ERROR,
        );
        expect(mockDispatch).toHaveBeenCalledWith(authError(undefined));
        expect(mockDispatch).not.toHaveBeenCalledWith(logIn());
        expect(lockAppSpy).toHaveBeenCalledWith({ reset: false });
      });

      it('does not lock the app when disableAutoLogout is true', async () => {
        getGenericPasswordSpy.mockResolvedValueOnce(null);
        const lockAppSpy = jest.spyOn(Authentication, 'lockApp');

        const error = await catchError(
          Authentication.appTriggeredAuth({
            bioStateMachineId: 'bio-3',
            disableAutoLogout: true,
          }),
        );
        await flushPromises();

        expect(error.customErrorMessage).toBe(
          AUTHENTICATION_APP_TRIGGERED_AUTH_ERROR,
        );
        expect(mockDispatch.mock.calls).toEqual([[authError('bio-3')]]);
        expect(lockAppSpy).not.toHaveBeenCalled();
        expect(keyringController.setLocked).not.toHaveBeenCalled();
        expect(mockNavigationReset).not.toHaveBeenCalled();
      });
    });

    describe('lockApp', () => {
      it('resets the keychain, locks an unlocked keyring and navigates to login by default', async () => {
        keyringController.isUnlocked.mockReturnValue(true);

        await Authentication.lockApp();

        expect(resetGenericPasswordSpy).toHaveBeenCalledTimes(1);
        expect(keyringController.setLocked).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith(logOut());
        expect(mockNavigationReset).toHaveBeenCalledWith({
          routes: [
            { name: Routes.ONBOARDING.LOGIN, params: { locked: false } },
          ],
        });
      });

      it('keeps the keychain password when reset is false and passes the locked param', async () => {
        keyringController.isUnlocked.mockReturnValue(true);

        await Authentication.lockApp({ reset: false, locked: true });

        expect(resetGenericPasswordSpy).not.toHaveBeenCalled();
        expect(keyringController.setLocked).toHaveBeenCalledTimes(1);
        expect(mockNavigationReset).toHaveBeenCalledWith({
          routes: [{ name: Routes.ONBOARDING.LOGIN, params: { locked: true } }],
        });
      });

      it('does not call setLocked when the keyring is already locked', async () => {
        keyringController.isUnlocked.mockReturnValue(false);

        await Authentication.lockApp({ reset: false });

        expect(keyringController.setLocked).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(logOut());
        expect(mockNavigationReset).toHaveBeenCalledTimes(1);
      });

      it('resets the stored auth data to UNKNOWN', async () => {
        await Authentication.userEntryAuth('pass', {
          currentAuthType: AUTHENTICATION_TYPE.BIOMETRIC,
        });
        await Authentication.lockApp({ reset: false });
        keyringController.submitPassword.mockRejectedValueOnce(
          new Error('Incorrect password'),
        );

        const error = await catchError(
          Authentication.userEntryAuth('wrong', {
            currentAuthType: AUTHENTICATION_TYPE.PASSCODE,
          }),
        );

        expect(error.authData).toEqual({
          currentAuthType: AUTHENTICATION_TYPE.UNKNOWN,
        });
      });
    });

    describe('wallet creation rollback', () => {
      const runCreation = (method: 'keychain' | 'restore') =>
        method === 'keychain'
          ? Authentication.newWalletAndKeychain('pass', {
              currentAuthType: AUTHENTICATION_TYPE.BIOMETRIC,
            })
          : Authentication.newWalletAndRestore(
              'pass',
              { currentAuthType: AUTHENTICATION_TYPE.BIOMETRIC },
              'seed words',
              true,
            );

      it.each([
        ['newWalletAndKeychain', 'keychain', 'createNewVaultAndKeychain'],
        ['newWalletAndRestore', 'restore', 'createNewVaultAndRestore'],
      ] as const)(
        '%s locks the app without wiping the keychain when vault creation fails',
        async (_, method, vaultMethod) => {
          keyringController[vaultMethod].mockRejectedValueOnce(
            new Error('vault boom'),
          );
          keyringController.isUnlocked.mockReturnValue(true);
          const lockAppSpy = jest.spyOn(Authentication, 'lockApp');

          const error = await catchError(runCreation(method));
          await flushPromises();

          expect(error).toBeInstanceOf(AuthenticationError);
          expect(error.message).toBe('vault boom');
          expect(error.customErrorMessage).toBe(
            AUTHENTICATION_FAILED_WALLET_CREATION,
          );
          expect(lockAppSpy).toHaveBeenCalledWith({ reset: false });
          expect(resetGenericPasswordSpy).not.toHaveBeenCalled();
          expect(keyringController.setLocked).toHaveBeenCalledTimes(1);
          expect(setGenericPasswordSpy).not.toHaveBeenCalled();
          expect(StorageWrapper.setItem).not.toHaveBeenCalledWith(
            EXISTING_USER,
            TRUE,
          );
          expect(mockDispatch).not.toHaveBeenCalledWith(logIn());
          expect(mockDispatch).toHaveBeenCalledWith(logOut());
          expect(mockNavigationReset).toHaveBeenCalledWith({
            routes: [
              { name: Routes.ONBOARDING.LOGIN, params: { locked: false } },
            ],
          });
        },
      );

      it.each([
        ['newWalletAndKeychain', 'keychain'],
        ['newWalletAndRestore', 'restore'],
      ] as const)(
        '%s locks the app and does not mark an existing user when storing the password fails',
        async (_, method) => {
          setGenericPasswordSpy.mockRejectedValueOnce(
            new Error('keychain down'),
          );
          const lockAppSpy = jest.spyOn(Authentication, 'lockApp');

          const error = await catchError(runCreation(method));
          await flushPromises();

          expect(error.message).toBe('keychain down');
          expect(error.customErrorMessage).toBe(
            AUTHENTICATION_FAILED_WALLET_CREATION,
          );
          expect(lockAppSpy).toHaveBeenCalledWith({ reset: false });
          expect(StorageWrapper.setItem).not.toHaveBeenCalledWith(
            EXISTING_USER,
            TRUE,
          );
          expect(mockDispatch).not.toHaveBeenCalledWith(logIn());
        },
      );

      it.each([
        ['newWalletAndKeychain', 'keychain'],
        ['newWalletAndRestore', 'restore'],
      ] as const)(
        '%s stores the password, marks an existing user and dispatches login on success',
        async (_, method) => {
          const lockAppSpy = jest.spyOn(Authentication, 'lockApp');

          await runCreation(method);

          expect(setGenericPasswordSpy).toHaveBeenCalledWith(
            'pass',
            SecureKeychain.TYPES.BIOMETRICS,
          );
          expect(StorageWrapper.setItem).toHaveBeenCalledWith(
            EXISTING_USER,
            TRUE,
          );
          expect(mockDispatch).toHaveBeenCalledWith(logIn());
          expect(lockAppSpy).not.toHaveBeenCalled();
        },
      );

      it('newWalletAndRestore restores the vault from the seed and clears the engine when requested', async () => {
        await runCreation('restore');

        expect(Engine.resetState).toHaveBeenCalled();
        expect(keyringController.createNewVaultAndRestore).toHaveBeenCalledWith(
          'pass',
          'seed words',
        );
      });
    });
  });
});
