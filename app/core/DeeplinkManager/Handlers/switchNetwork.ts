import { Alert } from 'react-native';
import { toHex } from '@metamask/controller-utils';
import { strings } from '../../../../locales/i18n';
import { showAlert } from '../../../actions/alert';
import { handleNetworkSwitch } from '../../../util/networks/handleNetworkSwitch';
import DevLogger from '../../SDKConnect/utils/DevLogger';
import DeeplinkManager from '../DeeplinkManager';

import {
  selectEvmChainId,
  selectEvmNetworkConfigurationsByChainId,
} from '../../../selectors/networkController';
import { store } from '../../../store';

/**
 * Asks the user to approve a network change requested by a deeplink.
 * Resolves to `false` when the user cancels or dismisses the prompt.
 */
export function requestDeeplinkNetworkSwitchApproval({
  currentNetworkName,
  networkName,
}: {
  currentNetworkName: string;
  networkName: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      strings('deeplink.network_switch_title'),
      strings('deeplink.network_switch_message', {
        currentNetworkName,
        networkName,
      }),
      [
        {
          text: strings('deeplink.network_switch_cancel'),
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: strings('deeplink.network_switch_confirm'),
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/**
 * Switches the active network to the chain requested by a deeplink, but only
 * after the user explicitly approves the change.
 *
 * @returns `true` when the wallet is on the requested network (or no network
 * was requested), `false` when the user declined the switch.
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
  if (!newChainId) {
    return true;
  }

  const state = store.getState();
  const activeChainId = selectEvmChainId(state);
  const targetChainId = toHex(newChainId);

  if (activeChainId === targetChainId) {
    return true;
  }

  const networkConfigurations = selectEvmNetworkConfigurationsByChainId(state);
  const targetNetwork = networkConfigurations?.[targetChainId];

  if (!targetNetwork) {
    throw new Error(`Unable to find network with chain id ${newChainId}`);
  }

  const approved = await requestDeeplinkNetworkSwitchApproval({
    currentNetworkName:
      networkConfigurations?.[activeChainId]?.name ?? activeChainId,
    networkName: targetNetwork.name,
  });

  if (!approved) {
    return false;
  }

  const networkName = handleNetworkSwitch(newChainId);

  if (networkName) {
    deeplinkManager.dispatch(
      showAlert({
        isVisible: true,
        autodismiss: 5000,
        content: 'clipboard-alert',
        data: { msg: strings('send.warn_network_change') + networkName },
      }),
    );
  }

  return true;
}

export default switchNetwork;
