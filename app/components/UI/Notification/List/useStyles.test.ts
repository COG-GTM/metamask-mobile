import { renderHook } from '@testing-library/react-hooks';
import useStyles from './useStyles';

describe('useStyles (Notification/List)', () => {
  it('returns a theme and styles object', () => {
    const { result } = renderHook(() => useStyles());

    expect(result.current).toBeDefined();
    expect(result.current.theme).toBeDefined();
    expect(result.current.styles).toBeDefined();
    expect(typeof result.current.styles).toBe('object');
  });

  it('includes expected style keys used by the notification list', () => {
    const { result } = renderHook(() => useStyles());

    expect(result.current.styles.container).toBeDefined();
    expect(result.current.styles.wrapper).toBeDefined();
    expect(result.current.styles.list).toBeDefined();
  });

  it('memoizes styles across re-renders with the same theme', () => {
    const { result, rerender } = renderHook(() => useStyles());
    const stylesBefore = result.current.styles;
    rerender();
    expect(result.current.styles).toBe(stylesBefore);
  });
});
