import {
  NetworkController,
  NetworkState,
  NetworkStatus,
} from '@metamask/network-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { ApprovalController } from '@metamask/approval-controller';
import AppConstants from '../AppConstants';
import NotificationManager from '../NotificationManager';
import { deprecatedGetNetworkId } from '../../util/networks/engineNetworkUtils';
import { getGlobalChainId } from '../../util/networks/global-network';
import { store } from '../../store';
import {
  networkIdUpdated,
  networkIdWillUpdate,
} from '../../core/redux/slices/inpageProvider';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import { RestrictedMethods } from '../Permissions/constants';
///: END:ONLY_INCLUDE_IF
import type { BaseControllerMessenger } from './types';

interface SetupEngineSubscriptionsParams {
  controllerMessenger: BaseControllerMessenger;
  networkController: NetworkController;
  approvalController: ApprovalController;
  configureControllersOnNetworkChange: () => void;
  getCurrentChainId: () => string | undefined;
  setCurrentChainId: (chainId: string) => void;
  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  snapControllerName: string;
  ///: END:ONLY_INCLUDE_IF
}

/**
 * Sets up event subscriptions for the Engine.
 *
 * @param params - Parameters containing controller references and callbacks.
 */
export function setupEngineSubscriptions(
  params: SetupEngineSubscriptionsParams,
): void {
  const {
    controllerMessenger,
    networkController,
    approvalController,
    configureControllersOnNetworkChange,
    getCurrentChainId,
    setCurrentChainId,
    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
    snapControllerName,
    ///: END:ONLY_INCLUDE_IF
  } = params;

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
        getGlobalChainId(networkController) !== getCurrentChainId()
      ) {
        // We should add a state or event emitter saying the provider changed
        setTimeout(() => {
          configureControllersOnNetworkChange();
          setCurrentChainId(getGlobalChainId(networkController));
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
    `${snapControllerName}:snapTerminated`,
    (truncatedSnap: { id: string }) => {
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
