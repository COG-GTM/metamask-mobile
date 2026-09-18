import { addFavoriteCollectible, removeFavoriteCollectible } from './index';
import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';

describe('collectibles actions', () => {
  const collectible = { address: '0x1', tokenId: '1' };

  it('creates add favorite action', () => {
    expect(addFavoriteCollectible('0xaddr', '0x1', collectible)).toEqual({
      type: ADD_FAVORITE_COLLECTIBLE,
      selectedAddress: '0xaddr',
      chainId: '0x1',
      collectible,
    });
  });

  it('creates remove favorite action', () => {
    expect(removeFavoriteCollectible('0xaddr', '0x1', collectible)).toEqual({
      type: REMOVE_FAVORITE_COLLECTIBLE,
      selectedAddress: '0xaddr',
      chainId: '0x1',
      collectible,
    });
  });
});
