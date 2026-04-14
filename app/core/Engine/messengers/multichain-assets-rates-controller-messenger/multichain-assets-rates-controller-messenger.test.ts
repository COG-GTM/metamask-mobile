import { getMultichainAssetsRatesControllerMessenger } from './multichain-assets-rates-controller-messenger';

describe('getMultichainAssetsRatesControllerMessenger', () => {
  it('should return a restricted messenger with correct allowed actions and events', () => {
    const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
    const mockMessenger = { getRestricted: mockRestricted } as any;

    const result = getMultichainAssetsRatesControllerMessenger(mockMessenger);

    expect(result).toBe('restricted-messenger');
    expect(mockRestricted).toHaveBeenCalledWith({
      name: 'MultichainAssetsRatesController',
      allowedEvents: [
        'AccountsController:accountAdded',
        'KeyringController:lock',
        'KeyringController:unlock',
        'CurrencyRateController:stateChange',
        'MultichainAssetsController:stateChange',
      ],
      allowedActions: [
        'AccountsController:listMultichainAccounts',
        'SnapController:handleRequest',
        'CurrencyRateController:getState',
        'MultichainAssetsController:getState',
        'AccountsController:getSelectedMultichainAccount',
      ],
    });
  });
});
