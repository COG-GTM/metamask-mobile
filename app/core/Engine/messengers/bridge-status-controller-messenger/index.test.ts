import { getBridgeStatusControllerMessenger } from '.';

describe('getBridgeStatusControllerMessenger', () => {
  it('should return a restricted messenger with correct allowed actions', () => {
    const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
    const mockMessenger = { getRestricted: mockRestricted } as any;

    const result = getBridgeStatusControllerMessenger(mockMessenger);

    expect(result).toBe('restricted-messenger');
    expect(mockRestricted).toHaveBeenCalledWith({
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
  });
});
