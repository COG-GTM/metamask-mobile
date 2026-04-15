import { validateAccountsController } from './accountsController';
import { LOG_TAG } from './validateMigration.types';




import { EthScope } from '@metamask/keyring-api';

describe('validateAccountsController', () => {
  const createMockState = (
  accountsState) => (
  {
    engine: accountsState ?
    {
      backgroundState: {
        AccountsController: accountsState
      }
    } :
    undefined
  });

  const mockValidAccountsState = {
    internalAccounts: {
      accounts: {
        'account-1': {
          id: 'account-1',
          address: '0x123',
          type: 'eip155:eoa',
          scopes: [EthScope.Eoa],
          options: {},
          methods: [],
          metadata: {
            name: 'Account 1',
            lastSelected: 0,
            importTime: Date.now(),
            keyring: {
              type: 'HD Key Tree'
            }
          }
        }
      },
      selectedAccount: 'account-1'
    }
  };

  it('returns no errors for valid state', () => {
    const errors = validateAccountsController(
      createMockState(mockValidAccountsState)
    );
    expect(errors).toEqual([]);
  });

  it('returns error if AccountsController state is missing', () => {
    const errors = validateAccountsController(
      createMockState(undefined)
    );
    expect(errors).toEqual([
    `${LOG_TAG}: AccountsController state is missing in engine backgroundState.`]
    );
  });

  it('returns error if internalAccounts is missing', () => {
    const errors = validateAccountsController(createMockState({}));
    expect(errors).toEqual([
    `${LOG_TAG}: AccountsController No internalAccounts object found on AccountsControllerState.`]
    );
  });

  it('returns error if accounts is empty', () => {
    const errors = validateAccountsController(
      createMockState({
        internalAccounts: {
          accounts: {},
          selectedAccount: 'dummy-account'
        }
      })
    );
    expect(errors).toEqual([
    `${LOG_TAG}: AccountsController No accounts found in internalAccounts.accounts.`]
    );
  });

  it('returns error if selectedAccount is empty', () => {
    const errors = validateAccountsController(
      createMockState({
        internalAccounts: {
          accounts: {
            'account-1': {
              id: 'account-1',
              address: '0x123',
              type: 'eip155:eoa',
              scopes: [EthScope.Eoa],
              options: {},
              methods: [],
              metadata: {
                name: 'Account 1',
                lastSelected: 0,
                importTime: Date.now(),
                keyring: {
                  type: 'HD Key Tree'
                }
              }
            }
          },
          selectedAccount: ''
        }
      })
    );
    expect(errors).toEqual([
    `${LOG_TAG}: AccountsController selectedAccount is missing or empty. selectedAccount: `]
    );
  });

  it('returns error if selectedAccount is undefined', () => {
    const errors = validateAccountsController(
      createMockState({
        internalAccounts: {
          accounts: {
            'account-1': {
              id: 'account-1',
              address: '0x123',
              type: 'eip155:eoa',
              scopes: [EthScope.Eoa],
              options: {},
              methods: [],
              metadata: {
                name: 'Account 1',
                lastSelected: 0,
                importTime: Date.now(),
                keyring: {
                  type: 'HD Key Tree'
                }
              }
            }
          },
          selectedAccount: undefined
        }
      })
    );
    expect(errors).toEqual([
    `${LOG_TAG}: AccountsController selectedAccount is missing or empty. selectedAccount: undefined`]
    );
  });

  it('returns error if selectedAccount does not exist in accounts', () => {
    const errors = validateAccountsController(
      createMockState({
        internalAccounts: {
          accounts: {
            'account-1': {
              id: 'account-1',
              address: '0x123',
              type: 'eip155:eoa',
              scopes: [EthScope.Eoa],
              options: {},
              methods: [],
              metadata: {
                name: 'Account 1',
                lastSelected: 0,
                importTime: Date.now(),
                keyring: {
                  type: 'HD Key Tree'
                }
              }
            }
          },
          selectedAccount: 'non-existent-account'
        }
      })
    );
    expect(errors).toEqual([
    `${LOG_TAG}: AccountsController The selectedAccount 'non-existent-account' does not exist in the accounts record.`]
    );
  });

  it('handles undefined engine state', () => {
    const errors = validateAccountsController({});
    expect(errors).toEqual([
    `${LOG_TAG}: AccountsController state is missing in engine backgroundState.`]
    );
  });

  it('handles undefined backgroundState', () => {
    const errors = validateAccountsController({ engine: {} });
    expect(errors).toEqual([
    `${LOG_TAG}: AccountsController state is missing in engine backgroundState.`]
    );
  });

  it('does not throw with malformed state', () => {
    // Test with various malformed states
    const testStates = [
    undefined,
    null,
    {},
    { engine: undefined },
    { engine: null },
    { engine: { backgroundState: undefined } },
    { engine: { backgroundState: null } },
    { engine: { backgroundState: { AccountsController: undefined } } },
    { engine: { backgroundState: { AccountsController: null } } },
    {
      engine: {
        backgroundState: {
          AccountsController: { internalAccounts: undefined }
        }
      }
    },
    {
      engine: {
        backgroundState: { AccountsController: { internalAccounts: null } }
      }
    },
    {
      engine: {
        backgroundState: {
          AccountsController: {
            internalAccounts: {
              accounts: undefined,
              selectedAccount: undefined
            }
          }
        }
      }
    },
    {
      engine: {
        backgroundState: {
          AccountsController: {
            internalAccounts: { accounts: null, selectedAccount: null }
          }
        }
      }
    }];


    testStates.forEach((state) => {
      // Verify no throw
      expect(() => {
        validateAccountsController(state);
      }).not.toThrow();

      // Verify returns errors array
      const errors = validateAccountsController(state);
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});