import {

  NON_EVM_TESTNET_IDS } from

'@metamask/multichain-network-controller';

import { createSelector } from 'reselect';

import { BtcScope, SolScope } from '@metamask/keyring-api';
import imageIcons from '../../images/image-icons';

import { createDeepEqualSelector } from '../util';

export const selectMultichainNetworkControllerState = (state) =>
state.engine.backgroundState?.MultichainNetworkController;

export const selectIsEvmNetworkSelected = createSelector(
  selectMultichainNetworkControllerState,
  (multichainNetworkControllerState) =>
  multichainNetworkControllerState.isEvmSelected
);

export const selectSelectedNonEvmNetworkChainId = createDeepEqualSelector(
  selectMultichainNetworkControllerState,
  (multichainNetworkControllerState) =>
  multichainNetworkControllerState.selectedMultichainNetworkChainId
);

/**
 * This selector is used to get the non-EVM network configurations by chain ID.
 * It extends the network configurations with additional data for non-EVM networks that doens't have a source of truth source yet.
 *
 * @param state - The root state object.
 * @returns An object where the keys are chain IDs and the values are network configurations.
 */
export const selectNonEvmNetworkConfigurationsByChainId = createSelector(
  selectMultichainNetworkControllerState,
  (multichainNetworkControllerState) => {
    const extendedNonEvmData =






    {
      [SolScope.Mainnet]: {
        decimals: 9,
        imageSource: imageIcons.SOLANA,
        ticker: 'SOL'
      },
      [BtcScope.Mainnet]: {
        decimals: 8,
        imageSource: imageIcons.BTC,
        ticker: 'BTC'
      }
    };

    // TODO: Add support for non-EVM testnets
    const networks = multichainNetworkControllerState.multichainNetworkConfigurationsByChainId || {};
    const nonEvmNetworks =
    Object.keys(networks).
    filter((key) => !NON_EVM_TESTNET_IDS.includes(key)).
    reduce((filteredNetworks, key) => {
      // @ts-expect-error - key is typed as string because that is the type of Object.keys but we know it is a CaipChainId
      filteredNetworks[key] = networks[key];
      return filteredNetworks;
    },
    {});

    return Object.fromEntries(
      Object.entries(nonEvmNetworks).map(([key, network]) => [
      key,
      { ...network, ...extendedNonEvmData[network.chainId] }]
      )
    );
  }
);

export const selectSelectedNonEvmNetworkDecimals = createSelector(
  selectNonEvmNetworkConfigurationsByChainId,
  selectSelectedNonEvmNetworkChainId,
  (nonEvmNetworkConfigurationsByChainId, selectedMultichainNetworkChainId) =>
  nonEvmNetworkConfigurationsByChainId[selectedMultichainNetworkChainId]?.
  decimals
);

export const selectSelectedNonEvmNetworkName = createSelector(
  selectNonEvmNetworkConfigurationsByChainId,
  selectSelectedNonEvmNetworkChainId,
  (nonEvmNetworkConfigurationsByChainId, selectedMultichainNetworkChainId) => {
    const network =
    nonEvmNetworkConfigurationsByChainId[selectedMultichainNetworkChainId];
    return network?.name;
  }
);

export const selectSelectedNonEvmNativeCurrency = createSelector(
  selectNonEvmNetworkConfigurationsByChainId,
  selectSelectedNonEvmNetworkChainId,
  (nonEvmNetworkConfigurationsByChainId, selectedMultichainNetworkChainId) => {
    const network =
    nonEvmNetworkConfigurationsByChainId[selectedMultichainNetworkChainId];
    return network?.nativeCurrency;
  }
);

export const selectSelectedNonEvmNetworkSymbol = createSelector(
  selectSelectedNonEvmNetworkChainId,
  selectNonEvmNetworkConfigurationsByChainId,
  (selectedMultichainNetworkChainId, nonEvmNetworkConfigurationsByChainId) =>
  nonEvmNetworkConfigurationsByChainId[selectedMultichainNetworkChainId]?.
  ticker
);