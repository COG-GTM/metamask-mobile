import { selectDismissedBanners } from './banner';
import { RootState } from '../reducers';

describe('banner selectors', () => {
  describe('selectDismissedBanners', () => {
    it('should return dismissed banners from state', () => {
      const dismissedBanners = ['banner1', 'banner2'];
      const state = {
        banners: { dismissedBanners },
      } as unknown as RootState;
      expect(selectDismissedBanners(state)).toEqual(dismissedBanners);
    });

    it('should return empty array when no banners are dismissed', () => {
      const state = {
        banners: { dismissedBanners: [] },
      } as unknown as RootState;
      expect(selectDismissedBanners(state)).toEqual([]);
    });

    it('should memoize the result', () => {
      const dismissedBanners = ['banner1'];
      const state = {
        banners: { dismissedBanners },
      } as unknown as RootState;
      const result1 = selectDismissedBanners(state);
      const result2 = selectDismissedBanners(state);
      expect(result1).toBe(result2);
    });
  });
});
