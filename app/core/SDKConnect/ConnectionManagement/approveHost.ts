import {
  resetApprovedHosts,
  resetConnections,
} from '../../../../app/actions/sdk';
import { store } from '../../../../app/store';
import AppConstants from '../../../core/AppConstants';
import SDKConnect, { approveHostProps } from '../SDKConnect';
import { DEFAULT_SESSION_TIMEOUT_MS } from '../SDKConnectConstants';
import DevLogger from '../utils/DevLogger';

function approveHost({
  host,
  instance,
}: {
  host: approveHostProps['host'];
  instance: SDKConnect;
}) {
  const channelId = host.replace(AppConstants.MM_SDK.SDK_REMOTE_ORIGIN, '');
  if (instance.state.disabledHosts[host]) {
    // Might be useful for future feature.
  } else {
    const approvedUntil = Date.now() + DEFAULT_SESSION_TIMEOUT_MS;
    instance.state.approvedHosts[host] = approvedUntil;
    DevLogger.log(
      `SDKConnect approveHost ${host}`,
      instance.state.approvedHosts,
    );
    if (instance.state.connections[channelId]) {
      instance.state.connections[channelId].lastAuthorized = approvedUntil;
    }
    const connected = instance.state.connected[channelId];
    if (connected) {
      connected.lastAuthorized = approvedUntil;
      if (
        !connected.requiresReapproval &&
        instance.state.connections[channelId]
      ) {
        instance.state.connections[channelId].requiresReapproval = false;
      }
    }

    store.dispatch(resetConnections(instance.state.connections));
    store.dispatch(resetApprovedHosts(instance.state.approvedHosts));
  }
}

export default approveHost;
