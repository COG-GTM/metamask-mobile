import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';
import {
  MOCK_ACCOUNTS_CONTROLLER_STATE,
  MOCK_ADDRESS_1,
} from '../../../../util/test/accountsControllerTestUtils';
import usePermittedAccount from './usePermittedAccount';

const buildSubject = (accounts: string[]) => ({
  permissions: {
    [Caip25EndowmentPermissionName]: {
      caveats: [
        {
          type: Caip25CaveatType,
          value: {
            requiredScopes: {},
            optionalScopes: {
              'eip155:1': {
                accounts: accounts.map((address) => `eip155:1:${address}`),
              },
            },
            isMultichainOrigin: false,
          },
        },
      ],
    },
  },
});

const buildState = (subjects: Record<string, unknown>) => ({
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
      PermissionController: { subjects },
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  },
});

describe('usePermittedAccount', () => {
  it('returns the name and checksummed address of the permitted account', () => {
    const { result } = renderHookWithProvider(
      () => usePermittedAccount('example.com'),
      {
        state: buildState({
          'example.com': buildSubject([MOCK_ADDRESS_1.toLowerCase()]),
        }),
      },
    );

    expect(result.current).toEqual({
      name: 'Account 1',
      address: MOCK_ADDRESS_1,
    });
  });

  it('returns undefined when the hostname has no permission subject', () => {
    const { result } = renderHookWithProvider(
      () => usePermittedAccount('other.com'),
      {
        state: buildState({
          'example.com': buildSubject([MOCK_ADDRESS_1.toLowerCase()]),
        }),
      },
    );

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when the subject has no permitted accounts', () => {
    const { result } = renderHookWithProvider(
      () => usePermittedAccount('example.com'),
      { state: buildState({ 'example.com': { permissions: {} } }) },
    );

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when the permitted address is not a wallet account', () => {
    const { result } = renderHookWithProvider(
      () => usePermittedAccount('example.com'),
      {
        state: buildState({
          'example.com': buildSubject([
            '0x0000000000000000000000000000000000000abc',
          ]),
        }),
      },
    );

    expect(result.current).toBeUndefined();
  });

  it('ignores inherited object keys used as hostnames', () => {
    const { result } = renderHookWithProvider(
      () => usePermittedAccount('constructor'),
      { state: buildState({}) },
    );

    expect(result.current).toBeUndefined();
  });

  it('keeps the same result reference across re-renders', () => {
    const { result, rerender } = renderHookWithProvider(
      () => usePermittedAccount('example.com'),
      {
        state: buildState({
          'example.com': buildSubject([MOCK_ADDRESS_1.toLowerCase()]),
        }),
      },
    );
    const first = result.current;

    rerender({});

    expect(result.current).toBe(first);
  });
});
