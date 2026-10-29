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

export const TERMINATE_TIMEOUT_MS = 5000;

async function sendTerminateBestEffort({
  channelId,
  connection,
}: {
  channelId: string;
  connection: Connection;
}): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let terminated = false;
  try {
    terminated = await Promise.race([
      connection.removeConnection({
        terminate: true,
        context: 'SDKConnect::removeChannel',
      }),
      new Promise<boolean>((resolve) => {
        timeoutId = setTimeout(() => resolve(false), TERMINATE_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    console.error(`Can't remove connection ${channelId}`, err);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  if (!terminated) {
    DevLogger.log(
      `SDKConnect::removeChannel channelId=${channelId} terminate not delivered, closing locally`,
    );
    try {
      connection.backgroundBridge?.onDisconnect();
      connection.remote?.disconnect();
    } catch (err) {
      console.error(`Can't close connection ${channelId}`, err);
    }
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

  DevLogger.log(
    `SDKConnect::removeChannel ${channelId} sendTerminate=${sendTerminate} isDappConnection=${isDappConnection} connectedted=${
      instance.state.connected[channelId] !== undefined
    }`,
  );

  if (isDappConnection) {
    instance.state.androidService?.removeConnection(channelId);
    instance.state.deeplinkingService?.removeConnection(channelId);
  }

  const connection = instance.state.connected[channelId];

  // Revoke locally first so an unreachable dapp cannot keep its access.
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
    try {
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
    } catch (err) {
      console.error(`Can't revoke permissions for ${channelId}`, err);
    }
  }

  if (connection) {
    await sendTerminateBestEffort({ channelId, connection });
  }

  return true;
}

export default removeChannel;
