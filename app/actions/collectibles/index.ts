import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';

export interface FavoriteCollectible {
  address?: string;
  tokenId?: string | number;
}

export interface AddFavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress?: string;
  chainId?: string;
  collectible: FavoriteCollectible;
}

export interface RemoveFavoriteCollectibleAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress?: string;
  chainId?: string;
  collectible: FavoriteCollectible;
}

export type CollectiblesActionTypes =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction;

export const addFavoriteCollectible = <T extends object>(
  selectedAddress: string | undefined,
  chainId: string | undefined,
  collectible: T & FavoriteCollectible,
): AddFavoriteCollectibleAction => ({
  type: ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = <T extends object>(
  selectedAddress: string | undefined,
  chainId: string | undefined,
  collectible: T & FavoriteCollectible,
): RemoveFavoriteCollectibleAction => ({
  type: REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
