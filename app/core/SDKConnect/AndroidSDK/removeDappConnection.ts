import { removeDappConnection as removeDappConnectionAction } from '../../../actions/sdk';
import { store } from '../../../store';
import SDKConnect from '../SDKConnect';
import DevLogger from '../utils/DevLogger';

/**
 * Removes a stored dapp (Android / iOS deeplink SDK) connection from
 * SDKConnect state and the persisted `sdk.dappConnections` slice.
 *
 * @param channelId - Id of the dapp connection to remove.
 * @param instance - SDKConnect instance holding the in-memory state.
 */
async function removeDappConnection(channelId: string, instance: SDKConnect) {
  delete instance.state.dappConnections[channelId];

  DevLogger.log(`SDKConnect::removeDappConnection ${channelId}`);

  store.dispatch(removeDappConnectionAction(channelId));
}

export default removeDappConnection;
