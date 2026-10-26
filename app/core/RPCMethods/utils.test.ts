import { query } from '@metamask/controller-utils';
import { rpcErrors } from '@metamask/rpc-errors';
import Engine from '../Engine';
import {
  makeMethodMiddlewareMaker,
  polyfillGasPrice,
  UNSUPPORTED_RPC_METHODS,
} from './utils';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  query: jest.fn(),
}));

jest.mock('@metamask/eth-query', () => jest.fn());

jest.mock('../Engine', () => ({
  controllerMessenger: {
    call: jest.fn(),
  },
}));

const mockQuery = query as jest.Mock;
const mockCall = Engine.controllerMessenger.call as jest.Mock;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = any;

const createHandler = (implementation: jest.Mock): AnyHandler => ({
  methodNames: ['test_method', 'test_alias'],
  implementation,
  hookNames: { hookA: true },
});

const createReq = (method: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ id: 1, jsonrpc: '2.0', method, params: [] } as any);

describe('RPCMethods utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flags eth_signTransaction as unsupported', () => {
    expect(UNSUPPORTED_RPC_METHODS.has('eth_signTransaction')).toBe(true);
  });

  describe('makeMethodMiddlewareMaker', () => {
    it('throws when expected hooks are missing', () => {
      const makeMiddleware = makeMethodMiddlewareMaker([
        createHandler(jest.fn()),
      ]);
      expect(() => makeMiddleware({})).toThrow(
        'Missing expected hooks:\n\nhookA\n',
      );
    });

    it('throws when unexpected hooks are provided', () => {
      const makeMiddleware = makeMethodMiddlewareMaker([
        createHandler(jest.fn()),
      ]);
      expect(() => makeMiddleware({ hookA: jest.fn(), hookB: jest.fn() }))
        .toThrow('Received unexpected hooks:\n\nhookB\n');
    });

    it('calls the handler implementation with the selected hooks', async () => {
      const hookA = jest.fn();
      const implementation = jest.fn().mockResolvedValue('result');
      const middleware = makeMethodMiddlewareMaker([
        createHandler(implementation),
      ])({ hookA });
      const next = jest.fn();
      const end = jest.fn();
      const res = { id: 1, jsonrpc: '2.0' as const };

      const result = await middleware(createReq('test_alias'), res, next, end);

      expect(result).toBe('result');
      expect(implementation).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'test_alias' }),
        res,
        next,
        end,
        { hookA },
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next for unknown methods', async () => {
      const middleware = makeMethodMiddlewareMaker([
        createHandler(jest.fn()),
      ])({ hookA: jest.fn() });
      const next = jest.fn();
      const end = jest.fn();
      await middleware(
        createReq('unknown_method'),
        { id: 1, jsonrpc: '2.0' },
        next,
        end,
      );
      expect(next).toHaveBeenCalled();
      expect(end).not.toHaveBeenCalled();
    });

    it('ends with the thrown error when the handler throws an Error', async () => {
      const error = new Error('boom');
      const middleware = makeMethodMiddlewareMaker([
        createHandler(jest.fn().mockRejectedValue(error)),
      ])({ hookA: jest.fn() });
      const end = jest.fn();
      await middleware(
        createReq('test_method'),
        { id: 1, jsonrpc: '2.0' },
        jest.fn(),
        end,
      );
      expect(end).toHaveBeenCalledWith(error);
    });

    it('wraps non Error throws in an internal rpc error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const middleware = makeMethodMiddlewareMaker([
        createHandler(jest.fn().mockRejectedValue('not an error')),
      ])({ hookA: jest.fn() });
      const end = jest.fn();
      await middleware(
        createReq('test_method'),
        { id: 1, jsonrpc: '2.0' },
        jest.fn(),
        end,
      );
      expect(end).toHaveBeenCalledWith(
        rpcErrors.internal({ data: 'not an error' }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('polyfillGasPrice', () => {
    beforeEach(() => {
      mockCall.mockImplementation((action: string) => {
        if (
          action === 'SelectedNetworkController:getNetworkClientIdForDomain'
        ) {
          return 'mainnet';
        }
        return { provider: {} };
      });
    });

    it('queries using the network client for the origin', async () => {
      mockQuery.mockResolvedValue({ gasPrice: '0x1' });
      const result = await polyfillGasPrice('eth_getBlockByNumber', 'origin', [
        'latest',
      ]);
      expect(mockCall).toHaveBeenCalledWith(
        'SelectedNetworkController:getNetworkClientIdForDomain',
        'origin',
      );
      expect(mockCall).toHaveBeenCalledWith(
        'NetworkController:getNetworkClientById',
        'mainnet',
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        'eth_getBlockByNumber',
        ['latest'],
      );
      expect(result).toEqual({ gasPrice: '0x1' });
    });

    it('sets gasPrice from maxFeePerGas when missing', async () => {
      mockQuery.mockResolvedValue({ maxFeePerGas: '0x2' });
      const result = await polyfillGasPrice('eth_getTransactionByHash', 'o');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        'eth_getTransactionByHash',
        [],
      );
      expect(result).toEqual({ maxFeePerGas: '0x2', gasPrice: '0x2' });
    });

    it('returns falsy data unchanged', async () => {
      mockQuery.mockResolvedValue(null);
      expect(await polyfillGasPrice('eth_call', 'o')).toBeNull();
    });
  });
});
