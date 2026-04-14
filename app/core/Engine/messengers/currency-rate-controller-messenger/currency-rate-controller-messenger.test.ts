import { getCurrencyRateControllerMessenger } from './currency-rate-controller-messenger';

describe('getCurrencyRateControllerMessenger', () => {
  it('should return a restricted messenger with correct allowed actions', () => {
    const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
    const mockMessenger = { getRestricted: mockRestricted } as any;

    const result = getCurrencyRateControllerMessenger(mockMessenger);

    expect(result).toBe('restricted-messenger');
    expect(mockRestricted).toHaveBeenCalledWith({
      name: 'CurrencyRateController',
      allowedActions: ['NetworkController:getNetworkClientById'],
      allowedEvents: [],
    });
  });
});
