import React from 'react';
import { Provider } from 'react-redux';
import { AnyAction, createStore } from 'redux';
import { act, renderHook } from '@testing-library/react-hooks';
import { Hex } from '@metamask/utils';
import { useAccountNativeBalance } from './useAccountNativeBalance';

type AccountsByChainId = Record<Hex, Record<string, { balance: string }>>;

const MOCK_CHAIN_ID = '0x1' as Hex;
const MOCK_OTHER_CHAIN_ID = '0x89' as Hex;
const MOCK_ADDRESS = '0xAbCdEf0123456789aBcDeF0123456789AbCdEf01';
const MOCK_OTHER_ADDRESS = '0x1111111111111111111111111111111111111111';
const MOCK_BALANCE = '0xff';

const buildState = (accountsByChainId?: AccountsByChainId) => ({
  engine: {
    backgroundState: {
      AccountTrackerController: { accountsByChainId },
    },
  },
});

type TestState = ReturnType<typeof buildState>;

const SET_ACCOUNTS = 'SET_ACCOUNTS';

const createTestStore = (accountsByChainId?: AccountsByChainId) => {
  const reducer = (state: TestState | undefined, action: AnyAction) =>
    action.type === SET_ACCOUNTS
      ? buildState(action.accountsByChainId)
      : (state as TestState);
  return createStore(reducer, buildState(accountsByChainId));
};

const renderWithStore = (
  store: ReturnType<typeof createTestStore>,
  chainId: Hex,
  address: string,
) => {
  let renderCount = 0;
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const hook = renderHook(
    () => {
      renderCount++;
      return useAccountNativeBalance(chainId, address);
    },
    { wrapper },
  );
  return { ...hook, getRenderCount: () => renderCount };
};

describe('useAccountNativeBalance', () => {
  const baseAccounts: AccountsByChainId = {
    [MOCK_CHAIN_ID]: {
      [MOCK_ADDRESS]: { balance: MOCK_BALANCE },
      [MOCK_OTHER_ADDRESS]: { balance: '0x1' },
    },
    [MOCK_OTHER_CHAIN_ID]: {
      [MOCK_ADDRESS]: { balance: '0x2' },
    },
  };

  it('returns correct balance for valid chainId and address', () => {
    const { result } = renderWithStore(
      createTestStore(baseAccounts),
      MOCK_CHAIN_ID,
      MOCK_ADDRESS,
    );

    expect(result.current).toEqual({ balanceWeiInHex: MOCK_BALANCE });
  });

  it('handles case-insensitive address matching', () => {
    const store = createTestStore(baseAccounts);

    expect(
      renderWithStore(store, MOCK_CHAIN_ID, MOCK_ADDRESS.toLowerCase()).result
        .current,
    ).toEqual({ balanceWeiInHex: MOCK_BALANCE });
    expect(
      renderWithStore(store, MOCK_CHAIN_ID, MOCK_ADDRESS.toUpperCase()).result
        .current,
    ).toEqual({ balanceWeiInHex: MOCK_BALANCE });
  });

  it('reads the balance from the requested chain only', () => {
    const { result } = renderWithStore(
      createTestStore(baseAccounts),
      MOCK_OTHER_CHAIN_ID,
      MOCK_ADDRESS,
    );

    expect(result.current).toEqual({ balanceWeiInHex: '0x2' });
  });

  it('returns 0x0 balance when chainId is undefined', () => {
    const { result } = renderWithStore(
      createTestStore(baseAccounts),
      undefined as unknown as Hex,
      MOCK_ADDRESS,
    );

    expect(result.current).toEqual({ balanceWeiInHex: '0x0' });
  });

  it('returns 0x0 balance when address is undefined', () => {
    const { result } = renderWithStore(
      createTestStore(baseAccounts),
      MOCK_CHAIN_ID,
      undefined as unknown as string,
    );

    expect(result.current).toEqual({ balanceWeiInHex: '0x0' });
  });

  it('returns 0x0 balance when accountsByChainId is undefined', () => {
    const { result } = renderWithStore(
      createTestStore(undefined),
      MOCK_CHAIN_ID,
      MOCK_ADDRESS,
    );

    expect(result.current).toEqual({ balanceWeiInHex: '0x0' });
  });

  it('returns 0x0 balance when chain not found', () => {
    const { result } = renderWithStore(
      createTestStore(baseAccounts),
      '0x2' as Hex,
      MOCK_ADDRESS,
    );

    expect(result.current).toEqual({ balanceWeiInHex: '0x0' });
  });

  it('returns 0x0 balance when address not found for chain', () => {
    const { result } = renderWithStore(
      createTestStore(baseAccounts),
      MOCK_CHAIN_ID,
      '0x987654321',
    );

    expect(result.current).toEqual({ balanceWeiInHex: '0x0' });
  });

  it('does not re-render when unrelated balances change', () => {
    const store = createTestStore(baseAccounts);
    const { result, getRenderCount } = renderWithStore(
      store,
      MOCK_CHAIN_ID,
      MOCK_ADDRESS,
    );
    const initialRenderCount = getRenderCount();

    act(() => {
      store.dispatch({
        type: SET_ACCOUNTS,
        accountsByChainId: {
          [MOCK_CHAIN_ID]: {
            [MOCK_ADDRESS]: { balance: MOCK_BALANCE },
            [MOCK_OTHER_ADDRESS]: { balance: '0x999' },
          },
          [MOCK_OTHER_CHAIN_ID]: {
            [MOCK_ADDRESS]: { balance: '0x888' },
          },
        },
      });
    });

    expect(getRenderCount()).toBe(initialRenderCount);
    expect(result.current).toEqual({ balanceWeiInHex: MOCK_BALANCE });
  });

  it('re-renders with the new value when the selected balance changes', () => {
    const store = createTestStore(baseAccounts);
    const { result } = renderWithStore(store, MOCK_CHAIN_ID, MOCK_ADDRESS);

    act(() => {
      store.dispatch({
        type: SET_ACCOUNTS,
        accountsByChainId: {
          ...baseAccounts,
          [MOCK_CHAIN_ID]: {
            ...baseAccounts[MOCK_CHAIN_ID],
            [MOCK_ADDRESS]: { balance: '0x100' },
          },
        },
      });
    });

    expect(result.current).toEqual({ balanceWeiInHex: '0x100' });
  });
});
