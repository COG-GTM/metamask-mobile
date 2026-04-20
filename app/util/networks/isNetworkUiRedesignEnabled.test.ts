import isNetworkUiRedesignEnabled, {
  isNetworkUiRedesignEnabled as namedExport,
} from './isNetworkUiRedesignEnabled';

describe('isNetworkUiRedesignEnabled', () => {
  it('returns true via the default export', () => {
    expect(isNetworkUiRedesignEnabled()).toBe(true);
  });

  it('exposes the same function as a named export', () => {
    expect(namedExport).toBe(isNetworkUiRedesignEnabled);
  });
});
