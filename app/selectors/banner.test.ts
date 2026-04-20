import { selectDismissedBanners } from './banner';
import type { RootState } from '../reducers';

describe('selectDismissedBanners', () => {
  it('returns dismissedBanners from banners state', () => {
    const dismissed = [{ id: 'banner-1' }];
    const state = {
      banners: { dismissedBanners: dismissed },
    } as unknown as RootState;
    expect(selectDismissedBanners(state)).toBe(dismissed);
  });

  it('returns an empty array when no banners have been dismissed', () => {
    const state = {
      banners: { dismissedBanners: [] },
    } as unknown as RootState;
    expect(selectDismissedBanners(state)).toEqual([]);
  });
});
