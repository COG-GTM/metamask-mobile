import { selectAllNftContracts, selectAllNfts, selectAllNftsFlat } from './nftController';

describe('NftController Selectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        NftController: {
          allNftContracts: { '0x1': { '0x1': [{ address: '0xContract' }] } },
          allNfts: {
            '0xAccount': {
              '0x1': [
                { tokenId: '1', address: '0xNft1' },
                { tokenId: '2', address: '0xNft2' },
              ],
            },
          },
        },
      },
    },
  } as any;

  it('selectAllNftContracts should return all NFT contracts', () => {
    const result = selectAllNftContracts(mockState);
    expect(result).toStrictEqual({ '0x1': { '0x1': [{ address: '0xContract' }] } });
  });

  it('selectAllNfts should return all NFTs', () => {
    const result = selectAllNfts(mockState);
    expect(result['0xAccount']['0x1']).toHaveLength(2);
  });

  it('selectAllNftsFlat should return flattened array of all NFTs', () => {
    const result = selectAllNftsFlat(mockState);
    expect(result).toHaveLength(2);
    expect(result[0].tokenId).toBe('1');
  });

  it('selectAllNftsFlat should return empty array when no NFTs', () => {
    const emptyState = {
      engine: {
        backgroundState: {
          NftController: { allNftContracts: {}, allNfts: {} },
        },
      },
    } as any;
    expect(selectAllNftsFlat(emptyState)).toStrictEqual([]);
  });
});
