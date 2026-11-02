import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { InternalAccount } from '@metamask/keyring-internal-api';
import Engine from '../../../core/Engine';
import { RootState } from '../../../reducers';
import { backgroundState } from '../../../util/test/initial-root-state';
import {
  MOCK_ADDRESS_1,
  MOCK_ADDRESS_2,
  createMockInternalAccount,
} from '../../../util/test/accountsControllerTestUtils';
import {
  selectActiveConnectedDapp,
  selectActiveTabHostname,
} from './selectActiveConnectedDapp';

const mockListAccounts = Engine.context.AccountsController
  .listAccounts as jest.Mock;

const ADDRESS_1 = MOCK_ADDRESS_1.toLowerCase();
const ADDRESS_2 = MOCK_ADDRESS_2.toLowerCase();

const withLastSelected = (
  address: string,
  name: string,
  lastSelected: number,
): InternalAccount => {
  const account = createMockInternalAccount(address, name);
  return { ...account, metadata: { ...account.metadata, lastSelected } };
};

const buildAccountsControllerState = (
  lastSelected1: number,
  lastSelected2: number,
) => {
  const account1 = withLastSelected(ADDRESS_1, 'Account 1', lastSelected1);
  const account2 = withLastSelected(ADDRESS_2, 'Account 2', lastSelected2);
  return {
    internalAccounts: {
      accounts: { [account1.id]: account1, [account2.id]: account2 },
      selectedAccount: account1.id,
    },
  };
};

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
            isMultichainOrigin: false,
            sessionProperties: {},
          },
        },
      ],
    },
  },
});

interface StateOptions {
  activeTabUrl?: string;
  subjects?: Record<string, unknown>;
  accountsControllerState?: ReturnType<typeof buildAccountsControllerState>;
  extra?: Record<string, unknown>;
}

const buildState = ({
  activeTabUrl,
  subjects = {},
  accountsControllerState = buildAccountsControllerState(1, 2),
  extra = {},
}: StateOptions) =>
  ({
    browser: {
      tabs: activeTabUrl ? [{ id: 1, url: activeTabUrl }] : [],
      activeTab: activeTabUrl ? 1 : null,
    },
    engine: {
      backgroundState: {
        ...backgroundState,
        AccountsController: accountsControllerState,
        PermissionController: { subjects },
      },
    },
    ...extra,
  } as unknown as RootState);

const syncListAccounts = (state: RootState) =>
  mockListAccounts.mockImplementation(() =>
    Object.values(
      state.engine.backgroundState.AccountsController.internalAccounts.accounts,
    ),
  );

describe('selectActiveConnectedDapp', () => {
  // Fresh subject objects per test so memoized results never leak between tests.
  const buildSubjects = () => ({
    'dapp.example': buildSubject('dapp.example', [ADDRESS_1, ADDRESS_2]),
    'other.example': buildSubject('other.example', [ADDRESS_1]),
    'third.example': buildSubject('third.example', [ADDRESS_2]),
  });
  let subjects: ReturnType<typeof buildSubjects>;

  beforeEach(() => {
    mockListAccounts.mockReset();
    subjects = buildSubjects();
  });

  it('returns an empty array when no browser tab is active', () => {
    const state = buildState({ subjects });
    expect(selectActiveConnectedDapp(state)).toEqual([]);
    expect(mockListAccounts).not.toHaveBeenCalled();
  });

  it('returns an empty array when the active tab URL is not a URL', () => {
    const state = buildState({ activeTabUrl: 'not a url', subjects });
    expect(selectActiveTabHostname(state)).toBeUndefined();
    expect(selectActiveConnectedDapp(state)).toEqual([]);
    expect(mockListAccounts).not.toHaveBeenCalled();
  });

  it('returns an empty array when the active hostname is not connected', () => {
    const state = buildState({
      activeTabUrl: 'https://unknown.example/page',
      subjects,
    });
    expect(selectActiveConnectedDapp(state)).toEqual([]);
    expect(mockListAccounts).not.toHaveBeenCalled();
  });

  it('ignores prototype keys used as hostnames', () => {
    const state = buildState({
      activeTabUrl: 'https://constructor/',
      subjects,
    });
    expect(selectActiveConnectedDapp(state)).toEqual([]);
  });

  it('returns accounts of the active hostname only, sorted by last selected', () => {
    const state = buildState({
      activeTabUrl: 'https://dapp.example/swap?x=1',
      subjects,
    });
    syncListAccounts(state);

    expect(selectActiveConnectedDapp(state)).toEqual([ADDRESS_2, ADDRESS_1]);
    // Only the active subject is resolved, not the other connected dapps.
    expect(mockListAccounts).toHaveBeenCalledTimes(1);
  });

  it('does not recompute on unrelated state updates', () => {
    const state = buildState({
      activeTabUrl: 'https://dapp.example/',
      subjects,
    });
    syncListAccounts(state);
    const first = selectActiveConnectedDapp(state);

    for (let i = 0; i < 50; i++) {
      const next = buildState({
        activeTabUrl: `https://dapp.example/path/${i}`,
        subjects,
        accountsControllerState: state.engine.backgroundState
          .AccountsController as ReturnType<
          typeof buildAccountsControllerState
        >,
        extra: { settings: { tick: i } },
      });
      expect(selectActiveConnectedDapp(next)).toBe(first);
    }
    expect(mockListAccounts).toHaveBeenCalledTimes(1);
  });

  it('recomputes when the active tab moves to another connected hostname', () => {
    const state = buildState({
      activeTabUrl: 'https://dapp.example/',
      subjects,
    });
    syncListAccounts(state);
    expect(selectActiveConnectedDapp(state)).toEqual([ADDRESS_2, ADDRESS_1]);

    const next = buildState({
      activeTabUrl: 'https://other.example/',
      subjects,
    });
    syncListAccounts(next);
    expect(selectActiveConnectedDapp(next)).toEqual([ADDRESS_1]);
  });

  it('recomputes when the active subject permissions change', () => {
    const state = buildState({
      activeTabUrl: 'https://dapp.example/',
      subjects,
    });
    syncListAccounts(state);
    expect(selectActiveConnectedDapp(state)).toEqual([ADDRESS_2, ADDRESS_1]);

    const next = buildState({
      activeTabUrl: 'https://dapp.example/',
      subjects: {
        ...subjects,
        'dapp.example': buildSubject('dapp.example', [ADDRESS_1]),
      },
    });
    syncListAccounts(next);
    expect(selectActiveConnectedDapp(next)).toEqual([ADDRESS_1]);
  });

  it('re-sorts when the last selected account changes', () => {
    const state = buildState({
      activeTabUrl: 'https://dapp.example/',
      subjects,
      accountsControllerState: buildAccountsControllerState(1, 2),
    });
    syncListAccounts(state);
    expect(selectActiveConnectedDapp(state)).toEqual([ADDRESS_2, ADDRESS_1]);

    const next = buildState({
      activeTabUrl: 'https://dapp.example/',
      subjects,
      accountsControllerState: buildAccountsControllerState(3, 2),
    });
    syncListAccounts(next);
    expect(selectActiveConnectedDapp(next)).toEqual([ADDRESS_1, ADDRESS_2]);
  });
});
