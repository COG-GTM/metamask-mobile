import { getMultichainAssetsControllerMessenger } from './multichain-assets-controller-messenger';

describe('getMultichainAssetsControllerMessenger', () => {
  it('should return a restricted messenger with correct allowed actions and events', () => {
    const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
    const mockMessenger = { getRestricted: mockRestricted } as any;

    const result = getMultichainAssetsControllerMessenger(mockMessenger);

    expect(result).toBe('restricted-messenger');
    expect(mockRestricted).toHaveBeenCalledWith({
      name: 'MultichainAssetsController',
      allowedEvents: [
        'AccountsController:accountAdded',
        'AccountsController:accountRemoved',
        'AccountsController:accountAssetListUpdated',
      ],
      allowedActions: [
        'PermissionController:getPermissions',
        'SnapController:handleRequest',
        'SnapController:getAll',
        'AccountsController:listMultichainAccounts',
      ],
    });
  });
});
