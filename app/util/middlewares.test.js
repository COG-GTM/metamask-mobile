import {
  containsUserRejectedError,
  createOriginMiddleware,
  createLoggerMiddleware,
} from './middlewares';
import Logger from './Logger';
import trackErrorAsAnalytics from './metrics/TrackError/trackErrorAsAnalytics';

jest.mock('./Logger', () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

jest.mock('./metrics/TrackError/trackErrorAsAnalytics', () => jest.fn());

describe('containsUserRejectedError', () => {
  it.each([
    ['User rejected the transaction'],
    ['user denied message signature'],
    ['user cancelled the transaction'],
  ])('returns true for a user-rejection message: %s', (message) => {
    expect(containsUserRejectedError(message)).toBe(true);
  });

  it('returns true when the error code is 4001', () => {
    expect(containsUserRejectedError('Internal JSON-RPC error.', 4001)).toBe(
      true,
    );
  });

  it('returns false for unrelated errors', () => {
    expect(containsUserRejectedError('gas too low', -32000)).toBe(false);
  });

  it('returns false for non-string / falsy input', () => {
    expect(containsUserRejectedError('')).toBe(false);
    expect(containsUserRejectedError(undefined)).toBe(false);
    expect(containsUserRejectedError(123)).toBe(false);
  });
});

describe('createOriginMiddleware', () => {
  it('attaches the origin and initializes params', () => {
    const middleware = createOriginMiddleware({ origin: 'https://dapp.io' });
    const req = {};
    const next = jest.fn();
    middleware(req, {}, next);
    expect(req).toEqual({ origin: 'https://dapp.io', params: [] });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('preserves existing params', () => {
    const middleware = createOriginMiddleware({ origin: 'https://dapp.io' });
    const req = { params: [1] };
    middleware(req, {}, jest.fn());
    expect(req.params).toEqual([1]);
  });
});

describe('createLoggerMiddleware', () => {
  const flush = (cb) => cb(jest.fn());

  beforeEach(() => {
    Logger.error.mockReset();
    Logger.log.mockReset();
    trackErrorAsAnalytics.mockReset();
  });

  it('logs rpc traffic when there is no error', () => {
    const middleware = createLoggerMiddleware({ origin: 'dapp.io' });
    const req = { method: 'eth_call' };
    const res = { result: 'ok' };
    const next = jest.fn(flush);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(Logger.log).toHaveBeenCalledWith(
      'RPC (dapp.io):',
      req,
      '->',
      res,
    );
  });

  it('tracks user-rejected errors via analytics, not Sentry', () => {
    const middleware = createLoggerMiddleware({ origin: 'dapp.io' });
    const req = { method: 'eth_sendTransaction' };
    const res = { error: { message: 'User rejected the transaction' } };
    middleware(req, res, jest.fn(flush));
    expect(trackErrorAsAnalytics).toHaveBeenCalled();
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('routes non-user-rejected errors to Logger.error', () => {
    const middleware = createLoggerMiddleware({ origin: 'dapp.io' });
    const req = { method: 'eth_call' };
    const res = { error: { message: 'gas required exceeds allowance' } };
    middleware(req, res, jest.fn(flush));
    expect(Logger.error).toHaveBeenCalled();
  });

  it('skips the rpc log for internal metamask requests', () => {
    const middleware = createLoggerMiddleware({ origin: 'metamask' });
    const req = { isMetamaskInternal: true };
    const res = {};
    middleware(req, res, jest.fn(flush));
    expect(Logger.log).not.toHaveBeenCalled();
  });
});
