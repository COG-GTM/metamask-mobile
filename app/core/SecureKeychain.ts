import * as Keychain from 'react-native-keychain'; // eslint-disable-line import/no-namespace
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

/**
 * Authentication types supported by SecureKeychain
 */
enum SecureKeychainAuthType {
  BIOMETRICS = 'BIOMETRICS',
  PASSCODE = 'PASSCODE',
  REMEMBER_ME = 'REMEMBER_ME',
}

/**
 * Interface for decrypted password data
 */
interface DecryptedPasswordData {
  password: string;
}

/**
 * Interface for keychain options used in authentication prompts
 */
interface KeychainOptions {
  service: string;
  authenticationPromptTitle: string;
  authenticationPrompt: { title: string };
  authenticationPromptDesc: string;
  fingerprintPromptTitle: string;
  fingerprintPromptDesc: string;
  fingerprintPromptCancel: string;
}

/**
 * Interface for authentication options passed to Keychain
 */
interface AuthOptions {
  accessible: Keychain.ACCESSIBLE;
  accessControl?: Keychain.ACCESS_CONTROL;
}

/**
 * Private data stored in the WeakMap for SecureKeychain instances
 */
interface PrivateData {
  code: string;
}

const privates = new WeakMap<SecureKeychain, PrivateData>();
const encryptor = new Encryptor({
  keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
});
const defaultOptions: KeychainOptions = {
  service: 'com.metamask',
  authenticationPromptTitle: strings('authentication.auth_prompt_title'),
  authenticationPrompt: { title: strings('authentication.auth_prompt_desc') },
  authenticationPromptDesc: strings('authentication.auth_prompt_desc'),
  fingerprintPromptTitle: strings('authentication.fingerprint_prompt_title'),
  fingerprintPromptDesc: strings('authentication.fingerprint_prompt_desc'),
  fingerprintPromptCancel: strings('authentication.fingerprint_prompt_cancel'),
};

/**
 * Class that wraps Keychain from react-native-keychain
 * abstracting metamask specific functionality and settings
 * and also adding an extra layer of encryption before writing into
 * the phone's keychain
 */
class SecureKeychain {
  isAuthenticating = false;
  private static instance: SecureKeychain;

  constructor(code: string) {
    if (!SecureKeychain.instance) {
      privates.set(this, { code });
      SecureKeychain.instance = this;
    }

    return SecureKeychain.instance;
  }

  encryptPassword(password: string): Promise<string> {
    const privateData = privates.get(this);
    if (!privateData) {
      throw new Error('SecureKeychain not initialized');
    }
    return encryptor.encrypt(privateData.code, { password });
  }

  decryptPassword(str: string): Promise<DecryptedPasswordData> {
    const privateData = privates.get(this);
    if (!privateData) {
      throw new Error('SecureKeychain not initialized');
    }
    return encryptor.decrypt(privateData.code, str) as Promise<DecryptedPasswordData>;
  }
}

let instance: SecureKeychain | undefined;

/**
 * Interface for the SecureKeychain module export
 */
interface SecureKeychainModule {
  init(salt: string): SecureKeychain;
  getInstance(): SecureKeychain | undefined;
  getSupportedBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null>;
  resetGenericPassword(): Promise<boolean>;
  getGenericPassword(): Promise<Keychain.UserCredentials | null>;
  setGenericPassword(
    password: string,
    type?: SecureKeychainAuthType,
  ): Promise<void>;
  ACCESS_CONTROL: typeof Keychain.ACCESS_CONTROL;
  ACCESSIBLE: typeof Keychain.ACCESSIBLE;
  AUTHENTICATION_TYPE: typeof Keychain.AUTHENTICATION_TYPE;
  TYPES: typeof SecureKeychainAuthType;
}

const SecureKeychainExport: SecureKeychainModule = {
  init(salt: string): SecureKeychain {
    instance = new SecureKeychain(salt);

    // Check if hardware keystore is available on Android
    // At runtime, SECURITY_LEVEL.SECURE_HARDWARE may be undefined if the native module
    // doesn't support it, but TypeScript types it as always defined
    const secureHardwareLevel = (
      Keychain.SECURITY_LEVEL as unknown as
        | { SECURE_HARDWARE?: string | number }
        | undefined
    )?.SECURE_HARDWARE;
    if (Device.isAndroid() && secureHardwareLevel)
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

  getSupportedBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
    return Keychain.getSupportedBiometryType();
  },

  async resetGenericPassword(): Promise<boolean> {
    const options = { service: defaultOptions.service };
    await StorageWrapper.removeItem(BIOMETRY_CHOICE);
    await StorageWrapper.removeItem(PASSCODE_CHOICE);
    // This is called to remove other auth types and set the user back to the default password login
    await MetaMetrics.getInstance().addTraitsToUser({
      [UserProfileProperty.AUTHENTICATION_TYPE]: AUTHENTICATION_TYPE.PASSWORD,
    });
    return Keychain.resetGenericPassword(options);
  },

  async getGenericPassword(): Promise<Keychain.UserCredentials | null> {
    if (instance) {
      try {
        instance.isAuthenticating = true;
        const keychainObject = await Keychain.getGenericPassword(
          defaultOptions,
        );
        if (keychainObject && keychainObject.password) {
          const encryptedPassword = keychainObject.password;
          const decrypted = await instance.decryptPassword(encryptedPassword);
          keychainObject.password = decrypted.password;
          instance.isAuthenticating = false;
          return keychainObject;
        }
        instance.isAuthenticating = false;
      } catch (error) {
        instance.isAuthenticating = false;
        throw new Error((error as Error).message);
      }
    }
    return null;
  },

  async setGenericPassword(
    password: string,
    type?: SecureKeychainAuthType,
  ): Promise<void> {
    const authOptions: AuthOptions = {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    };

    const metrics = MetaMetrics.getInstance();
    if (type === this.TYPES.BIOMETRICS) {
      authOptions.accessControl = Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET;

      await metrics.addTraitsToUser({
        [UserProfileProperty.AUTHENTICATION_TYPE]:
          AUTHENTICATION_TYPE.BIOMETRIC,
      });
    } else if (type === this.TYPES.PASSCODE) {
      authOptions.accessControl = Keychain.ACCESS_CONTROL.DEVICE_PASSCODE;
      await metrics.addTraitsToUser({
        [UserProfileProperty.AUTHENTICATION_TYPE]: AUTHENTICATION_TYPE.PASSCODE,
      });
    } else if (type === this.TYPES.REMEMBER_ME) {
      await metrics.addTraitsToUser({
        [UserProfileProperty.AUTHENTICATION_TYPE]:
          AUTHENTICATION_TYPE.REMEMBER_ME,
      });
      //Don't need to add any parameter
    } else {
      // Setting a password without a type does not save it
      await this.resetGenericPassword();
      return;
    }

    if (!instance) {
      throw new Error('SecureKeychain not initialized');
    }

    const encryptedPassword = await instance.encryptPassword(password);
    await Keychain.setGenericPassword('metamask-user', encryptedPassword, {
      ...defaultOptions,
      ...authOptions,
    });

    if (type === this.TYPES.BIOMETRICS) {
      await StorageWrapper.setItem(BIOMETRY_CHOICE, TRUE);
      await StorageWrapper.setItem(PASSCODE_DISABLED, TRUE);
      await StorageWrapper.removeItem(PASSCODE_CHOICE);
      await StorageWrapper.removeItem(BIOMETRY_CHOICE_DISABLED);

      // If the user enables biometrics, we're trying to read the password
      // immediately so we get the permission prompt
      if (Platform.OS === 'ios') {
        try {
          await this.getGenericPassword();
        } catch (error) {
          // Specifically check for user cancellation
          if ((error as Error).message === 'User canceled the operation.') {
            // Store password without biometrics
            const encryptedPasswordFallback =
              await instance.encryptPassword(password);
            await Keychain.setGenericPassword(
              'metamask-user',
              encryptedPasswordFallback,
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
    } else if (type === this.TYPES.PASSCODE) {
      await StorageWrapper.removeItem(BIOMETRY_CHOICE);
      await StorageWrapper.removeItem(PASSCODE_DISABLED);
      await StorageWrapper.setItem(PASSCODE_CHOICE, TRUE);
      await StorageWrapper.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
    } else if (type === this.TYPES.REMEMBER_ME) {
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
  TYPES: SecureKeychainAuthType,
};

export default SecureKeychainExport;
