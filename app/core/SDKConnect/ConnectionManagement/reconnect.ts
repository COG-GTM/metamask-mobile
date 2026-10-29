import { resetConnections } from '../../../../app/actions/sdk';
import { store } from '../../../../app/store';
import Engine from '../../Engine';
import { Connection, ConnectionProps } from '../Connection';
import { revokeChannelPermissions } from '../handlers/checkPermissions';
import SDKConnect from '../SDKConnect';
import DevLogger from '../utils/DevLogger';
import { waitForCondition } from '../utils/wait.util';

async function reconnect({
  channelId,
  otherPublicKey,
  initialConnection,
  trigger,
  updateKey,
  context,
  instance,
}: {
  channelId: string;
  otherPublicKey: string;
  context?: string;
  updateKey?: boolean;
  protocolVersion?: ConnectionProps['protocolVersion'];
  trigger?: ConnectionProps['trigger'];
  initialConnection: boolean;
  instance: SDKConnect;
}) {
  try {
    const existingConnection: Connection | undefined =
      instance.state.connected[channelId];
    const storedConnection = instance.state.connections[channelId];
    // A new peer key on an existing channel is treated as a new, unapproved peer.
    const keyChanged =
      updateKey === true &&
      storedConnection !== undefined &&
      storedConnection.otherPublicKey !== otherPublicKey;

    // Check if already connected
    if (!keyChanged && existingConnection?.remote.isReady()) {
      DevLogger.log(
        `SDKConnect::reconnect[${context}] - already ready - ignore`,
      );
      if (trigger) {
        instance.state.connected[channelId].setTrigger(trigger);
      }
      instance.updateSDKLoadingState({ channelId, loading: false });

      return;
    }

    if (keyChanged) {
      console.warn(
        `SDKConnect::reconnect[${context}] existing=${
          existingConnection !== undefined
        } - otherPublicKey changed -- revoking permissions until user re-approves`,
      );
      revokeChannelPermissions({ engine: Engine, channelId });
      instance.disapproveChannel(channelId);
      storedConnection.otherPublicKey = otherPublicKey;
      // Persisted so the pending re-approval survives an app restart.
      storedConnection.requiresReapproval = true;
      store.dispatch(resetConnections(instance.state.connections));
      if (existingConnection) {
        existingConnection.remote.setOtherPublicKey(otherPublicKey);
        existingConnection.requiresReapproval = true;
      }
    }

    // Update initial connection state
    instance.state.connections[channelId].initialConnection = initialConnection;

    const wasPaused = existingConnection?.remote.isPaused();
    // Make sure the connection has resumed from pause before reconnecting.
    await waitForCondition({
      fn: () => !instance.state.paused,
      context: 'reconnect_from_pause',
    });
    if (wasPaused) {
      DevLogger.log(`SDKConnect::reconnect[${context}] - not paused anymore`);
    }
    const connecting = instance.state.connecting[channelId] === true;
    const socketConnected = existingConnection?.remote.isConnected() ?? false;

    DevLogger.log(
      `SDKConnect::reconnect[${context}][${trigger}] - channel=${channelId} paused=${
        instance.state.paused
      } connecting=${connecting} socketConnected=${socketConnected} existingConnection=${
        existingConnection !== undefined
      }`,
      otherPublicKey,
    );

    let interruptReason = '';

    if (connecting && trigger !== 'deeplink') {
      // Prioritize deeplinks -- interrup other connection attempts.
      interruptReason = 'already connecting';
    } else if (!instance.state.connections[channelId]) {
      interruptReason = 'no connection';
    }

    if (interruptReason) {
      DevLogger.log(
        `SDKConnect::reconnect - interrupting reason=${interruptReason}`,
      );
      return;
    }

    if (existingConnection) {
      const connected = existingConnection?.remote.isConnected();
      const ready = existingConnection?.isReady;
      if (trigger) {
        instance.state.connected[channelId].setTrigger(trigger);
        DevLogger.log(
          `SDKConnect::reconnect - connected=${connected} -- trigger updated to '${trigger}'`,
        );
        instance.updateSDKLoadingState({ channelId, loading: false });
      }

      if (ready && !keyChanged) {
        DevLogger.log(
          `SDKConnect::reconnect - already connected [ready=${ready}] -- ignoring`,
        );
        instance.updateSDKLoadingState({ channelId, loading: false });
        return;
      } else if (connected) {
        // disconnect socket before reconnecting to avoid room being full
        DevLogger.log(
          `SDKConnect::reconnect - disconnecting socket before reconnecting`,
        );
        existingConnection.remote.disconnect();
      }
    }

    DevLogger.log(
      `SDKConnect::reconnect - starting reconnection channel=${channelId}`,
    );

    const connection = instance.state.connections[channelId];
    DevLogger.log(`SDKConnect::reconnect - connection`, connection);
    instance.state.connecting[channelId] = true;
    instance.state.connected[channelId] = new Connection({
      ...connection,
      socketServerUrl: instance.state.socketServerUrl,
      otherPublicKey,
      reconnect: true,
      trigger,
      initialConnection,
      rpcQueueManager: instance.state.rpcqueueManager,
      navigation: instance.state.navigation,
      approveHost: instance._approveHost.bind(instance),
      disapprove: instance.disapproveChannel.bind(instance),
      getApprovedHosts: instance.getApprovedHosts.bind(instance),
      revalidate: instance.revalidateChannel.bind(instance),
      isApproved: instance.isApproved.bind(instance),
      updateOriginatorInfos: instance.updateOriginatorInfos.bind(instance),
      // eslint-disable-next-line @typescript-eslint/no-shadow
      onTerminate: ({ channelId }) => {
        instance.removeChannel({ channelId });
      },
    });
    const requiresReapproval =
      keyChanged ||
      connection.requiresReapproval === true ||
      existingConnection?.requiresReapproval === true;
    if (requiresReapproval) {
      instance.state.connected[channelId].requiresReapproval = true;
      instance.state.connected[channelId].isReady = false;
    }
    instance.state.connected[channelId].connect({
      withKeyExchange: true,
      // Never pre-authorize a peer the user has not approved yet.
      authorized:
        connection.originatorInfo !== undefined && !requiresReapproval,
    });

    instance.watchConnection(instance.state.connected[channelId]);
    const afterConnected =
      instance.state.connected[channelId].remote.isConnected() ?? false;
    instance.state.connecting[channelId] = !afterConnected; // If not connected, it means it's connecting.
  } catch (error) {
    DevLogger.log(`SDKConnect::reconnect[${context}] - error`, error);
  } finally {
    instance.state.connecting[channelId] = false;
  }
}

export default reconnect;
