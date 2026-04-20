import {
  selectAllNftContracts,
  selectAllNfts,
  selectAllNftsFlat,
} from './nftController';
import type { RootState } from '../reducers';

const makeState = (overrides: Record<string, unknown>) =>
  ({
    engine: {
      backgroundState: {
        NftController: {
          allNftContracts: {},
          allNfts: {},
          ...overrides,
        },
      },
    },
  } as unknown as RootState);

describe('nftController selectors', () => {
  it('selectAllNftContracts returns the allNftContracts map', () => {
    const allNftContracts = { '0xabc': { '0x1': [] } };
    expect(selectAllNftContracts(makeState({ allNftContracts }))).toBe(
      allNftContracts,
    );
  });

  it('selectAllNfts returns the allNfts map', () => {
    const allNfts = { '0xabc': { '0x1': [] } };
    expect(selectAllNfts(makeState({ allNfts }))).toBe(allNfts);
  });

  it('selectAllNftsFlat flattens nested chain/address arrays into a single array', () => {
    const nftA = { address: '0x1', tokenId: '1' };
    const nftB = { address: '0x1', tokenId: '2' };
    const nftC = { address: '0x2', tokenId: '3' };
    const allNfts = {
      '0xabc': { '0x1': [nftA, nftB] },
      '0xdef': { '0x89': [nftC] },
    };
    const state = makeState({ allNfts });
    expect(selectAllNftsFlat(state)).toEqual([nftA, nftB, nftC]);
  });

  it('selectAllNftsFlat returns an empty array when there are no NFTs', () => {
    expect(selectAllNftsFlat(makeState({}))).toEqual([]);
  });
});
