import Through from 'through2';
import ObjectMultiplex from '@metamask/object-multiplex';
import pump from 'pump';
// eslint-disable-next-line import/no-nodejs-modules
import { Duplex, Stream, Transform } from 'stream';

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return the stream transform
 */
function jsonParseStream(): Transform {
  return Through.obj(function (this: Transform, serialized, _, cb) {
    this.push(JSON.parse(serialized as string));
    cb();
  });
}

/**
 * Returns a stream transform that calls {@code JSON.stringify}
 * on objects passing through
 * @return the stream transform
 */
function jsonStringifyStream(): Transform {
  return Through.obj(function (this: Transform, obj, _, cb) {
    this.push(JSON.stringify(obj));
    cb();
  });
}

/**
 * Sets up stream multiplexing for the given stream
 * @param connectionStream - the stream to mux
 * @return the multiplexed stream
 */
function setupMultiplex(connectionStream: Stream): ObjectMultiplex {
  const mux = new ObjectMultiplex();
  pump(
    connectionStream as Duplex,
    mux as unknown as Duplex,
    connectionStream as Duplex,
    (err?: Error | null) => {
      if (err) {
        console.warn(err);
      }
    },
  );
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
