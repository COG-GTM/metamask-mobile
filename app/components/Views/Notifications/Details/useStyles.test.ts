import { renderHook } from '@testing-library/react-hooks';
import useStyles from './useStyles';

describe('useStyles (Notifications/Details)', () => {
  it('returns a theme and styles object', () => {
    const { result } = renderHook(() => useStyles());

    expect(result.current).toBeDefined();
    expect(result.current.theme).toBeDefined();
    expect(result.current.styles).toBeDefined();
  });

  it('exposes the core style keys used by notification detail components', () => {
    const { result } = renderHook(() => useStyles());

    expect(result.current.styles.row).toBeDefined();
    expect(result.current.styles.boxLeft).toBeDefined();
    expect(result.current.styles.badgeWrapper).toBeDefined();
    expect(result.current.styles.headerImageContainer).toBeDefined();
  });

  it('memoizes styles across re-renders with the same theme', () => {
    const { result, rerender } = renderHook(() => useStyles());
    const before = result.current.styles;
    rerender();
    expect(result.current.styles).toBe(before);
  });
});
