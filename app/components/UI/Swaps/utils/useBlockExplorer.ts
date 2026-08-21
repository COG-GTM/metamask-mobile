import { useCallback, useEffect, useState } from 'react';
import etherscanLink from '@metamask/etherscan-link';
import { RPC } from '../../../../constants/network';
import {
  findBlockExplorerForRpc,
  getBlockExplorerName,
} from '../../../../util/networks';
import { strings } from '../../../../../locales/i18n';
import { getEtherscanBaseUrl } from '../../../../util/etherscan';
import { useSelector } from 'react-redux';
import {
  selectEvmChainId,
  selectProviderConfig,
  type ProviderConfig,
} from '../../../../selectors/networkController';
import { selectNetworkName } from '../../../../selectors/networkInfos';
import type { NetworkConfiguration } from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';

interface Explorer {
  name: string;
  value: string | null;
  isValid: boolean;
  isRPC: boolean;
  baseUrl: string;
}

const DEFAULT_EXPLORER: Explorer = {
  name: '',
  value: null,
  isValid: false,
  isRPC: false,
  baseUrl: '',
};

function useBlockExplorer(
  networkConfigurations: Record<Hex, NetworkConfiguration>,
  providerConfigTokenExplorer?: ProviderConfig,
) {
  const [explorer, setExplorer] = useState<Explorer>(DEFAULT_EXPLORER);
  const providerConfig = useSelector(selectProviderConfig);
  const chainId = useSelector(selectEvmChainId);
  const networkName = useSelector(selectNetworkName);

  useEffect(() => {
    const definitiveProviderConfig =
      providerConfigTokenExplorer ?? providerConfig;
    if (definitiveProviderConfig.type === RPC) {
      try {
        const blockExplorer = findBlockExplorerForRpc(
          definitiveProviderConfig.rpcUrl,
          networkConfigurations,
        );
        if (!blockExplorer) {
          throw new Error('No block explorer url');
        }
        const url = new URL(blockExplorer);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Block explorer URL is not a valid http(s) protocol');
        }

        const name =
          getBlockExplorerName(blockExplorer) ||
          strings('swaps.block_explorer');
        setExplorer({
          name,
          value: blockExplorer,
          isValid: true,
          isRPC: true,
          baseUrl: url.href,
        });
      } catch {
        setExplorer(DEFAULT_EXPLORER);
      }
    } else {
      setExplorer({
        name: 'Etherscan',
        value: chainId,
        isValid: true,
        isRPC: false,
        baseUrl: getEtherscanBaseUrl(definitiveProviderConfig.type),
      });
    }
  }, [
    networkConfigurations,
    providerConfig,
    providerConfigTokenExplorer,
    chainId,
    networkName,
  ]);

  const tx = useCallback(
    (hash?: string) => {
      if (!explorer.isValid || explorer.value === null || !hash) {
        return '';
      }

      const create = explorer.isRPC
        ? etherscanLink.createCustomExplorerLink
        : etherscanLink.createExplorerLink;
      return create(hash, explorer.value);
    },
    [explorer],
  );
  const account = useCallback(
    (address?: string) => {
      if (!explorer.isValid || explorer.value === null || !address) {
        return '';
      }

      const create = explorer.isRPC
        ? etherscanLink.createCustomAccountLink
        : etherscanLink.createAccountLink;
      return create(address, explorer.value);
    },
    [explorer],
  );
  const token = useCallback(
    (address?: string) => {
      if (!explorer.isValid || explorer.value === null || !address) {
        return '';
      }

      const create = explorer.isRPC
        ? etherscanLink.createCustomTokenTrackerLink
        : etherscanLink.createTokenTrackerLink;
      return create(address, explorer.value);
    },
    [explorer],
  );

  return {
    ...explorer,
    tx,
    account,
    token,
  };
}

export default useBlockExplorer;
