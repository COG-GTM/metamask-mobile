// eslint-disable-next-line import/no-nodejs-modules
import { Duplex, Transform } from 'stream';
import through2 from 'through2';
import ObjectMultiplex from '@metamask/object-multiplex';
import pump from 'pump';

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return {stream.Transform}
 */
function jsonParseStream(): Transform {
  return through2.obj(function (this: Transform, serialized: string, _, cb) {
    this.push(JSON.parse(serialized));
    cb();
  });
}

/**
 * Returns a stream transform that calls {@code JSON.stringify}
 * on objects passing through
 * @return {stream.Transform} the stream transform
 */
function jsonStringifyStream(): Transform {
  return through2.obj(function (this: Transform, obj, _, cb) {
    this.push(JSON.stringify(obj));
    cb();
  });
}

/**
 * Sets up stream multiplexing for the given stream
 * @param {any} connectionStream - the stream to mux
 * @return {stream.Stream} the multiplexed stream
 */
function setupMultiplex(connectionStream: Duplex): ObjectMultiplex {
  const mux = new ObjectMultiplex();
  pump(
    connectionStream,
    mux as unknown as Duplex,
    connectionStream,
    (err?: Error | null) => {
      if (err) {
        console.warn(err);
      }
    },
  );
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
