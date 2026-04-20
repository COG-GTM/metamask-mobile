import type { SecuritySettingsState } from './state';

describe('SecuritySettingsState', () => {
  it('can be constructed with valid flags and null marketing preference', () => {
    const state: SecuritySettingsState = {
      allowLoginWithRememberMe: true,
      automaticSecurityChecksEnabled: true,
      hasUserSelectedAutomaticSecurityCheckOption: false,
      isAutomaticSecurityChecksModalOpen: false,
      isNFTAutoDetectionModalViewed: false,
      dataCollectionForMarketing: null,
    };
    expect(state.dataCollectionForMarketing).toBeNull();
    expect(state.allowLoginWithRememberMe).toBe(true);
  });

  it('accepts boolean values for dataCollectionForMarketing', () => {
    const state: SecuritySettingsState = {
      allowLoginWithRememberMe: false,
      automaticSecurityChecksEnabled: false,
      hasUserSelectedAutomaticSecurityCheckOption: true,
      isAutomaticSecurityChecksModalOpen: true,
      isNFTAutoDetectionModalViewed: true,
      dataCollectionForMarketing: true,
    };
    expect(state.dataCollectionForMarketing).toBe(true);
  });
});
