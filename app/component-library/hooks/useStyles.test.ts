import { renderHook } from '@testing-library/react-hooks';
import { useStyles } from './useStyles';

describe('useStyles (component-library)', () => {
  it('invokes the style sheet function with the current theme and vars and memoizes the result', () => {
    const styleSheet = jest.fn(({ vars }: { vars: { size: number } }) => ({
      base: { width: vars.size },
    }));

    const { result, rerender } = renderHook(
      ({ size }: { size: number }) => useStyles(styleSheet, { size }),
      { initialProps: { size: 10 } },
    );

    expect(styleSheet).toHaveBeenCalledTimes(1);
    expect(result.current.styles).toEqual({ base: { width: 10 } });
    expect(result.current.theme).toBeDefined();

    // Same vars reference should memoize (still the same call count).
    rerender({ size: 10 });
    // New vars object (different reference) triggers re-evaluation.
    rerender({ size: 20 });
    expect(result.current.styles).toEqual({ base: { width: 20 } });
  });
});
