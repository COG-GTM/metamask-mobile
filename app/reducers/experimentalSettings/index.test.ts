import { ActionType } from '../../actions/experimental';
import experimentalSettingsReducer from './';

describe('experimentalSettingsReducer', () => {
  const initialState = {
    securityAlertsEnabled: true,
  };

  it('should return the initial state', () => {
    const result = experimentalSettingsReducer(undefined, { type: '', securityAlertsEnabled: false });
    expect(result).toEqual(initialState);
  });

  it('should handle SET_SECURITY_ALERTS_ENABLED to true', () => {
    const state = { securityAlertsEnabled: false };
    const result = experimentalSettingsReducer(state, {
      type: ActionType.SET_SECURITY_ALERTS_ENABLED,
      securityAlertsEnabled: true,
    });
    expect(result.securityAlertsEnabled).toBe(true);
  });

  it('should handle SET_SECURITY_ALERTS_ENABLED to false', () => {
    const result = experimentalSettingsReducer(initialState, {
      type: ActionType.SET_SECURITY_ALERTS_ENABLED,
      securityAlertsEnabled: false,
    });
    expect(result.securityAlertsEnabled).toBe(false);
  });

  it('should return state unchanged for unknown action', () => {
    const state = { securityAlertsEnabled: true };
    const result = experimentalSettingsReducer(state, {
      type: 'UNKNOWN_ACTION',
      securityAlertsEnabled: false,
    });
    expect(result).toBe(state);
  });
});
