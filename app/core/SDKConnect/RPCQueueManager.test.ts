import { RPCQueueManager } from './RPCQueueManager';
import { METHODS_TO_REDIRECT, RPC_METHODS } from './SDKConnectConstants';

jest.mock('./utils/DevLogger');

interface RpcQueue {
  [id: string]: string;
}

describe('RPCQueueManager', () => {
  let rpcQueueManager: RPCQueueManager;

  const getQueue = () =>
    (rpcQueueManager as unknown as { rpcQueue: RpcQueue }).rpcQueue;
  const setQueue = (queue: unknown) => {
    (rpcQueueManager as unknown as { rpcQueue: RpcQueue }).rpcQueue =
      queue as RpcQueue;
  };

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

      expect(getQueue()).toEqual({ id: 'method' });
    });
  });

  describe('reset', () => {
    it('should clear the RPC queue', () => {
      rpcQueueManager.reset();

      expect(getQueue()).toEqual({});
    });

    it('should warn if there are RPCs in the queue on reset', () => {
      const spyConsoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {
          // do nothing
        });

      setQueue([{ method: 'method', params: 'params' }]);

      rpcQueueManager.reset();

      expect(spyConsoleWarn).toHaveBeenCalledWith(
        'RPCQueueManager: 1 RPCs still in the queue',
        [{ method: 'method', params: 'params' }],
      );
    });
  });

  describe('isEmpty', () => {
    it('should return true if the queue is empty', () => {
      setQueue([]);

      expect(rpcQueueManager.isEmpty()).toBe(true);
    });

    it('should return false if the queue is not empty', () => {
      setQueue([{ method: 'method', params: 'params' }]);

      expect(rpcQueueManager.isEmpty()).toBe(false);
    });
  });

  describe('canRedirect', () => {
    it('should return true if method is redirectable and queue is empty', () => {
      setQueue([]);

      const result = rpcQueueManager.canRedirect({
        method: RPC_METHODS.ETH_REQUESTACCOUNTS,
      });

      expect(result).toBe(true);
    });

    it('should return false if method is not redirectable', () => {
      setQueue([]);

      METHODS_TO_REDIRECT.method = false;

      const result = rpcQueueManager.canRedirect({ method: 'method' });

      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove an RPC method from the queue', () => {
      setQueue({
        id: 'method',
      });

      rpcQueueManager.remove('id');

      expect(getQueue()).toEqual({});
    });
  });

  describe('get', () => {
    it('should return the current state of the RPC queue', () => {
      setQueue([{ method: 'method', params: 'params' }]);

      const result = rpcQueueManager.get();

      expect(result).toEqual([{ method: 'method', params: 'params' }]);
    });
  });

  describe('getId', () => {
    it('should return the method for a given ID', () => {
      setQueue({
        id: 'method',
      });

      const result = rpcQueueManager.getId('id');

      expect(result).toEqual('method');
    });
  });
});
