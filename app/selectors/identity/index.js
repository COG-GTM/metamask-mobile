import { createSelector } from 'reselect';

import {
  AuthenticationController,
  UserStorageController } from
'@metamask/profile-sync-controller';





const selectAuthenticationControllerState = (state) =>
state?.engine?.backgroundState?.AuthenticationController ??
AuthenticationController.defaultState;

const selectUserStorageControllerState = (state) =>
state?.engine?.backgroundState?.UserStorageController ??
UserStorageController.defaultState;

// Authentication
export const selectIsSignedIn = createSelector(
  selectAuthenticationControllerState,
  (authenticationControllerState) =>
  authenticationControllerState.isSignedIn
);

// User Storage
export const selectIsBackupAndSyncEnabled = createSelector(
  selectUserStorageControllerState,
  (userStorageControllerState) =>
  userStorageControllerState?.isProfileSyncingEnabled
);

export const selectIsBackupAndSyncUpdateLoading = createSelector(
  selectUserStorageControllerState,
  (userStorageControllerState) =>
  userStorageControllerState.isProfileSyncingUpdateLoading
);

export const selectIsAccountSyncingEnabled = createSelector(
  selectUserStorageControllerState,
  (userStorageControllerState) =>
  userStorageControllerState?.isAccountSyncingEnabled
);

export const selectIsAccountSyncingReadyToBeDispatched = createSelector(
  selectUserStorageControllerState,
  (userStorageControllerState) =>
  userStorageControllerState.isAccountSyncingReadyToBeDispatched
);