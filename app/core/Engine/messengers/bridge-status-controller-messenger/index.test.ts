import { BaseControllerMessenger } from '../../types';
import { getBridgeStatusControllerMessenger } from '.';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';

describe('getBridgeStatusControllerMessenger', () => {
  const arrangeMocks = () => {
    const baseMessenger: BaseControllerMessenger =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
    return { baseMessenger, mockGetRestricted };
  };

  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const restrictedMessenger =
      getBridgeStatusControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'BridgeStatusController',
      allowedActions: [
        'AccountsController:getSelectedAccount',
        'NetworkController:getNetworkClientById',
        'NetworkController:findNetworkClientIdByChainId',
        'NetworkController:getState',
        'TransactionController:getState',
      ],
      allowedEvents: [],
    });

    expect(restrictedMessenger).toBeDefined();
  });

  it('delegates allowed actions to the base messenger and rejects others', () => {
    const { baseMessenger } = arrangeMocks();
    const mockFindNetworkClientIdByChainId = jest
      .fn()
      .mockReturnValue('mainnet');
    baseMessenger.registerActionHandler(
      'NetworkController:findNetworkClientIdByChainId',
      mockFindNetworkClientIdByChainId,
    );

    const restrictedMessenger =
      getBridgeStatusControllerMessenger(baseMessenger);

    expect(
      restrictedMessenger.call(
        'NetworkController:findNetworkClientIdByChainId',
        '0x1',
      ),
    ).toBe('mainnet');
    expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith('0x1');

    expect(() =>
      // @ts-expect-error - action is not in the allow-list
      restrictedMessenger.call('NetworkController:addNetwork', {}),
    ).toThrow('Action missing from allow list: NetworkController:addNetwork');
  });
});
