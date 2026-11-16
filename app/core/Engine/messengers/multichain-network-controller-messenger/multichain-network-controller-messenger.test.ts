import { BaseControllerMessenger } from '../../types';
import { getMultichainNetworkControllerMessenger } from './multichain-network-controller-messenger';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';

describe('getMultichainNetworkControllerMessenger', () => {
  const arrangeMocks = () => {
    const baseMessenger: BaseControllerMessenger =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
    return { baseMessenger, mockGetRestricted };
  };

  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const restrictedMessenger =
      getMultichainNetworkControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'MultichainNetworkController',
      allowedActions: [
        'NetworkController:setActiveNetwork',
        'NetworkController:getState',
      ],
      allowedEvents: ['AccountsController:selectedAccountChange'],
    });
    expect(restrictedMessenger).toBeDefined();
  });

  it('delegates allowed NetworkController actions to the base messenger', async () => {
    const { baseMessenger } = arrangeMocks();
    const mockSetActiveNetwork = jest.fn().mockResolvedValue(undefined);
    const mockGetState = jest.fn().mockReturnValue({
      selectedNetworkClientId: 'mainnet',
    });
    baseMessenger.registerActionHandler(
      'NetworkController:setActiveNetwork',
      mockSetActiveNetwork,
    );
    baseMessenger.registerActionHandler(
      'NetworkController:getState',
      mockGetState,
    );

    const restrictedMessenger =
      getMultichainNetworkControllerMessenger(baseMessenger);

    await restrictedMessenger.call(
      'NetworkController:setActiveNetwork',
      'linea-mainnet',
    );
    const state = restrictedMessenger.call('NetworkController:getState');

    expect(mockSetActiveNetwork).toHaveBeenCalledWith('linea-mainnet');
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(state).toStrictEqual({ selectedNetworkClientId: 'mainnet' });
  });

  it('forwards AccountsController:selectedAccountChange events to subscribers', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger =
      getMultichainNetworkControllerMessenger(baseMessenger);
    const handler = jest.fn();
    const account = { id: 'account-1' };

    restrictedMessenger.subscribe(
      'AccountsController:selectedAccountChange',
      handler,
    );
    baseMessenger.publish(
      'AccountsController:selectedAccountChange',
      // @ts-expect-error - partial InternalAccount is sufficient for this test
      account,
    );

    expect(handler).toHaveBeenCalledWith(account);
  });

  it('rejects actions outside the allow-list', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger =
      getMultichainNetworkControllerMessenger(baseMessenger);

    expect(() =>
      // @ts-expect-error - intentionally calling a disallowed action
      restrictedMessenger.call('NetworkController:removeNetwork', '0x1'),
    ).toThrow(
      'Action missing from allow list: NetworkController:removeNetwork',
    );
  });
});
