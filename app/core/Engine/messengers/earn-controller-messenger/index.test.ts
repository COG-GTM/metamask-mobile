import { getEarnControllerMessenger } from '.';
import { BaseControllerMessenger } from '../../types';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';

const EXPECTED_ALLOWED_EVENTS = [
  'AccountsController:selectedAccountChange',
  'NetworkController:stateChange',
  'TransactionController:transactionConfirmed',
] as const;

const EXPECTED_ALLOWED_ACTIONS = [
  'AccountsController:getSelectedAccount',
  'NetworkController:getNetworkClientById',
  'NetworkController:getState',
] as const;

describe('getEarnControllerMessenger', () => {
  const arrangeMocks = () => {
    const baseMessenger: BaseControllerMessenger =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
    return { baseMessenger, mockGetRestricted };
  };

  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const restrictedMessenger = getEarnControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'EarnController',
      allowedEvents: [...EXPECTED_ALLOWED_EVENTS],
      allowedActions: [...EXPECTED_ALLOWED_ACTIONS],
    });
    expect(restrictedMessenger).toBeDefined();
  });

  it.each(EXPECTED_ALLOWED_EVENTS)('allows subscribing to %s', (eventType) => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger = getEarnControllerMessenger(baseMessenger);

    expect(() =>
      restrictedMessenger.subscribe(eventType, jest.fn()),
    ).not.toThrow();
  });

  it('throws when subscribing to an event that is not allowed', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger = getEarnControllerMessenger(baseMessenger);

    expect(() =>
      restrictedMessenger.subscribe(
        // @ts-expect-error - event intentionally missing from the allow-list
        'KeyringController:unlock',
        jest.fn(),
      ),
    ).toThrow('Event missing from allow list: KeyringController:unlock');
  });

  it.each(EXPECTED_ALLOWED_ACTIONS)('allows calling %s', (actionType) => {
    const { baseMessenger } = arrangeMocks();
    const handler = jest.fn();
    baseMessenger.registerActionHandler(actionType, handler);
    const restrictedMessenger = getEarnControllerMessenger(baseMessenger);

    restrictedMessenger.call(actionType);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('throws when calling an action that is not allowed', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger = getEarnControllerMessenger(baseMessenger);

    expect(() =>
      // @ts-expect-error - action intentionally missing from the allow-list
      restrictedMessenger.call('KeyringController:getState'),
    ).toThrow('Action missing from allow list: KeyringController:getState');
  });
});
