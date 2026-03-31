import { type Action } from 'redux';
import {
  CollectibleActionType,
} from '../../reducers/collectibles';

/**
 * Collectible action interfaces
 */
export interface Collectible {
  tokenId: string;
  address: string;
}

export interface AddFavoriteCollectibleAction
  extends Action<typeof CollectibleActionType.ADD_FAVORITE_COLLECTIBLE> {
  selectedAddress: string;
  chainId: string;
  collectible: Collectible;
}

export interface RemoveFavoriteCollectibleAction
  extends Action<typeof CollectibleActionType.REMOVE_FAVORITE_COLLECTIBLE> {
  selectedAddress: string;
  chainId: string;
  collectible: Collectible;
}

/**
 * Union type for collectible actions
 */
export type CollectibleAction =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction;

export const addFavoriteCollectible = (
  selectedAddress: string,
  chainId: string,
  collectible: Collectible,
): AddFavoriteCollectibleAction => ({
  type: CollectibleActionType.ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string,
  chainId: string,
  collectible: Collectible,
): RemoveFavoriteCollectibleAction => ({
  type: CollectibleActionType.REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
