/* eslint-disable @typescript-eslint/default-param-last */

import { Reducer } from 'redux';
import {
  ActionType,
  SetSecurityAlertsEnabled,
} from '../../actions/experimental';
import { ExperimentalSettingsState } from './types';

interface ExperimentalSettingsAction {
  type: string;
  securityAlertsEnabled?: SetSecurityAlertsEnabled;
}

const initialState: ExperimentalSettingsState = {
  securityAlertsEnabled: true,
};

const experimentalSettingsReducer: Reducer<
  ExperimentalSettingsState,
  ExperimentalSettingsAction
> = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.SET_SECURITY_ALERTS_ENABLED:
      return {
        ...state,
        securityAlertsEnabled: Boolean(action.securityAlertsEnabled),
      };
    default:
      return state;
  }
};

export default experimentalSettingsReducer;
