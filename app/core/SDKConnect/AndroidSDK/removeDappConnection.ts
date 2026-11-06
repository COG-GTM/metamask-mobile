import { removeDappConnection as removeDappConnectionAction } from '../../../actions/sdk';
import { store } from '../../../store';
import SDKConnect from '../SDKConnect';
import DevLogger from '../utils/DevLogger';

/**
 * Removes a persisted dapp (deeplink / android) connection from both the
 * SDKConnect instance state and the redux `sdk.dappConnections` store.
 *
 * @param channelId - The channel id of the connection to remove.
 * @param instance - The SDKConnect instance.
 */
async function removeDappConnection(channelId: string, instance: SDKConnect) {
  delete instance.state.dappConnections[channelId];

  DevLogger.log(`SDKConnect::removeDappConnection ${channelId}`);

  store.dispatch(removeDappConnectionAction(channelId));
}

export default removeDappConnection;
