/* eslint-disable @typescript-eslint/default-param-last */

import {
  ActionType,
  SetSecurityAlertsEnabled,
} from '../../actions/experimental';

export interface ExperimentalSettingsState {
  securityAlertsEnabled: boolean;
}

export const initialState: ExperimentalSettingsState = {
  securityAlertsEnabled: true,
};

const experimentalSettingsReducer = (
  state: ExperimentalSettingsState = initialState,
  action: SetSecurityAlertsEnabled | { type: string },
): ExperimentalSettingsState => {
  switch (action.type) {
    case ActionType.SET_SECURITY_ALERTS_ENABLED:
      return {
        ...state,
        securityAlertsEnabled: (action as SetSecurityAlertsEnabled).securityAlertsEnabled,
      };
    default:
      return state;
  }
};

export default experimentalSettingsReducer;
