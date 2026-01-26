/* eslint-disable @typescript-eslint/default-param-last */

import {
  ActionType,
  SetSecurityAlertsEnabled,
} from '../../actions/experimental';

/**
 * State shape for the experimentalSettings reducer
 */
export interface ExperimentalSettingsState {
  securityAlertsEnabled: boolean;
}

const initialState: ExperimentalSettingsState = {
  securityAlertsEnabled: true,
};

const experimentalSettingsReducer = (
  state: ExperimentalSettingsState = initialState,
  action: SetSecurityAlertsEnabled,
): ExperimentalSettingsState => {
  switch (action.type) {
    case ActionType.SET_SECURITY_ALERTS_ENABLED:
      return {
        ...state,
        securityAlertsEnabled: action.securityAlertsEnabled,
      };
    default:
      return state;
  }
};

export default experimentalSettingsReducer;
