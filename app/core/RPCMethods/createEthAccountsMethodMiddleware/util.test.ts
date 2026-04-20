import legacyHandlers from './util';
import ethAccounts from '../eth_accounts';

describe('createEthAccountsMethodMiddleware/util', () => {
  it('exports a list of legacy handlers containing ethAccounts', () => {
    expect(Array.isArray(legacyHandlers)).toBe(true);
    expect(legacyHandlers).toContain(ethAccounts);
    expect(legacyHandlers).toHaveLength(1);
  });
});
