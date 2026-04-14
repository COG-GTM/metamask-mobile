import { pooledStakingSelectors } from './pooledStaking';

jest.mock('../../components/UI/Stake/utils/value', () => ({
  CommonPercentageInputUnits: { PERCENTAGE: 'percentage' },
  PercentageOutputFormat: { PERCENT_SIGN: 'percent_sign' },
  formatPercent: jest.fn().mockReturnValue('2.5%'),
}));

describe('EarnController Selectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        EarnController: {
          pooled_staking: {
            isEligible: true,
            vaultMetadata: { apy: 0.025, fee: 0.15 },
            pooledStakes: [{ amount: '1000000000000000000' }],
            exchangeRate: '1.05',
            vaultDailyApys: [{ apy: 2.5, date: '2025-01-01' }],
            vaultApyAverages: { oneWeek: 2.5, oneMonth: 2.4 },
          },
        },
      },
    },
  } as any;

  it('selectEligibility should return eligibility status', () => {
    const result = pooledStakingSelectors.selectEligibility(mockState);
    expect(result).toBe(true);
  });

  it('selectVaultMetadata should return vault metadata', () => {
    const result = pooledStakingSelectors.selectVaultMetadata(mockState);
    expect(result.apy).toBe(0.025);
  });

  it('selectPoolStakes should return pooled stakes', () => {
    const result = pooledStakingSelectors.selectPoolStakes(mockState);
    expect(result).toHaveLength(1);
  });

  it('selectExchangeRate should return exchange rate', () => {
    const result = pooledStakingSelectors.selectExchangeRate(mockState);
    expect(result).toBe('1.05');
  });

  it('selectVaultApyAverages should return apy averages', () => {
    const result = pooledStakingSelectors.selectVaultApyAverages(mockState);
    expect(result.oneWeek).toBe(2.5);
  });
});
