import {
  selectAllNftContracts,
  selectAllNfts,
  selectAllNftsFlat,
} from './nftController';

const mockState = {
  engine: {
    backgroundState: {
      NftController: {
        allNftContracts: {
          '0x1': { '0xacc': [{ address: '0xcontract1', name: 'NFT Collection' }] },
        },
        allNfts: {
          '0x1': {
            '0xacc': [
              { tokenId: '1', address: '0xcontract1', name: 'NFT #1' },
              { tokenId: '2', address: '0xcontract1', name: 'NFT #2' },
            ],
          },
          '0x89': {
            '0xacc': [
              { tokenId: '3', address: '0xcontract2', name: 'NFT #3' },
            ],
          },
        },
      },
    },
  },
} as any;

describe('nftController selectors', () => {
  it('selectAllNftContracts returns allNftContracts', () => {
    const result = selectAllNftContracts(mockState);
    expect(result).toEqual(mockState.engine.backgroundState.NftController.allNftContracts);
  });

  it('selectAllNfts returns allNfts', () => {
    const result = selectAllNfts(mockState);
    expect(result).toEqual(mockState.engine.backgroundState.NftController.allNfts);
  });

  it('selectAllNftsFlat returns flattened array of all NFTs', () => {
    const result = selectAllNftsFlat(mockState);
    expect(result).toHaveLength(3);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tokenId: '1' }),
        expect.objectContaining({ tokenId: '2' }),
        expect.objectContaining({ tokenId: '3' }),
      ]),
    );
  });

  it('selectAllNftsFlat returns empty array when no NFTs', () => {
    const emptyState = {
      engine: {
        backgroundState: {
          NftController: {
            allNftContracts: {},
            allNfts: {},
          },
        },
      },
    } as any;
    const result = selectAllNftsFlat(emptyState);
    expect(result).toEqual([]);
  });
});
