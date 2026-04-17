import { mockTheme, getAssetFromTheme } from './index';
import { AppThemeKey } from './models';

describe('theme utils', () => {
  describe('mockTheme', () => {
    it('has colors', () => {
      expect(mockTheme.colors).toBeDefined();
    });

    it('has themeAppearance', () => {
      expect(mockTheme.themeAppearance).toBe('light');
    });

    it('has typography', () => {
      expect(mockTheme.typography).toBeDefined();
    });

    it('has shadows', () => {
      expect(mockTheme.shadows).toBeDefined();
    });

    it('has brandColors', () => {
      expect(mockTheme.brandColors).toBeDefined();
    });
  });

  describe('getAssetFromTheme', () => {
    it('returns light asset for light theme', () => {
      const result = getAssetFromTheme(AppThemeKey.light, 'light', 'lightAsset', 'darkAsset');
      expect(result).toBe('lightAsset');
    });

    it('returns dark asset for dark theme', () => {
      const result = getAssetFromTheme(AppThemeKey.dark, 'light', 'lightAsset', 'darkAsset');
      expect(result).toBe('darkAsset');
    });

    it('returns dark asset for os theme when os is dark', () => {
      const result = getAssetFromTheme(AppThemeKey.os, 'dark', 'lightAsset', 'darkAsset');
      expect(result).toBe('darkAsset');
    });

    it('returns light asset for os theme when os is light', () => {
      const result = getAssetFromTheme(AppThemeKey.os, 'light', 'lightAsset', 'darkAsset');
      expect(result).toBe('lightAsset');
    });

    it('returns light asset for default/unknown theme', () => {
      const result = getAssetFromTheme('unknown' as AppThemeKey, 'light', 'lightAsset', 'darkAsset');
      expect(result).toBe('lightAsset');
    });
  });
});
