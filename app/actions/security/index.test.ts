import {
  ActionType,
  setAllowLoginWithRememberMe,
  setAutomaticSecurityChecks,
  userSelectedAutomaticSecurityChecksOptions,
  setAutomaticSecurityChecksModalOpen,
  setNftAutoDetectionModalOpen,
  setMultiRpcMigrationModalOpen,
  setDataCollectionForMarketing,
} from '.';

describe('Security Actions', () => {
  it('setAllowLoginWithRememberMe should return correct action', () => {
    expect(setAllowLoginWithRememberMe(true)).toStrictEqual({
      type: ActionType.SET_ALLOW_LOGIN_WITH_REMEMBER_ME,
      enabled: true,
    });
  });

  it('setAutomaticSecurityChecks should return correct action', () => {
    expect(setAutomaticSecurityChecks(false)).toStrictEqual({
      type: ActionType.SET_AUTOMATIC_SECURITY_CHECKS,
      enabled: false,
    });
  });

  it('userSelectedAutomaticSecurityChecksOptions should return correct action', () => {
    expect(userSelectedAutomaticSecurityChecksOptions()).toStrictEqual({
      type: ActionType.USER_SELECTED_AUTOMATIC_SECURITY_CHECKS_OPTION,
      selected: true,
    });
  });

  it('setAutomaticSecurityChecksModalOpen should return correct action', () => {
    expect(setAutomaticSecurityChecksModalOpen(true)).toStrictEqual({
      type: ActionType.SET_AUTOMATIC_SECURITY_CHECKS_MODAL_OPEN,
      open: true,
    });
  });

  it('setNftAutoDetectionModalOpen should return correct action', () => {
    expect(setNftAutoDetectionModalOpen(false)).toStrictEqual({
      type: ActionType.SET_NFT_AUTO_DETECTION_MODAL_OPEN,
      open: false,
    });
  });

  it('setMultiRpcMigrationModalOpen should return correct action', () => {
    expect(setMultiRpcMigrationModalOpen(true)).toStrictEqual({
      type: ActionType.SET_MULTI_RPC_MIGRATION_MODAL_OPEN,
      open: true,
    });
  });

  it('setDataCollectionForMarketing should return correct action', () => {
    expect(setDataCollectionForMarketing(true)).toStrictEqual({
      type: ActionType.SET_DATA_COLLECTION_FOR_MARKETING,
      enabled: true,
    });
  });
});
