import { getSignatureControllerMessenger } from './signature-controller-messenger';

describe('getSignatureControllerMessenger', () => {
  it('should return a restricted messenger with correct allowed actions', () => {
    const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
    const mockMessenger = { getRestricted: mockRestricted } as any;

    const result = getSignatureControllerMessenger(mockMessenger);

    expect(result).toBe('restricted-messenger');
    expect(mockRestricted).toHaveBeenCalledWith({
      name: 'SignatureController',
      allowedActions: [
        'AccountsController:getState',
        'ApprovalController:addRequest',
        'LoggingController:add',
        'NetworkController:getNetworkClientById',
        'KeyringController:signMessage',
        'KeyringController:signPersonalMessage',
        'KeyringController:signTypedMessage',
      ],
      allowedEvents: [],
    });
  });
});
