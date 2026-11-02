import isDappConnectionExpired from './isDappConnectionExpired';

describe('isDappConnectionExpired', () => {
  it('is false for a validUntil in the future', () => {
    expect(isDappConnectionExpired(2000, 1000)).toBe(false);
  });

  it('is true for a validUntil in the past or now', () => {
    expect(isDappConnectionExpired(999, 1000)).toBe(true);
    expect(isDappConnectionExpired(1000, 1000)).toBe(true);
  });

  it('is true when validUntil is missing or not finite', () => {
    expect(isDappConnectionExpired(undefined, 1000)).toBe(true);
    expect(isDappConnectionExpired(NaN, 1000)).toBe(true);
    expect(isDappConnectionExpired(Infinity, 1000)).toBe(true);
  });
});
