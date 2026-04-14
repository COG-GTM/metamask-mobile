import { addFavoriteCollectible, removeFavoriteCollectible } from '.';

jest.mock('../../reducers/collectibles', () => ({
  ADD_FAVORITE_COLLECTIBLE: 'ADD_FAVORITE_COLLECTIBLE',
  REMOVE_FAVORITE_COLLECTIBLE: 'REMOVE_FAVORITE_COLLECTIBLE',
}));

describe('Collectibles Actions', () => {
  it('addFavoriteCollectible should return correct action', () => {
    const collectible = { tokenId: '1', address: '0xNFT' };

    expect(addFavoriteCollectible('0xUser', '0x1', collectible)).toStrictEqual({
      type: 'ADD_FAVORITE_COLLECTIBLE',
      selectedAddress: '0xUser',
      chainId: '0x1',
      collectible,
    });
  });

  it('removeFavoriteCollectible should return correct action', () => {
    const collectible = { tokenId: '1', address: '0xNFT' };

    expect(removeFavoriteCollectible('0xUser', '0x1', collectible)).toStrictEqual({
      type: 'REMOVE_FAVORITE_COLLECTIBLE',
      selectedAddress: '0xUser',
      chainId: '0x1',
      collectible,
    });
  });
});
