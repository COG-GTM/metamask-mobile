import { AppThemeKey } from './models';

describe('AppThemeKey', () => {
  it('exposes os, light and dark keys with matching string values', () => {
    expect(AppThemeKey.os).toBe('os');
    expect(AppThemeKey.light).toBe('light');
    expect(AppThemeKey.dark).toBe('dark');
  });

  it('contains exactly three keys', () => {
    expect(Object.keys(AppThemeKey)).toEqual(['os', 'light', 'dark']);
  });
});
