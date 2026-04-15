import {
  selectIsBackupAndSyncEnabled,
  selectIsBackupAndSyncUpdateLoading,
  selectIsAccountSyncingEnabled,
  selectIsAccountSyncingReadyToBeDispatched,
  selectIsSignedIn } from
'./index';


describe('Notification Selectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        AuthenticationController: {
          isSignedIn: true
        },
        UserStorageController: {
          isProfileSyncingEnabled: true,
          isAccountSyncingEnabled: true,
          isProfileSyncingUpdateLoading: false,
          isAccountSyncingReadyToBeDispatched: false
        }
      }
    }
  };

  it('selectIsBackupAndSyncEnabled returns correct value', () => {
    expect(selectIsBackupAndSyncEnabled(mockState)).toEqual(
      mockState.engine.backgroundState.UserStorageController.
      isProfileSyncingEnabled
    );
  });

  it('selectIsBackupAndSyncUpdateLoading returns correct value', () => {
    expect(selectIsBackupAndSyncUpdateLoading(mockState)).toEqual(
      mockState.engine.backgroundState.UserStorageController.
      isProfileSyncingUpdateLoading
    );
  });

  it('selectIsAccountSyncingEnabled returns correct value', () => {
    expect(selectIsAccountSyncingEnabled(mockState)).toEqual(
      mockState.engine.backgroundState.UserStorageController.
      isAccountSyncingEnabled
    );
  });

  it('selectIsAccountSyncingReadyToBeDispatched returns correct value', () => {
    expect(selectIsAccountSyncingReadyToBeDispatched(mockState)).toEqual(
      mockState.engine.backgroundState.UserStorageController.
      isAccountSyncingReadyToBeDispatched
    );
  });

  it('selectIsSignedIn returns correct value', () => {
    expect(selectIsSignedIn(mockState)).toEqual(
      mockState.engine.backgroundState.AuthenticationController.isSignedIn
    );
  });
});