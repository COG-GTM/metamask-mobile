import reducer, { updateAccountState, initialState } from '.';

describe('Notifications Accounts Slice', () => {
  it('should return initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toStrictEqual(initialState);
  });

  it('should handle updateAccountState with new accounts', () => {
    const payload = { '0x1': true, '0x2': false };
    const result = reducer(initialState, updateAccountState(payload));

    expect(result).toStrictEqual(payload);
  });

  it('should merge with existing state', () => {
    const existing = { '0x1': true };
    const payload = { '0x2': false };
    const result = reducer(existing, updateAccountState(payload));

    expect(result).toStrictEqual({ '0x1': true, '0x2': false });
  });

  it('should not update if payload is empty', () => {
    const existing = { '0x1': true };
    const result = reducer(existing, updateAccountState({}));

    expect(result).toStrictEqual(existing);
  });

  it('should not update if state is equal to payload', () => {
    const existing = { '0x1': true };
    const result = reducer(existing, updateAccountState({ '0x1': true }));

    expect(result).toStrictEqual(existing);
  });
});
