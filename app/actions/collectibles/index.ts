import type { Action } from 'redux';
import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';

export interface Collectible {
  tokenId?: string | number;
  address?: string;
  name?: string;
  description?: string;
  image?: string | string[];
  isCurrentlyOwned?: boolean;
  standard?: string;
  chainId?: string | number;
}

export interface AddFavoriteCollectibleAction
  extends Action<typeof ADD_FAVORITE_COLLECTIBLE> {
  selectedAddress: string | undefined;
  chainId: string;
  collectible: Collectible;
}

export interface RemoveFavoriteCollectibleAction
  extends Action<typeof REMOVE_FAVORITE_COLLECTIBLE> {
  selectedAddress: string | undefined;
  chainId: string;
  collectible: Collectible;
}

export type CollectiblesAction =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction;

export const addFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string,
  collectible: Collectible,
): AddFavoriteCollectibleAction => ({
  type: ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string,
  collectible: Collectible,
): RemoveFavoriteCollectibleAction => ({
  type: REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
