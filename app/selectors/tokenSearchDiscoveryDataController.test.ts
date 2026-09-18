import { merge } from 'lodash';
import { RootState } from '../reducers';
import initialRootState from '../util/test/initial-root-state';
import {
  isAssetFromSearch,
  selectTokenDisplayData,
  selectSupportedSwapTokenAddressesByChainId,
  selectSupportedSwapTokenAddressesForChainId,
} from './tokenSearchDiscoveryDataController';

const usdDisplayData = {
  chainId: '0x1',
  address: '0xa',
  currency: 'usd',
  found: true,
};
const eurDisplayData = { ...usdDisplayData, currency: 'eur' };

const state: RootState = merge({}, initialRootState, {
  engine: {
    backgroundState: {
      TokenSearchDiscoveryDataController: {
        tokenDisplayData: [eurDisplayData, usdDisplayData],
        swapsTokenAddressesByChainId: {
          '0x1': { addresses: ['0xa', '0xb'], isFetching: false },
        },
      },
    },
  },
});

describe('isAssetFromSearch', () => {
  it('returns true only for objects with isFromSearch === true', () => {
    expect(isAssetFromSearch({ isFromSearch: true })).toBe(true);
    expect(isAssetFromSearch({ isFromSearch: false })).toBe(false);
    expect(isAssetFromSearch({ isFromSearch: 'true' })).toBe(false);
    expect(isAssetFromSearch({})).toBe(false);
    expect(isAssetFromSearch(null)).toBe(false);
    expect(isAssetFromSearch(undefined)).toBe(false);
    expect(isAssetFromSearch('string')).toBe(false);
  });
});

describe('tokenSearchDiscoveryDataController selectors', () => {
  it('selectTokenDisplayData finds data matching chain, address and currency', () => {
    expect(selectTokenDisplayData(state, '0x1', '0xa')).toEqual(usdDisplayData);
  });

  it('selectTokenDisplayData returns undefined when nothing matches', () => {
    expect(selectTokenDisplayData(state, '0x1', '0xzz')).toBeUndefined();
    expect(selectTokenDisplayData(state, '0x89', '0xa')).toBeUndefined();
  });

  it('selectSupportedSwapTokenAddressesByChainId returns the full map', () => {
    expect(selectSupportedSwapTokenAddressesByChainId(state)).toEqual({
      '0x1': { addresses: ['0xa', '0xb'], isFetching: false },
    });
  });

  it('selectSupportedSwapTokenAddressesForChainId returns addresses for a chain', () => {
    expect(selectSupportedSwapTokenAddressesForChainId(state, '0x1')).toEqual([
      '0xa',
      '0xb',
    ]);
    expect(
      selectSupportedSwapTokenAddressesForChainId(state, '0x89'),
    ).toBeUndefined();
  });
});
