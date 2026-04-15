import { getErrorMessage } from '@metamask/utils';
import Engine from '../../core/Engine';


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

export const setIsBackupAndSyncFeatureEnabled = async (
feature,
enabled) =>
{
  try {
    await Engine.context.UserStorageController.setIsBackupAndSyncFeatureEnabled(
      feature,
      enabled
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
isAccountSyncingReadyToBeDispatched) =>
{
  try {
    await Engine.context.UserStorageController.setIsAccountSyncingReadyToBeDispatched(
      isAccountSyncingReadyToBeDispatched
    );
  } catch (error) {
    return getErrorMessage(error);
  }
};