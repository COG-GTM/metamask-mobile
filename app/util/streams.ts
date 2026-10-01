// eslint-disable-next-line import/no-nodejs-modules
import { Transform } from 'stream';
import ObjectMultiplex from '@metamask/object-multiplex';
import through from 'through2';
import pump from 'pump';

/**
 * Returns a stream transform that parses JSON strings passing through
 */
export function jsonParseStream(): Transform {
  return through.obj(function (this: Transform, serialized, _, cb) {
    this.push(JSON.parse(serialized));
    cb();
  });
}

/**
 * Returns a stream transform that calls {@code JSON.stringify}
 * on objects passing through
 */
export function jsonStringifyStream(): Transform {
  return through.obj(function (this: Transform, obj, _, cb) {
    this.push(JSON.stringify(obj));
    cb();
  });
}

/**
 * Sets up stream multiplexing for the given stream
 *
 * @param connectionStream - the stream to mux
 * @returns the multiplexed stream
 */
export function setupMultiplex(connectionStream: NodeJS.ReadWriteStream) {
  const mux = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream, (err?: Error | null) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}
