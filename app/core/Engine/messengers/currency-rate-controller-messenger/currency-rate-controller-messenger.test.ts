import { BaseControllerMessenger } from '../../types';
import { getCurrencyRateControllerMessenger } from './currency-rate-controller-messenger';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';

describe('getCurrencyRateControllerMessenger', () => {
  const arrangeMocks = () => {
    const baseMessenger: BaseControllerMessenger =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
    return { baseMessenger, mockGetRestricted };
  };

  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const restrictedMessenger =
      getCurrencyRateControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'CurrencyRateController',
      allowedActions: ['NetworkController:getNetworkClientById'],
      allowedEvents: [],
    });

    expect(restrictedMessenger).toBeDefined();
  });

  it('allows calling NetworkController:getNetworkClientById', () => {
    const { baseMessenger } = arrangeMocks();
    const mockNetworkClient = { configuration: { ticker: 'ETH' } };
    const mockGetNetworkClientById = jest
      .fn()
      .mockReturnValue(mockNetworkClient);
    baseMessenger.registerActionHandler(
      'NetworkController:getNetworkClientById',
      mockGetNetworkClientById,
    );

    const restrictedMessenger =
      getCurrencyRateControllerMessenger(baseMessenger);

    expect(
      restrictedMessenger.call(
        'NetworkController:getNetworkClientById',
        'mainnet',
      ),
    ).toBe(mockNetworkClient);
    expect(mockGetNetworkClientById).toHaveBeenCalledWith('mainnet');
  });
});
