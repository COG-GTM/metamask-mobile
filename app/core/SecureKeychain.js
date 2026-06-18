import * as Keychain from 'react-native-keychain'; // eslint-disable-line import/no-namespace
import { Encryptor, LEGACY_DERIVATION_OPTIONS } from './Encryptor';
import { strings } from '../../locales/i18n';
import StorageWrapper from '../store/storage-wrapper';
import { Platform } from 'react-native';
import Logger from '../util/Logger';
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
  keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
});

// Keychain service used to persist the per-device random key that wraps the
// stored wallet password. This key is generated once on first use and never
// leaves the device, so it is unique per install rather than a static,
// binary-recoverable build constant.
const DEVICE_ENCRYPTION_KEY_SERVICE = 'com.metamask.device-encryption-key';
const DEVICE_ENCRYPTION_KEY_BYTES = 32;

/**
 * Returns the per-device encryption key, generating and persisting a new random
 * key in the OS keychain on first use. The key is stored device-only and is
 * relied upon as the wrapping key for the "extra layer of encryption" applied
 * before writing the wallet password to the keychain.
 */
async function getOrCreateDeviceEncryptionKey() {
  try {
    const existing = await Keychain.getGenericPassword({
      service: DEVICE_ENCRYPTION_KEY_SERVICE,
    });
    if (existing && existing.password) {
      return existing.password;
    }
  } catch (error) {
    Logger.error(
      error,
      'SecureKeychain: failed to read device encryption key, generating a new one',
    );
  }

  const key = encryptor.generateSalt(DEVICE_ENCRYPTION_KEY_BYTES);
  await Keychain.setGenericPassword('metamask-device', key, {
    service: DEVICE_ENCRYPTION_KEY_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}
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

  // Lazily resolves (and caches) the per-device wrapping key. Falls back to
  // generating one on first use.
  async getEncryptionKey() {
    const store = privates.get(this);
    if (!store.encryptionKey) {
      store.encryptionKey = await getOrCreateDeviceEncryptionKey();
    }
    return store.encryptionKey;
  }

  async encryptPassword(password) {
    const key = await this.getEncryptionKey();
    return encryptor.encrypt(key, { password });
  }

  async decryptPassword(str) {
    const key = await this.getEncryptionKey();
    try {
      return await encryptor.decrypt(key, str);
    } catch (error) {
      // Backward compatibility: passwords stored before the per-device key
      // migration were wrapped with the legacy build-time code. Decrypt those
      // so existing users are not locked out; the next write re-encrypts the
      // password under the per-device key.
      const { code: legacyCode } = privates.get(this);
      if (legacyCode) {
        return await encryptor.decrypt(legacyCode, str);
      }
      throw error;
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
