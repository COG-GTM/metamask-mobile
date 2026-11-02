import { removeDappConnection as removeDappConnectionAction } from '../../../actions/sdk';
import { store } from '../../../store';
import SDKConnect from '../SDKConnect';
import DevLogger from '../utils/DevLogger';

/**
 * Removes a stored dapp (Android / iOS deeplink SDK) connection from SDKConnect
 * state and from the persisted `sdk.dappConnections` Redux store.
 * Does not tear down an active bridge or revoke permissions.
 *
 * @param channelId - The dapp connection / channel id to remove.
 * @param instance - The SDKConnect instance holding the in-memory state.
 */
async function removeDappConnection(channelId: string, instance: SDKConnect) {
  delete instance.state.dappConnections[channelId];

  DevLogger.log(`SDKConnect::removeDappConnection`, channelId);

  store.dispatch(removeDappConnectionAction(channelId));
}

export default removeDappConnection;
