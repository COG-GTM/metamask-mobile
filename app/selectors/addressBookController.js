
import { createSelector } from 'reselect';

import { createDeepEqualSelector } from './util';


export const selectAddressBookControllerState = (state) =>
state.engine.backgroundState.AddressBookController;

export const selectAddressBook = createSelector(
  selectAddressBookControllerState,
  (addressBookControllerState) =>
  addressBookControllerState.addressBook
);

export const selectAddressBookByChain = createDeepEqualSelector(
  [selectAddressBook,
  (_state, chainId) => chainId],
  (addressBook, chainId) => {
    if (!addressBook[chainId]) {
      return [];
    }
    return Object.values(addressBook[chainId]);
  }
);