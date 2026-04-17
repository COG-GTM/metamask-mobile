import reducer, {
  updateAccountState,
  initialState,
  REFECHING_ACCOUNTS_STATES,
} from './index';

describe('notificationsAccountsProvider slice', () => {
  it('has correct initial state', () => {
    expect(initialState).toEqual({});
  });

  it('exports REFECHING_ACCOUNTS_STATES constant', () => {
    expect(REFECHING_ACCOUNTS_STATES).toBe('loading');
  });

  it('returns initial state for unknown action', () => {
    const result = reducer(undefined, { type: 'UNKNOWN' });
    expect(result).toEqual({});
  });

  it('updates account state with new data', () => {
    const payload = { '0x123': true, '0x456': false };
    const result = reducer(initialState, updateAccountState(payload));
    expect(result).toEqual({ '0x123': true, '0x456': false });
  });

  it('does not update when payload is empty', () => {
    const state = { '0x123': true };
    const result = reducer(state, updateAccountState({}));
    expect(result).toEqual({ '0x123': true });
  });

  it('does not update when payload equals current state', () => {
    const state = { '0x123': true };
    const result = reducer(state, updateAccountState({ '0x123': true }));
    expect(result).toEqual({ '0x123': true });
  });

  it('merges new account state', () => {
    const state = { '0x123': true };
    const result = reducer(state, updateAccountState({ '0x456': false }));
    expect(result).toEqual({ '0x123': true, '0x456': false });
  });
});
