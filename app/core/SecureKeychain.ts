import * as Keychain from 'react-native-keychain'; // eslint-disable-line import/no-namespace
import type {
  Options,
  UserCredentials,
  BIOMETRY_TYPE,
} from 'react-native-keychain';
import { Encryptor, LEGACY_DERIVATION_OPTIONS } from './Encryptor';
import { strings } from '../../locales/i18n';
import StorageWrapper from '../store/storage-wrapper';
import { Platform } from 'react-native';
import { MetaMetricsEvents, MetaMetrics } from '../core/Analytics';
import {
  BIOMETRY_CHOICE,
  BIOMETRY_CHOICE_DISABLED,
  PASSCODE_CHOICE,
  PASSCODE_DISABLED,
  TRUE,
} from '../constants/storage';
import Device from '../util/device';
import AUTHENTICATION_TYPE from '../constants/userProperties';
import { UserProfileProperty } from '../util/metrics/UserSettingsAnalyticsMetaData/UserProfileAnalyticsMetaData.types';
import { MetricsEventBuilder } from './Analytics/MetricsEventBuilder';

interface SecureKeychainPrivateState {
  code: string;
}

const privates = new WeakMap<SecureKeychain, SecureKeychainPrivateState>();
const encryptor = new Encryptor({
  keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
});
// Cast through unknown because react-native-keychain's `Options` does not
// formally declare every legacy iOS/Android prompt key the JS used.
const defaultOptions = {
  service: 'com.metamask',
  authenticationPromptTitle: strings('authentication.auth_prompt_title'),
  authenticationPrompt: { title: strings('authentication.auth_prompt_desc') },
  authenticationPromptDesc: strings('authentication.auth_prompt_desc'),
  fingerprintPromptTitle: strings('authentication.fingerprint_prompt_title'),
  fingerprintPromptDesc: strings('authentication.fingerprint_prompt_desc'),
  fingerprintPromptCancel: strings('authentication.fingerprint_prompt_cancel'),
} as unknown as Options;

const SECURE_KEYCHAIN_TYPES = {
  BIOMETRICS: 'BIOMETRICS',
  PASSCODE: 'PASSCODE',
  REMEMBER_ME: 'REMEMBER_ME',
} as const;

type SecureKeychainType =
  (typeof SECURE_KEYCHAIN_TYPES)[keyof typeof SECURE_KEYCHAIN_TYPES];

interface DecryptedPasswordPayload {
  password: string;
}

interface DecryptedKeychainObject extends UserCredentials {
  password: string;
}

/**
 * Class that wraps Keychain from react-native-keychain
 * abstracting metamask specific functionality and settings
 * and also adding an extra layer of encryption before writing into
 * the phone's keychain
 */
class SecureKeychain {
  static instance: SecureKeychain | undefined;
  isAuthenticating = false;

  constructor(code: string) {
    if (!SecureKeychain.instance) {
      privates.set(this, { code });
      SecureKeychain.instance = this;
    }

    return SecureKeychain.instance;
  }

  encryptPassword(password: string): Promise<string> {
    const code = privates.get(this)?.code ?? '';
    return encryptor.encrypt(code, { password });
  }

  decryptPassword(str: string): Promise<DecryptedPasswordPayload> {
    const code = privates.get(this)?.code ?? '';
    return encryptor.decrypt(code, str) as Promise<DecryptedPasswordPayload>;
  }
}

let instance: SecureKeychain | undefined;

interface SecureKeychainModule {
  init: (salt: string) => SecureKeychain;
  getInstance: () => SecureKeychain | undefined;
  getSupportedBiometryType: () => Promise<BIOMETRY_TYPE | null>;
  resetGenericPassword: () => Promise<boolean>;
  getGenericPassword: () => Promise<DecryptedKeychainObject | null>;
  setGenericPassword: (
    password: string,
    type?: SecureKeychainType,
  ) => Promise<void>;
  ACCESS_CONTROL: typeof Keychain.ACCESS_CONTROL;
  ACCESSIBLE: typeof Keychain.ACCESSIBLE;
  AUTHENTICATION_TYPE: typeof Keychain.AUTHENTICATION_TYPE;
  TYPES: typeof SECURE_KEYCHAIN_TYPES;
}

const SecureKeychainModuleImpl: SecureKeychainModule = {
  init(salt: string): SecureKeychain {
    instance = new SecureKeychain(salt);

    const securityLevel = (
      Keychain as unknown as {
        SECURITY_LEVEL?: { SECURE_HARDWARE?: string };
      }
    ).SECURITY_LEVEL;
    if (Device.isAndroid() && securityLevel?.SECURE_HARDWARE)
      MetaMetrics.getInstance().trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.ANDROID_HARDWARE_KEYSTORE,
        ).build(),
      );

    Object.freeze(instance);
    return instance;
  },

  getInstance(): SecureKeychain | undefined {
    return instance;
  },

  getSupportedBiometryType(): Promise<BIOMETRY_TYPE | null> {
    return Keychain.getSupportedBiometryType();
  },

  async resetGenericPassword(): Promise<boolean> {
    const options: Options = { service: defaultOptions.service };
    await StorageWrapper.removeItem(BIOMETRY_CHOICE);
    await StorageWrapper.removeItem(PASSCODE_CHOICE);
    // This is called to remove other auth types and set the user back to the default password login
    await MetaMetrics.getInstance().addTraitsToUser({
      [UserProfileProperty.AUTHENTICATION_TYPE]: AUTHENTICATION_TYPE.PASSWORD,
    });
    return Keychain.resetGenericPassword(options);
  },

  async getGenericPassword(): Promise<DecryptedKeychainObject | null> {
    if (instance) {
      try {
        instance.isAuthenticating = true;
        const keychainObject = (await Keychain.getGenericPassword(
          defaultOptions,
        )) as UserCredentials | false;
        if (keychainObject && keychainObject.password) {
          const encryptedPassword = keychainObject.password;
          const decrypted = await instance.decryptPassword(encryptedPassword);
          (keychainObject as DecryptedKeychainObject).password =
            decrypted.password;
          instance.isAuthenticating = false;
          return keychainObject as DecryptedKeychainObject;
        }
        instance.isAuthenticating = false;
      } catch (error) {
        instance.isAuthenticating = false;
        const message =
          error instanceof Error ? error.message : String(error);
        throw new Error(message);
      }
    }
    return null;
  },

  async setGenericPassword(
    password: string,
    type?: SecureKeychainType,
  ): Promise<void> {
    const authOptions: Options = {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    };

    const metrics = MetaMetrics.getInstance();
    if (type === SecureKeychainModuleImpl.TYPES.BIOMETRICS) {
      authOptions.accessControl = Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET;

      await metrics.addTraitsToUser({
        [UserProfileProperty.AUTHENTICATION_TYPE]:
          AUTHENTICATION_TYPE.BIOMETRIC,
      });
    } else if (type === SecureKeychainModuleImpl.TYPES.PASSCODE) {
      authOptions.accessControl = Keychain.ACCESS_CONTROL.DEVICE_PASSCODE;
      await metrics.addTraitsToUser({
        [UserProfileProperty.AUTHENTICATION_TYPE]: AUTHENTICATION_TYPE.PASSCODE,
      });
    } else if (type === SecureKeychainModuleImpl.TYPES.REMEMBER_ME) {
      await metrics.addTraitsToUser({
        [UserProfileProperty.AUTHENTICATION_TYPE]:
          AUTHENTICATION_TYPE.REMEMBER_ME,
      });
      //Don't need to add any parameter
    } else {
      // Setting a password without a type does not save it
      await SecureKeychainModuleImpl.resetGenericPassword();
      return;
    }

    if (!instance) {
      return;
    }

    const encryptedPassword = await instance.encryptPassword(password);
    await Keychain.setGenericPassword('metamask-user', encryptedPassword, {
      ...defaultOptions,
      ...authOptions,
    });

    if (type === SecureKeychainModuleImpl.TYPES.BIOMETRICS) {
      await StorageWrapper.setItem(BIOMETRY_CHOICE, TRUE);
      await StorageWrapper.setItem(PASSCODE_DISABLED, TRUE);
      await StorageWrapper.removeItem(PASSCODE_CHOICE);
      await StorageWrapper.removeItem(BIOMETRY_CHOICE_DISABLED);

      // If the user enables biometrics, we're trying to read the password
      // immediately so we get the permission prompt
      if (Platform.OS === 'ios') {
        try {
          await SecureKeychainModuleImpl.getGenericPassword();
        } catch (error) {
          // Specifically check for user cancellation
          const message =
            error instanceof Error ? error.message : String(error);
          if (message === 'User canceled the operation.') {
            // Store password without biometrics
            const encryptedPasswordRetry =
              await instance.encryptPassword(password);
            await Keychain.setGenericPassword(
              'metamask-user',
              encryptedPasswordRetry,
              {
                ...defaultOptions,
              },
            );

            // Update storage to reflect disabled biometrics
            await StorageWrapper.removeItem(BIOMETRY_CHOICE);
            await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);

            // Update metrics
            await metrics.addTraitsToUser({
              [UserProfileProperty.AUTHENTICATION_TYPE]:
                AUTHENTICATION_TYPE.PASSWORD,
            });

            return;
          }
        }
      }
    } else if (type === SecureKeychainModuleImpl.TYPES.PASSCODE) {
      await StorageWrapper.removeItem(BIOMETRY_CHOICE);
      await StorageWrapper.removeItem(PASSCODE_DISABLED);
      await StorageWrapper.setItem(PASSCODE_CHOICE, TRUE);
      await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
    } else if (type === SecureKeychainModuleImpl.TYPES.REMEMBER_ME) {
      await StorageWrapper.removeItem(BIOMETRY_CHOICE);
      await StorageWrapper.setItem(PASSCODE_DISABLED, TRUE);
      await StorageWrapper.removeItem(PASSCODE_CHOICE);
      await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
      //Don't need to add any parameter
    }
  },

  ACCESS_CONTROL: Keychain.ACCESS_CONTROL,
  ACCESSIBLE: Keychain.ACCESSIBLE,
  AUTHENTICATION_TYPE: Keychain.AUTHENTICATION_TYPE,
  TYPES: SECURE_KEYCHAIN_TYPES,
};

export default SecureKeychainModuleImpl;
