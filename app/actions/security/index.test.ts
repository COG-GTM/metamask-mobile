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
    expect(setAllowLoginWithRememberMe(false)).toEqual({
      type: ActionType.SET_ALLOW_LOGIN_WITH_REMEMBER_ME,
      enabled: false,
    });
  });

  it('setAutomaticSecurityChecks', () => {
    expect(setAutomaticSecurityChecks(true)).toEqual({
      type: ActionType.SET_AUTOMATIC_SECURITY_CHECKS,
      enabled: true,
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
    expect(setNftAutoDetectionModalOpen(false)).toEqual({
      type: ActionType.SET_NFT_AUTO_DETECTION_MODAL_OPEN,
      open: false,
    });
  });

  it('setMultiRpcMigrationModalOpen', () => {
    expect(setMultiRpcMigrationModalOpen(true)).toEqual({
      type: ActionType.SET_MULTI_RPC_MIGRATION_MODAL_OPEN,
      open: true,
    });
  });

  it('setDataCollectionForMarketing', () => {
    expect(setDataCollectionForMarketing(true)).toEqual({
      type: ActionType.SET_DATA_COLLECTION_FOR_MARKETING,
      enabled: true,
    });
  });
});
