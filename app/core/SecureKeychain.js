import * as Keychain from 'react-native-keychain'; // eslint-disable-line import/no-namespace
import { Encryptor, DERIVATION_OPTIONS_DEFAULT_OWASP2023 } from './Encryptor';
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

const privates = new WeakMap();
const encryptor = new Encryptor({
  keyDerivationOptions: DERIVATION_OPTIONS_DEFAULT_OWASP2023,
});

// Keychain service that holds the per-install random key used to wrap the
// login password. This entry is device-only (excluded from backups) so the
// wrapping key never leaves the device and is never derivable from the app
// bundle (unlike the legacy build-wide `foxCode`).
const WRAPPING_KEY_SERVICE = 'com.metamask.SecureKeychainWrappingKey';
// Number of random bytes used for the per-install wrapping key.
const WRAPPING_KEY_BYTES = 32;
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
 * Class that wraps Keychain from react-native-keychain
 * abstracting metamask specific functionality and settings
 * and also adding an extra layer of encryption before writing into
 * the phone's keychain
 */
class SecureKeychain {
  isAuthenticating = false;

  constructor(code) {
    if (!SecureKeychain.instance) {
      privates.set(this, { code });
      SecureKeychain.instance = this;
    }

    return SecureKeychain.instance;
  }

  /**
   * Returns the per-install random key used to encrypt the login password
   * before it is written to the OS keychain. The key is generated once and
   * persisted in the keychain itself (device-only). Concurrent callers share
   * a single load/creation promise so only one key is ever created.
   *
   * @returns {Promise<string>} The base64-encoded wrapping key.
   */
  getWrappingKey() {
    const state = privates.get(this);
    if (!state.wrappingKeyPromise) {
      state.wrappingKeyPromise = (async () => {
        const stored = await Keychain.getGenericPassword({
          service: WRAPPING_KEY_SERVICE,
        });
        if (stored && stored.password) {
          return stored.password;
        }
        const wrappingKey = encryptor.generateSalt(WRAPPING_KEY_BYTES);
        await Keychain.setGenericPassword(WRAPPING_KEY_SERVICE, wrappingKey, {
          service: WRAPPING_KEY_SERVICE,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        return wrappingKey;
      })().catch((error) => {
        // Reset so a transient keychain failure can be retried on next call.
        state.wrappingKeyPromise = undefined;
        throw error;
      });
    }
    return state.wrappingKeyPromise;
  }

  async encryptPassword(password) {
    const wrappingKey = await this.getWrappingKey();
    return encryptor.encrypt(wrappingKey, { password });
  }

  async decryptPassword(str) {
    const wrappingKey = await this.getWrappingKey();
    try {
      return await encryptor.decrypt(wrappingKey, str);
    } catch {
      // Backwards compatibility: passwords stored before the per-install
      // wrapping key was introduced were encrypted with the static build-wide
      // `code` (foxCode). Fall back to it so existing users are not locked out;
      // the entry is re-encrypted with the wrapping key on the next save.
      return encryptor.decrypt(privates.get(this).code, str);
    }
  }
}
let instance;

export default {
  init(salt) {
    instance = new SecureKeychain(salt);

    if (Device.isAndroid && Keychain.SECURITY_LEVEL?.SECURE_HARDWARE)
      MetaMetrics.getInstance().trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.ANDROID_HARDWARE_KEYSTORE,
        ).build(),
      );

    Object.freeze(instance);
    return instance;
  },

  getInstance() {
    return instance;
  },

  getSupportedBiometryType() {
    return Keychain.getSupportedBiometryType();
  },

  async resetGenericPassword() {
    const options = { service: defaultOptions.service };
    await StorageWrapper.removeItem(BIOMETRY_CHOICE);
    await StorageWrapper.removeItem(PASSCODE_CHOICE);
    // This is called to remove other auth types and set the user back to the default password login
    await MetaMetrics.getInstance().addTraitsToUser({
      [UserProfileProperty.AUTHENTICATION_TYPE]: AUTHENTICATION_TYPE.PASSWORD,
    });
    return Keychain.resetGenericPassword(options);
  },

  async getGenericPassword() {
    if (instance) {
      try {
        instance.isAuthenticating = true;
        const keychainObject = await Keychain.getGenericPassword(
          defaultOptions,
        );
        if (keychainObject.password) {
          const encryptedPassword = keychainObject.password;
          const decrypted = await instance.decryptPassword(encryptedPassword);
          keychainObject.password = decrypted.password;
          instance.isAuthenticating = false;
          return keychainObject;
        }
        instance.isAuthenticating = false;
      } catch (error) {
        instance.isAuthenticating = false;
        throw new Error(error.message);
      }
    }
    return null;
  },

  async setGenericPassword(password, type) {
    const authOptions = {
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
          if (error.message === 'User canceled the operation.') {
            // Store password without biometrics
            const encryptedPassword = await instance.encryptPassword(password);
            await Keychain.setGenericPassword(
              'metamask-user',
              encryptedPassword,
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
  TYPES: {
    BIOMETRICS: 'BIOMETRICS',
    PASSCODE: 'PASSCODE',
    REMEMBER_ME: 'REMEMBER_ME',
  },
};
