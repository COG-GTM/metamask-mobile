import {
  isAssetFromSearch,
  selectSupportedSwapTokenAddressesByChainId,
  selectSupportedSwapTokenAddressesForChainId,
  selectTokenDisplayData,
} from './tokenSearchDiscoveryDataController';
import type { RootState } from '../reducers';
import type { Hex } from '@metamask/utils';

const makeState = (overrides: Record<string, unknown> = {}) =>
  ({
    engine: {
      backgroundState: {
        CurrencyRateController: { currentCurrency: 'usd' },
        TokenSearchDiscoveryDataController: {
          tokenDisplayData: [],
          swapsTokenAddressesByChainId: {},
          ...overrides,
        },
      },
    },
  } as unknown as RootState);

describe('isAssetFromSearch', () => {
  it('returns true when asset has isFromSearch === true', () => {
    expect(isAssetFromSearch({ isFromSearch: true })).toBe(true);
  });

  it('returns false for falsy or missing isFromSearch', () => {
    expect(isAssetFromSearch({ isFromSearch: false })).toBe(false);
    expect(isAssetFromSearch({})).toBe(false);
    expect(isAssetFromSearch(null)).toBe(false);
    expect(isAssetFromSearch(undefined)).toBe(false);
    expect(isAssetFromSearch('string')).toBe(false);
  });
});

describe('tokenSearchDiscoveryDataController selectors', () => {
  const chainId = '0x1' as Hex;
  const address = '0xabc';

  const displayData = {
    chainId,
    address,
    currency: 'usd',
    price: '1',
  };

  it('selectTokenDisplayData finds the matching display entry', () => {
    const state = makeState({ tokenDisplayData: [displayData] });
    expect(selectTokenDisplayData(state, chainId, address)).toEqual(
      displayData,
    );
  });

  it('selectTokenDisplayData returns undefined when nothing matches', () => {
    expect(
      selectTokenDisplayData(makeState(), chainId, address),
    ).toBeUndefined();
  });

  it('selectSupportedSwapTokenAddressesByChainId returns the full map', () => {
    const map = { [chainId]: { addresses: ['0x1'] } };
    expect(
      selectSupportedSwapTokenAddressesByChainId(
        makeState({ swapsTokenAddressesByChainId: map }),
      ),
    ).toEqual(map);
  });

  it('selectSupportedSwapTokenAddressesForChainId returns addresses for a chain', () => {
    const state = makeState({
      swapsTokenAddressesByChainId: {
        [chainId]: { addresses: ['0xaaa', '0xbbb'] },
      },
    });
    expect(
      selectSupportedSwapTokenAddressesForChainId(state, chainId),
    ).toEqual(['0xaaa', '0xbbb']);
  });
});
