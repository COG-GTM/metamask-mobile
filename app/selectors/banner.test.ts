import { selectDismissedBanners } from './banner';

const mockState = {
  banners: {
    dismissedBanners: ['banner-1', 'banner-2'],
  },
} as any;

describe('banner selectors', () => {
  it('selectDismissedBanners returns dismissed banners', () => {
    const result = selectDismissedBanners(mockState);
    expect(result).toEqual(['banner-1', 'banner-2']);
  });

  it('selectDismissedBanners returns empty array when no banners dismissed', () => {
    const emptyState = { banners: { dismissedBanners: [] } } as any;
    const result = selectDismissedBanners(emptyState);
    expect(result).toEqual([]);
  });
});
