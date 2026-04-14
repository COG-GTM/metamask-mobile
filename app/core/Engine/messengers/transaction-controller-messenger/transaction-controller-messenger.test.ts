import { getTransactionControllerMessenger, getTransactionControllerInitMessenger } from './transaction-controller-messenger';

describe('Transaction Controller Messengers', () => {
  describe('getTransactionControllerMessenger', () => {
    it('should return a restricted messenger with correct allowed actions and events', () => {
      const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
      const mockMessenger = { getRestricted: mockRestricted } as any;

      const result = getTransactionControllerMessenger(mockMessenger);

      expect(result).toBe('restricted-messenger');
      expect(mockRestricted).toHaveBeenCalledWith({
        name: 'TransactionController',
        allowedActions: [
          'AccountsController:getSelectedAccount',
          'AccountsController:getState',
          'ApprovalController:addRequest',
          'NetworkController:findNetworkClientIdByChainId',
          'NetworkController:getNetworkClientById',
          'RemoteFeatureFlagController:getState',
        ],
        allowedEvents: ['NetworkController:stateChange'],
      });
    });
  });

  describe('getTransactionControllerInitMessenger', () => {
    it('should return a restricted messenger with correct allowed actions and events', () => {
      const mockRestricted = jest.fn().mockReturnValue('restricted-init-messenger');
      const mockMessenger = { getRestricted: mockRestricted } as any;

      const result = getTransactionControllerInitMessenger(mockMessenger);

      expect(result).toBe('restricted-init-messenger');
      expect(mockRestricted).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'TransactionControllerInit',
          allowedEvents: expect.arrayContaining([
            'TransactionController:transactionApproved',
            'TransactionController:transactionConfirmed',
          ]),
          allowedActions: expect.arrayContaining([
            'ApprovalController:addRequest',
            'ApprovalController:endFlow',
            'ApprovalController:startFlow',
          ]),
        }),
      );
    });
  });
});
