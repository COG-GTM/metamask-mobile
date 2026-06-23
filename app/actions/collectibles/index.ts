import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';

interface FavoriteCollectible {
  address: string;
  tokenId: string;
}

interface AddFavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string | undefined;
  chainId: string;
  collectible: FavoriteCollectible;
}

interface RemoveFavoriteCollectibleAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string | undefined;
  chainId: string;
  collectible: FavoriteCollectible;
}

export type CollectiblesActionTypes =
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
