import { makeMethodMiddlewareMaker, UNSUPPORTED_RPC_METHODS, polyfillGasPrice } from './utils';
import Engine from '../Engine';

jest.mock('../Engine', () => ({
  controllerMessenger: {
    call: jest.fn(),
  },
}));

jest.mock('@metamask/controller-utils', () => ({
  query: jest.fn(),
}));

jest.mock('@metamask/eth-query', () =>
  jest.fn().mockImplementation(() => ({ provider: 'eth-query' })),
);

const queryMock = jest.requireMock('@metamask/controller-utils').query as jest.Mock;

describe('RPCMethods/utils', () => {
  describe('UNSUPPORTED_RPC_METHODS', () => {
    it('contains eth_signTransaction', () => {
      expect(UNSUPPORTED_RPC_METHODS.has('eth_signTransaction')).toBe(true);
    });
  });

  describe('makeMethodMiddlewareMaker', () => {
    const makeHandler = (
      methodNames: string[],
      hookNames: Record<string, true>,
      implementation = jest.fn(),
    ) => ({
      methodNames,
      implementation,
      hookNames,
    });

    it('throws when expected hooks are missing', () => {
      const handler = makeHandler(['foo'], { hookA: true, hookB: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const make = makeMethodMiddlewareMaker([handler] as any);
      expect(() => make({ hookA: () => null })).toThrow(/Missing expected hooks/);
    });

    it('throws when extraneous hooks are passed', () => {
      const handler = makeHandler(['foo'], { hookA: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const make = makeMethodMiddlewareMaker([handler] as any);
      expect(() =>
        make({ hookA: () => null, extraneous: () => null }),
      ).toThrow(/Received unexpected hooks/);
    });

    it('calls the matching handler implementation for a known method', async () => {
      const implementation = jest.fn().mockResolvedValue(undefined);
      const handler = makeHandler(['foo'], { hookA: true }, implementation);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const make = makeMethodMiddlewareMaker([handler] as any);
      const middleware = make({ hookA: jest.fn() });

      const req = { method: 'foo' };
      const res = {};
      const next = jest.fn();
      const end = jest.fn();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(req as any, res as any, next, end);
      expect(implementation).toHaveBeenCalledWith(
        req,
        res,
        next,
        end,
        expect.any(Object),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('passes unknown methods through to next()', async () => {
      const handler = makeHandler(['foo'], { hookA: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const make = makeMethodMiddlewareMaker([handler] as any);
      const middleware = make({ hookA: jest.fn() });

      const next = jest.fn();
      const end = jest.fn();
      await middleware(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { method: 'unknown' } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {} as any,
        next,
        end,
      );
      expect(next).toHaveBeenCalledTimes(1);
      expect(end).not.toHaveBeenCalled();
    });

    it('forwards thrown errors from the handler to end()', async () => {
      const error = new Error('impl boom');
      const implementation = jest.fn().mockRejectedValue(error);
      const handler = makeHandler(['foo'], { hookA: true }, implementation);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const make = makeMethodMiddlewareMaker([handler] as any);
      const middleware = make({ hookA: jest.fn() });

      const end = jest.fn();
      await middleware(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { method: 'foo' } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {} as any,
        jest.fn(),
        end,
      );

      expect(end).toHaveBeenCalledWith(error);
    });

    it('wraps non-Error throws into an internal rpc error', async () => {
      const implementation = jest.fn().mockRejectedValue({ weird: 'thing' });
      const handler = makeHandler(['foo'], { hookA: true }, implementation);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const make = makeMethodMiddlewareMaker([handler] as any);
      const middleware = make({ hookA: jest.fn() });

      const end = jest.fn();
      await middleware(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { method: 'foo' } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {} as any,
        jest.fn(),
        end,
      );

      const errArg = end.mock.calls[0][0];
      expect(errArg).toBeInstanceOf(Error);
    });
  });

  describe('polyfillGasPrice', () => {
    beforeEach(() => {
      (Engine.controllerMessenger.call as jest.Mock).mockReset();
      queryMock.mockReset();
    });

    it('fetches gas data and preserves existing gasPrice', async () => {
      (Engine.controllerMessenger.call as jest.Mock)
        .mockReturnValueOnce('network-client-id')
        .mockReturnValueOnce({ provider: 'my-provider' });

      queryMock.mockResolvedValue({ gasPrice: '0x1', maxFeePerGas: '0x2' });

      const result = await polyfillGasPrice('eth_getBlockByNumber', 'https://dapp');
      expect(result).toEqual({ gasPrice: '0x1', maxFeePerGas: '0x2' });
    });

    it('backfills gasPrice from maxFeePerGas when gasPrice is missing', async () => {
      (Engine.controllerMessenger.call as jest.Mock)
        .mockReturnValueOnce('network-client-id')
        .mockReturnValueOnce({ provider: 'my-provider' });

      queryMock.mockResolvedValue({ maxFeePerGas: '0xabc' });

      const result = await polyfillGasPrice('eth_call', 'https://dapp', [{}]);
      expect(result).toEqual({ maxFeePerGas: '0xabc', gasPrice: '0xabc' });
    });
  });
});
