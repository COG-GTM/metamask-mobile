import { useSelector } from 'react-redux';
import usePolling from '../usePolling';
import Engine from '../../../core/Engine';
import {
  selectAllPopularNetworkConfigurations,
  selectEvmChainId,
  selectIsAllNetworks,
  selectIsPopularNetwork } from
'../../../selectors/networkController';

import { isPortfolioViewEnabled } from '../../../util/networks';
import { selectSelectedInternalAccount } from '../../../selectors/accountsController';
import { selectUseTokenDetection } from '../../../selectors/preferencesController';
import { selectIsEvmNetworkSelected } from '../../../selectors/multichainNetworkController';

const useTokenDetectionPolling = ({ chainIds } = {}) => {
  const networkConfigurationsPopularNetworks = useSelector(
    selectAllPopularNetworkConfigurations
  );
  const currentChainId = useSelector(selectEvmChainId);
  const selectedAccount = useSelector(selectSelectedInternalAccount);
  const isEvmSelected = useSelector(selectIsEvmNetworkSelected);
  const useTokenDetection = useSelector(selectUseTokenDetection);
  const isAllNetworksSelected = useSelector(selectIsAllNetworks);
  const isPopularNetwork = useSelector(selectIsPopularNetwork);

  // if all networks are selected, poll all popular networks
  const filteredChainIds =
  isAllNetworksSelected && isPopularNetwork && isPortfolioViewEnabled() ?
  Object.values(networkConfigurationsPopularNetworks).map(
    (network) => network.chainId
  ) :
  [currentChainId];

  // if portfolio view is enabled, poll all chain ids
  const chainIdsToPoll = chainIds ?? filteredChainIds;

  const { TokenDetectionController } = Engine.context;

  usePolling({
    startPolling: TokenDetectionController.startPolling.bind(
      TokenDetectionController
    ),
    stopPollingByPollingToken:
    TokenDetectionController.stopPollingByPollingToken.bind(
      TokenDetectionController
    ),
    input:
    useTokenDetection && isEvmSelected ?
    [
    {
      chainIds: chainIdsToPoll,
      address: selectedAccount?.address
    }] :

    []
  });

  return {};
};

export default useTokenDetectionPolling;