import * as Keychain from 'react-native-keychain'; // eslint-disable-line import/no-namespace
import { hasProperty, isObject } from '@metamask/utils';
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

const privates = new WeakMap<SecureKeychain, { code: string }>();
const encryptor = new Encryptor({
  keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
});
const defaultOptions = {
  service: 'com.metamask',
  authenticationPromptTitle: strings('authentication.auth_prompt_title'),
  authenticationPrompt: { title: strings('authentication.auth_prompt_desc') },
  authenticationPromptDesc: strings('authentication.auth_prompt_desc'),
  fingerprintPromptTitle: strings('authentication.fingerprint_prompt_title'),
  fingerprintPromptDesc: strings('authentication.fingerprint_prompt_desc'),
  fingerprintPromptCancel: strings('authentication.fingerprint_prompt_cancel'),
};
import AUTHENTICATION_TYPE from '../constants/userProperties';
import { UserProfileProperty } from '../util/metrics/UserSettingsAnalyticsMetaData/UserProfileAnalyticsMetaData.types';
import { MetricsEventBuilder } from './Analytics/MetricsEventBuilder';

/**
 * The password payload stored in the keychain, encrypted with the
 * app specific code the keychain was initialised with.
 */
interface EncryptedPasswordPayload {
  password: string;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const isEncryptedPasswordPayload = (
  value: unknown,
): value is EncryptedPasswordPayload =>
  isObject(value) &&
  hasProperty(value, 'password') &&
  typeof value.password === 'string';

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

  private get code(): string {
    const code = privates.get(this)?.code;
    if (code === undefined) {
      throw new Error('SecureKeychain has not been initialized');
    }
    return code;
  }

  encryptPassword(password: string): Promise<string> {
    return encryptor.encrypt(this.code, { password });
  }

  async decryptPassword(str: string): Promise<EncryptedPasswordPayload> {
    const decrypted = await encryptor.decrypt(this.code, str);
    if (!isEncryptedPasswordPayload(decrypted)) {
      throw new Error('Decrypted keychain payload has an unexpected shape');
    }
    return decrypted;
  }
}
let instance: SecureKeychain;

const TYPES = {
  BIOMETRICS: 'BIOMETRICS',
  PASSCODE: 'PASSCODE',
  REMEMBER_ME: 'REMEMBER_ME',
} as const;

export type SecureKeychainType = (typeof TYPES)[keyof typeof TYPES];

export default {
  init(salt: string): SecureKeychain {
    instance = new SecureKeychain(salt);

    if (Device.isAndroid() && Keychain.SECURITY_LEVEL?.SECURE_HARDWARE)
      MetaMetrics.getInstance().trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.ANDROID_HARDWARE_KEYSTORE,
        ).build(),
      );

    Object.freeze(instance);
    return instance;
  },

  getInstance(): SecureKeychain {
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
        throw new Error(getErrorMessage(error));
      }
    }
    return null;
  },

  async setGenericPassword(
    password: string,
    type?: SecureKeychainType,
  ): Promise<boolean | void> {
    const authOptions: Keychain.Options = {
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
      return await this.resetGenericPassword();
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
          if (getErrorMessage(error) === 'User canceled the operation.') {
            // Store password without biometrics
            const fallbackEncryptedPassword = await instance.encryptPassword(
              password,
            );
            await Keychain.setGenericPassword(
              'metamask-user',
              fallbackEncryptedPassword,
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
  TYPES,
};
