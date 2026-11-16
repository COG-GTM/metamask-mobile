import { Hex } from '@metamask/utils';
import { TokenSearchDiscoveryDataControllerState } from '@metamask/assets-controllers';
import { RootState } from '../reducers';
import {
  isAssetFromSearch,
  selectSupportedSwapTokenAddressesByChainId,
  selectSupportedSwapTokenAddressesForChainId,
  selectTokenDisplayData,
} from './tokenSearchDiscoveryDataController';

const CHAIN_ID: Hex = '0x1';
const OTHER_CHAIN_ID: Hex = '0x89';
const TOKEN_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

const createFoundTokenDisplayData = (
  overrides: Partial<{ chainId: Hex; address: string; currency: string }> = {},
) => ({
  found: true as const,
  chainId: CHAIN_ID,
  address: TOKEN_ADDRESS,
  currency: 'usd',
  token: {
    address: TOKEN_ADDRESS,
    decimals: 18,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
  },
  price: null,
  ...overrides,
});

const createMockState = ({
  dataControllerState,
  currentCurrency = 'usd',
}: {
  dataControllerState?: Partial<TokenSearchDiscoveryDataControllerState>;
  currentCurrency?: string;
} = {}) =>
  ({
    engine: {
      backgroundState: {
        CurrencyRateController: {
          currentCurrency,
        },
        TokenSearchDiscoveryDataController: dataControllerState,
      },
    },
  } as unknown as RootState);

describe('isAssetFromSearch', () => {
  it('returns false for null', () => {
    expect(isAssetFromSearch(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAssetFromSearch(undefined)).toBe(false);
  });

  it.each(['isFromSearch', 1, true])(
    'returns false for non-object value %p',
    (value) => {
      expect(isAssetFromSearch(value)).toBe(false);
    },
  );

  it('returns false when the isFromSearch flag is missing', () => {
    expect(isAssetFromSearch({ address: TOKEN_ADDRESS })).toBe(false);
  });

  it('returns false when the isFromSearch flag is false', () => {
    expect(isAssetFromSearch({ isFromSearch: false })).toBe(false);
  });

  it('returns false when the isFromSearch flag is truthy but not true', () => {
    expect(isAssetFromSearch({ isFromSearch: 'true' })).toBe(false);
  });

  it('returns true when the isFromSearch flag is true', () => {
    expect(isAssetFromSearch({ isFromSearch: true })).toBe(true);
  });
});

describe('selectTokenDisplayData', () => {
  it('returns the entry matching chainId, address and current currency', () => {
    const usdEntry = createFoundTokenDisplayData({ currency: 'usd' });
    const eurEntry = createFoundTokenDisplayData({ currency: 'eur' });
    const state = createMockState({
      dataControllerState: { tokenDisplayData: [eurEntry, usdEntry] },
      currentCurrency: 'usd',
    });

    expect(selectTokenDisplayData(state, CHAIN_ID, TOKEN_ADDRESS)).toBe(
      usdEntry,
    );
  });

  it('returns undefined when only a different currency is cached', () => {
    const state = createMockState({
      dataControllerState: {
        tokenDisplayData: [createFoundTokenDisplayData({ currency: 'eur' })],
      },
      currentCurrency: 'usd',
    });

    expect(
      selectTokenDisplayData(state, CHAIN_ID, TOKEN_ADDRESS),
    ).toBeUndefined();
  });

  it('returns undefined when only a different chain is cached', () => {
    const state = createMockState({
      dataControllerState: {
        tokenDisplayData: [
          createFoundTokenDisplayData({ chainId: OTHER_CHAIN_ID }),
        ],
      },
    });

    expect(
      selectTokenDisplayData(state, CHAIN_ID, TOKEN_ADDRESS),
    ).toBeUndefined();
  });

  it('returns undefined when the address does not match', () => {
    const state = createMockState({
      dataControllerState: {
        tokenDisplayData: [createFoundTokenDisplayData()],
      },
    });

    expect(
      selectTokenDisplayData(
        state,
        CHAIN_ID,
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      ),
    ).toBeUndefined();
  });

  it.each([
    ['lowercase', TOKEN_ADDRESS.toLowerCase()],
    ['uppercase', `0x${TOKEN_ADDRESS.slice(2).toUpperCase()}`],
  ])(
    'matches the address case-insensitively when queried in %s',
    (_label, queriedAddress) => {
      const entry = createFoundTokenDisplayData();
      const state = createMockState({
        dataControllerState: { tokenDisplayData: [entry] },
      });

      expect(selectTokenDisplayData(state, CHAIN_ID, queriedAddress)).toBe(
        entry,
      );
    },
  );

  it('matches the not-found entry for the queried token', () => {
    const notFoundEntry = {
      found: false as const,
      chainId: CHAIN_ID,
      address: TOKEN_ADDRESS,
      currency: 'usd',
    };
    const state = createMockState({
      dataControllerState: { tokenDisplayData: [notFoundEntry] },
    });

    expect(selectTokenDisplayData(state, CHAIN_ID, TOKEN_ADDRESS)).toBe(
      notFoundEntry,
    );
  });

  it('returns undefined when the controller state is absent', () => {
    const state = createMockState();

    expect(
      selectTokenDisplayData(state, CHAIN_ID, TOKEN_ADDRESS),
    ).toBeUndefined();
  });

  it('returns undefined when tokenDisplayData is absent', () => {
    const state = createMockState({ dataControllerState: {} });

    expect(
      selectTokenDisplayData(state, CHAIN_ID, TOKEN_ADDRESS),
    ).toBeUndefined();
  });
});

describe('selectSupportedSwapTokenAddressesByChainId', () => {
  it('returns the swaps token address map', () => {
    const swapsTokenAddressesByChainId = {
      [CHAIN_ID]: {
        lastFetched: 1,
        addresses: [TOKEN_ADDRESS],
        isFetching: false,
      },
    };
    const state = createMockState({
      dataControllerState: { swapsTokenAddressesByChainId },
    });

    expect(selectSupportedSwapTokenAddressesByChainId(state)).toStrictEqual(
      swapsTokenAddressesByChainId,
    );
  });

  it('returns undefined when the controller state is absent', () => {
    expect(
      selectSupportedSwapTokenAddressesByChainId(createMockState()),
    ).toBeUndefined();
  });
});

describe('selectSupportedSwapTokenAddressesForChainId', () => {
  const swapsTokenAddressesByChainId = {
    [CHAIN_ID]: {
      lastFetched: 1,
      addresses: [TOKEN_ADDRESS],
      isFetching: false,
    },
  };

  it('returns the addresses for a known chain', () => {
    const state = createMockState({
      dataControllerState: { swapsTokenAddressesByChainId },
    });

    expect(
      selectSupportedSwapTokenAddressesForChainId(state, CHAIN_ID),
    ).toStrictEqual([TOKEN_ADDRESS]);
  });

  it('returns undefined for an unknown chain', () => {
    const state = createMockState({
      dataControllerState: { swapsTokenAddressesByChainId },
    });

    expect(
      selectSupportedSwapTokenAddressesForChainId(state, OTHER_CHAIN_ID),
    ).toBeUndefined();
  });

  it('returns undefined without throwing when the map is absent', () => {
    const state = createMockState({ dataControllerState: {} });

    expect(() =>
      selectSupportedSwapTokenAddressesForChainId(state, CHAIN_ID),
    ).not.toThrow();
    expect(
      selectSupportedSwapTokenAddressesForChainId(state, CHAIN_ID),
    ).toBeUndefined();
  });

  it('returns undefined when the controller state is absent', () => {
    expect(
      selectSupportedSwapTokenAddressesForChainId(createMockState(), CHAIN_ID),
    ).toBeUndefined();
  });
});
