import { BaseControllerMessenger } from '../../types';

/**
 * Get the BridgeStatusControllerMessenger for the BridgeStatusController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The BridgeStatusControllerMessenger.
 */
export function getBridgeStatusControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
) {
  return baseControllerMessenger.getRestricted({
    name: 'BridgeStatusController',
    allowedActions: [
      'AccountsController:getSelectedMultichainAccount',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getState',
      'BridgeController:getBridgeERC20Allowance',
      'BridgeController:trackUnifiedSwapBridgeEvent',
      'GasFeeController:getState',
      'AccountsController:getAccountByAddress',
      'SnapController:handleRequest',
      'TransactionController:getState',
    ],
    allowedEvents: [],
  });
}
