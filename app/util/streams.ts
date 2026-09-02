import ObjectMultiplex from '@metamask/object-multiplex';
import pump from 'pump';
import Through from 'through2';
// eslint-disable-next-line import/no-nodejs-modules
import { Duplex, Stream, Transform } from 'stream';

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return {stream.Transform}
 */
function jsonParseStream(): Transform {
  return Through.obj(function (
    this: Transform,
    serialized: string,
    _: BufferEncoding,
    cb: (err?: Error | null, data?: unknown) => void,
  ) {
    this.push(JSON.parse(serialized));
    cb();
  } as unknown as (
    this: Transform,
    chunk: unknown,
    enc: BufferEncoding,
    cb: (err?: Error | null, data?: unknown) => void,
  ) => void);
}

/**
 * Returns a stream transform that calls {@code JSON.stringify}
 * on objects passing through
 * @return {stream.Transform} the stream transform
 */
function jsonStringifyStream(): Transform {
  return Through.obj(function (obj: unknown, _, cb) {
    this.push(JSON.stringify(obj));
    cb();
  });
}

/**
 * Sets up stream multiplexing for the given stream
 * @param {Duplex} connectionStream - the stream to mux
 * @return {stream.Stream} the multiplexed stream
 */
function setupMultiplex(connectionStream: Duplex): ObjectMultiplex {
  const mux = new ObjectMultiplex();
  pump(connectionStream, mux as unknown as Stream, connectionStream, (err) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
