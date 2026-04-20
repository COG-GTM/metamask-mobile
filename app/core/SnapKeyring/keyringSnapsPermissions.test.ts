import { KeyringRpcMethod } from '@metamask/keyring-api';
import {
  isProtocolAllowed,
  keyringSnapPermissionsBuilder,
} from './keyringSnapsPermissions';

describe('isProtocolAllowed', () => {
  it('returns true for https URLs', () => {
    expect(isProtocolAllowed('https://example.com')).toBe(true);
  });

  it('returns false for http URLs', () => {
    expect(isProtocolAllowed('http://example.com')).toBe(false);
  });

  it('returns false for malformed URLs', () => {
    expect(isProtocolAllowed('not-a-url')).toBe(false);
  });
});

describe('keyringSnapPermissionsBuilder', () => {
  it('returns the full metamask method list for the metamask origin', () => {
    const permissions = keyringSnapPermissionsBuilder('metamask')();
    expect(permissions).toEqual(
      expect.arrayContaining([
        KeyringRpcMethod.ListAccounts,
        KeyringRpcMethod.GetAccount,
        KeyringRpcMethod.FilterAccountChains,
        KeyringRpcMethod.DeleteAccount,
        KeyringRpcMethod.ListRequests,
        KeyringRpcMethod.GetRequest,
        KeyringRpcMethod.SubmitRequest,
        KeyringRpcMethod.RejectRequest,
      ]),
    );
  });

  it('returns the portfolio method list for portfolio origins', () => {
    const permissions = keyringSnapPermissionsBuilder(
      'https://portfolio.metamask.io',
    )();
    expect(permissions).toEqual(
      expect.arrayContaining([
        KeyringRpcMethod.ListAccounts,
        KeyringRpcMethod.GetAccount,
        KeyringRpcMethod.GetAccountBalances,
        KeyringRpcMethod.SubmitRequest,
      ]),
    );
  });

  it('returns the website method list for other https origins', () => {
    const permissions = keyringSnapPermissionsBuilder('https://example.com')();
    expect(permissions).toContain(KeyringRpcMethod.CreateAccount);
    // NOTE: SubmitRequest must not be exposed to arbitrary websites.
    expect(permissions).not.toContain(KeyringRpcMethod.SubmitRequest);
  });

  it('returns an empty list for non-https origins', () => {
    expect(keyringSnapPermissionsBuilder('http://example.com')()).toEqual([]);
    expect(keyringSnapPermissionsBuilder('bogus-origin')()).toEqual([]);
  });
});
