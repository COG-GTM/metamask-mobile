import { getMultichainNetworkControllerMessenger } from './multichain-network-controller-messenger';

describe('getMultichainNetworkControllerMessenger', () => {
  it('should return a restricted messenger with correct allowed actions and events', () => {
    const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
    const mockMessenger = { getRestricted: mockRestricted } as any;

    const result = getMultichainNetworkControllerMessenger(mockMessenger);

    expect(result).toBe('restricted-messenger');
    expect(mockRestricted).toHaveBeenCalledWith({
      name: 'MultichainNetworkController',
      allowedActions: [
        'NetworkController:setActiveNetwork',
        'NetworkController:getState',
      ],
      allowedEvents: ['AccountsController:selectedAccountChange'],
    });
  });
});
