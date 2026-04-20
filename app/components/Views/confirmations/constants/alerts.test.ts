import { AlertKeys } from './alerts';

describe('AlertKeys', () => {
  it('contains the expected alert keys', () => {
    expect(AlertKeys.Blockaid).toBe('blockaid');
    expect(AlertKeys.DomainMismatch).toBe('domain_mismatch');
    expect(AlertKeys.InsufficientBalance).toBe('insufficient_balance');
  });

  it('exposes all expected members', () => {
    expect(Object.values(AlertKeys).sort()).toStrictEqual(
      ['blockaid', 'domain_mismatch', 'insufficient_balance'].sort(),
    );
  });
});
