import dappUrlList from './dapp-url-list';

describe('dapp-url-list', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(dappUrlList)).toBe(true);
    expect(dappUrlList.length).toBeGreaterThan(0);
  });

  it('every entry has url and name string properties', () => {
    dappUrlList.forEach((entry) => {
      expect(typeof entry.url).toBe('string');
      expect(typeof entry.name).toBe('string');
      expect(entry.url.length).toBeGreaterThan(0);
      expect(entry.name.length).toBeGreaterThan(0);
    });
  });

  it('every url is a valid http(s) URL', () => {
    dappUrlList.forEach((entry) => {
      expect(entry.url).toMatch(/^https?:\/\//);
    });
  });
});
