import experimentalSettingsReducer from '.';
import { ActionType } from '../../actions/experimental';

describe('ExperimentalSettings Reducer', () => {
  const initialState = { securityAlertsEnabled: true };

  it('should return initial state', () => {
    expect(experimentalSettingsReducer(undefined, { type: '', securityAlertsEnabled: false as any })).toStrictEqual(initialState);
  });

  it('should handle SET_SECURITY_ALERTS_ENABLED', () => {
    const result = experimentalSettingsReducer(initialState, {
      type: ActionType.SET_SECURITY_ALERTS_ENABLED,
      securityAlertsEnabled: false as any,
    });

    expect(result.securityAlertsEnabled).toBe(false);
  });

  it('should return state for unknown action', () => {
    expect(
      experimentalSettingsReducer(initialState, { type: 'UNKNOWN', securityAlertsEnabled: false as any }),
    ).toStrictEqual(initialState);
  });
});
