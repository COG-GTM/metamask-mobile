import { getAccountsControllerMessenger } from '.';

describe('getAccountsControllerMessenger', () => {
  it('should return a restricted messenger with correct allowed actions and events', () => {
    const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
    const mockMessenger = { getRestricted: mockRestricted } as any;

    const result = getAccountsControllerMessenger(mockMessenger);

    expect(result).toBe('restricted-messenger');
    expect(mockRestricted).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'AccountsController',
        allowedActions: expect.arrayContaining([
          'KeyringController:getState',
          'KeyringController:getAccounts',
          'KeyringController:getKeyringsByType',
          'KeyringController:getKeyringForAccount',
        ]),
        allowedEvents: expect.arrayContaining([
          'KeyringController:accountRemoved',
          'KeyringController:stateChange',
        ]),
      }),
    );
  });
});
