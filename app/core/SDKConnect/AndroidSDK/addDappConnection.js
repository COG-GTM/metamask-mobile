import { updateDappConnection } from '../../../actions/sdk';
import { store } from '../../../store';


import DevLogger from '../utils/DevLogger';

async function addDappConnection(
connection,
instance)
{
  instance.state.dappConnections[connection.id] = connection;

  DevLogger.log(`SDKConnect::addDappConnection`, connection);

  store.dispatch(updateDappConnection(connection.id, connection));
}

export default addDappConnection;