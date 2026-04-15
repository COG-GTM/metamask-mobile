import {

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SolScope
  ///: END:ONLY_INCLUDE_IF(keyring-snaps)
} from '@metamask/keyring-api';
import AppConstants from '../../../../core/AppConstants';

import {
  ARBITRUM_CHAIN_ID,
  AVALANCHE_CHAIN_ID,
  BASE_CHAIN_ID,
  BSC_CHAIN_ID,
  ETH_CHAIN_ID,
  LINEA_CHAIN_ID,
  OPTIMISM_CHAIN_ID,
  POLYGON_CHAIN_ID,
  ZKSYNC_ERA_CHAIN_ID } from
'@metamask/swaps-controller/dist/constants';

const ALLOWED_CHAIN_IDS = [
ETH_CHAIN_ID,
OPTIMISM_CHAIN_ID,
BSC_CHAIN_ID,
POLYGON_CHAIN_ID,
ZKSYNC_ERA_CHAIN_ID,
BASE_CHAIN_ID,
ARBITRUM_CHAIN_ID,
AVALANCHE_CHAIN_ID,
LINEA_CHAIN_ID,
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
SolScope.Mainnet
///: END:ONLY_INCLUDE_IF(keyring-snaps)
];

export const isBridgeAllowed = (chainId) => {
  if (!AppConstants.BRIDGE.ACTIVE) {
    return false;
  }
  return ALLOWED_CHAIN_IDS.includes(chainId);
};