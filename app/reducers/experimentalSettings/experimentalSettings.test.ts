import experimentalSettingsReducer from './index';
import { ActionType } from '../../actions/experimental';

describe('experimentalSettingsReducer', () => {
  it('returns the initial state', () => {
    expect(
      experimentalSettingsReducer(undefined, { type: 'UNKNOWN' } as never),
    ).toEqual({ securityAlertsEnabled: true });
  });

  it('sets securityAlertsEnabled', () => {
    const state = experimentalSettingsReducer(undefined, {
      type: ActionType.SET_SECURITY_ALERTS_ENABLED,
      securityAlertsEnabled: false,
    } as never);
    expect(state.securityAlertsEnabled).toBe(false);
  });
});
