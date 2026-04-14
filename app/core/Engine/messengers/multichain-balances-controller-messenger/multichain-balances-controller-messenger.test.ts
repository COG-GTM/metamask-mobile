import { getMultichainBalancesControllerMessenger } from './multichain-balances-controller-messenger';

describe('getMultichainBalancesControllerMessenger', () => {
  it('should return a restricted messenger with correct allowed actions and events', () => {
    const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
    const mockMessenger = { getRestricted: mockRestricted } as any;

    const result = getMultichainBalancesControllerMessenger(mockMessenger);

    expect(result).toBe('restricted-messenger');
    expect(mockRestricted).toHaveBeenCalledWith({
      name: 'MultichainBalancesController',
      allowedEvents: [
        'AccountsController:accountAdded',
        'AccountsController:accountRemoved',
        'AccountsController:accountBalancesUpdated',
        'MultichainAssetsController:stateChange',
      ],
      allowedActions: [
        'AccountsController:listMultichainAccounts',
        'SnapController:handleRequest',
        'MultichainAssetsController:getState',
        'KeyringController:getState',
      ],
    });
  });
});
