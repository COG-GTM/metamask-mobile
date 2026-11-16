import { RestrictedMessenger } from '@metamask/base-controller';
import { getMultichainTransactionsControllerMessenger } from './multichain-transactions-controller-messenger';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { BaseControllerMessenger } from '../../types';

describe('getMultichainTransactionsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const baseControllerMessenger: BaseControllerMessenger =
      new ExtendedControllerMessenger();

    const messenger = getMultichainTransactionsControllerMessenger(
      baseControllerMessenger,
    );

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('restricts the messenger to the expected actions and events', () => {
    const baseControllerMessenger: BaseControllerMessenger =
      new ExtendedControllerMessenger();
    const getRestrictedSpy = jest.spyOn(
      baseControllerMessenger,
      'getRestricted',
    );

    getMultichainTransactionsControllerMessenger(baseControllerMessenger);

    expect(getRestrictedSpy).toHaveBeenCalledTimes(1);
    expect(getRestrictedSpy).toHaveBeenCalledWith({
      name: 'MultichainTransactionsController',
      allowedEvents: [
        'AccountsController:accountAdded',
        'AccountsController:accountRemoved',
        'AccountsController:accountTransactionsUpdated',
      ],
      allowedActions: [
        'AccountsController:listMultichainAccounts',
        'SnapController:handleRequest',
        'KeyringController:getState',
      ],
    });
  });
});
