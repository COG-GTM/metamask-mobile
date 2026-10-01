import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';

export interface CollectibleIdentifier {
  tokenId: string;
  address: string;
}

interface AddFavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string | undefined;
  chainId: string | undefined;
  collectible: CollectibleIdentifier;
}

interface RemoveFavoriteCollectibleAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string | undefined;
  chainId: string | undefined;
  collectible: CollectibleIdentifier;
}

export type CollectibleAction =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction;

export const addFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string | undefined,
  collectible: CollectibleIdentifier,
): AddFavoriteCollectibleAction => ({
  type: ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string | undefined,
  collectible: CollectibleIdentifier,
): RemoveFavoriteCollectibleAction => ({
  type: REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
