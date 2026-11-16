import { RestrictedMessenger } from '@metamask/base-controller';
import { BaseControllerMessenger } from '../../types';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getMultichainAssetsControllerMessenger } from './multichain-assets-controller-messenger';

const EXPECTED_ALLOWED_EVENTS = [
  'AccountsController:accountAdded',
  'AccountsController:accountRemoved',
  'AccountsController:accountAssetListUpdated',
];

const EXPECTED_ALLOWED_ACTIONS = [
  'PermissionController:getPermissions',
  'SnapController:handleRequest',
  'SnapController:getAll',
  'AccountsController:listMultichainAccounts',
];

describe('getMultichainAssetsControllerMessenger', () => {
  const arrangeMocks = () => {
    const baseMessenger: BaseControllerMessenger =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
    return { baseMessenger, mockGetRestricted };
  };

  it('returns a restricted messenger with the exact name and allow-lists', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const restrictedMessenger =
      getMultichainAssetsControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'MultichainAssetsController',
      allowedEvents: EXPECTED_ALLOWED_EVENTS,
      allowedActions: EXPECTED_ALLOWED_ACTIONS,
    });
    expect(restrictedMessenger).toBeInstanceOf(RestrictedMessenger);
  });

  it.each(EXPECTED_ALLOWED_ACTIONS)(
    'delegates the allowed action %s to the base messenger',
    (actionType) => {
      const { baseMessenger } = arrangeMocks();
      const handler = jest.fn().mockReturnValue('result');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseMessenger as any).registerActionHandler(actionType, handler);

      const restrictedMessenger =
        getMultichainAssetsControllerMessenger(baseMessenger);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (restrictedMessenger as any).call(actionType, 'arg');

      expect(handler).toHaveBeenCalledWith('arg');
      expect(result).toBe('result');
    },
  );

  it.each(EXPECTED_ALLOWED_EVENTS)(
    'forwards the allowed event %s from the base messenger',
    (eventType) => {
      const { baseMessenger } = arrangeMocks();
      const restrictedMessenger =
        getMultichainAssetsControllerMessenger(baseMessenger);
      const listener = jest.fn();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (restrictedMessenger as any).subscribe(eventType, listener);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseMessenger as any).publish(eventType, 'payload');

      expect(listener).toHaveBeenCalledWith('payload');
    },
  );

  it('rejects actions outside the allow-list', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger =
      getMultichainAssetsControllerMessenger(baseMessenger);

    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (restrictedMessenger as any).call('KeyringController:getState'),
    ).toThrow(/Action missing from allow list: KeyringController:getState/u);
  });

  it('rejects events outside the allow-list', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger =
      getMultichainAssetsControllerMessenger(baseMessenger);

    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (restrictedMessenger as any).subscribe(
        'AccountsController:selectedAccountChange',
        jest.fn(),
      ),
    ).toThrow(
      /Event missing from allow list: AccountsController:selectedAccountChange/u,
    );
  });
});
