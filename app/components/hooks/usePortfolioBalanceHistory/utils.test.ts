import { buildPortfolioSeries, getSeriesDiff } from './utils';

describe('buildPortfolioSeries', () => {
  it('scales a single token series so the last point matches its fiat value', () => {
    const series = buildPortfolioSeries([
      {
        prices: [
          ['1000', 1],
          ['2000', 2],
          ['3000', 4],
        ],
        tokenFiatAmount: 400,
      },
    ]);

    expect(series).toStrictEqual([
      ['1000', 100],
      ['2000', 200],
      ['3000', 400],
    ]);
  });

  it('sums series that share timestamps', () => {
    const series = buildPortfolioSeries([
      {
        prices: [
          ['1000', 1],
          ['2000', 2],
        ],
        tokenFiatAmount: 200,
      },
      {
        prices: [
          ['1000', 5],
          ['2000', 10],
        ],
        tokenFiatAmount: 50,
      },
    ]);

    expect(series).toStrictEqual([
      ['1000', 125],
      ['2000', 250],
    ]);
  });

  it('carries the last known value forward for sparser series', () => {
    const series = buildPortfolioSeries([
      {
        prices: [
          ['1000', 1],
          ['2000', 1],
          ['3000', 1],
        ],
        tokenFiatAmount: 10,
      },
      {
        prices: [
          ['1000', 1],
          ['3000', 2],
        ],
        tokenFiatAmount: 100,
      },
    ]);

    expect(series).toStrictEqual([
      ['1000', 60],
      ['2000', 60],
      ['3000', 110],
    ]);
  });

  it('ignores tokens without a usable price series or balance', () => {
    const series = buildPortfolioSeries([
      { prices: [['1000', 1]], tokenFiatAmount: 100 },
      {
        prices: [
          ['1000', 0],
          ['2000', 0],
        ],
        tokenFiatAmount: 100,
      },
      {
        prices: [
          ['1000', 1],
          ['2000', 2],
        ],
        tokenFiatAmount: 0,
      },
      {
        prices: [
          ['1000', 1],
          ['2000', 2],
        ],
        tokenFiatAmount: 20,
      },
    ]);

    expect(series).toStrictEqual([
      ['1000', 10],
      ['2000', 20],
    ]);
  });

  it('sorts unordered price points', () => {
    const series = buildPortfolioSeries([
      {
        prices: [
          ['3000', 4],
          ['1000', 1],
          ['2000', 2],
        ],
        tokenFiatAmount: 400,
      },
    ]);

    expect(series.map(([timestamp]) => timestamp)).toStrictEqual([
      '1000',
      '2000',
      '3000',
    ]);
  });

  it('returns an empty series when there is nothing to aggregate', () => {
    expect(buildPortfolioSeries([])).toStrictEqual([]);
  });
});

describe('getSeriesDiff', () => {
  it('returns the change between the first and last value', () => {
    expect(
      getSeriesDiff([
        ['1000', 10],
        ['2000', 25],
      ]),
    ).toBe(15);
  });

  it('returns zero for a series that cannot show change', () => {
    expect(getSeriesDiff([['1000', 10]])).toBe(0);
  });
});
