import {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
} from '../../reducers/collectibles';

// Type definitions
interface Collectible {
  address: string;
  tokenId: string;
  name?: string;
  image?: string;
  standard?: string;
}

export const addFavoriteCollectible = (
  selectedAddress: string,
  chainId: string,
  collectible: Collectible,
) => ({
  type: ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string,
  chainId: string,
  collectible: Collectible,
) => ({
  type: REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
