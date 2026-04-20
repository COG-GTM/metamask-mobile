import {
  getShouldShowAggregatedPercentage,
  getAggregatedBalance,
} from './utils';
import Engine from '../../../core/Engine';
import { isTestNet } from '../../../util/networks';

jest.mock('../../../core/Engine', () => ({
  __esModule: true,
  default: {
    getTotalEvmFiatAccountBalance: jest.fn(),
  },
}));

jest.mock('../../../util/networks', () => ({
  ...jest.requireActual('../../../util/networks'),
  isTestNet: jest.fn(),
  isPortfolioViewEnabled: jest.fn(() => false),
}));

describe('useMultichainBalances utils', () => {
  beforeEach(() => {
    (Engine.getTotalEvmFiatAccountBalance as jest.Mock).mockReset();
    (isTestNet as jest.Mock).mockReset();
  });

  describe('getShouldShowAggregatedPercentage', () => {
    it('returns false for testnets', () => {
      (isTestNet as jest.Mock).mockReturnValue(true);
      expect(
        getShouldShowAggregatedPercentage(
          'eip155:1' as Parameters<typeof getShouldShowAggregatedPercentage>[0],
        ),
      ).toBe(false);
    });

    it('returns true for mainnets', () => {
      (isTestNet as jest.Mock).mockReturnValue(false);
      expect(
        getShouldShowAggregatedPercentage(
          'eip155:1' as Parameters<typeof getShouldShowAggregatedPercentage>[0],
        ),
      ).toBe(true);
    });
  });

  describe('getAggregatedBalance', () => {
    it('defaults missing balance fields to zero', () => {
      (Engine.getTotalEvmFiatAccountBalance as jest.Mock).mockReturnValue(
        undefined,
      );
      expect(
        getAggregatedBalance(
          {} as Parameters<typeof getAggregatedBalance>[0],
        ),
      ).toEqual({
        ethFiat: 0,
        tokenFiat: 0,
        tokenFiat1dAgo: 0,
        ethFiat1dAgo: 0,
      });
    });

    it('passes through the balance values from Engine', () => {
      (Engine.getTotalEvmFiatAccountBalance as jest.Mock).mockReturnValue({
        ethFiat: 1,
        tokenFiat: 2,
        tokenFiat1dAgo: 3,
        ethFiat1dAgo: 4,
      });
      expect(
        getAggregatedBalance(
          {} as Parameters<typeof getAggregatedBalance>[0],
        ),
      ).toEqual({
        ethFiat: 1,
        tokenFiat: 2,
        tokenFiat1dAgo: 3,
        ethFiat1dAgo: 4,
      });
    });
  });
});
