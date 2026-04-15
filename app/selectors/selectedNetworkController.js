import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';


import { getNetworkImageSource, NetworkList } from '../util/networks';
import { strings } from '../../locales/i18n';
import {
  selectProviderConfig,
  selectNetworkClientId,
  selectSelectedNetworkClientId,
  selectEvmChainId as selectProviderChainId,
  selectRpcUrl as selectProviderRpcUrl,

  selectEvmChainId,
  selectEvmNetworkConfigurationsByChainId } from
'./networkController';
import { isNonEvmChainId } from '../core/Multichain/utils';

const selectSelectedNetworkControllerState = (state) =>
state?.engine?.backgroundState?.SelectedNetworkController;

export const selectNetworkClientIdsByDomains = createSelector(
  selectSelectedNetworkControllerState,
  (selectedNetworkControllerState) =>
  selectedNetworkControllerState?.domains
);

export const makeSelectDomainNetworkClientId = () =>
createSelector(
  [
  selectNetworkClientIdsByDomains,
  (_, hostname) => hostname],

  (networkClientIdsByDomains, hostname) =>
  hostname ? networkClientIdsByDomains?.[hostname] : undefined
);

const selectProviderNetworkName = createSelector(
  [
  selectProviderConfig,
  selectEvmNetworkConfigurationsByChainId,
  selectSelectedNetworkClientId,
  selectEvmChainId],

  (
  providerConfig,
  networkConfigurations,
  selectedNetworkClientId,
  chainId) =>
  {
    if (isNonEvmChainId(chainId)) {
      return networkConfigurations[chainId]?.name;
    }

    if (providerConfig.type === 'rpc') {
      return networkConfigurations[chainId]?.rpcEndpoints.find(
        ({ networkClientId }) => networkClientId === selectedNetworkClientId
      )?.name;
    }
    let name;
    if (providerConfig.nickname) {
      name = providerConfig.nickname;
    } else {
      const networkType = providerConfig.type;
      name =
      // @ts-expect-error The utils/network file is still JS
      NetworkList?.[networkType]?.name ||
      NetworkList.rpc.name ||
      strings('network_information.unknown_network');
    }
    return name;
  }
);

const selectProviderNetworkImageSource = createSelector(
  selectProviderConfig,
  (providerConfig) =>
  getNetworkImageSource({
    networkType: providerConfig.type,
    chainId: providerConfig.chainId
  })
);
export const makeSelectNetworkName = () =>
createSelector(
  [
  selectEvmNetworkConfigurationsByChainId,
  selectProviderNetworkName,
  makeSelectDomainNetworkClientId(),
  selectNetworkClientId,
  selectEvmChainId,
  (_, hostname) => hostname],

  (
  networkConfigurations,
  providerNetworkName,
  domainNetworkClientId,
  globalNetworkClientId,
  chainId,
  hostname) =>
  {
    if (!hostname || !process.env.MM_PER_DAPP_SELECTED_NETWORK)
    return providerNetworkName;
    const relevantNetworkClientId =
    domainNetworkClientId || globalNetworkClientId;
    return (
      networkConfigurations[chainId]?.rpcEndpoints.find(
        ({ networkClientId }) =>
        networkClientId === relevantNetworkClientId
      )?.name ||
      // @ts-expect-error The utils/network file is still JS
      NetworkList[relevantNetworkClientId]?.name);

  }
);

export const makeSelectNetworkImageSource = () =>
createSelector(
  [
  selectEvmNetworkConfigurationsByChainId,
  selectProviderNetworkImageSource,
  makeSelectDomainNetworkClientId(),
  selectNetworkClientId,
  selectEvmChainId,
  (_, hostname) => hostname],

  (
  networkConfigurations,
  providerNetworkImageSource,
  domainNetworkClientId,
  globalNetworkClientId,
  chainId,
  hostname) =>
  {
    if (!hostname || !process.env.MM_PER_DAPP_SELECTED_NETWORK)
    return providerNetworkImageSource;
    const relevantNetworkClientId =
    domainNetworkClientId || globalNetworkClientId;

    const networkConfig = networkConfigurations[chainId];
    if (networkConfig) {
      return getNetworkImageSource({ chainId: networkConfig.chainId });
    }
    return getNetworkImageSource({
      // @ts-expect-error The utils/network file is still JS
      networkType: NetworkList[relevantNetworkClientId]?.networkType,
      // @ts-expect-error The utils/network file is still JS
      chainId: NetworkList[relevantNetworkClientId]?.chainId
    });
  }
);

export const makeSelectChainId = () =>
createSelector(
  [
  selectProviderChainId,
  makeSelectDomainNetworkClientId(),
  selectNetworkClientId,
  selectEvmChainId,
  (_, hostname) => hostname],

  (
  providerChainId,
  domainNetworkClientId,
  globalNetworkClientId,
  chainId,
  hostname) =>
  {
    if (!hostname || !process.env.MM_PER_DAPP_SELECTED_NETWORK) {
      return providerChainId;
    }
    const relevantNetworkClientId =
    domainNetworkClientId || globalNetworkClientId;

    return (
      chainId ||
      // @ts-expect-error The utils/network file is still JS
      NetworkList[relevantNetworkClientId]?.chainId);

  }
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
  (_, hostname) => hostname],

  (
  networkConfigurations,
  providerRpcUrl,
  domainNetworkClientId,
  globalNetworkClientId,
  chainId,
  hostname) =>
  {
    if (isNonEvmChainId(chainId)) {
      return;
    }
    if (!hostname || !process.env.MM_PER_DAPP_SELECTED_NETWORK)
    return providerRpcUrl;
    const relevantNetworkClientId =
    domainNetworkClientId || globalNetworkClientId;
    return networkConfigurations[chainId]?.rpcEndpoints.find(
      ({ networkClientId }) => networkClientId === relevantNetworkClientId
    )?.url;
  }
);

export const makeSelectDomainIsConnectedDapp = () =>
createSelector(
  [
  selectNetworkClientIdsByDomains,
  (_, hostname) => hostname],

  (networkClientIdsByDomains, hostname) =>
  Boolean(hostname && networkClientIdsByDomains?.[hostname])
);

export const useNetworkInfo = (hostname) => {
  const selectNetworkName = useMemo(() => makeSelectNetworkName(), []);
  const selectNetworkImageSource = useMemo(
    () => makeSelectNetworkImageSource(),
    []
  );
  const selectDomainNetworkClientId = useMemo(
    () => makeSelectDomainNetworkClientId(),
    []
  );
  const selectCurrentChainId = useMemo(() => makeSelectChainId(), []);
  const selectRpcUrl = useMemo(() => makeSelectRpcUrl(), []);
  const selectDomainIsConnectedDapp = useMemo(
    () => makeSelectDomainIsConnectedDapp(),
    []
  );

  const networkName = useSelector((state) =>
  selectNetworkName(state, hostname)
  );
  const networkImageSource = useSelector((state) =>
  selectNetworkImageSource(state, hostname)
  );
  const domainNetworkClientId = useSelector((state) =>
  selectDomainNetworkClientId(state, hostname)
  );
  const chainId = useSelector((state) =>
  selectCurrentChainId(state, hostname)
  );
  const rpcUrl = useSelector((state) =>
  selectRpcUrl(state, hostname)
  );
  const domainIsConnectedDapp = useSelector((state) =>
  selectDomainIsConnectedDapp(state, hostname)
  );

  return {
    networkName,
    networkImageSource,
    domainNetworkClientId,
    chainId,
    rpcUrl,
    domainIsConnectedDapp
  };
};

export const useDomainNetworkClientId = (hostname) => {
  const selectDomainNetworkClientId = useMemo(
    () => makeSelectDomainNetworkClientId(),
    []
  );

  return useSelector((state) =>
  selectDomainNetworkClientId(state, hostname)
  );
};