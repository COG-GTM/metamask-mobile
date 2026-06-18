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
} from '../../../../selectors/networkController';
import { selectNetworkName } from '../../../../selectors/networkInfos';

interface ExplorerState {
  name: string;
  value: string | null;
  isValid: boolean;
  isRPC: boolean;
  baseUrl: string;
}

interface BlockExplorerResult extends ExplorerState {
  tx: (hash: string) => string;
  account: (address: string) => string;
  token: (address: string) => string;
}

interface ProviderConfig {
  type: string;
  rpcUrl?: string;
}

function useBlockExplorer(
  networkConfigurations: Record<string, unknown>,
  providerConfigTokenExplorer?: ProviderConfig,
): BlockExplorerResult {
  const [explorer, setExplorer] = useState<ExplorerState>({
    name: '',
    value: null,
    isValid: false,
    isRPC: false,
    baseUrl: '',
  });
  const providerConfig = useSelector(selectProviderConfig);
  const chainId = useSelector(selectEvmChainId);
  const networkName = useSelector(selectNetworkName);

  useEffect(() => {
    const definitiveProviderConfig =
      providerConfigTokenExplorer ?? providerConfig;
    if (definitiveProviderConfig.type === RPC) {
      try {
        if (!definitiveProviderConfig.rpcUrl) {
          throw new Error('No block explorer url');
        }
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
        setExplorer({
          name: '',
          value: null,
          isValid: false,
          isRPC: false,
          baseUrl: '',
        });
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
    (hash: string): string => {
      if (!explorer.isValid) {
        return '';
      }

      const create = explorer.isRPC
        ? etherscanLink.createCustomExplorerLink
        : etherscanLink.createExplorerLink;
      return create(hash, explorer.value as string);
    },
    [explorer],
  );
  const account = useCallback(
    (address: string): string => {
      if (!explorer.isValid) {
        return '';
      }

      const create = explorer.isRPC
        ? etherscanLink.createCustomAccountLink
        : etherscanLink.createAccountLink;
      return create(address, explorer.value as string);
    },
    [explorer],
  );
  const token = useCallback(
    (address: string): string => {
      if (!explorer.isValid) {
        return '';
      }

      const create = explorer.isRPC
        ? etherscanLink.createCustomTokenTrackerLink
        : etherscanLink.createTokenTrackerLink;
      return create(address, explorer.value as string);
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
