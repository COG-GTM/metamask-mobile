import { isInternalOrigin } from '../../Permissions';
import { isUUID } from '../utils/isUUID';

/**
 * Android SDK client ids come from any co-installed app and are used as the
 * PermissionController subject, so they must be UUIDs (the format the
 * MetaMask Android SDK generates) and can never equal an in-app browser
 * hostname or one of the wallet's internal origins.
 *
 * @param clientId - Client / session id supplied by the native layer.
 * @returns True if the id is safe to use as a permission subject.
 */
const isValidAndroidSDKClientId = (clientId: unknown): clientId is string =>
  typeof clientId === 'string' &&
  isUUID(clientId) &&
  !isInternalOrigin(clientId);

export default isValidAndroidSDKClientId;
