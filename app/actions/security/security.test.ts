import {
  ActionType,
  setAllowLoginWithRememberMe,
  setAutomaticSecurityChecks,
  userSelectedAutomaticSecurityChecksOptions,
  setAutomaticSecurityChecksModalOpen,
  setNftAutoDetectionModalOpen,
  setMultiRpcMigrationModalOpen,
  setDataCollectionForMarketing,
} from './index';

describe('security actions', () => {
  it('setAllowLoginWithRememberMe', () => {
    expect(setAllowLoginWithRememberMe(true)).toEqual({
      type: ActionType.SET_ALLOW_LOGIN_WITH_REMEMBER_ME,
      enabled: true,
    });
  });

  it('setAutomaticSecurityChecks', () => {
    expect(setAutomaticSecurityChecks(false)).toEqual({
      type: ActionType.SET_AUTOMATIC_SECURITY_CHECKS,
      enabled: false,
    });
  });

  it('userSelectedAutomaticSecurityChecksOptions', () => {
    expect(userSelectedAutomaticSecurityChecksOptions()).toEqual({
      type: ActionType.USER_SELECTED_AUTOMATIC_SECURITY_CHECKS_OPTION,
      selected: true,
    });
  });

  it('setAutomaticSecurityChecksModalOpen', () => {
    expect(setAutomaticSecurityChecksModalOpen(true)).toEqual({
      type: ActionType.SET_AUTOMATIC_SECURITY_CHECKS_MODAL_OPEN,
      open: true,
    });
  });

  it('setNftAutoDetectionModalOpen', () => {
    expect(setNftAutoDetectionModalOpen(true)).toEqual({
      type: ActionType.SET_NFT_AUTO_DETECTION_MODAL_OPEN,
      open: true,
    });
  });

  it('setMultiRpcMigrationModalOpen', () => {
    expect(setMultiRpcMigrationModalOpen(false)).toEqual({
      type: ActionType.SET_MULTI_RPC_MIGRATION_MODAL_OPEN,
      open: false,
    });
  });

  it('setDataCollectionForMarketing', () => {
    expect(setDataCollectionForMarketing(true)).toEqual({
      type: ActionType.SET_DATA_COLLECTION_FOR_MARKETING,
      enabled: true,
    });
  });
});
