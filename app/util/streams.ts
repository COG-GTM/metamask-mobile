/* eslint-disable import/no-commonjs */
import type { Duplex, Transform } from 'readable-stream';
import ObjectMultiplex from '@metamask/object-multiplex';
// through2 and pump are untyped.
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Through = require('through2');
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const pump = require('pump');

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return the stream transform
 */
function jsonParseStream(): Transform {
  return Through.obj(function (
    this: Duplex,
    serialized: string,
    _encoding: BufferEncoding,
    cb: () => void,
  ) {
    this.push(JSON.parse(serialized));
    cb();
  });
}

/**
 * Returns a stream transform that calls {@code JSON.stringify}
 * on objects passing through
 * @return the stream transform
 */
function jsonStringifyStream(): Transform {
  return Through.obj(function (
    this: Duplex,
    obj: unknown,
    _encoding: BufferEncoding,
    cb: () => void,
  ) {
    this.push(JSON.stringify(obj));
    cb();
  });
}

/**
 * Sets up stream multiplexing for the given stream
 * @param connectionStream - the stream to mux
 * @return the multiplexed stream
 */
function setupMultiplex(connectionStream: Duplex): ObjectMultiplex {
  const mux = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream, (err?: Error | null) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
