import { removeDappConnection as removeDappConnectionAction } from '../../../actions/sdk';
import { store } from '../../../store';
import SDKConnect from '../SDKConnect';
import DevLogger from '../utils/DevLogger';

function removeDappConnection(channelId: string, instance: SDKConnect) {
  if (instance.state.dappConnections) {
    delete instance.state.dappConnections[channelId];
  }

  DevLogger.log(`SDKConnect::removeDappConnection ${channelId}`);

  store.dispatch(removeDappConnectionAction(channelId));
}

export default removeDappConnection;
