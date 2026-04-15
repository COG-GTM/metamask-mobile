
import Engine from '../../../../core/Engine';
import Logger from '../../../../util/Logger';

import { performEvmRefresh } from './tokenRefreshUtils';











export const refreshTokens = async ({
  isEvmSelected,
  evmNetworkConfigurationsByChainId,
  nativeCurrencies,
  selectedAccount
}) => {
  if (!isEvmSelected) {
    const { MultichainBalancesController } = Engine.context;
    if (selectedAccount) {
      try {
        await MultichainBalancesController.updateBalance(selectedAccount.id);
      } catch (error) {
        Logger.error(error, 'Error while refreshing NonEvm tokens');
      }
    }
    return;
  }

  await performEvmRefresh(evmNetworkConfigurationsByChainId, nativeCurrencies);
};