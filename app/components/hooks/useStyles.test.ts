import { renderHook } from '@testing-library/react-hooks';
import { useStyles } from './useStyles';

describe('useStyles (components/hooks)', () => {
  it('returns styles and theme from the style sheet function', () => {
    const styleSheet = jest.fn(() => ({ wrapper: { flex: 1 } }));
    const { result } = renderHook(() => useStyles(styleSheet, {}));

    expect(styleSheet).toHaveBeenCalledTimes(1);
    expect(result.current.styles).toEqual({ wrapper: { flex: 1 } });
    expect(result.current.theme).toBeDefined();
  });
});
