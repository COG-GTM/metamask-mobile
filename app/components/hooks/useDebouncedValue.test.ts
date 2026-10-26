import { renderHook, act } from '@testing-library/react-hooks';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a'));
    expect(result.current).toBe('a');
  });

  it('updates the value after the default delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('b');
  });

  it('respects a custom delay and cancels pending updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 1000),
      { initialProps: { value: 1 } },
    );

    rerender({ value: 2 });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    rerender({ value: 3 });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe(1);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe(3);
  });
});
