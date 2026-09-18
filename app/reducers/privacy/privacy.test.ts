import privacyReducer from './index';
import {
  approveHost,
  rejectHost,
  recordSRPRevealTimestamp,
} from '../../actions/privacy';

interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

const reduce = (
  state: PrivacyState | undefined,
  action: Parameters<typeof privacyReducer>[1],
): PrivacyState =>
  privacyReducer(
    state as Parameters<typeof privacyReducer>[0],
    action,
  ) as PrivacyState;

const initialState = reduce(undefined, { type: 'UNKNOWN' });

describe('privacyReducer', () => {
  it('returns the initial state', () => {
    expect(initialState).toEqual({ approvedHosts: {}, revealSRPTimestamps: [] });
  });

  it('approves and rejects hosts', () => {
    let state = reduce(initialState, approveHost('a.com'));
    state = reduce(state, approveHost('b.com'));
    expect(state.approvedHosts).toEqual({ 'a.com': true, 'b.com': true });

    state = reduce(state, rejectHost('a.com'));
    expect(state.approvedHosts).toEqual({ 'b.com': true });
  });

  it('clears hosts', () => {
    const approved = reduce(initialState, approveHost('a.com'));
    const state = reduce(approved, { type: 'CLEAR_HOSTS' });
    expect(state.approvedHosts).toEqual({});
  });

  it('records SRP reveal timestamps', () => {
    let state = reduce(initialState, recordSRPRevealTimestamp(1));
    state = reduce(state, recordSRPRevealTimestamp(2));
    expect(state.revealSRPTimestamps).toEqual([1, 2]);
  });

  it('does not mutate state', () => {
    const state = reduce(initialState, approveHost('a.com'));
    expect(initialState.approvedHosts).toEqual({});
    expect(state).not.toBe(initialState);
  });
});

describe('privacy actions', () => {
  it('creates actions', () => {
    expect(approveHost('a')).toEqual({ type: 'APPROVE_HOST', hostname: 'a' });
    expect(rejectHost('a')).toEqual({ type: 'REJECT_HOST', hostname: 'a' });
    expect(recordSRPRevealTimestamp(1)).toEqual({
      type: 'RECORD_SRP_REVEAL_TIMESTAMP',
      timestamp: 1,
    });
  });
});
