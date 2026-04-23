import { NetworkController, NetworkState, NetworkStatus } from '@metamask/network-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { ApprovalController } from '@metamask/approval-controller';
import NotificationManager from '../NotificationManager';
import AppConstants from '../AppConstants';
import { store } from '../../store';
import {
  networkIdUpdated,
  networkIdWillUpdate,
} from '../../core/redux/slices/inpageProvider';
import { deprecatedGetNetworkId } from '../../util/networks/engineNetworkUtils';
import { getGlobalChainId } from '../../util/networks/global-network';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import { RestrictedMethods } from '../Permissions/constants';
///: END:ONLY_INCLUDE_IF
import type { BaseControllerMessenger } from './types';

export interface SetupEngineSubscriptionsArgs {
  controllerMessenger: BaseControllerMessenger;
  networkController: NetworkController;
  approvalController: ApprovalController;
  currentChainIdRef: { value: string };
  configureControllersOnNetworkChange: () => void;
  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  snapController: { name: string };
  ///: END:ONLY_INCLUDE_IF
}

/**
 * Sets up event subscriptions on the controller messenger for Engine.
 *
 * @param args - Dependencies for setting up subscriptions.
 */
export function setupEngineSubscriptions(args: SetupEngineSubscriptionsArgs) {
  const {
    controllerMessenger,
    networkController,
    approvalController,
    currentChainIdRef,
    configureControllersOnNetworkChange,
    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
    snapController,
    ///: END:ONLY_INCLUDE_IF
  } = args;

  controllerMessenger.subscribe(
    'TransactionController:incomingTransactionsReceived',
    (incomingTransactions: TransactionMeta[]) => {
      NotificationManager.gotIncomingTransaction(incomingTransactions);
    },
  );

  controllerMessenger.subscribe(
    AppConstants.NETWORK_STATE_CHANGE_EVENT,
    (state: NetworkState) => {
      if (
        state.networksMetadata[state.selectedNetworkClientId].status ===
        NetworkStatus.Available &&
        getGlobalChainId(networkController) !== currentChainIdRef.value
      ) {
        setTimeout(() => {
          configureControllersOnNetworkChange();
          currentChainIdRef.value = getGlobalChainId(networkController);
        }, 500);
      }
    },
  );

  controllerMessenger.subscribe(
    AppConstants.NETWORK_STATE_CHANGE_EVENT,
    async () => {
      try {
        const networkId = await deprecatedGetNetworkId();
        store.dispatch(networkIdUpdated(networkId));
      } catch (error) {
        console.error(
          error,
          `Network ID not changed, current chainId: ${getGlobalChainId(
            networkController,
          )}`,
        );
      }
    },
  );

  controllerMessenger.subscribe(
    `${networkController.name}:networkWillChange`,
    () => {
      store.dispatch(networkIdWillUpdate());
    },
  );

  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  controllerMessenger.subscribe(
    `${snapController.name}:snapTerminated`,
    (truncatedSnap) => {
      const approvals = Object.values(
        approvalController.state.pendingApprovals,
      ).filter(
        (approval) =>
          approval.origin === truncatedSnap.id &&
          approval.type.startsWith(RestrictedMethods.snap_dialog),
      );
      for (const approval of approvals) {
        approvalController.reject(
          approval.id,
          new Error('Snap was terminated.'),
        );
      }
    },
  );
  ///: END:ONLY_INCLUDE_IF
}
