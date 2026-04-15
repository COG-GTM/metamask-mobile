import {
  formatChainIdToHex,
  formatChainIdToCaip,
  isSolanaChainId } from
'@metamask/bridge-controller';
import { useSelector } from 'react-redux';
import {
  createProviderConfig,
  selectEvmNetworkConfigurationsByChainId } from
'../../../../../selectors/networkController';
import { useMemo } from 'react';

import useBlockExplorer from '../../../Swaps/utils/useBlockExplorer';
import { getTransactionUrl } from '../../../../../core/Multichain/utils';
import { getBlockExplorerName, getNetworkImageSource } from '../../../../../util/networks';

import { selectNonEvmNetworkConfigurationsByChainId } from '../../../../../selectors/multichainNetworkController';

const useEvmBlockExplorer = useBlockExplorer;

const getProviderConfigForNetwork = (networkConfig) => {
  const rpcEndpoint =
  networkConfig?.rpcEndpoints?.[networkConfig?.defaultRpcEndpointIndex];
  const providerConfig = createProviderConfig(networkConfig, rpcEndpoint);

  return providerConfig;
};

export const useMultichainBlockExplorerTxUrl = ({
  chainId,
  txHash



}) => {
  const evmNetworkConfigurations = useSelector(
    selectEvmNetworkConfigurationsByChainId
  );
  const nonEvmNetworkConfigurations = useSelector(
    selectNonEvmNetworkConfigurationsByChainId
  );

  // Format chainId based on whether it's Solana or not
  const isSolana = chainId ? isSolanaChainId(chainId) : false;
  let formattedChainId;
  if (chainId) {
    formattedChainId = isSolana ?
    formatChainIdToCaip(chainId) :
    formatChainIdToHex(chainId);
  }

  // EVM specific hooks - always call these regardless of chainId
  const evmNetworkConfig = formattedChainId && !isSolana ?
  evmNetworkConfigurations[formattedChainId] :
  undefined;

  const evmProviderConfig = useMemo(
    () =>
    evmNetworkConfig ?
    getProviderConfigForNetwork(evmNetworkConfig) :
    undefined,
    [evmNetworkConfig]
  );

  const evmExplorer = useEvmBlockExplorer(
    evmNetworkConfigurations,
    evmProviderConfig
  );

  // Handle undefined cases
  if (!chainId || !txHash) {
    return undefined;
  }

  // Determine explorer URL based on chain type and txHash
  let explorerTxUrl;
  if (!txHash) {
    explorerTxUrl = undefined;
  } else if (isSolana) {
    // Solana
    explorerTxUrl = getTransactionUrl(txHash, formatChainIdToCaip(chainId));
  } else {
    // EVM
    explorerTxUrl = evmExplorer.tx(txHash);
  }

  // Get network image source
  const networkImageSource = getNetworkImageSource({
    chainId: formattedChainId
  });

  // Determine explorer name and chain name
  const explorerName = isSolana && explorerTxUrl ?
  getBlockExplorerName(explorerTxUrl) :
  evmExplorer.name;

  const chainName = isSolana && formattedChainId ?
  nonEvmNetworkConfigurations[formattedChainId]?.name :
  evmNetworkConfig?.name;

  return {
    explorerTxUrl,
    explorerName,
    networkImageSource,
    chainName
  };
};