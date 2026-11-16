import { getAccountsControllerMessenger } from '.';
import { BaseControllerMessenger } from '../../types';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';

const EXPECTED_ALLOWED_EVENTS = [
  'KeyringController:accountRemoved',
  'KeyringController:stateChange',
  'SnapController:stateChange',
  'SnapKeyring:accountAssetListUpdated',
  'SnapKeyring:accountBalancesUpdated',
  'SnapKeyring:accountTransactionsUpdated',
  'MultichainNetworkController:networkDidChange',
] as const;

const EXPECTED_ALLOWED_ACTIONS = [
  'KeyringController:getState',
  'KeyringController:getAccounts',
  'KeyringController:getKeyringsByType',
  'KeyringController:getKeyringForAccount',
] as const;

// Loosely typed views of the messengers so every allow-listed name can be
// exercised generically in loops.
interface LooseMessenger {
  registerActionHandler: (
    action: string,
    handler: (...args: unknown[]) => unknown,
  ) => void;
  call: (action: string, ...args: unknown[]) => unknown;
  publish: (event: string, ...payload: unknown[]) => void;
  subscribe: (event: string, handler: (...payload: unknown[]) => void) => void;
}

describe('getAccountsControllerMessenger', () => {
  const arrangeMocks = () => {
    const baseMessenger: BaseControllerMessenger =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
    return { baseMessenger, mockGetRestricted };
  };

  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const restrictedMessenger = getAccountsControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'AccountsController',
      allowedEvents: [...EXPECTED_ALLOWED_EVENTS],
      allowedActions: [...EXPECTED_ALLOWED_ACTIONS],
    });
    expect(restrictedMessenger).toBeDefined();
  });

  it('can call KeyringController:getAccounts registered on the base messenger', async () => {
    const { baseMessenger } = arrangeMocks();
    const accounts = ['0x0000000000000000000000000000000000000001'];
    const getAccountsHandler = jest.fn().mockResolvedValue(accounts);
    baseMessenger.registerActionHandler(
      'KeyringController:getAccounts',
      getAccountsHandler,
    );

    // `AccountsControllerMessenger`'s type omits this action even though the
    // runtime allow-list includes it, so call through the loose view.
    const restrictedMessenger = getAccountsControllerMessenger(
      baseMessenger,
    ) as unknown as LooseMessenger;

    await expect(
      restrictedMessenger.call('KeyringController:getAccounts'),
    ).resolves.toStrictEqual(accounts);
    expect(getAccountsHandler).toHaveBeenCalledTimes(1);
  });

  it('receives KeyringController:stateChange published on the base messenger', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger = getAccountsControllerMessenger(baseMessenger);
    const listener = jest.fn();
    const state = { isUnlocked: true, keyrings: [] };

    restrictedMessenger.subscribe('KeyringController:stateChange', listener);
    (baseMessenger as unknown as LooseMessenger).publish(
      'KeyringController:stateChange',
      state,
      [],
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(state, []);
  });

  it.each(EXPECTED_ALLOWED_ACTIONS)('can call allowed action %s', (action) => {
    const { baseMessenger } = arrangeMocks();
    const handler = jest.fn().mockReturnValue(action);
    (baseMessenger as unknown as LooseMessenger).registerActionHandler(
      action,
      handler,
    );

    const restrictedMessenger = getAccountsControllerMessenger(
      baseMessenger,
    ) as unknown as LooseMessenger;

    expect(restrictedMessenger.call(action, 'arg')).toBe(action);
    expect(handler).toHaveBeenCalledWith('arg');
  });

  it.each(EXPECTED_ALLOWED_EVENTS)(
    'can subscribe to allowed event %s',
    (event) => {
      const { baseMessenger } = arrangeMocks();
      const restrictedMessenger = getAccountsControllerMessenger(
        baseMessenger,
      ) as unknown as LooseMessenger;
      const listener = jest.fn();

      restrictedMessenger.subscribe(event, listener);
      (baseMessenger as unknown as LooseMessenger).publish(event, 'payload');

      expect(listener).toHaveBeenCalledWith('payload');
    },
  );

  it('rejects actions that are not allow-listed', () => {
    const { baseMessenger } = arrangeMocks();
    (baseMessenger as unknown as LooseMessenger).registerActionHandler(
      'KeyringController:withKeyring',
      jest.fn(),
    );

    const restrictedMessenger = getAccountsControllerMessenger(
      baseMessenger,
    ) as unknown as LooseMessenger;

    expect(() =>
      restrictedMessenger.call('KeyringController:withKeyring'),
    ).toThrow(/missing from allow list/u);
  });

  it('rejects subscriptions to events that are not allow-listed', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger = getAccountsControllerMessenger(
      baseMessenger,
    ) as unknown as LooseMessenger;

    expect(() =>
      restrictedMessenger.subscribe('KeyringController:unlock', jest.fn()),
    ).toThrow(/missing from allow list/u);
  });
});
