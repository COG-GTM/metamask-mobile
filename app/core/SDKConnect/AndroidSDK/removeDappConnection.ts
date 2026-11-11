import { removeDappConnection as removeDappConnectionAction } from '../../../actions/sdk';
import { store } from '../../../store';
import SDKConnect from '../SDKConnect';
import DevLogger from '../utils/DevLogger';

async function removeDappConnection(id: string, instance: SDKConnect) {
  delete instance.state.dappConnections[id];

  DevLogger.log(`SDKConnect::removeDappConnection`, id);

  store.dispatch(removeDappConnectionAction(id));
}

export default removeDappConnection;
