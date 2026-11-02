import { removeDappConnection as removeDappConnectionAction } from '../../../actions/sdk';
import { store } from '../../../store';
import SDKConnect from '../SDKConnect';
import DevLogger from '../utils/DevLogger';

/**
 * Removes a dapp (Android SDK / deeplink) connection from SDKConnect state
 * and from the persisted `sdk.dappConnections` redux slice, so it is not
 * restored on the next launch.
 *
 * @param channelId - The client/channel id of the connection.
 * @param instance - The SDKConnect instance holding in-memory state.
 */
function removeDappConnection(channelId: string, instance: SDKConnect) {
  if (instance.state.dappConnections) {
    delete instance.state.dappConnections[channelId];
  }

  DevLogger.log(`SDKConnect::removeDappConnection ${channelId}`);

  store.dispatch(removeDappConnectionAction(channelId));
}

export default removeDappConnection;
