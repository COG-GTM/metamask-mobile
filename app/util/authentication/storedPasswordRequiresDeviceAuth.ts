import StorageWrapper from '../../store/storage-wrapper';
import AUTHENTICATION_TYPE from '../../constants/userProperties';
import {
  BIOMETRY_CHOICE,
  PASSCODE_CHOICE,
  TRUE,
} from '../../constants/storage';

/**
 * Whether reading the stored password from the keychain forces an OS
 * biometric or device passcode prompt. Remember me and plain password
 * entries have no access control, so they must not be used to reveal secrets
 * without the user re-entering their password.
 */
export const storedPasswordRequiresDeviceAuth = async (
  authType: AUTHENTICATION_TYPE,
): Promise<boolean> => {
  if (authType === AUTHENTICATION_TYPE.BIOMETRIC) {
    return Boolean(await StorageWrapper.getItem(BIOMETRY_CHOICE));
  }
  if (authType === AUTHENTICATION_TYPE.PASSCODE) {
    return (await StorageWrapper.getItem(PASSCODE_CHOICE)) === TRUE;
  }
  return false;
};
