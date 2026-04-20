import { distributeDataPoints, placeholderData } from './utils';
import { TokenPrice } from '../../../hooks/useTokenHistoricalPrices';

const makePoints = (count: number): TokenPrice[] =>
  Array.from({ length: count }, (_, i) => [String(i), i] as TokenPrice);

describe('distributeDataPoints', () => {
  it('returns the input unchanged when the series is small', () => {
    const points = makePoints(5);
    expect(distributeDataPoints(points)).toEqual(points);
  });

  it('always starts with the first data point', () => {
    const points = makePoints(500);
    expect(distributeDataPoints(points)[0]).toEqual(points[0]);
  });

  it('samples down to at most 100 data points for large inputs', () => {
    const points = makePoints(1000);
    const result = distributeDataPoints(points);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.length).toBeGreaterThan(0);
  });

  it('pads to exactly 100 points by duplicating the second-to-last value when sampling lands on 99', () => {
    const points = makePoints(99);
    const result = distributeDataPoints(points);
    expect(result.length).toBe(100);
    // pad branch duplicates points[n-2] after points[n-1]
    expect(result[result.length - 1]).toEqual(points[points.length - 2]);
  });
});

describe('placeholderData', () => {
  it('is a non-empty numeric array used as chart placeholder', () => {
    expect(Array.isArray(placeholderData)).toBe(true);
    expect(placeholderData.length).toBeGreaterThan(0);
    placeholderData.forEach((value) => {
      expect(typeof value).toBe('number');
    });
  });
});
