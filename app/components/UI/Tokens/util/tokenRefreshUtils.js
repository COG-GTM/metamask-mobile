
import Engine from '../../../../core/Engine';
import Logger from '../../../../util/Logger';

export const performEvmRefresh = async (
evmNetworkConfigurationsByChainId,



nativeCurrencies) =>
{
  const {
    TokenDetectionController,
    AccountTrackerController,
    CurrencyRateController,
    TokenRatesController,
    TokenBalancesController,
    NetworkController
  } = Engine.context;

  const networkClientIds = Object.values(
    NetworkController.state.networkConfigurationsByChainId
  ).map(
    (network) =>
    network?.rpcEndpoints?.[network.defaultRpcEndpointIndex]?.networkClientId
  );

  const actions = [
  TokenDetectionController.detectTokens({
    chainIds: Object.keys(evmNetworkConfigurationsByChainId)
  }),
  TokenBalancesController.updateBalances({
    chainIds: Object.keys(evmNetworkConfigurationsByChainId)
  }),
  AccountTrackerController.refresh(networkClientIds),
  CurrencyRateController.updateExchangeRate(nativeCurrencies),
  ...Object.values(evmNetworkConfigurationsByChainId).map((network) =>
  TokenRatesController.updateExchangeRatesByChainId([
  {
    chainId: network.chainId,
    nativeCurrency: network.nativeCurrency
  }]
  )
  )];


  await Promise.all(actions).catch((error) => {
    Logger.error(error, 'Error while refreshing tokens');
  });
};