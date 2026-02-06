import { renderHook, act } from '@testing-library/react-hooks';
import { useDebouncedValue } from './useDebouncedValue';

jest.useFakeTimers();

describe('useDebouncedValue', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'first' } },
    );

    expect(result.current).toBe('first');

    rerender({ value: 'second' });

    expect(result.current).toBe('first');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('second');
  });

  it('uses default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: 'initial' } },
    );

    rerender({ value: 'updated' });

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('cancels pending debounce on unmount', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'first' } },
    );

    rerender({ value: 'second' });
    unmount();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('first');
  });

  it('works with numbers', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: 1 } },
    );

    expect(result.current).toBe(1);

    rerender({ value: 2 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe(2);
  });

  it('works with objects', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };

    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: obj1 } },
    );

    expect(result.current).toBe(obj1);

    rerender({ value: obj2 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe(obj2);
  });

  it('resets debounce timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'first' } },
    );

    rerender({ value: 'second' });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'third' });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('first');

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe('third');
  });
});
