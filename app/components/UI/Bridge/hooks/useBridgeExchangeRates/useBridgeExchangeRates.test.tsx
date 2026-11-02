import React from 'react';
import { Provider } from 'react-redux';
import { AnyAction, createStore } from 'redux';
import { act, renderHook } from '@testing-library/react-native';
import { Hex } from '@metamask/utils';
import { useBridgeExchangeRates } from '.';
import { BridgeToken } from '../../types';
import useThunkDispatch from '../../../../hooks/useThunkDispatch';

jest.mock('../../../../hooks/useThunkDispatch', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const CHAIN_ID = '0x1' as Hex;
const UNLISTED_ADDRESS = '0x1111111111111111111111111111111111111111' as Hex;
const LISTED_ADDRESS = '0x2222222222222222222222222222222222222222' as Hex;
const OTHER_ADDRESS = '0x3333333333333333333333333333333333333333' as Hex;

type MarketData = Record<Hex, Record<Hex, { price?: number }>>;

const buildState = (marketData: MarketData, currentCurrency = 'usd') => ({
  engine: {
    backgroundState: {
      CurrencyRateController: { currentCurrency },
      TokenRatesController: { marketData },
    },
  },
});

const createTestStore = (marketData: MarketData) =>
  createStore(
    (state: ReturnType<typeof buildState> | undefined, action: AnyAction) =>
      action.type === 'SET_STATE' ? action.state : state,
    buildState(marketData),
  );

const buildToken = (
  address: Hex,
  overrides: Partial<BridgeToken> = {},
): BridgeToken => ({
  address,
  chainId: CHAIN_ID,
  symbol: 'TKN',
  decimals: 18,
  ...overrides,
});

describe('useBridgeExchangeRates', () => {
  const mockDispatch = jest.fn();
  const mockAction = jest.fn((arg) => ({ type: 'FETCH_RATE', arg }));

  const renderUseBridgeExchangeRates = (
    store: ReturnType<typeof createTestStore>,
    initialProps: { token?: BridgeToken; currencyOverride?: string },
  ) => {
    const renderCount = { current: 0 };
    const wrapper = ({ children }: { children: React.ReactElement }) => (
      <Provider store={store}>{children}</Provider>
    );
    const result = renderHook(
      (props: { token?: BridgeToken; currencyOverride?: string }) => {
        renderCount.current += 1;
        useBridgeExchangeRates({
          ...props,
          action: mockAction as unknown as Parameters<
            typeof useBridgeExchangeRates
          >[0]['action'],
        });
      },
      { wrapper, initialProps },
    );
    return { ...result, renderCount };
  };

  const pollRates = (
    store: ReturnType<typeof createTestStore>,
    times: number,
    extra: MarketData = {},
  ) => {
    for (let i = 0; i < times; i++) {
      act(() => {
        store.dispatch({
          type: 'SET_STATE',
          state: buildState({
            [CHAIN_ID]: {
              [OTHER_ADDRESS]: { price: Math.random() },
              ...extra[CHAIN_ID],
            },
          }),
        });
      });
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useThunkDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  it('fetches once for an unlisted token and does not refetch on unrelated rate updates', () => {
    const store = createTestStore({});
    const { renderCount } = renderUseBridgeExchangeRates(store, {
      token: buildToken(UNLISTED_ADDRESS),
    });

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(mockAction).toHaveBeenCalledWith({
      chainId: CHAIN_ID,
      tokenAddress: UNLISTED_ADDRESS,
      currency: 'usd',
    });
    const rendersAfterMount = renderCount.current;

    pollRates(store, 5);

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(renderCount.current).toBe(rendersAfterMount);
  });

  it('does not refetch when the fetch resolves without a rate', () => {
    const store = createTestStore({});
    const token = buildToken(UNLISTED_ADDRESS);
    const { rerender } = renderUseBridgeExchangeRates(store, { token });

    // pending/fulfilled replace the token object but leave the rate undefined
    rerender({ token: { ...token, currencyExchangeRate: undefined } });
    pollRates(store, 3);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when the token is in market data', () => {
    const store = createTestStore({
      [CHAIN_ID]: { [LISTED_ADDRESS]: { price: 0.5 } },
    });
    renderUseBridgeExchangeRates(store, { token: buildToken(LISTED_ADDRESS) });

    pollRates(store, 3, { [CHAIN_ID]: { [LISTED_ADDRESS]: { price: 0.5 } } });

    expect(mockAction).not.toHaveBeenCalled();
  });

  it('does not fetch when the token already has a fetched rate', () => {
    const store = createTestStore({});
    renderUseBridgeExchangeRates(store, {
      token: buildToken(UNLISTED_ADDRESS, { currencyExchangeRate: 2 }),
    });

    expect(mockAction).not.toHaveBeenCalled();
  });

  it('fetches again when the currency changes', () => {
    const store = createTestStore({});
    const token = buildToken(UNLISTED_ADDRESS);
    const { rerender } = renderUseBridgeExchangeRates(store, {
      token,
      currencyOverride: 'usd',
    });

    rerender({ token, currencyOverride: 'eur' });
    rerender({ token, currencyOverride: 'eur' });

    expect(mockAction).toHaveBeenCalledTimes(2);
    expect(mockAction).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      tokenAddress: UNLISTED_ADDRESS,
      currency: 'eur',
    });
  });

  it('fetches again when a different token is selected', () => {
    const store = createTestStore({});
    const { rerender } = renderUseBridgeExchangeRates(store, {
      token: buildToken(UNLISTED_ADDRESS),
    });

    rerender({ token: buildToken(OTHER_ADDRESS) });

    expect(mockAction).toHaveBeenCalledTimes(2);
    expect(mockAction).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      tokenAddress: OTHER_ADDRESS,
      currency: 'usd',
    });
  });

  it('fetches again if a previously available rate goes missing', () => {
    const store = createTestStore({});
    const token = buildToken(UNLISTED_ADDRESS);
    const { rerender } = renderUseBridgeExchangeRates(store, { token });
    expect(mockAction).toHaveBeenCalledTimes(1);

    rerender({ token: { ...token, currencyExchangeRate: 3 } });
    rerender({ token: { ...token, currencyExchangeRate: undefined } });

    expect(mockAction).toHaveBeenCalledTimes(2);
  });

  it('re-renders when the selected token price changes', () => {
    const store = createTestStore({
      [CHAIN_ID]: { [LISTED_ADDRESS]: { price: 0.5 } },
    });
    const { renderCount } = renderUseBridgeExchangeRates(store, {
      token: buildToken(LISTED_ADDRESS),
    });
    const rendersAfterMount = renderCount.current;

    pollRates(store, 1, { [CHAIN_ID]: { [LISTED_ADDRESS]: { price: 0.6 } } });

    expect(renderCount.current).toBe(rendersAfterMount + 1);
    expect(mockAction).not.toHaveBeenCalled();
  });

  it('does nothing without a token', () => {
    const store = createTestStore({});
    renderUseBridgeExchangeRates(store, { token: undefined });

    expect(mockAction).not.toHaveBeenCalled();
  });
});
