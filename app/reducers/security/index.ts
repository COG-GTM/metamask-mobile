/* eslint-disable @typescript-eslint/default-param-last */
import { createSlice } from '@reduxjs/toolkit';
import {
  ActionType,
  Action,
  AllowLoginWithRememberMeUpdated,
  AutomaticSecurityChecks,
  UserSelectedAutomaticSecurityChecksOptions,
  SetAutomaticSecurityChecksModalOpen,
  SetNftAutoDetectionModalOpen,
  SetDataCollectionForMarketing,
} from '../../actions/security';
import { SecuritySettingsState } from '../../actions/security/state';

export interface SecurityState {
  allowLoginWithRememberMe: boolean;
  automaticSecurityChecksEnabled: boolean;
  hasUserSelectedAutomaticSecurityCheckOption: boolean;
  isAutomaticSecurityChecksModalOpen: boolean;
  dataCollectionForMarketing: boolean | null;
  isNFTAutoDetectionModalViewed: boolean;
}

export const initialState: Readonly<SecuritySettingsState> = {
  allowLoginWithRememberMe: false,
  automaticSecurityChecksEnabled: false,
  hasUserSelectedAutomaticSecurityCheckOption: false,
  isAutomaticSecurityChecksModalOpen: false,
  dataCollectionForMarketing: null,
  isNFTAutoDetectionModalViewed: false,
};

// Legacy action types are handled in extraReducers so that action creators,
// type strings and action shapes stay byte-identical. Case reducers return a
// fresh object (as the legacy switch did) so reference semantics are unchanged.
const securitySlice = createSlice({
  name: 'security',
  initialState: initialState as SecuritySettingsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.SET_ALLOW_LOGIN_WITH_REMEMBER_ME,
        (state, action: AllowLoginWithRememberMeUpdated) => ({
          ...state,
          allowLoginWithRememberMe: action.enabled,
        }),
      )
      .addCase(
        ActionType.SET_AUTOMATIC_SECURITY_CHECKS,
        (state, action: AutomaticSecurityChecks) => ({
          ...state,
          automaticSecurityChecksEnabled: action.enabled,
        }),
      )
      .addCase(
        ActionType.USER_SELECTED_AUTOMATIC_SECURITY_CHECKS_OPTION,
        (state, action: UserSelectedAutomaticSecurityChecksOptions) => ({
          ...state,
          hasUserSelectedAutomaticSecurityCheckOption: action.selected,
        }),
      )
      .addCase(
        ActionType.SET_AUTOMATIC_SECURITY_CHECKS_MODAL_OPEN,
        (state, action: SetAutomaticSecurityChecksModalOpen) => ({
          ...state,
          isAutomaticSecurityChecksModalOpen: action.open,
        }),
      )
      .addCase(
        ActionType.SET_NFT_AUTO_DETECTION_MODAL_OPEN,
        (state, action: SetNftAutoDetectionModalOpen) => ({
          ...state,
          isNFTAutoDetectionModalViewed: action.open,
        }),
      )
      .addCase(
        ActionType.SET_DATA_COLLECTION_FOR_MARKETING,
        (state, action: SetDataCollectionForMarketing) => ({
          ...state,
          dataCollectionForMarketing: action.enabled,
        }),
      );
  },
});

const securityReducer: (
  state: SecuritySettingsState | undefined,
  action: Action,
) => SecuritySettingsState = securitySlice.reducer;

export default securityReducer;
