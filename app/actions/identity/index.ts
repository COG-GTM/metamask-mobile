import { getErrorMessage } from '@metamask/utils';
import Engine from '../../core/Engine';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import { Auth0 } from '../../core/Authentication/Auth0Service';

export const performSignIn = async () => {
  try {
    await Engine.context.AuthenticationController.performSignIn();
  } catch (error) {
    return getErrorMessage(error);
  }
};

export const performSignOut = () => {
  try {
    Engine.context.AuthenticationController.performSignOut();
  } catch (error) {
    return getErrorMessage(error);
  }
};

/**
 * Bearer token for backend identity services. Prefers the optional Auth0 cloud
 * identity when the user is signed in to it, and otherwise falls back to the
 * SRP-derived identity of the AuthenticationController.
 */
export const getIdentityBearerToken = async (): Promise<string | undefined> => {
  const auth0AccessToken = await Auth0.getAccessToken();
  if (auth0AccessToken) {
    return auth0AccessToken;
  }
  try {
    return await Engine.context.AuthenticationController.getBearerToken();
  } catch {
    return undefined;
  }
};

export const setIsBackupAndSyncFeatureEnabled = async (
  feature: keyof typeof BACKUPANDSYNC_FEATURES,
  enabled: boolean,
) => {
  try {
    await Engine.context.UserStorageController.setIsBackupAndSyncFeatureEnabled(
      feature,
      enabled,
    );
  } catch (error) {
    return getErrorMessage(error);
  }
};

export const syncInternalAccountsWithUserStorage = async () => {
  try {
    await Engine.context.UserStorageController.syncInternalAccountsWithUserStorage();
  } catch (error) {
    return getErrorMessage(error);
  }
};

export const setIsAccountSyncingReadyToBeDispatched = async (
  isAccountSyncingReadyToBeDispatched: boolean,
) => {
  try {
    await Engine.context.UserStorageController.setIsAccountSyncingReadyToBeDispatched(
      isAccountSyncingReadyToBeDispatched,
    );
  } catch (error) {
    return getErrorMessage(error);
  }
};
