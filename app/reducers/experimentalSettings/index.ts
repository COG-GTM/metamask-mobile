import { createSlice } from '@reduxjs/toolkit';
import {
  ActionType,
  type SetSecurityAlertsEnabled,
} from '../../actions/experimental';

export interface ExperimentalSettingsState {
  securityAlertsEnabled: boolean;
}

export const initialState: ExperimentalSettingsState = {
  securityAlertsEnabled: true,
};

const experimentalSettingsSlice = createSlice({
  name: 'experimentalSettings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      ActionType.SET_SECURITY_ALERTS_ENABLED,
      (state, action: SetSecurityAlertsEnabled) => ({
        ...state,
        securityAlertsEnabled: action.securityAlertsEnabled,
      }),
    );
  },
});

export default experimentalSettingsSlice.reducer;
