import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';

/**
 * Collectible-like object accepted by the favorite collectible actions. Only
 * `tokenId` and `address` are consumed by the reducer, but callers pass richer
 * collectible objects.
 */
export interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

export interface AddFavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string | undefined;
  chainId: string;
  collectible: FavoriteCollectible;
}

export interface RemoveFavoriteCollectibleAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string | undefined;
  chainId: string;
  collectible: FavoriteCollectible;
}

export type CollectiblesAction =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction;

export const addFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string,
  collectible: FavoriteCollectible,
): AddFavoriteCollectibleAction => ({
  type: ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string,
  collectible: FavoriteCollectible,
): RemoveFavoriteCollectibleAction => ({
  type: REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
