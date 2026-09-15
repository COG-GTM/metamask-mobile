import reducer, { initialState } from './index';
import { approveHost, type PrivacyAction } from '../../actions/privacy';

describe('privacyReducer', () => {
  it('returns initial state for an unknown action', () => {
    expect(
      reducer(undefined, { type: 'UNKNOWN' } as unknown as PrivacyAction),
    ).toEqual(initialState);
  });

  it('approves a host', () => {
    expect(reducer(undefined, approveHost('example.com'))).toEqual({
      ...initialState,
      approvedHosts: { 'example.com': true },
    });
  });
});
