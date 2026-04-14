import { handleSnapRequest } from './utils';

jest.mock('../Engine/controllers/snaps', () => ({
  SnapControllerHandleRequestAction: 'SnapController:handleRequest',
}));

describe('Snaps utils', () => {
  describe('handleSnapRequest', () => {
    it('should call controllerMessenger.call with correct args', async () => {
      const mockMessenger = {
        call: jest.fn().mockResolvedValue({ result: 'ok' }),
      } as any;

      const args = {
        snapId: 'npm:test-snap',
        origin: 'metamask',
        handler: 'onRpcRequest' as any,
        request: { method: 'test', params: [] },
      };

      const result = await handleSnapRequest(mockMessenger, args);

      expect(mockMessenger.call).toHaveBeenCalledWith(
        'SnapController:handleRequest',
        args,
      );
      expect(result).toEqual({ result: 'ok' });
    });
  });
});
