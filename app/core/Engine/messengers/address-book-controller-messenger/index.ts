import type { AddressBookControllerMessenger } from '@metamask/address-book-controller';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the AddressBookControllerMessenger for the AddressBookController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The AddressBookControllerMessenger.
 */
export function getAddressBookControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): AddressBookControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'AddressBookController',
    allowedActions: [],
    allowedEvents: [],
  });
}
