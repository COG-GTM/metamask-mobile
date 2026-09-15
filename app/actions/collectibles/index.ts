import { CaipChainId, Hex } from '@metamask/utils';
import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';
import { Collectible } from '../../components/UI/CollectibleMedia/CollectibleMedia.types';

interface AddFavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string | undefined;
  chainId: Hex | CaipChainId;
  collectible: Collectible;
}

interface RemoveFavoriteCollectibleAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string | undefined;
  chainId: Hex | CaipChainId;
  collectible: Collectible;
}

export type CollectiblesAction =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction;

export const addFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: Hex | CaipChainId,
  collectible: Collectible,
): AddFavoriteCollectibleAction => ({
  type: ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: Hex | CaipChainId,
  collectible: Collectible,
): RemoveFavoriteCollectibleAction => ({
  type: REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
