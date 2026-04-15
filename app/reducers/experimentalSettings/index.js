/* eslint-disable @typescript-eslint/default-param-last */

import {
  ActionType } from

'../../actions/experimental';

const initialState = {
  securityAlertsEnabled: true
};

const experimentalSettingsReducer = (
state = initialState,
action) =>



{
  switch (action.type) {
    case ActionType.SET_SECURITY_ALERTS_ENABLED:
      return {
        ...state,
        securityAlertsEnabled: action.securityAlertsEnabled
      };
    default:
      return state;
  }
};

export default experimentalSettingsReducer;