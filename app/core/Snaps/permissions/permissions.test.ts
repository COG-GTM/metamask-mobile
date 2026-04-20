import {
  EndowmentPermissions,
  ExcludedSnapPermissions,
} from './permissions';

describe('Snaps permissions constants', () => {
  it('declares eth_accounts as excluded with a reason', () => {
    expect(ExcludedSnapPermissions).toHaveProperty('eth_accounts');
    expect(ExcludedSnapPermissions.eth_accounts).toMatch(/eth_accounts/);
  });

  it('freezes the constants to prevent mutation', () => {
    expect(Object.isFrozen(ExcludedSnapPermissions)).toBe(true);
    expect(Object.isFrozen(EndowmentPermissions)).toBe(true);
  });

  it('maps each well-known endowment to its own name', () => {
    for (const [key, value] of Object.entries(EndowmentPermissions)) {
      expect(value).toBe(key);
      expect(key.startsWith('endowment:')).toBe(true);
    }
  });

  it('includes the expected set of endowments', () => {
    const keys = Object.keys(EndowmentPermissions);
    expect(keys).toEqual(
      expect.arrayContaining([
        'endowment:network-access',
        'endowment:transaction-insight',
        'endowment:cronjob',
        'endowment:ethereum-provider',
        'endowment:rpc',
        'endowment:webassembly',
        'endowment:lifecycle-hooks',
        'endowment:page-home',
        'endowment:signature-insight',
        'endowment:name-lookup',
        'endowment:keyring',
      ]),
    );
  });
});
