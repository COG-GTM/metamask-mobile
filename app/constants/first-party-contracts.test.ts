import FIRST_PARTY_CONTRACT_NAMES from './first-party-contracts';

describe('first-party-contracts constants', () => {
  it('is a non-empty object', () => {
    expect(typeof FIRST_PARTY_CONTRACT_NAMES).toBe('object');
    expect(Object.keys(FIRST_PARTY_CONTRACT_NAMES).length).toBeGreaterThan(0);
  });

  it('contains Validator Staking', () => {
    expect(FIRST_PARTY_CONTRACT_NAMES['Validator Staking']).toBeDefined();
  });

  it('contains Pooled Staking', () => {
    expect(FIRST_PARTY_CONTRACT_NAMES['Pooled Staking']).toBeDefined();
  });

  it('contains Bridge', () => {
    expect(FIRST_PARTY_CONTRACT_NAMES['Bridge']).toBeDefined();
    expect(
      Object.keys(FIRST_PARTY_CONTRACT_NAMES['Bridge']).length,
    ).toBeGreaterThan(1);
  });

  it('contains Swaps', () => {
    expect(FIRST_PARTY_CONTRACT_NAMES['Swaps']).toBeDefined();
    expect(
      Object.keys(FIRST_PARTY_CONTRACT_NAMES['Swaps']).length,
    ).toBeGreaterThan(1);
  });

  it('all addresses are valid hex addresses', () => {
    Object.values(FIRST_PARTY_CONTRACT_NAMES).forEach((chainMap) => {
      Object.values(chainMap).forEach((address) => {
        expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
      });
    });
  });
});
