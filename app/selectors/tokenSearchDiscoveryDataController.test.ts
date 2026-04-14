import { isAssetFromSearch, selectSupportedSwapTokenAddressesByChainId, selectSupportedSwapTokenAddressesForChainId } from './tokenSearchDiscoveryDataController';

jest.mock('./currencyRateController', () => ({
  selectCurrentCurrency: (state: any) => state.engine.backgroundState.CurrencyRateController?.currentCurrency || 'usd',
}));

describe('TokenSearchDiscoveryDataController Selectors', () => {
  describe('isAssetFromSearch', () => {
    it('should return true for asset from search', () => {
      expect(isAssetFromSearch({ isFromSearch: true })).toBe(true);
    });

    it('should return false for regular asset', () => {
      expect(isAssetFromSearch({ isFromSearch: false })).toBe(false);
    });

    it('should return false for null', () => {
      expect(isAssetFromSearch(null)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isAssetFromSearch('string')).toBe(false);
    });
  });

  describe('selectSupportedSwapTokenAddressesByChainId', () => {
    it('should return swap token addresses by chain', () => {
      const state = {
        engine: {
          backgroundState: {
            TokenSearchDiscoveryDataController: {
              tokenDisplayData: [],
              swapsTokenAddressesByChainId: { '0x1': { addresses: ['0xA'] } },
            },
            CurrencyRateController: { currentCurrency: 'usd' },
          },
        },
      } as any;
      const result = selectSupportedSwapTokenAddressesByChainId(state);
      expect(result).toStrictEqual({ '0x1': { addresses: ['0xA'] } });
    });
  });

  describe('selectSupportedSwapTokenAddressesForChainId', () => {
    it('should return addresses for specific chain', () => {
      const state = {
        engine: {
          backgroundState: {
            TokenSearchDiscoveryDataController: {
              tokenDisplayData: [],
              swapsTokenAddressesByChainId: { '0x1': { addresses: ['0xA', '0xB'] } },
            },
            CurrencyRateController: { currentCurrency: 'usd' },
          },
        },
      } as any;
      const result = selectSupportedSwapTokenAddressesForChainId(state, '0x1' as any);
      expect(result).toStrictEqual(['0xA', '0xB']);
    });
  });
});
