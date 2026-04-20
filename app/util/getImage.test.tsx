import getImage from './getImage';

jest.mock('./networks/customNetworks', () => ({
  PopularList: [
    {
      chainId: '0x1',
      rpcPrefs: { imageSource: 'ethereum-image' },
    },
    {
      chainId: '0x89',
      rpcPrefs: { imageSource: 'polygon-image' },
    },
  ],
}));

describe('getImage', () => {
  it('returns the imageSource for a known chain id', () => {
    expect(getImage('0x1')).toBe('ethereum-image');
    expect(getImage('0x89')).toBe('polygon-image');
  });

  it('returns null when the chain id is not in PopularList', () => {
    expect(getImage('0xdeadbeef')).toBeNull();
  });
});
