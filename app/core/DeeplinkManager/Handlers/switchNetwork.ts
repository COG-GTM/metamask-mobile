import { Alert } from 'react-native';
import { strings } from '../../../../locales/i18n';
import { showAlert } from '../../../actions/alert';
import DevLogger from '../../SDKConnect/utils/DevLogger';
import DeeplinkManager from '../DeeplinkManager';
import Engine from '../../Engine';

import {
  selectEvmChainId,
  selectEvmNetworkConfigurationsByChainId,
} from '../../../selectors/networkController';
import { store } from '../../../store';
import { toHex } from '@metamask/controller-utils';

/**
 * Asks the user to confirm a network switch requested by a deeplink.
 *
 * @param networkName - Name of the network the deeplink wants to switch to.
 * @returns Whether the user approved the switch.
 */
export const confirmDeeplinkNetworkSwitch = (networkName: string) =>
  new Promise<boolean>((resolve) => {
    Alert.alert(
      strings('deeplink.switch_network_title'),
      strings('deeplink.switch_network_description', { networkName }),
      [
        {
          text: strings('switch_custom_network.cancel'),
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: strings('switch_custom_network.switch'),
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });

/**
 * Switches the active network to the chain requested by a deeplink, after the
 * user confirms it.
 *
 * @returns Whether the deeplink flow may continue: true when no switch was
 * needed or the user approved it, false when the user declined.
 */
async function switchNetwork({
  deeplinkManager,
  switchToChainId,
}: {
  deeplinkManager: DeeplinkManager;
  switchToChainId: `${number}` | undefined;
}): Promise<boolean> {
  if (
    typeof switchToChainId !== 'number' &&
    typeof switchToChainId !== 'string'
  ) {
    DevLogger.log(
      'Invalid Type: switchToChainId must be a string or number but was ' +
        typeof switchToChainId,
    );
    return true;
  }

  const newChainId = String(switchToChainId);
  const hexChainId = toHex(newChainId);
  const { MultichainNetworkController } = Engine.context;
  const state = store.getState();

  if (
    MultichainNetworkController.state.isEvmSelected &&
    selectEvmChainId(state) === hexChainId
  ) {
    return true;
  }

  const networkConfiguration =
    selectEvmNetworkConfigurationsByChainId(state)[hexChainId];

  if (!networkConfiguration) {
    throw new Error(`Unable to find network with chain id ${newChainId}`);
  }

  const { name, rpcEndpoints, defaultRpcEndpointIndex } = networkConfiguration;

  if (!(await confirmDeeplinkNetworkSwitch(name))) {
    return false;
  }

  await MultichainNetworkController.setActiveNetwork(
    rpcEndpoints[defaultRpcEndpointIndex].networkClientId,
  );

  deeplinkManager.dispatch(
    showAlert({
      isVisible: true,
      autodismiss: 5000,
      content: 'clipboard-alert',
      data: { msg: strings('send.warn_network_change') + name },
    }),
  );

  return true;
}

export default switchNetwork;
