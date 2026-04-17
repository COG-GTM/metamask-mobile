import dappUrlList from './dapp-url-list';

describe('dapp-url-list', () => {
  it('exports an array', () => {
    expect(Array.isArray(dappUrlList)).toBe(true);
  });

  it('has entries', () => {
    expect(dappUrlList.length).toBeGreaterThan(0);
  });

  it('each entry has url and name properties', () => {
    dappUrlList.forEach((entry) => {
      expect(entry).toHaveProperty('url');
      expect(entry).toHaveProperty('name');
      expect(typeof entry.url).toBe('string');
      expect(typeof entry.name).toBe('string');
    });
  });

  it('all urls start with https://', () => {
    dappUrlList.forEach((entry) => {
      expect(entry.url).toMatch(/^https:\/\//);
    });
  });

  it('contains well-known dapps', () => {
    const names = dappUrlList.map((e) => e.name);
    expect(names).toContain('Uniswap');
    expect(names).toContain('OpenSea');
    expect(names).toContain('MetaMask');
    expect(names).toContain('Aave');
  });

  it('contains no duplicate names', () => {
    const names = dappUrlList.map((e) => e.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('contains no duplicate urls', () => {
    const urls = dappUrlList.map((e) => e.url);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(urls.length);
  });
});
