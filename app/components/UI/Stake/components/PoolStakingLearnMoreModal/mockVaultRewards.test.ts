import {
  MOCK_VAULT_DAILY_APYS,
  MOCK_VAULT_APYS_ONE_WEEK,
  MOCK_VAULT_APYS_ONE_MONTH,
  MOCK_VAULT_APYS_SIX_MONTHS,
  MOCK_VAULT_APYS_ONE_YEAR,
  MOCK_VAULT_APY_AVERAGES,
} from './mockVaultRewards';

describe('MOCK_VAULT_DAILY_APYS', () => {
  it('is a non-empty array of daily APY records', () => {
    expect(Array.isArray(MOCK_VAULT_DAILY_APYS)).toBe(true);
    expect(MOCK_VAULT_DAILY_APYS.length).toBeGreaterThan(0);
  });

  it('exposes records with the expected shape', () => {
    const sample = MOCK_VAULT_DAILY_APYS[0];
    expect(sample).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        chain_id: expect.any(Number),
        vault_address: expect.any(String),
        timestamp: expect.any(String),
        daily_apy: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      }),
    );
  });

  it('has parseable daily_apy values for every entry', () => {
    MOCK_VAULT_DAILY_APYS.forEach((entry) => {
      expect(Number.isNaN(Number(entry.daily_apy))).toBe(false);
    });
  });
});

describe('MOCK_VAULT_APYS_ONE_WEEK', () => {
  it('returns the trailing 7 entries', () => {
    expect(MOCK_VAULT_APYS_ONE_WEEK.length).toBe(7);
    expect(MOCK_VAULT_APYS_ONE_WEEK).toEqual(MOCK_VAULT_DAILY_APYS.slice(-7));
  });
});

describe('MOCK_VAULT_APYS_ONE_MONTH', () => {
  it('returns the trailing 30 entries', () => {
    expect(MOCK_VAULT_APYS_ONE_MONTH.length).toBe(30);
    expect(MOCK_VAULT_APYS_ONE_MONTH).toEqual(MOCK_VAULT_DAILY_APYS.slice(-30));
  });
});

describe('MOCK_VAULT_APYS_SIX_MONTHS', () => {
  it('returns up to 90 trailing entries', () => {
    expect(MOCK_VAULT_APYS_SIX_MONTHS.length).toBeLessThanOrEqual(90);
    expect(MOCK_VAULT_APYS_SIX_MONTHS).toEqual(
      MOCK_VAULT_DAILY_APYS.slice(-90),
    );
  });
});

describe('MOCK_VAULT_APYS_ONE_YEAR', () => {
  it('returns up to 365 trailing entries', () => {
    expect(MOCK_VAULT_APYS_ONE_YEAR.length).toBeLessThanOrEqual(365);
    expect(MOCK_VAULT_APYS_ONE_YEAR).toEqual(
      MOCK_VAULT_DAILY_APYS.slice(-365),
    );
  });
});

describe('MOCK_VAULT_APY_AVERAGES', () => {
  it('exposes averages for every supported timeframe', () => {
    expect(MOCK_VAULT_APY_AVERAGES).toEqual({
      oneDay: expect.any(String),
      oneWeek: expect.any(String),
      oneMonth: expect.any(String),
      threeMonths: expect.any(String),
      sixMonths: expect.any(String),
      oneYear: expect.any(String),
    });
  });
});
