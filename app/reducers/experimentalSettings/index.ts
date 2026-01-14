import {
  ActionType,
  SetSecurityAlertsEnabled,
} from '../../actions/experimental';

export interface ExperimentalSettingsState {
  securityAlertsEnabled: boolean;
}

interface SetSecurityAlertsEnabledAction {
  type: typeof ActionType.SET_SECURITY_ALERTS_ENABLED;
  securityAlertsEnabled: boolean;
}

type ExperimentalSettingsAction = SetSecurityAlertsEnabledAction;

const initialState: ExperimentalSettingsState = {
  securityAlertsEnabled: true,
};

const experimentalSettingsReducer = (
  state: ExperimentalSettingsState = initialState,
  action: ExperimentalSettingsAction,
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
