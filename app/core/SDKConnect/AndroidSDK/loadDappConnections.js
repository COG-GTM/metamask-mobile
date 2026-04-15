
import { store } from '../../../store';

import DevLogger from '../utils/DevLogger';

async function loadDappConnections()

{
  const { sdk } = store.getState();

  const dappConnections = sdk.dappConnections || {};
  DevLogger.log(
    `SDKConnect::loadDappConnections found ${
    Object.keys(dappConnections).length}`,

    dappConnections
  );
  return dappConnections;
}

export default loadDappConnections;