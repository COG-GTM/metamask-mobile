// eslint-disable-next-line import/no-nodejs-modules
import { PassThrough } from 'stream';
import {
  jsonParseStream,
  jsonStringifyStream,
  setupMultiplex,
} from './streams';

describe('streams', () => {
  it('jsonParseStream parses serialized JSON', (done) => {
    const stream = jsonParseStream();
    stream.on('data', (data: unknown) => {
      expect(data).toEqual({ foo: 'bar' });
      done();
    });
    stream.write('{"foo":"bar"}');
  });

  it('jsonStringifyStream stringifies objects', (done) => {
    const stream = jsonStringifyStream();
    stream.on('data', (data: unknown) => {
      expect(data).toBe('{"foo":"bar"}');
      done();
    });
    stream.write({ foo: 'bar' });
  });

  it('setupMultiplex returns a multiplexed stream', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const connectionStream = new PassThrough({ objectMode: true });
    const mux = setupMultiplex(connectionStream);
    expect(typeof mux.createStream).toBe('function');
    const substream = mux.createStream('test');
    expect(substream).toBeDefined();
    connectionStream.destroy();
    jest.restoreAllMocks();
  });

  it('setupMultiplex logs errors from the pipeline', (done) => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
      done();
    });
    const connectionStream = new PassThrough({ objectMode: true });
    setupMultiplex(connectionStream);
    connectionStream.destroy(new Error('boom'));
  });
});
