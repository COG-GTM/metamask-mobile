import { createSelector } from 'reselect';
import {
  getNetworkNameFromProviderConfig,
  getNetworkImageSource } from
'../util/networks';
import { selectProviderConfig } from './networkController';
import {
  selectIsEvmNetworkSelected,
  selectSelectedNonEvmNetworkChainId,
  selectSelectedNonEvmNetworkName } from
'./multichainNetworkController';
import { getNonEvmNetworkImageSourceByChainId } from '../util/networks/customNetworks';


export const selectEvmNetworkName = createSelector(
  selectProviderConfig,
  (providerConfig) =>
  getNetworkNameFromProviderConfig(providerConfig)
);

export const selectEvmNetworkImageSource = createSelector(
  selectProviderConfig,
  (providerConfig) =>
  getNetworkImageSource({
    networkType: providerConfig?.type,
    chainId: providerConfig.chainId
  })
);
export const selectNetworkName = createSelector(
  selectProviderConfig,
  selectIsEvmNetworkSelected,
  selectSelectedNonEvmNetworkName,
  (
  providerConfig,
  isEvmSelected,
  nonEvmNetworkName) =>

  !isEvmSelected ?
  nonEvmNetworkName :
  getNetworkNameFromProviderConfig(providerConfig)
);

export const selectNetworkImageSource = createSelector(
  selectProviderConfig,
  selectIsEvmNetworkSelected,
  selectSelectedNonEvmNetworkChainId,
  (
  providerConfig,
  isEvmSelected,
  nonEvmNetworkChainId) =>

  !isEvmSelected ?
  getNonEvmNetworkImageSourceByChainId(nonEvmNetworkChainId) :
  getNetworkImageSource({
    networkType: providerConfig?.type,
    chainId: providerConfig.chainId
  })
);