import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';

export interface FavoriteCollectible {
  address: string;
  tokenId: string | number;
}

export const addFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string,
  collectible: FavoriteCollectible,
) => ({
  type: ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string,
  collectible: FavoriteCollectible,
) => ({
  type: REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
