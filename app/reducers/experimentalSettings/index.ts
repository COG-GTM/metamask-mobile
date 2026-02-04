/* eslint-disable @typescript-eslint/default-param-last */

import { ActionType } from '../../actions/experimental';

export interface ExperimentalSettingsState {
  securityAlertsEnabled: boolean;
}

const initialState: ExperimentalSettingsState = {
  securityAlertsEnabled: true,
};

interface ExperimentalSettingsAction {
  type: string;
  securityAlertsEnabled?: boolean;
}

const experimentalSettingsReducer = (
  state: ExperimentalSettingsState = initialState,
  action: ExperimentalSettingsAction,
): ExperimentalSettingsState => {
  switch (action.type) {
    case ActionType.SET_SECURITY_ALERTS_ENABLED:
      return {
        ...state,
        securityAlertsEnabled: action.securityAlertsEnabled ?? state.securityAlertsEnabled,
      };
    default:
      return state;
  }
};

export default experimentalSettingsReducer;
