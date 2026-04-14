import { getBridgeControllerMessenger } from '.';

describe('getBridgeControllerMessenger', () => {
  it('should return a restricted messenger with correct allowed actions', () => {
    const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
    const mockMessenger = { getRestricted: mockRestricted } as any;

    const result = getBridgeControllerMessenger(mockMessenger);

    expect(result).toBe('restricted-messenger');
    expect(mockRestricted).toHaveBeenCalledWith({
      name: 'BridgeController',
      allowedActions: [
        'AccountsController:getSelectedAccount',
        'NetworkController:findNetworkClientIdByChainId',
        'NetworkController:getState',
        'NetworkController:getNetworkClientById',
      ],
      allowedEvents: [],
    });
  });
});
