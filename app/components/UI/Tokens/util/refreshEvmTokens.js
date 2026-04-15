
import { performEvmRefresh } from './tokenRefreshUtils';










export const refreshEvmTokens = async ({
  isEvmSelected,
  evmNetworkConfigurationsByChainId,
  nativeCurrencies
}) => {
  if (!isEvmSelected) {
    return;
  }

  await performEvmRefresh(evmNetworkConfigurationsByChainId, nativeCurrencies);
};