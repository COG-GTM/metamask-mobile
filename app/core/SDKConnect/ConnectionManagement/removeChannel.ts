import { PermissionController } from '@metamask/permission-controller';
import {
  removeApprovedHost,
  removeConnection,
} from '../../../../app/actions/sdk';
import { store } from '../../../../app/store';
import AppConstants from '../../../core/AppConstants';
import Engine from '../../Engine';
import { Connection } from '../Connection';
import SDKConnect from '../SDKConnect';
import DevLogger from '../utils/DevLogger';

export const TERMINATE_TIMEOUT_MS = 3000;

async function sendTerminateWithTimeout({
  connection,
  sendTerminate,
}: {
  connection: Connection;
  sendTerminate: boolean;
}): Promise<boolean> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timeoutId = setTimeout(() => resolve(false), TERMINATE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([
      connection.removeConnection({
        terminate: sendTerminate,
        context: 'SDKConnect::removeChannel',
      }),
      timeout,
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function closeConnection({
  connection,
  channelId,
  sendTerminate,
}: {
  connection: Connection;
  channelId: string;
  sendTerminate: boolean;
}) {
  let terminated = false;
  try {
    terminated = await sendTerminateWithTimeout({ connection, sendTerminate });
  } catch (err) {
    console.error(`Can't remove connection ${channelId}`, err);
  }

  if (terminated) {
    return;
  }

  // The dapp could not be told (offline, relay failure or timeout): tear the
  // session down locally so it cannot be resumed with the old keys.
  DevLogger.log(
    `SDKConnect::removeChannel channelId=${channelId} sendTerminate=${sendTerminate} terminated=false, closing locally`,
  );
  try {
    connection.backgroundBridge?.onDisconnect();
    connection.isReady = false;
    connection.lastAuthorized = 0;
    connection.authorizedSent = false;
    await connection.remote.disconnect({ terminate: true, sendMessage: false });
  } catch (err) {
    console.error(`Can't close connection ${channelId}`, err);
  }
}

async function removeChannel({
  channelId,
  engine,
  sendTerminate,
  instance,
}: {
  channelId: string;
  engine?: typeof Engine;
  sendTerminate?: boolean;
  instance: SDKConnect;
}): Promise<boolean> {
  // check if it is an android sdk connection, if it doesn't belong to regular connections
  const isDappConnection = instance.state.connections[channelId] === undefined;
  const connection = instance.state.connected[channelId];

  DevLogger.log(
    `SDKConnect::removeChannel ${channelId} sendTerminate=${sendTerminate} isDappConnection=${isDappConnection} connected=${
      connection !== undefined
    }`,
  );

  if (isDappConnection) {
    instance.state.androidService?.removeConnection(channelId);
    instance.state.deeplinkingService?.removeConnection(channelId);
  }

  // Revoke locally before notifying the dapp, so a dapp that cannot be
  // reached keeps neither its session nor its permissions.
  delete instance.state.connected[channelId];
  delete instance.state.connections[channelId];
  delete instance.state.approvedHosts[
    AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + channelId
  ];

  delete instance.state.disabledHosts[
    AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + channelId
  ];

  store.dispatch(removeConnection(channelId));
  store.dispatch(removeApprovedHost(channelId));

  delete instance.state.connecting[channelId];
  if (engine) {
    // Remove matching permissions from controller
    const permissionsController = (
      engine.context as {
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        PermissionController: PermissionController<any, any>;
      }
    ).PermissionController;
    if (permissionsController.getPermissions(channelId)) {
      permissionsController.revokeAllPermissions(channelId);
    }
  }

  if (connection) {
    await closeConnection({
      connection,
      channelId,
      sendTerminate: Boolean(sendTerminate),
    });
  }

  return true;
}

export default removeChannel;
