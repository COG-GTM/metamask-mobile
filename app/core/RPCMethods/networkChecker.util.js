import axios from 'axios';
import { BannerAlertSeverity } from '../../component-library/components/Banners/Banner';
import { strings } from '../../../locales/i18n';
import { PopularList } from '../../util/networks/customNetworks';

import { toHex } from '@metamask/controller-utils';

const findPopularNetwork = (rpcUrl, chainId) =>
PopularList.some((network) => {
  const { origin } = new URL(network.rpcUrl);
  return origin === rpcUrl && network.chainId === chainId;
});

const findPopularNetworkName = (name, chainId) =>
PopularList.some(
  (network) =>
  network.nickname.toLowerCase() === name?.toLowerCase() &&
  network.chainId === chainId
);

const findPopularNetworkSymbol = (symbol, chainId) =>
PopularList.some(
  (network) => network.ticker === symbol && network.chainId === chainId
);

const checkSafeNetwork = async (
chainIdDecimal,
rpcUrl,
nickname,
ticker) =>
{
  const alerts = [];
  const EVM_NATIVE_TOKEN_DECIMALS = 18;

  const response = await axios.get('https://chainid.network/chains.json');
  const safeChainsList = response.data;

  const matchedChain = safeChainsList.find(
    (chain) => chain.chainId.toString() === chainIdDecimal
  );

  if (matchedChain) {
    const { origin } = new URL(rpcUrl);
    if (
    !matchedChain.rpc?.
    map((rpc) => new URL(rpc).origin).
    includes(origin) &&
    !findPopularNetwork(origin, toHex(chainIdDecimal)))
    {
      alerts.push({
        alertError: strings('add_custom_network.invalid_rpc_url'),
        alertSeverity: BannerAlertSeverity.Error,
        alertOrigin: 'rpc_url'
      });
    }
    if (matchedChain.nativeCurrency?.decimals !== EVM_NATIVE_TOKEN_DECIMALS) {
      alerts.push({
        alertError: strings('add_custom_network.invalid_chain_token_decimals'),
        alertSeverity: BannerAlertSeverity.Warning,
        alertOrigin: 'decimals'
      });
    }
    if (
    matchedChain.name?.toLowerCase() !== nickname?.toLowerCase() &&
    !findPopularNetworkName(nickname, toHex(chainIdDecimal)))
    {
      alerts.push({
        alertError: strings('add_custom_network.unrecognized_chain_name'),
        alertSeverity: BannerAlertSeverity.Warning,
        alertOrigin: 'chain_name'
      });
    }
    if (
    matchedChain.nativeCurrency?.symbol !== ticker &&
    !findPopularNetworkSymbol(ticker, toHex(chainIdDecimal)))
    {
      alerts.push({
        alertError: strings('add_custom_network.unrecognized_chain_ticker'),
        alertSeverity: BannerAlertSeverity.Warning,
        alertOrigin: 'chain_ticker'
      });
    }
  }

  if (!matchedChain) {
    alerts.push({
      alertError: strings('add_custom_network.unrecognized_chain_id'),
      alertSeverity: BannerAlertSeverity.Error,
      alertOrigin: 'unknown_chain'
    });
  }

  return alerts;
};

export default checkSafeNetwork;