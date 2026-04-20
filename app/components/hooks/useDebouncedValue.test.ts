import { act, renderHook } from '@testing-library/react-hooks';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 100));
    expect(result.current).toBe('initial');
  });

  it('updates only after the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebouncedValue(value, delay),
      { initialProps: { value: 'a', delay: 300 } },
    );
    expect(result.current).toBe('a');

    rerender({ value: 'b', delay: 300 });
    // Still the old value before the delay completes.
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('b');
  });

  it('uses a 300ms default delay', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value),
      { initialProps: { value: 'x' } },
    );
    rerender({ value: 'y' });
    expect(result.current).toBe('x');
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('y');
  });
});
