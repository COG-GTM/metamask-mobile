import { PassThrough } from 'stream';
import { setupMultiplex } from './streams';
import Logger from './Logger';

jest.mock('./Logger', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

describe('setupMultiplex', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reports stream failures to Logger with the bridge type', async () => {
    const connectionStream = new PassThrough({ objectMode: true });
    setupMultiplex(connectionStream, 'snap');

    const error = new Error('stream broke');
    connectionStream.emit('error', error);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Logger.error).toHaveBeenCalledWith(error, {
      context: 'setupMultiplex',
      bridgeType: 'snap',
    });
  });

  it('does not report anything on normal teardown', async () => {
    const connectionStream = new PassThrough({ objectMode: true });
    setupMultiplex(connectionStream);

    connectionStream.end();

    await new Promise((resolve) => setImmediate(resolve));

    expect(Logger.error).not.toHaveBeenCalled();
  });
});
