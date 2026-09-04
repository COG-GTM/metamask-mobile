import { createLoggerMiddleware } from './middlewares';
import Logger from './Logger';
import trackErrorAsAnalytics from './metrics/TrackError/trackErrorAsAnalytics';

jest.mock('./Logger', () => ({
  log: jest.fn(),
  error: jest.fn(),
}));
jest.mock('./metrics/TrackError/trackErrorAsAnalytics', () => jest.fn());

const ORIGIN = 'https://dapp.example';
const ADDRESS = '0x1111111111111111111111111111111111111111';
const CALLDATA = '0xa9059cbb000000000000000000000000deadbeef';

const runMiddleware = (req, res) => {
  const middleware = createLoggerMiddleware({ origin: ORIGIN });
  const cb = jest.fn();
  middleware(req, res, (onComplete) => onComplete(cb));
  return cb;
};

describe('createLoggerMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs only RPC routing metadata, never params or results', () => {
    const req = {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_sendTransaction',
      origin: ORIGIN,
      params: [{ from: ADDRESS, to: ADDRESS, data: CALLDATA }],
    };
    const res = { id: 1, jsonrpc: '2.0', result: '0xtxhash' };

    const cb = runMiddleware(req, res);

    expect(cb).toHaveBeenCalled();
    expect(Logger.log).toHaveBeenCalledWith(
      `RPC (${ORIGIN}):`,
      { id: 1, jsonrpc: '2.0', method: 'eth_sendTransaction', origin: ORIGIN },
      '->',
      { id: 1, jsonrpc: '2.0' },
    );
    const serialized = JSON.stringify(Logger.log.mock.calls);
    expect(serialized).not.toContain(ADDRESS);
    expect(serialized).not.toContain(CALLDATA);
    expect(serialized).not.toContain('0xtxhash');
  });

  it('skips logging for internal requests', () => {
    runMiddleware(
      { id: 2, method: 'eth_chainId', isMetamaskInternal: true },
      { id: 2, result: '0x1' },
    );

    expect(Logger.log).not.toHaveBeenCalled();
  });

  it('reports RPC errors without request params, results or error payloads', () => {
    const req = {
      id: 3,
      jsonrpc: '2.0',
      method: 'personal_sign',
      params: ['secret message', ADDRESS],
    };
    const error = {
      code: -32603,
      message: 'Internal JSON-RPC error.',
      data: {
        code: -32000,
        message: 'execution reverted',
        originalRequest: { params: [{ data: CALLDATA }] },
      },
    };
    const res = { id: 3, jsonrpc: '2.0', result: { echoed: ADDRESS }, error };

    runMiddleware(req, res);

    const expectedError = {
      code: -32603,
      message: 'Internal JSON-RPC error.',
      data: { code: -32000, message: 'execution reverted' },
    };
    expect(Logger.error).toHaveBeenCalledWith(expectedError, {
      message: 'Error in RPC response',
      orginalError: expectedError,
      res: { id: 3, jsonrpc: '2.0' },
      req: { id: 3, jsonrpc: '2.0', method: 'personal_sign' },
      data: expectedError.data,
    });
    const serialized = JSON.stringify(Logger.error.mock.calls);
    expect(serialized).not.toContain(ADDRESS);
    expect(serialized).not.toContain(CALLDATA);
    expect(serialized).not.toContain('secret message');
  });

  it('tracks user rejections as analytics instead of errors', () => {
    runMiddleware(
      { id: 4, method: 'eth_sendTransaction', params: [{ from: ADDRESS }] },
      {
        id: 4,
        error: { code: 4001, message: 'User rejected the request.' },
      },
    );

    expect(trackErrorAsAnalytics).toHaveBeenCalledWith(
      'Error in RPC response: User rejected',
      'User rejected the request.',
    );
    expect(Logger.error).not.toHaveBeenCalled();
  });
});
