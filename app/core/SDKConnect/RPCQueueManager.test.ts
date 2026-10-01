import { RPCQueueManager } from './RPCQueueManager';
import { METHODS_TO_REDIRECT, RPC_METHODS } from './SDKConnectConstants';

type RPCQueueManagerInternals = RPCQueueManager & {
  rpcQueue: Record<string, string>;
};

jest.mock('./utils/DevLogger');

describe('RPCQueueManager', () => {
  let rpcQueueManager: RPCQueueManager;

  beforeEach(() => {
    jest.clearAllMocks();
    rpcQueueManager = new RPCQueueManager();
  });

  describe('add', () => {
    it('should add an RPC method to the queue', () => {
      rpcQueueManager.add({
        id: 'id',
        method: 'method',
      });

      expect((rpcQueueManager as unknown as RPCQueueManagerInternals).rpcQueue).toEqual({ id: 'method' });
    });
  });

  describe('reset', () => {
    it('should clear the RPC queue', () => {
      rpcQueueManager.reset();

      expect((rpcQueueManager as unknown as RPCQueueManagerInternals).rpcQueue).toEqual({});
    });

    it('should warn if there are RPCs in the queue on reset', () => {
      const spyConsoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {
          // do nothing
        });

      (rpcQueueManager as unknown as RPCQueueManagerInternals).rpcQueue = [{ method: 'method', params: 'params' }] as unknown as Record<string, string>;

      rpcQueueManager.reset();

      expect(spyConsoleWarn).toHaveBeenCalledWith(
        'RPCQueueManager: 1 RPCs still in the queue',
        [{ method: 'method', params: 'params' }],
      );
    });
  });

  describe('isEmpty', () => {
    it('should return true if the queue is empty', () => {
      (rpcQueueManager as unknown as RPCQueueManagerInternals).rpcQueue = [] as unknown as Record<string, string>;

      expect(rpcQueueManager.isEmpty()).toBe(true);
    });

    it('should return false if the queue is not empty', () => {
      (rpcQueueManager as unknown as RPCQueueManagerInternals).rpcQueue = [{ method: 'method', params: 'params' }] as unknown as Record<string, string>;

      expect(rpcQueueManager.isEmpty()).toBe(false);
    });
  });

  describe('canRedirect', () => {
    it('should return true if method is redirectable and queue is empty', () => {
      (rpcQueueManager as unknown as RPCQueueManagerInternals).rpcQueue = [] as unknown as Record<string, string>;

      const result = rpcQueueManager.canRedirect({
        method: RPC_METHODS.ETH_REQUESTACCOUNTS,
      });

      expect(result).toBe(true);
    });

    it('should return false if method is not redirectable', () => {
      (rpcQueueManager as unknown as RPCQueueManagerInternals).rpcQueue = [] as unknown as Record<string, string>;

      (METHODS_TO_REDIRECT as Record<string, boolean>).method = false;

      const result = rpcQueueManager.canRedirect({ method: 'method' });

      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove an RPC method from the queue', () => {
      (rpcQueueManager as unknown as RPCQueueManagerInternals).rpcQueue = {
        id: 'method',
      };

      rpcQueueManager.remove('id');

      expect((rpcQueueManager as unknown as RPCQueueManagerInternals).rpcQueue).toEqual({});
    });
  });

  describe('get', () => {
    it('should return the current state of the RPC queue', () => {
      (rpcQueueManager as unknown as RPCQueueManagerInternals).rpcQueue = [{ method: 'method', params: 'params' }] as unknown as Record<string, string>;

      const result = rpcQueueManager.get();

      expect(result).toEqual([{ method: 'method', params: 'params' }]);
    });
  });

  describe('getId', () => {
    it('should return the method for a given ID', () => {
      (rpcQueueManager as unknown as RPCQueueManagerInternals).rpcQueue = {
        id: 'method',
      };

      const result = rpcQueueManager.getId('id');

      expect(result).toEqual('method');
    });
  });
});
