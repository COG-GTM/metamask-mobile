import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';

interface AddFavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: { address: string; tokenId: string };
}

interface RemoveFavoriteCollectibleAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: { address: string; tokenId: string };
}

export type CollectibleAction =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction;

export function addFavoriteCollectible(
  selectedAddress: string,
  chainId: string,
  collectible: { address: string; tokenId: string },
): AddFavoriteCollectibleAction {
  return {
    type: ADD_FAVORITE_COLLECTIBLE,
    selectedAddress,
    chainId,
    collectible,
  };
}

export function removeFavoriteCollectible(
  selectedAddress: string,
  chainId: string,
  collectible: { address: string; tokenId: string },
): RemoveFavoriteCollectibleAction {
  return {
    type: REMOVE_FAVORITE_COLLECTIBLE,
    selectedAddress,
    chainId,
    collectible,
  };
}
