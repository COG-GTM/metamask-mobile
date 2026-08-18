import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';

export interface Collectible {
  tokenId: string | number;
  address: string;
}

export interface FavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE | typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string | undefined;
  chainId: string | undefined;
  collectible: Collectible;
}

export const addFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string | undefined,
  collectible: Collectible,
): FavoriteCollectibleAction => ({
  type: ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string | undefined,
  collectible: Collectible,
): FavoriteCollectibleAction => ({
  type: REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
