import {
  jsonParseStream,
  jsonStringifyStream,
  setupMultiplex,
} from './streams';

describe('streams utilities', () => {
  it('jsonParseStream parses JSON strings into objects', (done) => {
    const stream = jsonParseStream();
    stream.on('data', (chunk) => {
      expect(chunk).toEqual({ foo: 'bar' });
      done();
    });
    stream.write(JSON.stringify({ foo: 'bar' }));
  });

  it('jsonStringifyStream stringifies objects', (done) => {
    const stream = jsonStringifyStream();
    stream.on('data', (chunk) => {
      expect(chunk).toBe('{"foo":"bar"}');
      done();
    });
    stream.write({ foo: 'bar' });
  });

  it('setupMultiplex returns an ObjectMultiplex-like object', () => {
    const connectionStream = jsonParseStream();
    const mux = setupMultiplex(connectionStream);
    expect(mux).toBeDefined();
    expect(typeof mux.createStream).toBe('function');
  });
});
