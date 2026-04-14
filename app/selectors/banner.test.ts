import { selectDismissedBanners } from './banner';

describe('Banner Selectors', () => {
  it('selectDismissedBanners should return dismissed banners', () => {
    const state = { banners: { dismissedBanners: ['banner1', 'banner2'] } } as any;
    expect(selectDismissedBanners(state)).toStrictEqual(['banner1', 'banner2']);
  });

  it('selectDismissedBanners should return empty array when none dismissed', () => {
    const state = { banners: { dismissedBanners: [] } } as any;
    expect(selectDismissedBanners(state)).toStrictEqual([]);
  });
});
