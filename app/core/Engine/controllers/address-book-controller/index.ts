import {
  AddressBookController,
  type AddressBookControllerMessenger,
} from '@metamask/address-book-controller';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the AddressBookController.
 *
 * @param request - The request object.
 * @returns The AddressBookController.
 */
export const addressBookControllerInit: ControllerInitFunction<
  AddressBookController,
  AddressBookControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new AddressBookController({
    messenger: controllerMessenger,
    state: persistedState.AddressBookController,
  });

  return { controller };
};
