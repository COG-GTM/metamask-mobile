import { type Action } from 'redux';
import type { Hex } from '@metamask/utils';
import type { SupportedCaipChainId } from '@metamask/multichain-network-controller';
import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
  FavoriteCollectible,
} from '../../reducers/collectibles';

export type AddFavoriteCollectibleAction = Action<
  typeof ADD_FAVORITE_COLLECTIBLE
> & {
  selectedAddress: string | undefined;
  chainId: Hex | SupportedCaipChainId;
  collectible: FavoriteCollectible;
};

export type RemoveFavoriteCollectibleAction = Action<
  typeof REMOVE_FAVORITE_COLLECTIBLE
> & {
  selectedAddress: string | undefined;
  chainId: Hex | SupportedCaipChainId;
  collectible: FavoriteCollectible;
};

export const addFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: Hex | SupportedCaipChainId,
  collectible: FavoriteCollectible,
): AddFavoriteCollectibleAction => ({
  type: ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: Hex | SupportedCaipChainId,
  collectible: FavoriteCollectible,
): RemoveFavoriteCollectibleAction => ({
  type: REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
