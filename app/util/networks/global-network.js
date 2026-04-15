import EthQuery from '@metamask/eth-query';





import Engine from '../../core/Engine';

export function getGlobalEthQuery(
networkController)
{
  const finalController = networkController ?? Engine.context.NetworkController;
  const { provider } = finalController.getSelectedNetworkClient() ?? {};

  if (!provider) {
    throw new Error('No selected network client');
  }

  return new EthQuery(provider);
}

export function getGlobalChainId(networkController) {
  const finalController = networkController ?? Engine.context.NetworkController;

  return finalController.getNetworkClientById(
    getGlobalNetworkClientId(finalController)
  ).configuration.chainId;
}

export function getGlobalNetworkClientId(
networkController)
{
  const finalController = networkController ?? Engine.context.NetworkController;
  return finalController.state.selectedNetworkClientId;
}