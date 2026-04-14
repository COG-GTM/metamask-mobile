import dappUrlList from './dapp-url-list';

describe('dapp-url-list', () => {
  it('should export an array', () => {
    expect(Array.isArray(dappUrlList)).toBe(true);
  });

  it('should contain objects with url and name properties', () => {
    dappUrlList.forEach((item) => {
      expect(item).toHaveProperty('url');
      expect(item).toHaveProperty('name');
      expect(typeof item.url).toBe('string');
      expect(typeof item.name).toBe('string');
    });
  });

  it('should contain well-known dapps', () => {
    const names = dappUrlList.map((d) => d.name);
    expect(names).toContain('Uniswap');
    expect(names).toContain('OpenSea');
  });

  it('should have valid URLs', () => {
    dappUrlList.forEach((item) => {
      expect(item.url).toMatch(/^https?:\/\//);
    });
  });
});
