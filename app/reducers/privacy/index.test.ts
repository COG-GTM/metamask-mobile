import privacyReducer, { initialState } from '.';
import {
  approveHost,
  rejectHost,
  recordSRPRevealTimestamp,
} from '../../actions/privacy';

describe('privacyReducer', () => {
  it('returns the initial state by default', () => {
    expect(privacyReducer(undefined, { type: 'UNKNOWN' } as never)).toEqual(
      initialState,
    );
  });

  it('handles APPROVE_HOST', () => {
    expect(privacyReducer(initialState, approveHost('metamask.io'))).toEqual({
      approvedHosts: { 'metamask.io': true },
      revealSRPTimestamps: [],
    });
  });

  it('handles REJECT_HOST', () => {
    const state = {
      approvedHosts: { 'metamask.io': true, 'other.io': true },
      revealSRPTimestamps: [],
    };
    expect(privacyReducer(state, rejectHost('metamask.io'))).toEqual({
      approvedHosts: { 'other.io': true },
      revealSRPTimestamps: [],
    });
  });

  it('handles RECORD_SRP_REVEAL_TIMESTAMP', () => {
    expect(
      privacyReducer(initialState, recordSRPRevealTimestamp('123')),
    ).toEqual({
      approvedHosts: {},
      revealSRPTimestamps: ['123'],
    });
  });
});
