import { renderHook } from '@testing-library/react-hooks';
import useCurrency from './useCurrency';
import { CURRENCIES } from './constants';

describe('useCurrency', () => {
  it('returns the default currency when currency is falsy', () => {
    const { result } = renderHook(() => useCurrency(undefined, 0));
    expect(result.current.symbol).toBe(CURRENCIES.default.symbol);
    expect(result.current.decimalSeparator).toBe(
      CURRENCIES.default.decimalSeparator,
    );
    expect(typeof result.current.handler).toBe('function');
  });

  it('returns a known currency from CURRENCIES by exact key', () => {
    const firstKey = Object.keys(CURRENCIES).find(
      (key) => key !== 'default',
    ) as string;
    expect(firstKey).toBeDefined();
    const { result } = renderHook(() => useCurrency(firstKey, 0));
    expect(result.current).toEqual({
      symbol: CURRENCIES[firstKey].symbol,
      handler: CURRENCIES[firstKey].handler,
      decimalSeparator: CURRENCIES[firstKey].decimalSeparator,
    });
  });

  it('uppercases the currency key when looking up CURRENCIES', () => {
    const firstKey = Object.keys(CURRENCIES).find(
      (key) => key !== 'default' && key === key.toUpperCase(),
    );
    if (!firstKey) return;
    const { result } = renderHook(() =>
      useCurrency(firstKey.toLowerCase(), 0),
    );
    expect(result.current.symbol).toBe(CURRENCIES[firstKey].symbol);
  });

  it('falls back to a dynamic rule when currency is unknown but decimals > 0', () => {
    const { result } = renderHook(() => useCurrency('zzz', 4));
    expect(result.current.symbol).toBeNull();
    expect(result.current.decimalSeparator).toBe('.');
    expect(typeof result.current.handler).toBe('function');
  });

  it('falls back to the default currency when decimals <= 0 and currency unknown', () => {
    const { result } = renderHook(() => useCurrency('zzz', 0));
    expect(result.current.symbol).toBe(CURRENCIES.default.symbol);
  });
});
