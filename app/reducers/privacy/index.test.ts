import privacyReducer, { PrivacyState } from './index';
import type { PrivacyAction } from '../../actions/privacy';

const emptyAction = { type: null } as unknown as PrivacyAction;

describe('privacyReducer', () => {
  it('should return initial state', () => {
    const initialState: PrivacyState = {
      approvedHosts: {},
      revealSRPTimestamps: [],
    };
    expect(privacyReducer(undefined, emptyAction)).toEqual(initialState);
  });
});
