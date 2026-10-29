import { KeyringController } from '@metamask/keyring-controller';
import { PermissionController } from '@metamask/permission-controller';
import { CommunicationLayerMessage } from '@metamask/sdk-communication-layer';
import {
  Caip25EndowmentPermissionName,
  Caip25CaveatType,
} from '@metamask/chain-agnostic-permission';
import Routes from '../../../constants/navigation/Routes';
import Engine from '../../Engine';
import {
  getDefaultCaip25CaveatValue,
  getPermittedAccounts,
} from '../../Permissions';
import { Connection } from '../Connection';
import DevLogger from '../utils/DevLogger';
import {
  wait,
  waitForCondition,
  waitForKeychainUnlocked,
} from '../utils/wait.util';
import { Platform } from 'react-native';

/**
 * Revokes every permission granted to an SDK channel, if it has any.
 *
 * @param params - The parameters.
 * @param params.engine - Engine providing the PermissionController.
 * @param params.channelId - SDK channel id, used as the permission subject.
 */
export const revokeChannelPermissions = ({
  engine,
  channelId,
}: {
  engine: typeof Engine;
  channelId: string;
}) => {
  const permissionsController = (
    engine.context as {
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      PermissionController: PermissionController<any, any>;
    }
  ).PermissionController;
  if (permissionsController?.getPermissions(channelId)) {
    permissionsController.revokeAllPermissions(channelId);
  }
};

interface CheckPermissionsParams {
  connection: Connection;
  engine: typeof Engine;
  message?: CommunicationLayerMessage;
  lastAuthorized?: number;
  /**
   * Require explicit user re-approval even if the channel already holds permissions.
   * Existing permissions are revoked first so a rejection leaves the channel without access.
   */
  forcePrompt?: boolean;
}

// TODO: should be more generic and be used in wallet connect and android service as well
const runCheckPermissions = async ({
  connection,
  engine,
  message,
  lastAuthorized,
  forcePrompt = false,
}: CheckPermissionsParams): Promise<boolean> => {
  try {
    // close poientially open loading modal
    connection.setLoading(false);
    const currentRouteName = connection.navigation?.getCurrentRoute()?.name;

    DevLogger.log(
      `checkPermissions initialConnection=${connection.initialConnection} method=${message?.method} lastAuthorized=${lastAuthorized} forcePrompt=${forcePrompt}`,
      connection.originatorInfo,
    );

    if (forcePrompt) {
      connection.approvalPromise = undefined;
      revokeChannelPermissions({ engine, channelId: connection.channelId });
    }

    const permittedAccounts = getPermittedAccounts(connection.channelId);
    DevLogger.log(`checkPermissions permittedAccounts`, permittedAccounts);

    if (!forcePrompt && permittedAccounts.length > 0) {
      return true;
    }

    const permissionsController = (
      engine.context as {
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        PermissionController: PermissionController<any, any>;
      }
    ).PermissionController;

    // Make sure to wait for user to be on main pages before requesting permissions or request can get cancelled.
    const pendingRoutes = [Routes.LOCK_SCREEN, Routes.ONBOARDING.LOGIN];

    if (currentRouteName && pendingRoutes.includes(currentRouteName)) {
      await waitForCondition({
        fn: (): boolean => {
          const activeRoute = connection.navigation?.getCurrentRoute()?.name;
          return Boolean(activeRoute && !pendingRoutes.includes(activeRoute));
        },
        waitTime: 1000,
        context: 'checkPermissions',
      });
      // Add extra time on IOS since it takes longer to initialize keychain and detect that it is unlocked
    }

    // Wait for keychain to be unlocked before handling rpc calls.
    const keyringController = (
      engine.context as { KeyringController: KeyringController }
    ).KeyringController;

    await waitForKeychainUnlocked({
      keyringController,
      context: 'connection::on_message',
    });

    if (connection.approvalPromise && !forcePrompt) {
      DevLogger.log(
        `checkPermissions approvalPromise exists currentRouteName=${currentRouteName}`,
      );
      const allowed = (await connection.approvalPromise) as boolean;
      DevLogger.log(
        `checkPermissions approvalPromise exists completed -- allowed`,
        allowed,
      );
      // Add delay for backgroundBridge to complete setup
      await wait(300);
      return allowed;
    }

    const caip25Permission = permissionsController.getPermission(
      connection.channelId,
      Caip25EndowmentPermissionName,
    );
    const moreAccountPermission = permissionsController.getPermissions(
      connection.channelId,
    );
    DevLogger.log(
      `checkPermissions caip25Permission`,
      caip25Permission,
      moreAccountPermission,
    );
    if (!caip25Permission || forcePrompt) {
      connection.approvalPromise = permissionsController.requestPermissions(
        { origin: connection.channelId },
        {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: getDefaultCaip25CaveatValue(),
              },
            ],
          },
        },
        {
          preserveExistingPermissions: false,
        },
      );
    }

    const res = await connection.approvalPromise;
    if (Platform.OS === 'ios') {
      // A UI crash happening on ios from AccountConnect.tsx which is triggered by permissionsController.getPermission().
      // Seems to be a race condition between the connect being accepted and the approvalPromise being resolved.
      // Adding a small delay seems to fix the issue.
      // *** Assertion failure in -[RCTNativeAnimatedNodesManager disconnectAnimatedNodes:childTag:](), metamask-mobile/node_modules/react-native/Libraries/NativeAnimation/RCTNativeAnimatedNodesManager.m:142
      // Exception thrown while executing UI block: 'childNode' is a required parameter
      // 0x14146e100 - GPUProcessProxy::gpuProcessExited: reason=IdleExit
      await wait(100);
    }
    const accounts = getPermittedAccounts(connection.channelId);
    DevLogger.log(`checkPermissions approvalPromise completed`, res);
    return accounts.length > 0;
  } catch (err) {
    console.warn(`checkPermissions error`, err);
    connection.approvalPromise = undefined;
    throw err;
  }
};

/**
 * Ensures the SDK channel is allowed to use the wallet, prompting the user when needed.
 *
 * With `forcePrompt`, all concurrent callers share one prompt and
 * `connection.requiresReapproval` is only cleared once the user approves.
 *
 * @param params - The parameters.
 * @returns Whether the channel has permitted accounts.
 */
export const checkPermissions = async (
  params: CheckPermissionsParams,
): Promise<boolean> => {
  const { connection, forcePrompt } = params;
  if (!forcePrompt) {
    return runCheckPermissions(params);
  }
  if (!connection.reapprovalPromise) {
    connection.reapprovalPromise = runCheckPermissions(params)
      .then((approved) => {
        if (approved) {
          connection.requiresReapproval = false;
        }
        return approved;
      })
      .finally(() => {
        connection.reapprovalPromise = undefined;
      });
  }
  return connection.reapprovalPromise;
};

export default checkPermissions;
