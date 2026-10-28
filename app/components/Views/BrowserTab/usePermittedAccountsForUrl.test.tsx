import React from 'react';
import { Provider } from 'react-redux';
import { createStore, Store } from 'redux';
import { act, renderHook } from '@testing-library/react-native';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { InternalAccount } from '@metamask/keyring-internal-api';
import Engine from '../../../core/Engine';
import { getAccountsFromSubject } from '../../../core/Permissions';
import { backgroundState } from '../../../util/test/initial-root-state';
import usePermittedAccountsForUrl from './usePermittedAccountsForUrl';

jest.mock('../../../core/Permissions', () => ({
  ...jest.requireActual('../../../core/Permissions'),
  getAccountsFromSubject: jest.fn(),
}));

const { getAccountsFromSubject: actualGetAccountsFromSubject } =
  jest.requireActual('../../../core/Permissions');
const mockGetAccountsFromSubject = getAccountsFromSubject as jest.Mock;
const mockListAccounts = Engine.context.AccountsController
  .listAccounts as jest.Mock;

const ADDRESS_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const ADDRESS_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const buildSubject = (origin: string, addresses: string[]) => ({
  origin,
  permissions: {
    [Caip25EndowmentPermissionName]: {
      id: `${origin}-caip25`,
      parentCapability: Caip25EndowmentPermissionName,
      invoker: origin,
      date: 1,
      caveats: [
        {
          type: Caip25CaveatType,
          value: {
            requiredScopes: {},
            optionalScopes: {
              'eip155:1': {
                accounts: addresses.map((address) => `eip155:1:${address}`),
              },
            },
            sessionProperties: {},
            isMultichainOrigin: false,
          },
        },
      ],
    },
  },
});

const buildAccount = (
  id: string,
  address: string,
  lastSelected: number,
): InternalAccount =>
  ({
    id,
    address,
    type: 'eip155:eoa',
    options: {},
    methods: [],
    scopes: ['eip155:0'],
    metadata: {
      name: id,
      importTime: 0,
      lastSelected,
      keyring: { type: 'HD Key Tree' },
    },
  } as InternalAccount);

const buildState = (
  subjects: Record<string, unknown>,
  accounts: InternalAccount[],
) => ({
  engine: {
    backgroundState: {
      ...backgroundState,
      PermissionController: { subjects },
      AccountsController: {
        internalAccounts: {
          selectedAccount: accounts[0]?.id,
          accounts: Object.fromEntries(accounts.map((a) => [a.id, a])),
        },
      },
    },
  },
  unrelated: 0,
});

type TestState = ReturnType<typeof buildState>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reducer = (state: any, action: any) => {
  switch (action.type) {
    case 'UNRELATED':
      return { ...state, unrelated: state.unrelated + 1 };
    case 'REPLACE':
      return action.state;
    default:
      return state;
  }
};

const currentAccounts = (store: Store) =>
  Object.values(
    (store.getState() as TestState).engine.backgroundState.AccountsController
      .internalAccounts.accounts,
  );

const setup = (initialState: TestState, url: string) => {
  const store = createStore(reducer, initialState);
  mockListAccounts.mockImplementation(() => currentAccounts(store));
  const urlRef = { current: url };
  const wrapper = ({ children }: { children: React.ReactElement }) => (
    <Provider store={store}>{children}</Provider>
  );
  const hook = renderHook(() => usePermittedAccountsForUrl(urlRef), {
    wrapper,
  });
  return { store, urlRef, ...hook };
};

describe('usePermittedAccountsForUrl', () => {
  const accountA = buildAccount('a', ADDRESS_A, 1);
  const accountB = buildAccount('b', ADDRESS_B, 2);

  beforeEach(() => {
    mockGetAccountsFromSubject.mockImplementation(actualGetAccountsFromSubject);
  });

  it('returns the permitted accounts for the URL hostname sorted by last selected', () => {
    const { result } = setup(
      buildState(
        {
          'app.uniswap.org': buildSubject('app.uniswap.org', [
            ADDRESS_A,
            ADDRESS_B,
          ]),
        },
        [accountA, accountB],
      ),
      'https://app.uniswap.org/swap?chain=mainnet',
    );

    expect(result.current).toEqual([ADDRESS_B, ADDRESS_A]);
  });

  it('returns an empty list when the hostname has no subject', () => {
    const { result } = setup(
      buildState(
        { 'app.uniswap.org': buildSubject('app.uniswap.org', [ADDRESS_A]) },
        [accountA],
      ),
      'https://example.com',
    );

    expect(result.current).toEqual([]);
  });

  it('does not recompute or change identity on unrelated dispatches', () => {
    const { result, store } = setup(
      buildState(
        { 'app.uniswap.org': buildSubject('app.uniswap.org', [ADDRESS_A]) },
        [accountA],
      ),
      'https://app.uniswap.org',
    );
    const first = result.current;
    const callsAfterMount = mockGetAccountsFromSubject.mock.calls.length;

    act(() => {
      for (let i = 0; i < 50; i++) {
        store.dispatch({ type: 'UNRELATED' });
      }
    });

    expect(mockGetAccountsFromSubject).toHaveBeenCalledTimes(callsAfterMount);
    expect(result.current).toBe(first);
  });

  it('does not recompute when a different subject changes', () => {
    const subject = buildSubject('app.uniswap.org', [ADDRESS_A]);
    const { result, store } = setup(
      buildState(
        {
          'app.uniswap.org': subject,
          'opensea.io': buildSubject('opensea.io', [ADDRESS_A]),
        },
        [accountA, accountB],
      ),
      'https://app.uniswap.org',
    );
    const first = result.current;
    const callsAfterMount = mockGetAccountsFromSubject.mock.calls.length;
    const state = store.getState() as TestState;

    act(() => {
      store.dispatch({
        type: 'REPLACE',
        state: {
          ...state,
          engine: {
            backgroundState: {
              ...state.engine.backgroundState,
              PermissionController: {
                subjects: {
                  'app.uniswap.org': subject,
                  'opensea.io': buildSubject('opensea.io', [ADDRESS_B]),
                },
              },
            },
          },
        },
      });
    });

    expect(mockGetAccountsFromSubject).toHaveBeenCalledTimes(callsAfterMount);
    expect(result.current).toBe(first);
  });

  it('updates when the subject for the hostname changes', () => {
    const { result, store } = setup(
      buildState(
        { 'app.uniswap.org': buildSubject('app.uniswap.org', [ADDRESS_A]) },
        [accountA, accountB],
      ),
      'https://app.uniswap.org',
    );
    expect(result.current).toEqual([ADDRESS_A]);
    const state = store.getState() as TestState;

    act(() => {
      store.dispatch({
        type: 'REPLACE',
        state: {
          ...state,
          engine: {
            backgroundState: {
              ...state.engine.backgroundState,
              PermissionController: {
                subjects: {
                  'app.uniswap.org': buildSubject('app.uniswap.org', [
                    ADDRESS_A,
                    ADDRESS_B,
                  ]),
                },
              },
            },
          },
        },
      });
    });

    expect(result.current).toEqual([ADDRESS_B, ADDRESS_A]);
  });

  it('re-sorts when the last selected account changes', () => {
    const { result, store } = setup(
      buildState(
        {
          'app.uniswap.org': buildSubject('app.uniswap.org', [
            ADDRESS_A,
            ADDRESS_B,
          ]),
        },
        [accountA, accountB],
      ),
      'https://app.uniswap.org',
    );
    expect(result.current).toEqual([ADDRESS_B, ADDRESS_A]);
    const state = store.getState() as TestState;

    act(() => {
      store.dispatch({
        type: 'REPLACE',
        state: {
          ...state,
          engine: {
            backgroundState: {
              ...state.engine.backgroundState,
              AccountsController: {
                internalAccounts: {
                  selectedAccount: 'a',
                  accounts: {
                    a: buildAccount('a', ADDRESS_A, 3),
                    b: accountB,
                  },
                },
              },
            },
          },
        },
      });
    });

    expect(result.current).toEqual([ADDRESS_A, ADDRESS_B]);
  });

  it('keeps the same array when account metadata changes without reordering', () => {
    const { result, store } = setup(
      buildState(
        { 'app.uniswap.org': buildSubject('app.uniswap.org', [ADDRESS_A]) },
        [accountA, accountB],
      ),
      'https://app.uniswap.org',
    );
    const first = result.current;
    const state = store.getState() as TestState;

    act(() => {
      store.dispatch({
        type: 'REPLACE',
        state: {
          ...state,
          engine: {
            backgroundState: {
              ...state.engine.backgroundState,
              AccountsController: {
                internalAccounts: {
                  selectedAccount: 'b',
                  accounts: { a: accountA, b: buildAccount('b', ADDRESS_B, 9) },
                },
              },
            },
          },
        },
      });
    });

    expect(result.current).toBe(first);
  });

  it('follows the URL ref on the next render', () => {
    const { result, urlRef, rerender } = setup(
      buildState(
        {
          'app.uniswap.org': buildSubject('app.uniswap.org', [ADDRESS_A]),
          'opensea.io': buildSubject('opensea.io', [ADDRESS_B]),
        },
        [accountA, accountB],
      ),
      'https://app.uniswap.org',
    );
    expect(result.current).toEqual([ADDRESS_A]);

    urlRef.current = 'https://opensea.io/collection/x';
    rerender({});

    expect(result.current).toEqual([ADDRESS_B]);
  });
});
