import { getMultichainTransactionsControllerMessenger } from './multichain-transactions-controller-messenger';

describe('getMultichainTransactionsControllerMessenger', () => {
  it('should return a restricted messenger with correct allowed actions and events', () => {
    const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
    const mockMessenger = { getRestricted: mockRestricted } as any;

    const result = getMultichainTransactionsControllerMessenger(mockMessenger);

    expect(result).toBe('restricted-messenger');
    expect(mockRestricted).toHaveBeenCalledWith({
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
