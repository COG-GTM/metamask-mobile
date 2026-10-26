import {
  createOriginMiddleware,
  createLoggerMiddleware,
  containsUserRejectedError,
} from './middlewares';
import Logger from './Logger';
import trackErrorAsAnalytics from './metrics/TrackError/trackErrorAsAnalytics';

jest.mock('./Logger', () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

jest.mock('./metrics/TrackError/trackErrorAsAnalytics', () => jest.fn());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = Record<string, any>;

describe('middlewares', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOriginMiddleware', () => {
    it('appends the origin and default params', () => {
      const middleware = createOriginMiddleware({ origin: 'example.com' });
      const req: AnyObject = {};
      const next = jest.fn();
      middleware(req, {}, next);
      expect(req.origin).toBe('example.com');
      expect(req.params).toEqual([]);
      expect(next).toHaveBeenCalled();
    });

    it('keeps existing params', () => {
      const middleware = createOriginMiddleware({ origin: 'example.com' });
      const req: AnyObject = { params: ['a'] };
      middleware(req, {}, jest.fn());
      expect(req.params).toEqual(['a']);
    });
  });

  describe('containsUserRejectedError', () => {
    it.each([
      ['User rejected the transaction', undefined, true],
      ['MetaMask: User denied message signature.', undefined, true],
      ['User cancelled the request', undefined, true],
      ['Some other error', 4001, true],
      ['Some other error', -32603, false],
      ['', 4001, false],
      [undefined, 4001, false],
      [123, 4001, false],
    ])('%s (%s) => %s', (message, code, expected) => {
      expect(containsUserRejectedError(message as string, code)).toBe(expected);
    });
  });

  describe('createLoggerMiddleware', () => {
    const run = (req: AnyObject, res: AnyObject) => {
      const middleware = createLoggerMiddleware({ origin: 'example.com' });
      const cb = jest.fn();
      const next = jest.fn((callback) => callback(cb));
      middleware(req, res, next);
      return cb;
    };

    it('logs successful requests', () => {
      const req = { method: 'eth_chainId' };
      const res = { result: '0x1' };
      const cb = run(req, res);
      expect(Logger.log).toHaveBeenCalledWith(
        'RPC (example.com):',
        req,
        '->',
        res,
      );
      expect(cb).toHaveBeenCalled();
      expect(Logger.error).not.toHaveBeenCalled();
    });

    it('tracks user rejected errors as analytics', () => {
      run(
        { method: 'eth_sendTransaction' },
        { error: { message: 'User rejected the request', code: 4001 } },
      );
      expect(trackErrorAsAnalytics).toHaveBeenCalledWith(
        'Error in RPC response: User rejected',
        'User rejected the request',
      );
      expect(Logger.error).not.toHaveBeenCalled();
    });

    it('logs other errors to the logger with data', () => {
      const error = {
        message: 'Internal JSON-RPC error.',
        code: -32603,
        data: { code: -32000, message: 'gas required exceeds allowance' },
      };
      const req = { method: 'eth_sendTransaction' };
      run(req, { error, id: 1 });
      expect(Logger.error).toHaveBeenCalledWith(error, {
        message: 'Error in RPC response',
        orginalError: error,
        res: { id: 1 },
        req,
        data: error.data,
      });
    });

    it('logs other errors without data', () => {
      const error = { message: 'Internal error', code: -32603 };
      const req = { method: 'eth_call' };
      run(req, { error });
      expect(Logger.error).toHaveBeenCalledWith(error, {
        message: 'Error in RPC response',
        orginalError: error,
        res: {},
        req,
      });
    });

    it('does not log internal requests', () => {
      const cb = run({ method: 'eth_chainId', isMetamaskInternal: true }, {});
      expect(Logger.log).not.toHaveBeenCalled();
      expect(cb).not.toHaveBeenCalled();
    });
  });
});
