import { renderHook } from '@testing-library/react-hooks';
import usePrevious from './usePrevious';

describe('usePrevious', () => {
  it('returns undefined on the first render', () => {
    const { result } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 'initial' },
    });
    expect(result.current).toBeUndefined();
  });

  it('returns the previous value on subsequent renders', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      {
        initialProps: { value: 1 },
      },
    );
    rerender({ value: 2 });
    expect(result.current).toBe(1);
    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });
});
