import { RootState } from '../../../reducers';
import { store } from '../../../store';
import { ConnectionProps } from '../Connection';
import DevLogger from '../utils/DevLogger';
import { isValidSDKChannelId } from '../utils/isUUID';

async function loadDappConnections(): Promise<{
  [id: string]: ConnectionProps;
}> {
  const { sdk } = store.getState() as RootState;

  // Never restore a session whose id could collide with a browser hostname.
  const dappConnections = Object.fromEntries(
    Object.entries(sdk.dappConnections || {}).filter(([id]) =>
      isValidSDKChannelId(id),
    ),
  );
  DevLogger.log(
    `SDKConnect::loadDappConnections found ${
      Object.keys(dappConnections).length
    }`,
    dappConnections,
  );
  return dappConnections;
}

export default loadDappConnections;
