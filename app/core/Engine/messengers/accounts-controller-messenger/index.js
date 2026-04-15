
import { SnapControllerStateChangeEvent } from '../../controllers/snaps';

import {
  SnapKeyringAccountAssetListUpdatedEvent,
  SnapKeyringAccountBalancesUpdatedEvent,
  SnapKeyringAccountTransactionsUpdatedEvent } from
'../../../SnapKeyring/constants';

// Export the types
export * from './types';

/**
 * Get the AccountsControllerMessenger for the AccountsController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The AccountsControllerMessenger.
 */
export function getAccountsControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'AccountsController',
    allowedEvents: [
    'KeyringController:accountRemoved',
    'KeyringController:stateChange',
    SnapControllerStateChangeEvent,
    SnapKeyringAccountAssetListUpdatedEvent,
    SnapKeyringAccountBalancesUpdatedEvent,
    SnapKeyringAccountTransactionsUpdatedEvent,
    'MultichainNetworkController:networkDidChange'],

    allowedActions: [
    'KeyringController:getState',
    'KeyringController:getAccounts',
    'KeyringController:getKeyringsByType',
    'KeyringController:getKeyringForAccount']

  });
}