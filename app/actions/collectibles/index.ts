import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';

export interface CollectibleIdentifier {
  tokenId: string;
  address: string;
}

export interface AddFavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: CollectibleIdentifier;
}

export interface RemoveFavoriteCollectibleAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: CollectibleIdentifier;
}

export type CollectibleAction =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction;

export const addFavoriteCollectible = (
  selectedAddress: string,
  chainId: string,
  collectible: CollectibleIdentifier,
): AddFavoriteCollectibleAction => ({
  type: ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string,
  chainId: string,
  collectible: CollectibleIdentifier,
): RemoveFavoriteCollectibleAction => ({
  type: REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
