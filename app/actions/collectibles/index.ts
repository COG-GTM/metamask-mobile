import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';
import { Collectible } from '../../components/UI/CollectibleMedia/CollectibleMedia.types';

type FavoriteCollectible = Pick<Collectible, 'tokenId' | 'address'>;

export interface AddFavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: FavoriteCollectible;
}

export interface RemoveFavoriteCollectibleAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: FavoriteCollectible;
}

export const addFavoriteCollectible = (
  selectedAddress: string,
  chainId: string,
  collectible: FavoriteCollectible,
): AddFavoriteCollectibleAction => ({
  type: ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string,
  chainId: string,
  collectible: FavoriteCollectible,
): RemoveFavoriteCollectibleAction => ({
  type: REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
