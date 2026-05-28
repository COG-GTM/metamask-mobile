import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { RootState } from '../reducers';
import { SelectedNetworkControllerState } from '@metamask/selected-network-controller';
import { getNetworkImageSource, NetworkList } from '../util/networks';
import { strings } from '../../locales/i18n';
import {
  selectProviderConfig,
  selectNetworkClientId,
  selectSelectedNetworkClientId,
  selectEvmChainId as selectProviderChainId,
  selectRpcUrl as selectProviderRpcUrl,
  ProviderConfig,
  selectEvmChainId,
  selectEvmNetworkConfigurationsByChainId,
} from './networkController';
import { isNonEvmChainId } from '../core/Multichain/utils';

const selectSelectedNetworkControllerState = (state: RootState) =>
  state?.engine?.backgroundState?.SelectedNetworkController;

export const selectNetworkClientIdsByDomains = createSelector(
  selectSelectedNetworkControllerState,
  (selectedNetworkControllerState: SelectedNetworkControllerState) =>
    selectedNetworkControllerState?.domains,
);

export const makeSelectDomainNetworkClientId = () =>
  createSelector(
    [
      selectNetworkClientIdsByDomains,
      (_: RootState, hostname?: string) => hostname,
    ],
    (networkClientIdsByDomains, hostname) =>
      hostname ? networkClientIdsByDomains?.[hostname] : undefined,
  );

const selectProviderNetworkName = createSelector(
  [
    selectProviderConfig,
    selectEvmNetworkConfigurationsByChainId,
    selectSelectedNetworkClientId,
    selectEvmChainId,
  ],
  (
    providerConfig: ProviderConfig,
    networkConfigurations,
    selectedNetworkClientId,
    chainId,
  ) => {
    if (isNonEvmChainId(chainId)) {
      return networkConfigurations[chainId]?.name;
    }

    if (providerConfig.type === 'rpc') {
      return networkConfigurations[chainId]?.rpcEndpoints.find(
        ({ networkClientId }) => networkClientId === selectedNetworkClientId,
      )?.name;
    }
    let name;
    if (providerConfig.nickname) {
      name = providerConfig.nickname;
    } else {
      const networkType = providerConfig.type;
      name =
        (NetworkList as Record<string, { name?: string }>)?.[networkType]?.name ||
        NetworkList.rpc.name ||
        strings('network_information.unknown_network');
    }
    return name;
  },
);

const selectProviderNetworkImageSource = createSelector(
  selectProviderConfig,
  (providerConfig: ProviderConfig) =>
    getNetworkImageSource({
      networkType: providerConfig.type,
      chainId: providerConfig.chainId,
    }),
);
export const makeSelectNetworkName = () =>
  createSelector(
    [
      selectEvmNetworkConfigurationsByChainId,
      selectProviderNetworkName,
      makeSelectDomainNetworkClientId(),
      selectNetworkClientId,
      selectEvmChainId,
      (_: RootState, hostname?: string) => hostname,
    ],
    (
      networkConfigurations,
      providerNetworkName,
      domainNetworkClientId,
      globalNetworkClientId,
      chainId,
      hostname,
    ) => {
      if (!hostname || !process.env.MM_PER_DAPP_SELECTED_NETWORK)
        return providerNetworkName;
      const relevantNetworkClientId =
        domainNetworkClientId || globalNetworkClientId;
      return (
        networkConfigurations[chainId]?.rpcEndpoints.find(
          ({ networkClientId }: { networkClientId: string }) =>
            networkClientId === relevantNetworkClientId,
        )?.name ||
        (NetworkList as Record<string, { name?: string }>)[relevantNetworkClientId]?.name
      );
    },
  );

export const makeSelectNetworkImageSource = () =>
  createSelector(
    [
      selectEvmNetworkConfigurationsByChainId,
      selectProviderNetworkImageSource,
      makeSelectDomainNetworkClientId(),
      selectNetworkClientId,
      selectEvmChainId,
      (_: RootState, hostname?: string) => hostname,
    ],
    (
      networkConfigurations,
      providerNetworkImageSource,
      domainNetworkClientId,
      globalNetworkClientId,
      chainId,
      hostname,
    ) => {
      if (!hostname || !process.env.MM_PER_DAPP_SELECTED_NETWORK)
        return providerNetworkImageSource;
      const relevantNetworkClientId =
        domainNetworkClientId || globalNetworkClientId;

      const networkConfig = networkConfigurations[chainId];
      if (networkConfig) {
        return getNetworkImageSource({ chainId: networkConfig.chainId });
      }
      const networkEntry = (NetworkList as Record<string, { networkType?: string; chainId?: string }>)[relevantNetworkClientId];
      return getNetworkImageSource({
        networkType: networkEntry?.networkType,
        chainId: networkEntry?.chainId,
      });
    },
  );

export const makeSelectChainId = () =>
  createSelector(
    [
      selectProviderChainId,
      makeSelectDomainNetworkClientId(),
      selectNetworkClientId,
      selectEvmChainId,
      (_: RootState, hostname?: string) => hostname,
    ],
    (
      providerChainId,
      domainNetworkClientId,
      globalNetworkClientId,
      chainId,
      hostname,
    ) => {
      if (!hostname || !process.env.MM_PER_DAPP_SELECTED_NETWORK) {
        return providerChainId;
      }
      const relevantNetworkClientId =
        domainNetworkClientId || globalNetworkClientId;

      return (
        chainId ||
        (NetworkList as Record<string, { chainId?: string }>)[relevantNetworkClientId]?.chainId
      );
    },
  );

// TODO: [SOLANA] - This do not support non evm networks, need to revisit
export const makeSelectRpcUrl = () =>
  createSelector(
    [
      selectEvmNetworkConfigurationsByChainId,
      selectProviderRpcUrl,
      makeSelectDomainNetworkClientId(),
      selectNetworkClientId,
      selectEvmChainId,
      (_: RootState, hostname?: string) => hostname,
    ],
    (
      networkConfigurations,
      providerRpcUrl,
      domainNetworkClientId,
      globalNetworkClientId,
      chainId,
      hostname,
    ) => {
      if (isNonEvmChainId(chainId)) {
        return;
      }
      if (!hostname || !process.env.MM_PER_DAPP_SELECTED_NETWORK)
        return providerRpcUrl;
      const relevantNetworkClientId =
        domainNetworkClientId || globalNetworkClientId;
      return networkConfigurations[chainId]?.rpcEndpoints.find(
        ({ networkClientId }) => networkClientId === relevantNetworkClientId,
      )?.url;
    },
  );

export const makeSelectDomainIsConnectedDapp = () =>
  createSelector(
    [
      selectNetworkClientIdsByDomains,
      (_: RootState, hostname?: string) => hostname,
    ],
    (networkClientIdsByDomains, hostname) =>
      Boolean(hostname && networkClientIdsByDomains?.[hostname]),
  );

export const useNetworkInfo = (hostname?: string) => {
  const selectNetworkName = useMemo(() => makeSelectNetworkName(), []);
  const selectNetworkImageSource = useMemo(
    () => makeSelectNetworkImageSource(),
    [],
  );
  const selectDomainNetworkClientId = useMemo(
    () => makeSelectDomainNetworkClientId(),
    [],
  );
  const selectCurrentChainId = useMemo(() => makeSelectChainId(), []);
  const selectRpcUrl = useMemo(() => makeSelectRpcUrl(), []);
  const selectDomainIsConnectedDapp = useMemo(
    () => makeSelectDomainIsConnectedDapp(),
    [],
  );

  const networkName = useSelector((state: RootState) =>
    selectNetworkName(state, hostname),
  );
  const networkImageSource = useSelector((state: RootState) =>
    selectNetworkImageSource(state, hostname),
  );
  const domainNetworkClientId = useSelector((state: RootState) =>
    selectDomainNetworkClientId(state, hostname),
  );
  const chainId = useSelector((state: RootState) =>
    selectCurrentChainId(state, hostname),
  );
  const rpcUrl = useSelector((state: RootState) =>
    selectRpcUrl(state, hostname),
  );
  const domainIsConnectedDapp = useSelector((state: RootState) =>
    selectDomainIsConnectedDapp(state, hostname),
  );

  return {
    networkName,
    networkImageSource,
    domainNetworkClientId,
    chainId,
    rpcUrl,
    domainIsConnectedDapp,
  };
};

export const useDomainNetworkClientId = (hostname: string) => {
  const selectDomainNetworkClientId = useMemo(
    () => makeSelectDomainNetworkClientId(),
    [],
  );

  return useSelector((state: RootState) =>
    selectDomainNetworkClientId(state, hostname),
  );
};
